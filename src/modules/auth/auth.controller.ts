import {
  Controller,
  Post,
  Body,
  Get,
  UseGuards,
  Request,
} from '@nestjs/common';
import { AuthService } from './auth.service';
import { Public } from '../../common/decorators/public.decorator';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { LoginDto } from './dto/login.dto';
import { RegisterDto } from './dto/register.dto';
import { LoginResponseDto, UserProfileDto } from './dto/auth-response.dto';
import {
  ApiTags,
  ApiOperation,
  ApiBody,
  ApiResponse,
  ApiBearerAuth,
} from '@nestjs/swagger';

@ApiTags('Auth')
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
    description: 'Authenticate user with email & password and return JWT access token.\n\n🔓 **Allowed Roles**: Public (No Authentication Required)',
  })
  @ApiBody({ type: LoginDto })
  @ApiResponse({
    status: 200,
    description: 'Successful login returning JWT access token & user profile',
    type: LoginResponseDto,
  })
  @ApiResponse({ status: 401, description: 'Invalid credentials (email or password)' })
  async login(@Body() loginDto: LoginDto) {
    return this.authService.login(loginDto);
  }

  @UseGuards(JwtAuthGuard)
  @Get('profile')
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({
    summary: 'Get Logged-in User Profile',
    description: 'Fetch the profile of the currently authenticated user.\n\n🔒 **Allowed Roles**: Any Authenticated User',
  })
  @ApiResponse({
    status: 200,
    description: 'Profile details of current user',
    type: UserProfileDto,
  })
  @ApiResponse({ status: 401, description: 'Unauthorized / Missing or invalid JWT token' })
  async getProfile(@Request() req: any) {
    return this.authService.getProfile(req.user.userId);
  }
}

