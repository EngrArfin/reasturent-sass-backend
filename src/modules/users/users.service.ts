import {
  Injectable,
  NotFoundException,
  ConflictException,
  UnauthorizedException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import * as bcrypt from 'bcryptjs';
import { User, UserDocument } from './user.schema';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { UserRole } from 'src/enums/user-role.enum';

@Injectable()
export class UsersService {
  constructor(@InjectModel(User.name) private userModel: Model<UserDocument>) {}

  async create(createUserDto: CreateUserDto): Promise<UserDocument> {
    const existingUser = await this.userModel.findOne({
      email: createUserDto.email,
    });
    if (existingUser) {
      throw new ConflictException('Email already exists');
    }

    const hashedPassword = await bcrypt.hash(createUserDto.password || '', 10);
    const hashedPin = createUserDto.pin
      ? await bcrypt.hash(createUserDto.pin, 10)
      : undefined;

    const user = new this.userModel({
      ...createUserDto,
      password: hashedPassword,
      pin: hashedPin,
      businessId: createUserDto.businessId
        ? new Types.ObjectId(createUserDto.businessId)
        : undefined,
    });

    return user.save();
  }

  async findAll(businessId?: string): Promise<UserDocument[]> {
    const query = businessId ? { businessId: new Types.ObjectId(businessId) } : {};
    return this.userModel.find(query).exec();
  }

  async findByRole(role: UserRole, businessId?: string): Promise<UserDocument[]> {
    const query: any = { role };
    if (businessId) {
      query.businessId = new Types.ObjectId(businessId);
    }
    return this.userModel.find(query).exec();
  }

  async findOne(id: string): Promise<UserDocument> {
    const user = await this.userModel.findById(id).exec();
    if (!user) {
      throw new NotFoundException('User not found');
    }
    return user;
  }

  async findByEmail(email: string): Promise<UserDocument | null> {
    return this.userModel.findOne({ email }).exec();
  }

  async update(
    id: string,
    updateUserDto: UpdateUserDto,
  ): Promise<UserDocument> {
    if (updateUserDto.password) {
      updateUserDto.password = await bcrypt.hash(updateUserDto.password, 10);
    }
    if (updateUserDto.pin) {
      updateUserDto.pin = await bcrypt.hash(updateUserDto.pin, 10);
    }

    const user = await this.userModel
      .findByIdAndUpdate(id, updateUserDto, { new: true })
      .exec();
    if (!user) {
      throw new NotFoundException('User not found');
    }
    return user;
  }

  async remove(id: string): Promise<UserDocument> {
    const user = await this.userModel.findByIdAndDelete(id).exec();
    if (!user) {
      throw new NotFoundException('User not found');
    }
    return user;
  }

  async changePin(
    userId: string,
    newPin: string,
    currentUser: any,
  ): Promise<void> {
    const user = await this.findOne(userId);

    // Check if current user has permission
    if (
      currentUser.role !== UserRole.SUPER_ADMIN &&
      currentUser.role !== UserRole.BUSINESS_ADMIN &&
      currentUser.userId !== userId
    ) {
      throw new UnauthorizedException("You cannot change this user's PIN");
    }

    const hashedPin = await bcrypt.hash(newPin, 10);
    await this.userModel.findByIdAndUpdate(userId, { pin: hashedPin });
  }
}
