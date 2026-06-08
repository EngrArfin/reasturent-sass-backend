import {
  Injectable,
  NotFoundException,
  ConflictException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Business, BusinessDocument } from './business.schema';

import { UsersService } from '../users/users.service';
import { UserRole } from '../../enums/user-role.enum';
import { CreateBusinessDto } from './dto/create-business.dto';
import { CreateManagerDto } from './dto/create-manager.dto';
import { UpdateBusinessDto } from './dto/update-business.dto';

@Injectable()
export class BusinessesService {
  constructor(
    @InjectModel(Business.name) private businessModel: Model<BusinessDocument>,
    private usersService: UsersService,
  ) {}

  async create(createBusinessDto: CreateBusinessDto): Promise<BusinessDocument> {
    const existingBusiness = await this.businessModel.findOne({
      name: createBusinessDto.name,
    });
    if (existingBusiness) {
      throw new ConflictException('Business name already exists');
    }

    const business = new this.businessModel(createBusinessDto);
    return business.save();
  }

  async createManager(
    businessId: string,
    createManagerDto: CreateManagerDto,
  ): Promise<any> {
    const business = await this.findOne(businessId);

    const manager = await this.usersService.create({
      ...createManagerDto,
      role: UserRole.MANAGER,
      businessId: business._id.toString(),
    });

    return {
      manager,
      business,
    };
  }

  async findAll(): Promise<BusinessDocument[]> {
    return this.businessModel.find().exec();
  }

  async findOne(id: string): Promise<BusinessDocument> {
    const business = await this.businessModel.findById(id).exec();
    if (!business) {
      throw new NotFoundException('Business not found');
    }
    return business;
  }

  async update(
    id: string,
    updateBusinessDto: UpdateBusinessDto,
  ): Promise<BusinessDocument> {
    const business = await this.businessModel
      .findByIdAndUpdate(id, updateBusinessDto, { new: true })
      .exec();
    if (!business) {
      throw new NotFoundException('Business not found');
    }
    return business;
  }

  async remove(id: string): Promise<BusinessDocument> {
    const business = await this.businessModel.findByIdAndDelete(id).exec();
    if (!business) {
      throw new NotFoundException('Business not found');
    }
    return business;
  }
}
