import {
  Controller,
  Get,
  Post,
  Patch,
  Body,
  Param,
  Query,
  UseGuards,
} from '@nestjs/common';
import {
  ApiTags,
  ApiBearerAuth,
  ApiOperation,
  ApiResponse,
  ApiQuery,
  ApiParam,
} from '@nestjs/swagger';
import { ServeService } from './serve.service';
import { CreateServeOrderDto } from './dto/create-serve-order.dto';
import { UpdateServeTableStatusDto } from './dto/update-serve-table.dto';
import { UpdateServeOrderStatusDto } from './dto/update-serve-order-status.dto';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { UserRole } from '../../enums/user-role.enum';

@ApiTags('Service - Waiter & Server Floor Dashboard')
@ApiBearerAuth('JWT-auth')
@Controller('serve')
@UseGuards(JwtAuthGuard, RolesGuard)
export class ServeController {
  constructor(private readonly serveService: ServeService) { }

  @Get('tables')
  @Roles(
    UserRole.SERVER,
    UserRole.MANAGER,
    UserRole.SUPERVISOR,
    UserRole.SUPER_ADMIN,
    UserRole.CASHIER,
  )
  @ApiOperation({
    summary: 'Get Table Map',
    description: 'Fetch all restaurant floor tables with real-time status and occupancy indicators.',
  })
  @ApiResponse({ status: 200, description: 'List of floor tables with summary' })
  getTableMap(@CurrentUser() user: any) {
    return this.serveService.getTableMap(user);
  }

  @Patch('tables/:id/status')
  @Roles(
    UserRole.SERVER,
    UserRole.MANAGER,
    UserRole.SUPERVISOR,
    UserRole.SUPER_ADMIN,
  )
  @ApiOperation({
    summary: 'Update Table Status',
    description: 'Change table status (AVAILABLE, OCCUPIED, RESERVED) directly from the floor map.',
  })
  @ApiParam({ name: 'id', description: 'Table UUID or ID' })
  @ApiResponse({ status: 200, description: 'Table status updated' })
  updateTableStatus(
    @Param('id') id: string,
    @Body() dto: UpdateServeTableStatusDto,
    @CurrentUser() user: any,
  ) {
    return this.serveService.updateTableStatus(id, dto, user);
  }

  @Get('menu')
  @Roles(
    UserRole.SERVER,
    UserRole.MANAGER,
    UserRole.SUPERVISOR,
    UserRole.SUPER_ADMIN,
    UserRole.CASHIER,
  )
  @ApiOperation({
    summary: 'Get Menu Dishes For Ordering',
    description: 'Fetch all available menu items for the table ordering modal.',
  })
  @ApiResponse({ status: 200, description: 'List of available menu dishes' })
  getMenuItems(@CurrentUser() user: any) {
    return this.serveService.getMenuItems(user);
  }

  @Post('orders')
  @Roles(
    UserRole.SERVER,
    UserRole.MANAGER,
    UserRole.SUPERVISOR,
    UserRole.SUPER_ADMIN,
    UserRole.CASHIER,
  )
  @ApiOperation({
    summary: 'Send Order to Kitchen',
    description: 'Creates an order ticket with selected items, dietary tags, and auto marks table as OCCUPIED.',
  })
  @ApiResponse({ status: 201, description: 'Order sent to kitchen' })
  sendOrderToKitchen(
    @Body() dto: CreateServeOrderDto,
    @CurrentUser() user: any,
  ) {
    return this.serveService.sendOrderToKitchen(dto, user);
  }

  @Get('orders')
  @Roles(
    UserRole.SERVER,
    UserRole.MANAGER,
    UserRole.SUPERVISOR,
    UserRole.SUPER_ADMIN,
    UserRole.CASHIER,
    UserRole.KITCHEN,
  )
  @ApiOperation({
    summary: 'Get Table Order Status List',
    description: 'Fetch active order tickets with time, dietary notes, and status.',
  })
  @ApiQuery({ name: 'status', required: false, description: 'Optional status filter (ALL, PENDING, PREPARING, READY, SERVED, CANCELLED)' })
  @ApiResponse({ status: 200, description: 'List of order tickets' })
  getTableOrderStatuses(
    @CurrentUser() user: any,
    @Query('status') status?: string,
  ) {
    return this.serveService.getTableOrderStatuses(user, status);
  }

  @Patch('orders/:id/status')
  @Roles(
    UserRole.SERVER,
    UserRole.MANAGER,
    UserRole.SUPERVISOR,
    UserRole.SUPER_ADMIN,
    UserRole.KITCHEN,
  )
  @ApiOperation({
    summary: 'Update Order Ticket Status',
    description: 'Update ticket status (Confirmed, In Kitchen, Ready to Serve, Served, Cancelled).',
  })
  @ApiParam({ name: 'id', description: 'Order UUID' })
  @ApiResponse({ status: 200, description: 'Order ticket status updated' })
  updateOrderStatus(
    @Param('id') id: string,
    @Body() dto: UpdateServeOrderStatusDto,
    @CurrentUser() user: any,
  ) {
    return this.serveService.updateOrderStatus(id, dto, user);
  }
}
