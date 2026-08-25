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
import { CreateVoucherDto } from './dto/create-voucher.dto';
import { ResetSupervisorDto } from './dto/reset-supervisor.dto';
import { UpdateTenantRolesDto } from './dto/update-tenant-roles.dto';
import { CreateUserDto } from '../users/dto/create-user.dto';
import { AssignPlanDto } from './dto/assign-plan.dto';
import { UpdateVoucherDto } from './dto/update-voucher.dto';

import { ApiTags, ApiBearerAuth, ApiOperation, ApiBody } from '@nestjs/swagger';

@ApiTags('Admin')
@ApiBearerAuth('JWT-auth')
@Controller('businesses')
@UseGuards(JwtAuthGuard, RolesGuard)
export class BusinessesController {
  constructor(private readonly businessesService: BusinessesService) {}

  @Post()
  @Roles(UserRole.SUPER_ADMIN)
  @ApiOperation({
    summary: '1. Register New Business Tenant & Manager',
    description:
      'Create a new restaurant business tenant along with its initial Manager account and enabled employee operational roles.\n\n🔒 **Allowed Roles**: `SUPER_ADMIN`',
  })
  @ApiBody({
    type: CreateBusinessDto,
    description: 'Business registration details, manager credentials, and role selections',
    examples: {
      default: {
        summary: 'Demo Data - Register New Restaurant Tenant',
        value: {
          businessName: 'Foodies Hub Restaurant',
          subscriptionFee: '99.99',
          managerEmail: 'manager@foodieshub.com',
          managerPin: '1234',
          allowedRoles: ['manager', 'server', 'cashier', 'kitchen'],
          phone: '+1234567890',
          address: '123 Main Street, City',
        },
      },
    },
  })
  create(@Body() createBusinessDto: CreateBusinessDto) {
    return this.businessesService.create(createBusinessDto);
  }

  @Get('admin-overview')
  @Roles(UserRole.SUPER_ADMIN)
  @ApiOperation({
    summary: '2. Super Admin Overview Metrics & Tenants',
    description:
      'Fetch high-level system metrics (tenants, tickets, revenue) and full tenant list for Super Admin Dashboard.\n\n🔒 **Allowed Roles**: `SUPER_ADMIN`',
  })
  getAdminOverview() {
    return this.businessesService.getAdminOverview();
  }

  @Get()
  @Roles(UserRole.SUPER_ADMIN)
  @ApiOperation({
    summary: '3. Get All Businesses',
    description:
      'Fetch all registered businesses.\n\n🔒 **Allowed Roles**: `SUPER_ADMIN`',
  })
  findAll() {
    return this.businessesService.findAll();
  }

  @Get(':id')
  @Roles(UserRole.SUPER_ADMIN, UserRole.MANAGER)
  @ApiOperation({
    summary: '4. Get Business by ID',
    description:
      'Fetch business details by ID.\n\n🔒 **Allowed Roles**: `SUPER_ADMIN`, `MANAGER`',
  })
  findOne(@Param('id') id: string) {
    return this.businessesService.findOne(id);
  }

  @Patch(':id')
  @Roles(UserRole.SUPER_ADMIN)
  @ApiOperation({
    summary: '5. Update Business',
    description:
      'Update business information.\n\n🔒 **Allowed Roles**: `SUPER_ADMIN`',
  })
  update(
    @Param('id') id: string,
    @Body() updateBusinessDto: UpdateBusinessDto,
  ) {
    return this.businessesService.update(id, updateBusinessDto);
  }

  @Delete(':id')
  @Roles(UserRole.SUPER_ADMIN)
  @ApiOperation({
    summary: '6. Delete Business',
    description:
      'Permanently remove a business account.\n\n🔒 **Allowed Roles**: `SUPER_ADMIN`',
  })
  remove(@Param('id') id: string) {
    return this.businessesService.remove(id);
  }

  @Post(':businessId/managers')
  @Roles(UserRole.SUPER_ADMIN)
  @ApiOperation({
    summary: '7. Create Manager for Business',
    description:
      'Create a manager account assigned to a specific business.\n\n🔒 **Allowed Roles**: `SUPER_ADMIN`',
  })
  createManager(
    @Param('businessId') businessId: string,
    @Body() createManagerDto: CreateManagerDto,
  ) {
    return this.businessesService.createManager(businessId, createManagerDto);
  }

