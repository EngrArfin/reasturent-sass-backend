import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  UseGuards,
} from '@nestjs/common';

import { Roles } from '../../common/decorators/roles.decorator';
import { UserRole } from '../../enums/user-role.enum';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { BusinessesService } from './businesses.service';
import { CreateBusinessDto } from './dto/create-business.dto';
import { CreateManagerDto } from './dto/create-manager.dto';
import { UpdateBusinessDto } from './dto/update-business.dto';

import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';

@ApiTags('Businesses')
@ApiBearerAuth('JWT-auth')
@Controller('businesses')
@UseGuards(JwtAuthGuard, RolesGuard)
export class BusinessesController {
  constructor(private readonly businessesService: BusinessesService) {}

  @Post()
  @Roles(UserRole.SUPER_ADMIN)
  @ApiOperation({
    summary: 'Create Business',
    description: 'Create a new business tenant.\n\n🔒 **Allowed Roles**: `SUPER_ADMIN`',
  })
  create(@Body() createBusinessDto: CreateBusinessDto) {
    return this.businessesService.create(createBusinessDto);
  }

  @Post(':businessId/managers')
  @Roles(UserRole.SUPER_ADMIN)
  @ApiOperation({
    summary: 'Create Manager for Business',
    description: 'Create a manager account assigned to a specific business.\n\n🔒 **Allowed Roles**: `SUPER_ADMIN`',
  })
  createManager(
    @Param('businessId') businessId: string,
    @Body() createManagerDto: CreateManagerDto,
  ) {
    return this.businessesService.createManager(businessId, createManagerDto);
  }

  @Get()
  @Roles(UserRole.SUPER_ADMIN)
  @ApiOperation({
    summary: 'Get All Businesses',
    description: 'Fetch all registered businesses.\n\n🔒 **Allowed Roles**: `SUPER_ADMIN`',
  })
  findAll() {
    return this.businessesService.findAll();
  }

  @Get(':id')
  @Roles(UserRole.SUPER_ADMIN, UserRole.BUSINESS_ADMIN)
  @ApiOperation({
    summary: 'Get Business by ID',
    description: 'Fetch business details by ID.\n\n🔒 **Allowed Roles**: `SUPER_ADMIN`, `BUSINESS_ADMIN`',
  })
  findOne(@Param('id') id: string) {
    return this.businessesService.findOne(id);
  }

  @Patch(':id')
  @Roles(UserRole.SUPER_ADMIN)
  @ApiOperation({
    summary: 'Update Business',
    description: 'Update business information.\n\n🔒 **Allowed Roles**: `SUPER_ADMIN`',
  })
  update(@Param('id') id: string, @Body() updateBusinessDto: UpdateBusinessDto) {
    return this.businessesService.update(id, updateBusinessDto);
  }

  @Delete(':id')
  @Roles(UserRole.SUPER_ADMIN)
  @ApiOperation({
    summary: 'Delete Business',
    description: 'Permanently remove a business account.\n\n🔒 **Allowed Roles**: `SUPER_ADMIN`',
  })
  remove(@Param('id') id: string) {
    return this.businessesService.remove(id);
  }
}
