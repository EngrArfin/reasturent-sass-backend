import {
  Injectable,
  NotFoundException,
  ConflictException,
} from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { Business } from '../../../generated/prisma/client';
import { UsersService } from '../users/users.service';
import { UserRole } from '../../enums/user-role.enum';
import { CreateBusinessDto } from './dto/create-business.dto';
import { CreateManagerDto } from './dto/create-manager.dto';
import { UpdateBusinessDto } from './dto/update-business.dto';

@Injectable()
export class BusinessesService {
  constructor(
    private prisma: PrismaService,
    private usersService: UsersService,
  ) {}

  async create(createBusinessDto: CreateBusinessDto): Promise<Business> {
    if (!createBusinessDto.name || !createBusinessDto.businessName || !createBusinessDto.email) {
      throw new ConflictException('Required fields missing');
    }
    const existingBusiness = await this.prisma.business.findUnique({
      where: { name: createBusinessDto.name },
    });
    if (existingBusiness) {
      throw new ConflictException('Business name already exists');
    }

    return this.prisma.business.create({
      data: {
        name: createBusinessDto.name,
        businessName: createBusinessDto.businessName,
        email: createBusinessDto.email,
        phone: createBusinessDto.phone,
        address: createBusinessDto.address,
        settings: createBusinessDto.settings ? (createBusinessDto.settings as any) : undefined,
      },
    });
  }

  async createManager(
    businessId: string,
    createManagerDto: CreateManagerDto,
  ): Promise<any> {
    const business = await this.findOne(businessId);

    const manager = await this.usersService.create({
      ...createManagerDto,
      role: UserRole.MANAGER,
      businessId: business.id,
    });

    return {
      manager,
      business,
    };
  }

  async findAll(): Promise<Business[]> {
    return this.prisma.business.findMany();
  }

  async findOne(id: string): Promise<Business> {
    const business = await this.prisma.business.findUnique({
      where: { id },
    });
    if (!business) {
      throw new NotFoundException('Business not found');
    }
    return business;
  }

  async update(
    id: string,
    updateBusinessDto: UpdateBusinessDto,
  ): Promise<Business> {
    try {
      const dataToUpdate: any = { ...updateBusinessDto };
      if (updateBusinessDto.settings) {
        dataToUpdate.settings = updateBusinessDto.settings;
      }
      return await this.prisma.business.update({
        where: { id },
        data: dataToUpdate,
      });
    } catch {
      throw new NotFoundException('Business not found');
    }
  }

  async remove(id: string): Promise<Business> {
    try {
      return await this.prisma.business.delete({
        where: { id },
      });
    } catch {
      throw new NotFoundException('Business not found');
    }
  }
}

