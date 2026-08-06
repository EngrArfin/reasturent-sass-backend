import {
  Injectable,
  UnauthorizedException,
  NotFoundException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcryptjs';
import { UsersService } from '../users/users.service';
import { LoginDto } from './dto/login.dto';
import { RegisterDto } from './dto/register.dto';

@Injectable()
export class AuthService {
  constructor(
    private usersService: UsersService,
    private jwtService: JwtService,
  ) {}

  async validateUser(email: string, password: string): Promise<any> {
    const user = await this.usersService.findByEmail(email);
    if (user && user.password && (await bcrypt.compare(password, user.password))) {
      const userObj = user.toObject ? user.toObject() : user;
      const { password: userPassword, pin, ...result } = userObj;
      return result;
    }
    return null;
  }

  async login(loginDto: LoginDto) {
    if (!loginDto.email || !loginDto.password) {
      throw new UnauthorizedException('Invalid credentials');
    }
    const user = await this.validateUser(loginDto.email, loginDto.password);
    if (!user) {
      throw new UnauthorizedException('Invalid credentials');
    }

    const payload = {
      sub: user._id,
      email: user.email,
      role: user.role,
      businessId: user.businessId,
    };
    return {
      access_token: this.jwtService.sign(payload),
      user,
    };
  }

  async register(registerDto: RegisterDto) {
    const userDoc = await this.usersService.create(registerDto as any);
    const userObj = userDoc.toObject ? userDoc.toObject() : userDoc;
    const { password, pin, ...result } = userObj;
    return result;
  }

  async getProfile(userId: string) {
    const userDoc = await this.usersService.findOne(userId);
    const userObj = userDoc.toObject ? userDoc.toObject() : userDoc;
    const { password, pin, ...result } = userObj;
    return result;
  }
}

