import {
  Injectable,
  UnauthorizedException,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcryptjs';
import { UsersService } from '../users/users.service';
import { PrismaService } from '../../prisma/prisma.service';
import { LoginDto } from './dto/login.dto';
import { RegisterDto } from './dto/register.dto';
import { UpdateProfileDto } from './dto/update-profile.dto';
import { ChangePasswordDto } from './dto/change-password.dto';

@Injectable()
export class AuthService {
  constructor(
    private usersService: UsersService,
    private prisma: PrismaService,
    private jwtService: JwtService,
  ) {}

  async validateUser(email: string, secret: string): Promise<any> {
    if (!email || !secret) {
      return null;
    }

    const cleanEmail = email.trim().toLowerCase();
    const cleanSecret = secret.trim();

    const user = await this.prisma.user.findUnique({
      where: { email: cleanEmail },
      include: {
        business: {
          select: {
            id: true,
            name: true,
            businessName: true,
            allowedRoles: true,
            isActive: true,
          },
        },
      },
    });

    if (!user) {
      return null;
    }

    let isValid = false;

    // 1. Verify bcrypt password hash
    if (user.password) {
      try {
        isValid = await bcrypt.compare(cleanSecret, user.password);
      } catch (e) {
        isValid = false;
      }
    }

    // 2. Verify bcrypt PIN hash
    if (!isValid && user.pin) {
      try {
        isValid = await bcrypt.compare(cleanSecret, user.pin);
      } catch (e) {
        isValid = false;
      }
    }

    // 3. Fallback direct match (for legacy plain-text or local dev)
    if (!isValid) {
      if (user.password === cleanSecret || user.pin === cleanSecret) {
        isValid = true;
      }
    }

    if (!isValid) {
      return null;
    }

    // Check User Active & Approval Status
    if (!user.isActive) {
      throw new UnauthorizedException(
        'Your account is pending supervisor approval or has been deactivated. Please contact your restaurant owner / supervisor.',
      );
    }

    // Check Business Subscription Status for non Super Admin
    if (user.role !== 'super_admin' && user.business && user.business.isActive === false) {
      throw new UnauthorizedException(
        'Your restaurant subscription plan is currently inactive or expired. Please contact your restaurant supervisor to renew.',
      );
    }

    const { password: _pwd, pin, ...result } = user;
    return {
      ...result,
      pin: pin ? '••••' : null,
      status: user.isActive ? 'APPROVED' : 'PENDING',
      isApproved: user.isActive,
      hasPin: !!pin,
    };
  }

  async login(loginDto: LoginDto) {
    const secret = loginDto.pin || loginDto.password;
    if (!loginDto.email || !secret) {
      throw new UnauthorizedException('Email and PIN or Password are required');
    }

    const user = await this.validateUser(loginDto.email, secret);
    if (!user) {
      throw new UnauthorizedException('Invalid email or PIN / password');
    }

    const payload = {
      sub: user.id,
      email: user.email,
      role: user.role,
      businessId: user.businessId,
    };

    return {
      access_token: this.jwtService.sign(payload),
      user: {
        ...user,
        role: user.role,
        businessId: user.businessId,
      },
    };
  }

  async register(registerDto: RegisterDto) {
    const user = await this.usersService.create(registerDto as any);
    const { password, pin, ...result } = user;
    return {
      ...result,
      pin: pin ? '••••' : null,
    };
  }

  async getProfile(userId: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      include: {
        business: {
          select: {
            id: true,
            name: true,
            businessName: true,
            isActive: true,
          },
        },
      },
    });

    if (!user) {
      throw new NotFoundException('User profile not found');
    }

    const { password, pin, ...result } = user;
    return {
      ...result,
      pin: pin ? '••••' : null,
    };
  }

  async updateProfile(userId: string, dto: UpdateProfileDto) {
    const data: any = {};
    if (dto.name !== undefined) data.name = dto.name.trim();
    if (dto.avatar !== undefined) data.avatar = dto.avatar.trim();

    const updatedUser = await this.prisma.user.update({
      where: { id: userId },
      data,
      include: {
        business: {
          select: {
            id: true,
            name: true,
            businessName: true,
            isActive: true,
          },
        },
      },
    });

    const { password, pin, ...result } = updatedUser;
    return {
      ...result,
      pin: pin ? '••••' : null,
    };
  }

  async changePassword(userId: string, dto: ChangePasswordDto) {
    if (dto.newPassword !== dto.confirmPassword) {
      throw new BadRequestException('New password and confirmation password do not match');
    }

    if (dto.newPassword.length < 6) {
      throw new BadRequestException('New password must be at least 6 characters long');
    }

    const user = await this.prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    let isCurrentValid = false;
    if (user.password) {
      try {
        isCurrentValid = await bcrypt.compare(dto.currentPassword.trim(), user.password);
      } catch (e) {
        isCurrentValid = false;
      }
      if (!isCurrentValid && user.password === dto.currentPassword.trim()) {
        isCurrentValid = true;
      }
    }

    if (!isCurrentValid) {
      throw new BadRequestException('Current password is incorrect');
    }

    const hashedPassword = await bcrypt.hash(dto.newPassword.trim(), 10);

    await this.prisma.user.update({
      where: { id: userId },
      data: { password: hashedPassword },
    });

    return {
      success: true,
      message: 'Password updated successfully',
    };
  }

  async changePin(userId: string, pin: string) {
    if (!/^\d{4}$/.test(pin)) {
      throw new BadRequestException('PIN must be exactly 4 digits');
    }

    const hashedPin = await bcrypt.hash(pin.trim(), 10);

    await this.prisma.user.update({
      where: { id: userId },
      data: { pin: hashedPin },
    });

    return {
      success: true,
      message: 'PIN updated successfully',
    };
  }
}
