import {
  Injectable,
  NotFoundException,
  ConflictException,
} from '@nestjs/common';
import * as bcrypt from 'bcryptjs';
import { PrismaService } from '../../prisma/prisma.service';
import { Business, Voucher } from '../../../generated/prisma/client';
import { UsersService } from '../users/users.service';
import { UserRole } from '../../enums/user-role.enum';
import { CreateBusinessDto } from './dto/create-business.dto';
import { CreateManagerDto } from './dto/create-manager.dto';
import { UpdateBusinessDto } from './dto/update-business.dto';
import { CreateVoucherDto } from './dto/create-voucher.dto';
import { ResetSupervisorDto } from './dto/reset-supervisor.dto';
import { UpdateTenantRolesDto } from './dto/update-tenant-roles.dto';
import { CreateUserDto } from '../users/dto/create-user.dto';

@Injectable()
export class BusinessesService {
  constructor(
    private prisma: PrismaService,
    private usersService: UsersService,
  ) {}

  async create(createBusinessDto: CreateBusinessDto): Promise<any> {
    const businessName = createBusinessDto.businessName || createBusinessDto.name;
    if (!businessName) {
      throw new ConflictException('Business name is required');
    }

    const email = createBusinessDto.managerEmail || (createBusinessDto as any).email;
    if (!email) {
      throw new ConflictException('Manager email is required');
    }

    const slug =
      createBusinessDto.name ||
      businessName.toLowerCase().replace(/[^a-z0-9]/g, '-') + '-' + Date.now().toString().slice(-4);

    const existingBusiness = await this.prisma.business.findFirst({
      where: {
        OR: [{ name: slug }, { email }],
      },
    });
    if (existingBusiness) {
      throw new ConflictException('Business name or Manager email already exists');
    }

    const allowedRoles = createBusinessDto.allowedRoles?.length
      ? createBusinessDto.allowedRoles
      : ['manager'];

    const subFee = createBusinessDto.subscriptionFee
      ? (createBusinessDto.subscriptionFee.includes('$') || createBusinessDto.subscriptionFee.includes('CFA')
          ? createBusinessDto.subscriptionFee
          : `$${createBusinessDto.subscriptionFee}/mo`)
      : 'CFA 99/mo';

    const business = await this.prisma.business.create({
      data: {
        name: slug,
        businessName: businessName,
        email: email,
        phone: createBusinessDto.phone,
        address: createBusinessDto.address,
        subscriptionFee: subFee,
        allowedRoles: allowedRoles,
        settings: createBusinessDto.settings ? (createBusinessDto.settings as any) : undefined,
      },
    });

    const pin = createBusinessDto.managerPin || '1234';
    const hashedPassword = await bcrypt.hash(pin, 10);
    const hashedPin = await bcrypt.hash(pin, 10);

    const manager = await this.prisma.user.create({
      data: {
        name: `${businessName} Manager`,
        email: email,
        password: hashedPassword,
        pin: hashedPin,
        role: 'manager' as any,
        businessId: business.id,
      },
    });

    const { password: pwd, pin: p, ...managerProfile } = manager;

    return {
      message: 'Business tenant created successfully with initial Manager account',
      business,
      manager: managerProfile,
    };
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
    return this.prisma.business.findMany({
      include: {
        users: true,
        vouchers: true,
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async findOne(id: string): Promise<Business> {
    const business = await this.prisma.business.findUnique({
      where: { id },
      include: {
        users: true,
        vouchers: true,
      },
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

  // --- Super Admin Dashboard Services ---

  async getAdminOverview() {
    const totalTenants = await this.prisma.business.count();
    const activeTickets = await this.prisma.ticket.count({
      where: { status: 'OPEN' },
    });

    const activeBusinesses = await this.prisma.business.findMany({
      where: { isActive: true },
      include: { subscriptionPlan: true },
    });

    let monthlyRevenue = 0;
    for (const biz of activeBusinesses) {
      if (biz.subscriptionPlan) {
        monthlyRevenue += biz.subscriptionPlan.amount;
      } else if (biz.subscriptionFee) {
        const matches = biz.subscriptionFee.match(/(\d+(?:\.\d+)?)/);
        if (matches && matches[1]) {
          monthlyRevenue += parseFloat(matches[1]);
        }
      }
    }

    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    const systemInsight = await this.prisma.business.count({
      where: {
        createdAt: {
          gte: thirtyDaysAgo,
        },
      },
    });

    const tenants = await this.findAll();

    return {
      metrics: {
        totalTenants,
        activeTickets,
        monthlyRevenue,
        systemInsight,
      },
      totalBusinesses: totalTenants,
      tenants,
    };
  }

  async createVoucher(
    businessId: string,
    createVoucherDto: CreateVoucherDto,
  ): Promise<Voucher> {
    await this.findOne(businessId);

    const existingVoucher = await this.prisma.voucher.findUnique({
      where: { code: createVoucherDto.code.toUpperCase() },
    });
    if (existingVoucher) {
      throw new ConflictException('Voucher code already exists');
    }

    return this.prisma.voucher.create({
      data: {
        code: createVoucherDto.code.toUpperCase(),
        amountOff: createVoucherDto.amountOff,
        expiresAt: new Date(createVoucherDto.expiresAt),
        isActive: createVoucherDto.isActive ?? true,
        businessId,
      },
    });
  }

  async getAllVouchers() {
    return this.prisma.voucher.findMany({
      include: {
        business: true,
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async assignSubscriptionPlan(businessId: string, subscriptionPlanId: string) {
    const business = await this.findOne(businessId);

    const plan = await this.prisma.subscriptionPlan.findUnique({
      where: { id: subscriptionPlanId },
    });
    if (!plan) {
      throw new NotFoundException('Subscription plan not found');
    }

    const feeText = plan.amount === 0 ? 'FREE' : `$${plan.amount}/mo`;
    return this.prisma.business.update({
      where: { id: businessId },
      data: {
        subscriptionPlanId: plan.id,
        subscriptionFee: feeText,
      },
      include: {
        subscriptionPlan: true,
      },
    });
  }

  async updateVoucher(voucherId: string, updateVoucherDto: any) {
    const voucher = await this.prisma.voucher.findUnique({
      where: { id: voucherId },
    });
    if (!voucher) {
      throw new NotFoundException('Voucher not found');
    }

    const data: any = { ...updateVoucherDto };
    if (updateVoucherDto.code) {
      data.code = updateVoucherDto.code.toUpperCase();
      const existing = await this.prisma.voucher.findUnique({
        where: { code: data.code },
      });
      if (existing && existing.id !== voucherId) {
        throw new ConflictException('Voucher code already exists');
      }
    }
    if (updateVoucherDto.expiresAt) {
      data.expiresAt = new Date(updateVoucherDto.expiresAt);
    }

    return this.prisma.voucher.update({
      where: { id: voucherId },
      data,
      include: {
        business: true,
      },
    });
  }

  async deleteVoucher(voucherId: string) {
    const voucher = await this.prisma.voucher.findUnique({
      where: { id: voucherId },
    });
    if (!voucher) {
      throw new NotFoundException('Voucher not found');
    }

    return this.prisma.voucher.delete({
      where: { id: voucherId },
    });
  }

  async addUserToBusiness(
    businessId: string,
    createUserDto: CreateUserDto,
  ) {
    await this.findOne(businessId);
    return this.usersService.create({
      ...createUserDto,
      businessId,
    });
  }

  async resetSupervisorCredentials(
    businessId: string,
    resetSupervisorDto: ResetSupervisorDto,
  ) {
    const business = await this.findOne(businessId);

    let supervisor = await this.prisma.user.findFirst({
      where: {
        businessId: business.id,
        role: {
          in: ['business_admin', 'supervisor' as any],
        },
      },
    });

    const hashedPassword = await bcrypt.hash(resetSupervisorDto.newPinOrPassword, 10);
    const hashedPin = await bcrypt.hash(resetSupervisorDto.newPinOrPassword, 10);

    if (supervisor) {
      supervisor = await this.prisma.user.update({
        where: { id: supervisor.id },
        data: {
          email: resetSupervisorDto.supervisorEmail || supervisor.email,
          password: hashedPassword,
          pin: hashedPin,
        },
      });
    } else {
      supervisor = await this.prisma.user.create({
        data: {
          name: `${business.name} Supervisor`,
          email: resetSupervisorDto.supervisorEmail || `supervisor_${Date.now()}@${business.name.toLowerCase().replace(/\s+/g, '')}.com`,
          password: hashedPassword,
          pin: hashedPin,
          role: 'supervisor' as any,
          businessId: business.id,
        },
      });
    }

    const { password, pin, ...result } = supervisor;
    return {
      message: 'Supervisor credentials reset successfully',
      user: result,
    };
  }

  async updateTenantRoles(
    businessId: string,
    updateTenantRolesDto: UpdateTenantRolesDto,
  ) {
    await this.findOne(businessId);
    return this.prisma.business.update({
      where: { id: businessId },
      data: {
        allowedRoles: updateTenantRolesDto.allowedRoles,
      },
    });
  }
}
