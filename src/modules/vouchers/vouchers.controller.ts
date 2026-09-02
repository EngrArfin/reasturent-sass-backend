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
import { VouchersService } from './vouchers.service';
import { CreateVoucherDto } from './dto/create-voucher.dto';
import { UpdateVoucherDto } from './dto/update-voucher.dto';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { UserRole } from '../../enums/user-role.enum';
import {
  ApiTags,
  ApiBearerAuth,
  ApiOperation,
  ApiResponse,
  ApiQuery,
  ApiParam,
} from '@nestjs/swagger';

@ApiTags('Manager - Vouchers & Discounts')
@ApiBearerAuth('JWT-auth')
@Controller('vouchers')
@UseGuards(JwtAuthGuard, RolesGuard)
export class VouchersController {
  constructor(private readonly vouchersService: VouchersService) {}

  @Post()
  @Roles(UserRole.MANAGER, UserRole.SUPERVISOR, UserRole.SUPER_ADMIN)
  @ApiOperation({
    summary: 'Add New Voucher / Discount',
    description:
      'Creates a new discount voucher for the restaurant inventory items.\n' +
      'Calculates amount off and final discounted price automatically.\n\n' +
      '🔒 **Allowed Roles**: `MANAGER`, `SUPERVISOR`, `SUPER_ADMIN`',
  })
  @ApiResponse({ status: 201, description: 'Voucher created successfully' })
  @ApiResponse({ status: 400, description: 'Validation error' })
  create(
    @Body() createVoucherDto: CreateVoucherDto,
    @CurrentUser() user: any,
  ) {
    return this.vouchersService.create(createVoucherDto, user);
  }

  @Get()
  @Roles(UserRole.MANAGER, UserRole.SUPERVISOR, UserRole.SUPER_ADMIN)
  @ApiOperation({
    summary: 'Get All Vouchers & Discounts',
    description:
      'Fetch all restaurant vouchers and discounts with original price, discount amount, and final price formatted.\n\n' +
      '🔒 **Allowed Roles**: `MANAGER`, `SUPERVISOR`, `SUPER_ADMIN`',
  })
  @ApiQuery({ name: 'search', required: false, description: 'Search keyword by item name, code, or requester' })
  @ApiQuery({ name: 'businessId', required: false, description: 'Optional business ID for Super Admin' })
  @ApiResponse({ status: 200, description: 'List of vouchers matching the UI cards' })
  findAll(
    @CurrentUser() user: any,
    @Query('businessId') businessId?: string,
    @Query('search') search?: string,
  ) {
    return this.vouchersService.findAll(user, businessId, search);
  }

  @Get(':id')
  @Roles(UserRole.MANAGER, UserRole.SUPERVISOR, UserRole.SUPER_ADMIN)
  @ApiOperation({
    summary: 'Get Voucher by ID',
    description: 'Retrieve details for a single voucher.\n\n🔒 **Allowed Roles**: `MANAGER`, `SUPERVISOR`, `SUPER_ADMIN`',
  })
  @ApiParam({ name: 'id', description: 'Voucher UUID' })
  @ApiResponse({ status: 200, description: 'Voucher found' })
  @ApiResponse({ status: 404, description: 'Voucher not found' })
  findOne(@Param('id') id: string, @CurrentUser() user: any) {
    return this.vouchersService.findOne(id, user);
  }

  @Patch(':id')
  @Roles(UserRole.MANAGER, UserRole.SUPERVISOR, UserRole.SUPER_ADMIN)
  @ApiOperation({
    summary: 'Edit Voucher',
    description:
      'Update voucher details such as name, minimum price, or off price percentage.\n\n' +
      '🔒 **Allowed Roles**: `MANAGER`, `SUPERVISOR`, `SUPER_ADMIN`',
  })
  @ApiParam({ name: 'id', description: 'Voucher UUID' })
  @ApiResponse({ status: 200, description: 'Voucher updated successfully' })
  @ApiResponse({ status: 404, description: 'Voucher not found' })
  update(
    @Param('id') id: string,
    @Body() updateVoucherDto: UpdateVoucherDto,
    @CurrentUser() user: any,
  ) {
    return this.vouchersService.update(id, updateVoucherDto, user);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.OK)
  @Roles(UserRole.MANAGER, UserRole.SUPER_ADMIN)
  @ApiOperation({
    summary: 'Delete Voucher',
    description: 'Permanently remove a voucher.\n\n🔒 **Allowed Roles**: `MANAGER`, `SUPER_ADMIN`',
  })
  @ApiParam({ name: 'id', description: 'Voucher UUID' })
  @ApiResponse({ status: 200, description: 'Voucher deleted successfully' })
  @ApiResponse({ status: 404, description: 'Voucher not found' })
  remove(@Param('id') id: string, @CurrentUser() user: any) {
    return this.vouchersService.remove(id, user);
  }
}
