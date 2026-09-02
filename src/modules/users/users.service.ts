import {
  Injectable,
  NotFoundException,
  ConflictException,
  UnauthorizedException,
  BadRequestException,
} from '@nestjs/common';
import * as bcrypt from 'bcryptjs';
import { PrismaService } from '../../prisma/prisma.service';
import { UserRole } from '../../../generated/prisma/client';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { UserRole as AppUserRole } from '../../enums/user-role.enum';

@Injectable()
export class UsersService {
  constructor(private prisma: PrismaService) {}

  private getEffectiveBusinessId(
    currentUser?: any,
    requestedBusinessId?: string,
    isRequired = false,
  ): string | undefined {
    if (!currentUser) {
      return requestedBusinessId;
    }

    if (currentUser.role === AppUserRole.SUPER_ADMIN) {
      if (requestedBusinessId) {
        return requestedBusinessId;
      }
      if (isRequired) {
        throw new BadRequestException('businessId is required for Super Admin');
      }
      return undefined;
    }

    const businessId = currentUser.businessId;
    if (!businessId) {
      throw new BadRequestException('Current user is not associated with any business tenant');
    }
    return businessId;
  }

  private normalizeRole(roleInput?: string): UserRole {
    if (!roleInput) {
      return UserRole.server;
    }
    const cleanRole = roleInput.toLowerCase().trim();
    switch (cleanRole) {
      case 'manager':
        return UserRole.manager;
      case 'supervisor':
        return UserRole.supervisor;
      case 'cashier':
        return UserRole.cashier;
      case 'server':
        return UserRole.server;
      case 'kitchen':
        return UserRole.kitchen;
      case 'business_admin':
        return UserRole.business_admin;
      case 'super_admin':
        return UserRole.super_admin;
      default:
        return UserRole.server;
    }
  }

  private sanitizeUser(user: any) {
    const { password, pin, ...rest } = user;
    return {
      ...rest,
      hasPin: !!pin,
      pin: pin ? '****' : null,
      avatar:
        user.avatar ||
        `https://api.dicebear.com/7.x/avataaars/svg?seed=${encodeURIComponent(user.name || 'User')}`,
    };
  }

  async create(createUserDto: CreateUserDto, currentUser?: any) {
    const businessId = this.getEffectiveBusinessId(
      currentUser,
      createUserDto.businessId,
      currentUser?.role === AppUserRole.SUPER_ADMIN,
    );

    if (businessId) {
      const business = await this.prisma.business.findUnique({
        where: { id: businessId },
      });
      if (!business) {
        throw new NotFoundException(`Business with ID '${businessId}' does not exist`);
      }
    }

    // Auto-generate email if omitted (common in POS staff management)
    let email = createUserDto.email?.trim().toLowerCase();
    if (!email) {
      const safeName = createUserDto.name.toLowerCase().replace(/[^a-z0-9]/g, '');
      const randomSuffix = Math.floor(1000 + Math.random() * 9000);
      email = `${safeName || 'staff'}${randomSuffix}@pos.local`;

      // Ensure uniqueness of auto-generated email
      let emailExists = await this.prisma.user.findUnique({ where: { email } });
      while (emailExists) {
        const newSuffix = Math.floor(1000 + Math.random() * 9000);
        email = `${safeName || 'staff'}${newSuffix}@pos.local`;
        emailExists = await this.prisma.user.findUnique({ where: { email } });
      }
    } else {
      const existingUser = await this.prisma.user.findUnique({
        where: { email },
      });
      if (existingUser) {
        throw new ConflictException(`User with email "${email}" already exists`);
      }
    }

    // Default password securely if not provided
    const rawPassword = createUserDto.password || `Staff@${Math.floor(100000 + Math.random() * 900000)}`;
    const hashedPassword = await bcrypt.hash(rawPassword, 10);

    const hashedPin = createUserDto.pin
      ? await bcrypt.hash(createUserDto.pin.trim(), 10)
      : null;

    const userRole = this.normalizeRole(createUserDto.role);

    const user = await this.prisma.user.create({
      data: {
        name: createUserDto.name.trim(),
        email,
        password: hashedPassword,
        role: userRole,
        businessId: businessId || null,
        pin: hashedPin,
        avatar: createUserDto.avatar || null,
        isActive: true,
      },
    });

    return this.sanitizeUser(user);
  }

  async findAll(
    currentUser?: any,
    businessIdQuery?: string,
    search?: string,
    role?: string,
  ) {
    const businessId = this.getEffectiveBusinessId(currentUser, businessIdQuery, false);

    const where: any = {};
    if (businessId) {
      where.businessId = businessId;
    }

    if (search && search.trim() !== '') {
      const q = search.trim();
      where.OR = [
        { name: { contains: q, mode: 'insensitive' } },
        { email: { contains: q, mode: 'insensitive' } },
      ];
    }

    if (role && role.trim() !== '') {
      where.role = this.normalizeRole(role);
    }

    // For restaurant managers, don't show super admins in their employee grid
    if (currentUser && currentUser.role !== AppUserRole.SUPER_ADMIN) {
      where.role = { not: UserRole.super_admin };
    }

    const users = await this.prisma.user.findMany({
      where,
      orderBy: { createdAt: 'asc' },
    });

    return users.map((u) => this.sanitizeUser(u));
  }

