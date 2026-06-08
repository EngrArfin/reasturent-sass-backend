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
import { RolesGuard } from 'src/common/guards/roles.guard';
import { CurrentUser } from 'src/common/decorators/current-user.decorator';

import { ApiTags, ApiBearerAuth } from '@nestjs/swagger';

@ApiTags('Users')
@ApiBearerAuth('JWT-auth')
@Controller('users')
@UseGuards(JwtAuthGuard, RolesGuard)
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Post()
  @Roles(UserRole.SUPER_ADMIN, UserRole.BUSINESS_ADMIN)
  create(@Body() createUserDto: CreateUserDto) {
    return this.usersService.create(createUserDto);
  }

  @Get()
  @Roles(UserRole.SUPER_ADMIN, UserRole.BUSINESS_ADMIN)
  findAll(@Query('businessId') businessId?: string) {
    return this.usersService.findAll(businessId);
  }

  @Get('role/:role')
  @Roles(UserRole.SUPER_ADMIN, UserRole.BUSINESS_ADMIN)
  findByRole(
    @Param('role') role: UserRole,
    @Query('businessId') businessId?: string,
  ) {
    return this.usersService.findByRole(role, businessId);
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.usersService.findOne(id);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() updateUserDto: UpdateUserDto) {
    return this.usersService.update(id, updateUserDto);
  }

  @Delete(':id')
  @Roles(UserRole.SUPER_ADMIN)
  remove(@Param('id') id: string) {
    return this.usersService.remove(id);
  }

  @Post(':id/change-pin')
  @Roles(UserRole.MANAGER, UserRole.BUSINESS_ADMIN)
  changePin(
    @Param('id') id: string,
    @Body('pin') pin: string,
    @CurrentUser() user: any,
  ) {
    return this.usersService.changePin(id, pin, user);
  }
}
