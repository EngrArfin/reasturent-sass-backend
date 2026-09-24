import {
  Controller,
  Post,
  Patch,
  Body,
  Get,
  UseGuards,
  Request,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { AuthService } from './auth.service';
import { Public } from '../../common/decorators/public.decorator';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { LoginDto } from './dto/login.dto';
import { RegisterDto } from './dto/register.dto';
import { UpdateProfileDto } from './dto/update-profile.dto';
import { ChangePasswordDto } from './dto/change-password.dto';
import { ChangePinDto } from '../users/dto/change-pin.dto';
import {
  LoginResponseDto,
  UserProfileDto,
  SuccessMessageResponseDto,
} from './dto/auth-response.dto';
import {
  ApiTags,
  ApiOperation,
  ApiBody,
  ApiResponse,
  ApiBearerAuth,
} from '@nestjs/swagger';

@ApiTags('Auth & Account Settings')
@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Public()
  @Post('register')
  @ApiOperation({
    summary: 'User Registration',
    description: 'Register a new user account.\n\n🔓 **Allowed Roles**: Public (No Authentication Required)',
  })
  @ApiBody({ type: RegisterDto })
  @ApiResponse({
    status: 201,
    description: 'User registered successfully',
    type: UserProfileDto,
  })
  @ApiResponse({ status: 400, description: 'Validation error / Bad request' })
  @ApiResponse({ status: 409, description: 'Email already exists' })
  async register(@Body() registerDto: RegisterDto) {
    return this.authService.register(registerDto);
  }

  @Public()
  @Post('login')
  @ApiOperation({
    summary: 'User Login',
    description:
      'Authenticate user with email & password (or PIN) and return JWT access token.\n\n🔓 **Allowed Roles**: Public (No Authentication Required)',
  })
  @ApiBody({ type: LoginDto })
  @ApiResponse({
    status: 200,
    description: 'Successful login returning JWT access token & user profile',
    type: LoginResponseDto,
  })
  @ApiResponse({ status: 401, description: 'Invalid credentials (email or password / PIN)' })
  async login(@Body() loginDto: LoginDto) {
    return this.authService.login(loginDto);
  }

  @UseGuards(JwtAuthGuard)
  @Get('profile')
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({
    summary: 'Get Logged-in User Profile & Account Details',
    description:
      'Fetch full profile details of current user (Full Name, Avatar, Professional Email, Role, Masked Login PIN, and Business Tenant details).\n\n' +
      '🔒 **Allowed Roles**: Any Authenticated User',
  })
  @ApiResponse({
    status: 200,
    description: 'Profile details of current user',
    type: UserProfileDto,
  })
  @ApiResponse({ status: 401, description: 'Unauthorized / Missing or invalid JWT token' })
  async getProfile(@Request() req: any) {
    const userId = req.user.userId || req.user.id || req.user.sub;
    return this.authService.getProfile(userId);
  }

  @UseGuards(JwtAuthGuard)
  @Patch('profile')
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({
    summary: 'Update User Profile / Identity Details',
    description:
      'Update user identity including full display name and avatar photo.\n' +
      'Email, Role, and Login PIN are protected read-only fields on this form.\n\n' +
      '🔒 **Allowed Roles**: Any Authenticated User',
  })
  @ApiBody({ type: UpdateProfileDto })
  @ApiResponse({
    status: 200,
    description: 'User profile updated successfully',
    type: UserProfileDto,
  })
  @ApiResponse({ status: 400, description: 'Invalid input' })
  async updateProfile(@Request() req: any, @Body() updateDto: UpdateProfileDto) {
    const userId = req.user.userId || req.user.id || req.user.sub;
    return this.authService.updateProfile(userId, updateDto);
  }

  @UseGuards(JwtAuthGuard)
  @Patch('change-password')
  @HttpCode(HttpStatus.OK)
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({
    summary: 'Security: Change User Password',
    description:
      'Change account password with verification of current password and matching confirmation.\n\n' +
      '🔒 **Allowed Roles**: Any Authenticated User',
  })
  @ApiBody({ type: ChangePasswordDto })
  @ApiResponse({
    status: 200,
    description: 'Password changed successfully',
    type: SuccessMessageResponseDto,
  })
  @ApiResponse({ status: 400, description: 'Incorrect current password or password mismatch' })
  async changePassword(@Request() req: any, @Body() changePasswordDto: ChangePasswordDto) {
    const userId = req.user.userId || req.user.id || req.user.sub;
    return this.authService.changePassword(userId, changePasswordDto);
  }

  @UseGuards(JwtAuthGuard)
  @Patch('change-pin')
  @HttpCode(HttpStatus.OK)
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({
    summary: 'Security & PIN: Update Quick-Login PIN',
    description:
      'Update 4-digit POS quick-login PIN for the logged-in user.\n\n' +
      '🔒 **Allowed Roles**: Any Authenticated User',
  })
  @ApiBody({ type: ChangePinDto })
  @ApiResponse({
    status: 200,
    description: 'PIN changed successfully',
    type: SuccessMessageResponseDto,
  })
  async changePin(@Request() req: any, @Body() changePinDto: ChangePinDto) {
    const userId = req.user.userId || req.user.id || req.user.sub;
    return this.authService.changePin(userId, changePinDto.pin);
  }
}
