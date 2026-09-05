import {
  Controller,
  Get,
  Post,
  Body,
  Query,
  Param,
  UseGuards,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import {
  ApiTags,
  ApiBearerAuth,
  ApiOperation,
  ApiResponse,
  ApiParam,
} from '@nestjs/swagger';
import { CashierService } from './cashier.service';
import { CashierCheckoutDto } from './dto/cashier-checkout.dto';
import { QueryCashierTablesDto, QueryCashierMenuDto } from './dto/query-cashier.dto';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { UserRole } from '../../enums/user-role.enum';

@ApiTags('Cashier - POS Hub & Payment Processing')
@ApiBearerAuth('JWT-auth')
@Controller('cashier')
@UseGuards(JwtAuthGuard, RolesGuard)
export class CashierController {
  constructor(private readonly cashierService: CashierService) {}

  @Get('tables')
  @Roles(
    UserRole.CASHIER,
    UserRole.MANAGER,
    UserRole.SUPERVISOR,
    UserRole.SUPER_ADMIN,
    UserRole.SERVER,
  )
  @ApiOperation({
    summary: 'Get Live POS Tables & Bar Stations',
    description:
      'Fetches all table and bar stations for Cashier Hub Grid with live billing totals, served/occupied status badges, and item summaries.\n\n' +
      '🔒 **Allowed Roles**: `CASHIER`, `MANAGER`, `SUPERVISOR`, `SUPER_ADMIN`, `SERVER`',
  })
  @ApiResponse({
    status: 200,
    description: 'Array of table cards with occupancy, status, and bill amounts',
  })
  getPosTables(
    @Query() query: QueryCashierTablesDto,
    @CurrentUser() user: any,
  ) {
    return this.cashierService.getPosTables(query, user);
  }

  @Get('menu')
  @Roles(
    UserRole.CASHIER,
    UserRole.MANAGER,
    UserRole.SUPERVISOR,
    UserRole.SUPER_ADMIN,
    UserRole.SERVER,
  )
  @ApiOperation({
    summary: 'Get Order Menu Dishes',
    description:
      'Fetches available food items categorized by Main, Starters, Breads, and Beverages for cashier order creation.\n\n' +
      '🔒 **Allowed Roles**: `CASHIER`, `MANAGER`, `SUPERVISOR`, `SUPER_ADMIN`, `SERVER`',
  })
  @ApiResponse({
    status: 200,
    description: 'List of menu items with price, dietary veg tag, and photos',
  })
  getMenuItems(
    @Query() query: QueryCashierMenuDto,
    @CurrentUser() user: any,
  ) {
    return this.cashierService.getMenuItems(query, user);
  }

  @Get('tables/:tableId/bill')
  @Roles(
    UserRole.CASHIER,
    UserRole.MANAGER,
    UserRole.SUPERVISOR,
    UserRole.SUPER_ADMIN,
  )
  @ApiOperation({
    summary: 'Get Table Bill Details',
    description: 'Retrieves active order items, subtotal, and bill for a specific table station before checkout.',
  })
  @ApiParam({ name: 'tableId', description: 'Table ID or Table Number', example: '1' })
  @ApiResponse({ status: 200, description: 'Table active order and bill breakdown' })
  @ApiResponse({ status: 404, description: 'Table not found' })
  getTableBill(
    @Param('tableId') tableId: string,
    @CurrentUser() user: any,
  ) {
    return this.cashierService.getTableBill(tableId, user);
  }

  @Post('checkout')
  @HttpCode(HttpStatus.OK)
  @Roles(
    UserRole.CASHIER,
    UserRole.MANAGER,
    UserRole.SUPERVISOR,
    UserRole.SUPER_ADMIN,
  )
  @ApiOperation({
    summary: 'Complete Checkout & Payment Settle',
    description:
      'Processes full bill settlement using:\n' +
      '- **Online**: bKash, Nagad, Rocket, Upay with Merchant details and TrxID.\n' +
      '- **Card**: Visa, Mastercard, Amex with POS Terminal integration.\n' +
      '- **Cash**: Cash received, change calculation, and receipt printing.\n' +
      'Automatically marks the order as COMPLETED and frees up the table to AVAILABLE status.\n\n' +
      '🔒 **Allowed Roles**: `CASHIER`, `MANAGER`, `SUPERVISOR`, `SUPER_ADMIN`',
  })
  @ApiResponse({
    status: 200,
    description: 'Payment processed successfully, receipt generated, and table freed.',
  })
  @ApiResponse({ status: 400, description: 'Invalid payment parameters or insufficient cash tendered.' })
  processCheckout(
    @Body() dto: CashierCheckoutDto,
    @CurrentUser() user: any,
  ) {
    return this.cashierService.processCheckout(dto, user);
  }
}
