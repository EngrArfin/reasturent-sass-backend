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
  HttpCode,
  HttpStatus,
} from '@nestjs/common';

import { Roles } from '../../common/decorators/roles.decorator';
import { UserRole } from '../../enums/user-role.enum';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { UsersService } from './users.service';
import { RolesGuard } from '../../common/guards/roles.guard';
import { CurrentUser } from '../../common/decorators/current-user.decorator';

import {
  ApiTags,
  ApiBearerAuth,
  ApiOperation,
  ApiResponse,
  ApiQuery,
  ApiParam,
} from '@nestjs/swagger';

@ApiTags('Manager - Employees Management')
@ApiBearerAuth('JWT-auth')
@Controller('users')
@UseGuards(JwtAuthGuard, RolesGuard)
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Post()
  @Roles(UserRole.SUPER_ADMIN, UserRole.MANAGER)
  @ApiOperation({
    summary: 'Add New Employee Profile',
    description:
      'Creates a new staff/employee account for the restaurant (e.g. Manager, Server, Kitchen, Cashier).\n' +
      'If email or password are not provided, secure defaults are automatically generated for POS quick access.\n\n' +
      '🔒 **Allowed Roles**: `MANAGER`, `SUPER_ADMIN`',
  })
  @ApiResponse({ status: 201, description: 'Employee created successfully' })
  @ApiResponse({ status: 400, description: 'Invalid input' })
  @ApiResponse({ status: 409, description: 'Email already exists' })
  create(
    @Body() createUserDto: CreateUserDto,
    @CurrentUser() user: any,
  ) {
    return this.usersService.create(createUserDto, user);
  }

  @Get()
  @Roles(UserRole.SUPER_ADMIN, UserRole.MANAGER, UserRole.SUPERVISOR)
  @ApiOperation({
    summary: 'Get All Employees',
    description:
      'Fetch all employee profiles for the current restaurant.\n' +
      'For Managers, this is automatically scoped to their restaurant tenant.\n\n' +
      '🔒 **Allowed Roles**: `MANAGER`, `SUPERVISOR`, `SUPER_ADMIN`',
  })
  @ApiQuery({ name: 'search', required: false, description: 'Filter by employee name or email' })
  @ApiQuery({ name: 'role', required: false, description: 'Filter by role (manager, server, kitchen, cashier)' })
  @ApiQuery({ name: 'businessId', required: false, description: 'Optional business ID (Super Admin only)' })
  @ApiResponse({ status: 200, description: 'List of employee cards with masked PIN' })
  findAll(
    @CurrentUser() user: any,
    @Query('businessId') businessId?: string,
    @Query('search') search?: string,
    @Query('role') role?: string,
  ) {
    return this.usersService.findAll(user, businessId, search, role);
  }

  @Get(':id')
  @Roles(UserRole.SUPER_ADMIN, UserRole.MANAGER, UserRole.SUPERVISOR)
  @ApiOperation({
    summary: 'Get Employee Profile by ID',
    description: 'Fetch detailed employee profile.\n\n🔒 **Allowed Roles**: `MANAGER`, `SUPERVISOR`, `SUPER_ADMIN`',
  })
  @ApiParam({ name: 'id', description: 'Employee UUID' })
  @ApiResponse({ status: 200, description: 'Employee profile found' })
  @ApiResponse({ status: 404, description: 'Employee not found' })
  findOne(@Param('id') id: string, @CurrentUser() user: any) {
    return this.usersService.findOne(id, user);
  }

  @Patch(':id')
  @Roles(UserRole.SUPER_ADMIN, UserRole.MANAGER)
  @ApiOperation({
    summary: 'Edit Employee Profile',
    description:
      'Update employee name, system role, active status, or 4-digit quick-login PIN.\n\n' +
      '🔒 **Allowed Roles**: `MANAGER`, `SUPER_ADMIN`',
  })
  @ApiParam({ name: 'id', description: 'Employee UUID' })
  @ApiResponse({ status: 200, description: 'Employee updated successfully' })
  @ApiResponse({ status: 404, description: 'Employee not found' })
  update(
    @Param('id') id: string,
    @Body() updateUserDto: UpdateUserDto,
    @CurrentUser() user: any,
  ) {
    return this.usersService.update(id, updateUserDto, user);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.OK)
  @Roles(UserRole.SUPER_ADMIN, UserRole.MANAGER)
  @ApiOperation({
    summary: 'Delete Employee',
    description:
      'Permanently delete an employee profile from the restaurant.\n\n' +
      '🔒 **Allowed Roles**: `MANAGER`, `SUPER_ADMIN`',
  })
  @ApiParam({ name: 'id', description: 'Employee UUID' })
  @ApiResponse({ status: 200, description: 'Employee deleted successfully' })
  @ApiResponse({ status: 404, description: 'Employee not found' })
  remove(@Param('id') id: string, @CurrentUser() user: any) {
    return this.usersService.remove(id, user);
  }

  @Post(':id/change-pin')
  @Roles(UserRole.SUPER_ADMIN, UserRole.MANAGER)
  @ApiOperation({
    summary: 'Update Quick-Login PIN',
    description:
      'Set or update the 4-digit quick-login PIN for an employee.\n\n' +
      '🔒 **Allowed Roles**: `MANAGER`, `SUPER_ADMIN`',
  })
  @ApiParam({ name: 'id', description: 'Employee UUID' })
  @ApiResponse({ status: 200, description: 'PIN updated successfully' })
  @ApiResponse({ status: 400, description: 'Invalid PIN format (must be 4 digits)' })
  changePin(
    @Param('id') id: string,
    @Body('pin') pin: string,
    @CurrentUser() user: any,
  ) {
    return this.usersService.changePin(id, pin, user);
  }
}
