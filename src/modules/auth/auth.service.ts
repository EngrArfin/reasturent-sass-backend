import {
  Injectable,
  UnauthorizedException,
  NotFoundException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcryptjs';
import { UsersService } from '../users/users.service';
import { PrismaService } from '../../prisma/prisma.service';
import { LoginDto } from './dto/login.dto';
import { RegisterDto } from './dto/register.dto';

@Injectable()
export class AuthService {
  constructor(
    private usersService: UsersService,
    private prisma: PrismaService,
    private jwtService: JwtService,
  ) { }

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

    const { password: _pwd, pin: _pin, ...result } = user;
    return {
      ...result,
      status: user.isActive ? 'APPROVED' : 'PENDING',
      isApproved: user.isActive,
      hasPin: !!user.pin,
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
    return result;
  }

  async getProfile(userId: string) {
    const user = await this.usersService.findOne(userId);
    const { password, pin, ...result } = user;
    return result;
  }
}

