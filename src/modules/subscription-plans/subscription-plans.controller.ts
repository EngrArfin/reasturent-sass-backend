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
import { ApiTags, ApiBearerAuth, ApiOperation, ApiBody } from '@nestjs/swagger';
import { SubscriptionPlansService } from './subscription-plans.service';
import { CreateSubscriptionPlanDto } from './dto/create-subscription-plan.dto';
import { UpdateSubscriptionPlanDto } from './dto/update-subscription-plan.dto';
import { Roles } from '../../common/decorators/roles.decorator';
import { UserRole } from '../../enums/user-role.enum';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';

@ApiTags('Subscription Plans')
@ApiBearerAuth('JWT-auth')
@Controller('subscription-plans')
@UseGuards(JwtAuthGuard, RolesGuard)
export class SubscriptionPlansController {
  constructor(private readonly plansService: SubscriptionPlansService) {}

  @Post()
  @Roles(UserRole.SUPER_ADMIN)
  @ApiOperation({
    summary: 'Create Subscription Plan',
    description: 'Create a new subscription plan.\n\n🔒 **Allowed Roles**: `SUPER_ADMIN`',
  })
  @ApiBody({ type: CreateSubscriptionPlanDto })
  create(@Body() createPlanDto: CreateSubscriptionPlanDto) {
    return this.plansService.create(createPlanDto);
  }

  @Get()
  @ApiOperation({
    summary: 'Get All Subscription Plans',
    description: 'Fetch all available subscription plans.\n\n🔒 **Allowed Roles**: Any Authenticated User',
  })
  findAll() {
    return this.plansService.findAll();
  }

  @Get(':id')
  @ApiOperation({
    summary: 'Get Subscription Plan by ID',
    description: 'Fetch a subscription plan by ID.\n\n🔒 **Allowed Roles**: Any Authenticated User',
  })
  findOne(@Param('id') id: string) {
    return this.plansService.findOne(id);
  }

  @Patch(':id')
  @Roles(UserRole.SUPER_ADMIN)
  @ApiOperation({
    summary: 'Update Subscription Plan',
    description: 'Modify an existing subscription plan.\n\n🔒 **Allowed Roles**: `SUPER_ADMIN`',
  })
  @ApiBody({ type: UpdateSubscriptionPlanDto })
  update(
    @Param('id') id: string,
    @Body() updatePlanDto: UpdateSubscriptionPlanDto,
  ) {
    return this.plansService.update(id, updatePlanDto);
  }

  @Delete(':id')
  @Roles(UserRole.SUPER_ADMIN)
  @ApiOperation({
    summary: 'Delete Subscription Plan',
    description: 'Permanently remove a subscription plan.\n\n🔒 **Allowed Roles**: `SUPER_ADMIN`',
  })
  remove(@Param('id') id: string) {
    return this.plansService.remove(id);
  }
}
