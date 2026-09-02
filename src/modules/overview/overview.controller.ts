import { Controller, Get, UseGuards, Query } from '@nestjs/common';
import {
  ApiTags,
  ApiBearerAuth,
  ApiOperation,
  ApiResponse,
  ApiQuery,
} from '@nestjs/swagger';
import { OverviewService } from './overview.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { UserRole } from '../../enums/user-role.enum';

@ApiTags('Manager - Overview Dashboard')
@ApiBearerAuth('JWT-auth')
@Controller('overview')
@UseGuards(JwtAuthGuard, RolesGuard)
export class OverviewController {
  constructor(private readonly overviewService: OverviewService) {}

  @Get()
  @Roles(UserRole.MANAGER, UserRole.SUPERVISOR, UserRole.SUPER_ADMIN)
  @ApiOperation({
    summary: 'Get Manager Overview Cards Data',
    description:
      'Retrieve POS Overview KPI metrics: Daily Sales ($4280.50, +12), Total Transactions (142, +5.2%), Active Terminals (4, Stable), and Pending Orders (0, 0 prev).\n\n' +
      '🔒 **Allowed Roles**: `MANAGER`, `SUPERVISOR`, `SUPER_ADMIN`',
  })
  @ApiQuery({
    name: 'businessId',
    required: false,
    description: 'Optional business ID for Super Admin to inspect a specific restaurant tenant',
  })
  @ApiResponse({
    status: 200,
    description: 'Overview card metrics formatted for frontend dashboard display',
  })
  getOverview(
    @CurrentUser() user: any,
    @Query('businessId') businessId?: string,
  ) {
    return this.overviewService.getOverviewCards(user, businessId);
  }

  @Get('cards')
  @Roles(UserRole.MANAGER, UserRole.SUPERVISOR, UserRole.SUPER_ADMIN)
  @ApiOperation({
    summary: 'Get Overview Cards (Alias)',
    description: 'Direct alias for fetching the 4 KPI cards.\n\n🔒 **Allowed Roles**: `MANAGER`, `SUPERVISOR`, `SUPER_ADMIN`',
  })
  getOverviewCards(
    @CurrentUser() user: any,
    @Query('businessId') businessId?: string,
  ) {
    return this.overviewService.getOverviewCards(user, businessId);
  }
}
