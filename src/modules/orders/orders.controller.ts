import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  Query,
  UseGuards,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import {
  ApiTags,
  ApiBearerAuth,
  ApiOperation,
  ApiResponse,
  ApiQuery,
  ApiParam,
} from '@nestjs/swagger';
import { OrdersService } from './orders.service';
import { CreateOrderDto } from './dto/create-order.dto';
import { UpdateOrderDto } from './dto/update-order.dto';
import { UpdateOrderStatusDto } from './dto/update-order-status.dto';
import { QueryOrderDto } from './dto/query-order.dto';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { UserRole } from '../../enums/user-role.enum';

@ApiTags('Manager - Food & Active Orders')
@ApiBearerAuth('JWT-auth')
@Controller('orders')
@UseGuards(JwtAuthGuard, RolesGuard)
export class OrdersController {
  constructor(private readonly ordersService: OrdersService) {}

  @Post()
  @Roles(
    UserRole.MANAGER,
    UserRole.SUPERVISOR,
    UserRole.SUPER_ADMIN,
    UserRole.SERVER,
    UserRole.CASHIER,
  )
  @ApiOperation({
    summary: 'Create New Order',
    description:
      'Creates a new dining or takeaway order with items, calculates total bill, and associates with table.\n\n' +
      '🔒 **Allowed Roles**: `MANAGER`, `SUPERVISOR`, `SUPER_ADMIN`, `SERVER`, `CASHIER`',
  })
  @ApiResponse({ status: 201, description: 'Order created successfully' })
  @ApiResponse({ status: 400, description: 'Invalid input or empty items' })
  create(
    @Body() createDto: CreateOrderDto,
    @CurrentUser() user: any,
  ) {
    return this.ordersService.create(createDto, user);
  }

  @Get()
  @Roles(
    UserRole.MANAGER,
    UserRole.SUPERVISOR,
    UserRole.SUPER_ADMIN,
    UserRole.SERVER,
    UserRole.CASHIER,
    UserRole.KITCHEN,
  )
  @ApiOperation({
    summary: 'Get All Active & History Orders',
    description:
      'Fetch orders filtered by status (ALL, PENDING, PREPARING, SERVED, COMPLETED), search by order number or table, with action button state.\n\n' +
      '🔒 **Allowed Roles**: `MANAGER`, `SUPERVISOR`, `SUPER_ADMIN`, `SERVER`, `CASHIER`, `KITCHEN`',
  })
  @ApiResponse({ status: 200, description: 'List of orders with status counts' })
  findAll(
    @Query() query: QueryOrderDto,
    @CurrentUser() user: any,
  ) {
    return this.ordersService.findAll(query, user);
  }

  @Get('summary')
  @Roles(
    UserRole.MANAGER,
    UserRole.SUPERVISOR,
    UserRole.SUPER_ADMIN,
    UserRole.SERVER,
    UserRole.CASHIER,
    UserRole.KITCHEN,
  )
  @ApiOperation({ summary: 'Get Order Metrics Summary' })
  @ApiQuery({ name: 'businessId', required: false, description: 'Optional business ID for Super Admin' })
  @ApiResponse({ status: 200, description: 'Order summary counts by status' })
  getSummary(@CurrentUser() user: any, @Query('businessId') businessId?: string) {
    return this.ordersService.getSummary(user, businessId);
  }

  @Get(':id')
  @Roles(
    UserRole.MANAGER,
    UserRole.SUPERVISOR,
    UserRole.SUPER_ADMIN,
    UserRole.SERVER,
    UserRole.CASHIER,
    UserRole.KITCHEN,
  )
  @ApiOperation({ summary: 'Get Order Details' })
  @ApiParam({ name: 'id', description: 'Order UUID' })
  @ApiResponse({ status: 200, description: 'Order details with items and table' })
  @ApiResponse({ status: 404, description: 'Order not found' })
  findOne(@Param('id') id: string, @CurrentUser() user: any) {
    return this.ordersService.findOne(id, user);
  }

  @Patch(':id/status')
  @Roles(
    UserRole.MANAGER,
    UserRole.SUPERVISOR,
    UserRole.SUPER_ADMIN,
    UserRole.SERVER,
    UserRole.CASHIER,
    UserRole.KITCHEN,
  )
  @ApiOperation({
    summary: 'Update Order Status (Trigger Action Button)',
    description:
      'Transitions order through lifecycle: PENDING -> Start Prep (PREPARING) -> Mark Served (SERVED) -> Complete Bill (COMPLETED).\n' +
      'Automatically updates corresponding table status when appropriate.\n\n' +
      '🔒 **Allowed Roles**: `MANAGER`, `SUPERVISOR`, `SUPER_ADMIN`, `SERVER`, `CASHIER`, `KITCHEN`',
  })
  @ApiParam({ name: 'id', description: 'Order UUID' })
  @ApiResponse({ status: 200, description: 'Order status updated successfully' })
  updateStatus(
    @Param('id') id: string,
    @Body() statusDto: UpdateOrderStatusDto,
    @CurrentUser() user: any,
  ) {
    return this.ordersService.updateStatus(id, statusDto, user);
  }

  @Patch(':id')
  @Roles(
    UserRole.MANAGER,
    UserRole.SUPERVISOR,
    UserRole.SUPER_ADMIN,
    UserRole.SERVER,
    UserRole.CASHIER,
  )
  @ApiOperation({ summary: 'Update Order Details / Items' })
  @ApiParam({ name: 'id', description: 'Order UUID' })
  @ApiResponse({ status: 200, description: 'Order updated successfully' })
  update(
    @Param('id') id: string,
    @Body() updateDto: UpdateOrderDto,
    @CurrentUser() user: any,
  ) {
    return this.ordersService.update(id, updateDto, user);
  }

  @Delete(':id')
  @Roles(UserRole.MANAGER, UserRole.SUPERVISOR, UserRole.SUPER_ADMIN)
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Cancel & Delete Order' })
  @ApiParam({ name: 'id', description: 'Order UUID' })
  @ApiResponse({ status: 200, description: 'Order deleted successfully' })
  remove(@Param('id') id: string, @CurrentUser() user: any) {
    return this.ordersService.remove(id, user);
  }
}
