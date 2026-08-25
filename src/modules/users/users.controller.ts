import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  UseGuards,
  Query,
} from '@nestjs/common';

import { Roles } from '../../common/decorators/roles.decorator';
import { UserRole } from '../../enums/user-role.enum';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { UsersService } from './users.service';
import { RolesGuard } from '../../common/guards/roles.guard';
import { CurrentUser } from '../../common/decorators/current-user.decorator';

import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';

@ApiTags('Users')
@ApiBearerAuth('JWT-auth')
@Controller('users')
@UseGuards(JwtAuthGuard, RolesGuard)
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Post()
  @Roles(UserRole.SUPER_ADMIN, UserRole.MANAGER)
  @ApiOperation({
    summary: 'Create User',
    description: 'Create a new user.\n\n🔒 **Allowed Roles**: `SUPER_ADMIN`, `MANAGER`',
  })
  create(@Body() createUserDto: CreateUserDto) {
    return this.usersService.create(createUserDto);
  }

  @Get()
  @Roles(UserRole.SUPER_ADMIN, UserRole.MANAGER)
  @ApiOperation({
    summary: 'Get All Users',
    description: 'Fetch all users (optionally filtered by businessId).\n\n🔒 **Allowed Roles**: `SUPER_ADMIN`, `MANAGER`',
  })
  findAll(@Query('businessId') businessId?: string) {
    return this.usersService.findAll(businessId);
  }

  @Get('role/:role')
  @Roles(UserRole.SUPER_ADMIN, UserRole.MANAGER)
  @ApiOperation({
    summary: 'Get Users by Role',
    description: 'Fetch users filtered by role.\n\n🔒 **Allowed Roles**: `SUPER_ADMIN`, `MANAGER`',
  })
  findByRole(
    @Param('role') role: UserRole,
    @Query('businessId') businessId?: string,
  ) {
    return this.usersService.findByRole(role, businessId);
  }

  @Get(':id')
  @ApiOperation({
    summary: 'Get User by ID',
    description: 'Fetch a single user profile by ID.\n\n🔒 **Allowed Roles**: Any Authenticated User',
  })
  findOne(@Param('id') id: string) {
    return this.usersService.findOne(id);
  }

  @Patch(':id')
  @ApiOperation({
    summary: 'Update User',
    description: 'Update user account information.\n\n🔒 **Allowed Roles**: Any Authenticated User',
  })
  update(@Param('id') id: string, @Body() updateUserDto: UpdateUserDto) {
    return this.usersService.update(id, updateUserDto);
  }

  @Delete(':id')
  @Roles(UserRole.SUPER_ADMIN)
  @ApiOperation({
    summary: 'Delete User',
    description: 'Permanently remove a user account.\n\n🔒 **Allowed Roles**: `SUPER_ADMIN`',
  })
  remove(@Param('id') id: string) {
    return this.usersService.remove(id);
  }

  @Post(':id/change-pin')
  @Roles(UserRole.MANAGER, UserRole.SUPER_ADMIN)
  @ApiOperation({
    summary: 'Change User PIN',
    description: 'Update account PIN for a user.\n\n🔒 **Allowed Roles**: `MANAGER`, `SUPER_ADMIN` (or self)',
  })
  changePin(
    @Param('id') id: string,
    @Body('pin') pin: string,
    @CurrentUser() user: any,
  ) {
    return this.usersService.changePin(id, pin, user);
  }
}