  @Post(':businessId/users')
  @Roles(UserRole.SUPER_ADMIN, UserRole.MANAGER)
  @ApiOperation({
    summary: '8. Add User to Business',
    description:
      'Create a new user (with name, email, 4-digit PIN, role) assigned to a tenant.\n\n🔒 **Allowed Roles**: `SUPER_ADMIN`, `MANAGER`',
  })
  addUserToBusiness(
    @Param('businessId') businessId: string,
    @Body() createUserDto: CreateUserDto,
  ) {
    return this.businessesService.addUserToBusiness(
      businessId,
      createUserDto,
    );
  }

  @Post(':businessId/vouchers')
  @Roles(UserRole.SUPER_ADMIN)
  @ApiOperation({
    summary: '9. Create Voucher for Business',
    description:
      'Generate a discount voucher for a tenant.\n\n🔒 **Allowed Roles**: `SUPER_ADMIN`',
  })
  createVoucher(
    @Param('businessId') businessId: string,
    @Body() createVoucherDto: CreateVoucherDto,
  ) {
    return this.businessesService.createVoucher(businessId, createVoucherDto);
  }

  @Get('vouchers')
  @Roles(UserRole.SUPER_ADMIN)
  @ApiOperation({
    summary: '10. Get All Created Vouchers',
    description:
      'Fetch all vouchers across tenants.\n\n🔒 **Allowed Roles**: `SUPER_ADMIN`',
  })
  getAllVouchers() {
    return this.businessesService.getAllVouchers();
  }

  @Patch(':id/subscription-plan')
  @Roles(UserRole.SUPER_ADMIN)
  @ApiOperation({
    summary: '10a. Assign Subscription Plan to Business',
    description:
      'Link a tenant / business to an administrative subscription plan.\n\n🔒 **Allowed Roles**: `SUPER_ADMIN`',
  })
  @ApiBody({ type: AssignPlanDto })
  assignSubscriptionPlan(
    @Param('id') id: string,
    @Body() assignPlanDto: AssignPlanDto,
  ) {
    return this.businessesService.assignSubscriptionPlan(id, assignPlanDto.subscriptionPlanId);
  }

  @Patch('vouchers/:voucherId')
  @Roles(UserRole.SUPER_ADMIN)
  @ApiOperation({
    summary: '10b. Update Voucher',
    description:
      'Modify a discount voucher (e.g. toggle active status or usage).\n\n🔒 **Allowed Roles**: `SUPER_ADMIN`',
  })
  @ApiBody({ type: UpdateVoucherDto })
  updateVoucher(
    @Param('voucherId') voucherId: string,
    @Body() updateVoucherDto: UpdateVoucherDto,
  ) {
    return this.businessesService.updateVoucher(voucherId, updateVoucherDto);
  }

  @Delete('vouchers/:voucherId')
  @Roles(UserRole.SUPER_ADMIN)
  @ApiOperation({
    summary: '10c. Delete Voucher',
    description:
      'Permanently delete a discount voucher.\n\n🔒 **Allowed Roles**: `SUPER_ADMIN`',
  })
  deleteVoucher(@Param('voucherId') voucherId: string) {
    return this.businessesService.deleteVoucher(voucherId);
  }

  @Post(':businessId/reset-supervisor')
  @Roles(UserRole.SUPER_ADMIN)
  @ApiOperation({
    summary: '11. Reset Supervisor Credentials',
    description:
      'Reset supervisor email/PIN for a tenant.\n\n🔒 **Allowed Roles**: `SUPER_ADMIN`',
  })
  resetSupervisor(
    @Param('businessId') businessId: string,
    @Body() resetSupervisorDto: ResetSupervisorDto,
  ) {
    return this.businessesService.resetSupervisorCredentials(
      businessId,
      resetSupervisorDto,
    );
  }

  @Patch(':businessId/roles')
  @Roles(UserRole.SUPER_ADMIN)
  @ApiOperation({
    summary: '12. Manage Tenant Roles',
    description:
      'Enable or disable operational roles for a tenant.\n\n🔒 **Allowed Roles**: `SUPER_ADMIN`',
  })
  updateTenantRoles(
    @Param('businessId') businessId: string,
    @Body() updateTenantRolesDto: UpdateTenantRolesDto,
  ) {
    return this.businessesService.updateTenantRoles(
      businessId,
      updateTenantRolesDto,
    );
  }
}