  async findByRole(role: string, currentUser?: any, businessIdQuery?: string) {
    return this.findAll(currentUser, businessIdQuery, undefined, role);
  }

  async findOne(id: string, currentUser?: any) {
    const user = await this.prisma.user.findUnique({
      where: { id },
      include: {
        business: {
          select: {
            id: true,
            businessName: true,
            name: true,
          },
        },
      },
    });

    if (!user) {
      throw new NotFoundException(`User with ID '${id}' not found`);
    }

    if (
      currentUser &&
      currentUser.role !== AppUserRole.SUPER_ADMIN &&
      user.businessId !== currentUser.businessId
    ) {
      throw new NotFoundException(`User with ID '${id}' not found`);
    }

    return this.sanitizeUser(user);
  }

  async findByEmail(email: string) {
    return this.prisma.user.findUnique({
      where: { email: email.toLowerCase().trim() },
    });
  }

  async update(id: string, updateUserDto: UpdateUserDto, currentUser?: any) {
    const existing = await this.prisma.user.findUnique({
      where: { id },
    });

    if (!existing) {
      throw new NotFoundException(`User with ID '${id}' not found`);
    }

    if (
      currentUser &&
      currentUser.role !== AppUserRole.SUPER_ADMIN &&
      existing.businessId !== currentUser.businessId
    ) {
      throw new UnauthorizedException('You can only update employees from your own business');
    }

    const dataToUpdate: any = {};

    if (updateUserDto.name !== undefined) {
      dataToUpdate.name = updateUserDto.name.trim();
    }

    if (updateUserDto.role !== undefined) {
      dataToUpdate.role = this.normalizeRole(updateUserDto.role);
    }

    if (updateUserDto.email !== undefined && updateUserDto.email.trim().toLowerCase() !== existing.email) {
      const email = updateUserDto.email.trim().toLowerCase();
      const duplicate = await this.prisma.user.findUnique({ where: { email } });
      if (duplicate) {
        throw new ConflictException(`Email "${email}" is already registered`);
      }
      dataToUpdate.email = email;
    }

    if (updateUserDto.password) {
      dataToUpdate.password = await bcrypt.hash(updateUserDto.password, 10);
    }

    // Only update PIN if provided and not the masked placeholder '****'
    if (updateUserDto.pin && updateUserDto.pin.trim() !== '****' && updateUserDto.pin.trim() !== '') {
      dataToUpdate.pin = await bcrypt.hash(updateUserDto.pin.trim(), 10);
    }

    if (updateUserDto.avatar !== undefined) {
      dataToUpdate.avatar = updateUserDto.avatar;
    }

    if (updateUserDto.isActive !== undefined) {
      dataToUpdate.isActive = updateUserDto.isActive;
    }

    const updated = await this.prisma.user.update({
      where: { id },
      data: dataToUpdate,
    });

    return this.sanitizeUser(updated);
  }

  async remove(id: string, currentUser?: any) {
    const existing = await this.prisma.user.findUnique({
      where: { id },
    });

    if (!existing) {
      throw new NotFoundException(`User with ID '${id}' not found`);
    }

    if (
      currentUser &&
      currentUser.role !== AppUserRole.SUPER_ADMIN &&
      existing.businessId !== currentUser.businessId
    ) {
      throw new UnauthorizedException('You can only delete employees from your own business');
    }

    if (currentUser && (currentUser.userId === id || currentUser.id === id)) {
      throw new BadRequestException('You cannot delete your own manager account');
    }

    await this.prisma.user.delete({
      where: { id },
    });

    return {
      message: `Employee "${existing.name}" deleted successfully`,
      id: existing.id,
      name: existing.name,
    };
  }

  async changePin(userId: string, newPin: string, currentUser: any) {
    if (!newPin || !/^\d{4}$/.test(newPin.trim())) {
      throw new BadRequestException('PIN must be exactly 4 digits');
    }

    const targetUser = await this.prisma.user.findUnique({
      where: { id: userId },
    });

    if (!targetUser) {
      throw new NotFoundException(`User with ID '${userId}' not found`);
    }

    if (
      currentUser.role !== AppUserRole.SUPER_ADMIN &&
      currentUser.role !== AppUserRole.MANAGER &&
      currentUser.userId !== userId
    ) {
      throw new UnauthorizedException("You cannot change this user's PIN");
    }

    if (
      currentUser.role === AppUserRole.MANAGER &&
      targetUser.businessId !== currentUser.businessId
    ) {
      throw new UnauthorizedException('You can only modify PINs for employees in your restaurant');
    }

    const hashedPin = await bcrypt.hash(newPin.trim(), 10);
    await this.prisma.user.update({
      where: { id: userId },
      data: { pin: hashedPin },
    });

    return {
      message: `PIN for "${targetUser.name}" updated successfully`,
      userId: targetUser.id,
    };
  }
}
