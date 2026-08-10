import {
  Injectable,
  NotFoundException,
  ConflictException,
  UnauthorizedException,
} from '@nestjs/common';
import * as bcrypt from 'bcryptjs';
import { PrismaService } from '../../prisma/prisma.service';
import { User, UserRole } from '../../../generated/prisma/client';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';

@Injectable()
export class UsersService {
  constructor(private prisma: PrismaService) {}

  async create(createUserDto: CreateUserDto): Promise<User> {
    if (!createUserDto.email) {
      throw new ConflictException('Email is required');
    }
    const existingUser = await this.prisma.user.findUnique({
      where: { email: createUserDto.email },
    });
    if (existingUser) {
      throw new ConflictException('Email already exists');
    }

    if (createUserDto.businessId) {
      const business = await this.prisma.business.findUnique({
        where: { id: createUserDto.businessId },
      });
      if (!business) {
        throw new NotFoundException(
          `Business with ID '${createUserDto.businessId}' does not exist`,
        );
      }
    }

    const hashedPassword = await bcrypt.hash(createUserDto.password || '', 10);
    const hashedPin = createUserDto.pin
      ? await bcrypt.hash(createUserDto.pin, 10)
      : undefined;

    return this.prisma.user.create({
      data: {
        name: createUserDto.name,
        email: createUserDto.email,
        password: hashedPassword,
        role: (createUserDto.role as UserRole) || UserRole.manager,
        businessId: createUserDto.businessId || null,
        pin: hashedPin,
      },
    });
  }

  async findAll(businessId?: string): Promise<User[]> {
    return this.prisma.user.findMany({
      where: businessId ? { businessId } : {},
    });
  }

  async findByRole(role: UserRole | string, businessId?: string): Promise<User[]> {
    return this.prisma.user.findMany({
      where: {
        role: role as UserRole,
        ...(businessId ? { businessId } : {}),
      },
    });
  }

  async findOne(id: string): Promise<User> {
    const user = await this.prisma.user.findUnique({
      where: { id },
    });
    if (!user) {
      throw new NotFoundException('User not found');
    }
    return user;
  }

  async findByEmail(email: string): Promise<User | null> {
    return this.prisma.user.findUnique({
      where: { email },
    });
  }

  async update(id: string, updateUserDto: UpdateUserDto): Promise<User> {
    const dataToUpdate: any = { ...updateUserDto };
    if (updateUserDto.password) {
      dataToUpdate.password = await bcrypt.hash(updateUserDto.password, 10);
    }
    if (updateUserDto.pin) {
      dataToUpdate.pin = await bcrypt.hash(updateUserDto.pin, 10);
    }

    try {
      return await this.prisma.user.update({
        where: { id },
        data: dataToUpdate,
      });
    } catch {
      throw new NotFoundException('User not found');
    }
  }

  async remove(id: string): Promise<User> {
    try {
      return await this.prisma.user.delete({
        where: { id },
      });
    } catch {
      throw new NotFoundException('User not found');
    }
  }

  async changePin(
    userId: string,
    newPin: string,
    currentUser: any,
  ): Promise<void> {
    await this.findOne(userId);

    if (
      currentUser.role !== 'super_admin' &&
      currentUser.role !== 'business_admin' &&
      currentUser.userId !== userId
    ) {
      throw new UnauthorizedException("You cannot change this user's PIN");
    }

    const hashedPin = await bcrypt.hash(newPin, 10);
    await this.prisma.user.update({
      where: { id: userId },
      data: { pin: hashedPin },
    });
  }
}

