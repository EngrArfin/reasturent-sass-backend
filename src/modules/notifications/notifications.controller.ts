import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Body,
  Param,
  Query,
  UseGuards,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { NotificationsService } from './notifications.service';
import { CreateNotificationDto } from './dto/create-notification.dto';
import { QueryNotificationDto } from './dto/query-notification.dto';
import { NotificationPreferencesDto } from './dto/notification-preferences.dto';
import {
  NotificationListResponseDto,
  NotificationItemDto,
  NotificationUnreadCountDto,
} from './dto/notification-response.dto';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import {
  ApiTags,
  ApiBearerAuth,
  ApiOperation,
  ApiResponse,
  ApiQuery,
  ApiParam,
  ApiBody,
} from '@nestjs/swagger';

@ApiTags('Manager & Staff - Notifications & Activity Alerts')
@ApiBearerAuth('JWT-auth')
@UseGuards(JwtAuthGuard)
@Controller('notifications')
export class NotificationsController {
  constructor(private readonly notificationsService: NotificationsService) {}

  @Get('preferences')
  @ApiOperation({
    summary: 'Get Notification Preferences',
    description:
      'Fetch current user notification settings toggles:\n' +
      '- **Email Alerts**: Receive daily sales and settlement reports via email\n' +
      '- **Low Stock Notifications**: Get notified when products drop below 5 units\n' +
      '- **Sync Error Notifications**: Instant alert when a POS terminal fails to synchronize\n\n' +
      '🔒 **Allowed Roles**: Any Authenticated User',
  })
  @ApiResponse({
    status: 200,
    description: 'Notification preferences settings',
    type: NotificationPreferencesDto,
  })
  getPreferences(@CurrentUser() user: any) {
    return this.notificationsService.getPreferences(user);
  }

  @Patch('preferences')
  @ApiOperation({
    summary: 'Update Notification Preferences',
    description:
      'Update email alerts, low stock alerts, and POS sync error alert toggles.\n\n' +
      '🔒 **Allowed Roles**: Any Authenticated User',
  })
  @ApiBody({ type: NotificationPreferencesDto })
  @ApiResponse({
    status: 200,
    description: 'Preferences updated successfully',
  })
  updatePreferences(
    @Body() preferencesDto: NotificationPreferencesDto,
    @CurrentUser() user: any,
  ) {
    return this.notificationsService.updatePreferences(preferencesDto, user);
  }

  @Get('unread-count')
  @ApiOperation({
    summary: 'Get Unread Notifications Count',
    description:
      'Fetch the count of unread notification alerts for navbar bell badge counter (e.g., 3 New).\n\n' +
      '🔒 **Allowed Roles**: Any Authenticated User',
  })
  @ApiResponse({
    status: 200,
    description: 'Unread count for header badge',
    type: NotificationUnreadCountDto,
  })
  getUnreadCount(@CurrentUser() user: any) {
    return this.notificationsService.getUnreadCount(user);
  }

  @Get()
  @ApiOperation({
    summary: 'Get Notifications Feed & Activity Alerts',
    description:
      'Fetch notifications list for dropdown and full page feed with filter tabs and search query.\n\n' +
      '- **Filter Tabs**: `ALL`, `UNREAD`, `SYSTEM`, `TICKETS`, `ORDERS`\n' +
      '- **Search**: Filter alerts by keyword across title, message, and category\n' +
      '- **Pagination**: `page`, `limit`\n\n' +
      '🔒 **Allowed Roles**: Any Authenticated User',
  })
  @ApiQuery({
    name: 'filter',
    required: false,
    enum: ['ALL', 'UNREAD', 'SYSTEM', 'TICKETS', 'ORDERS'],
    description: 'Category filter tab',
  })
  @ApiQuery({
    name: 'search',
    required: false,
    type: String,
    description: 'Search string for alerts',
  })
  @ApiQuery({
    name: 'page',
    required: false,
    type: Number,
    description: 'Page number (default: 1)',
  })
  @ApiQuery({
    name: 'limit',
    required: false,
    type: Number,
    description: 'Items per page (default: 20)',
  })
  @ApiResponse({
    status: 200,
    description: 'List of notifications with unread count and pagination',
    type: NotificationListResponseDto,
  })
  findAll(
    @Query() query: QueryNotificationDto,
    @CurrentUser() user: any,
  ) {
    return this.notificationsService.findAll(query, user);
  }

  @Post()
  @ApiOperation({
    summary: 'Create Notification Alert',
    description:
      'Trigger/create a new notification event (e.g. system alert, ticket opened, sync error, high demand order).\n\n' +
      '🔒 **Allowed Roles**: Any Authenticated User / POS Service',
  })
  @ApiBody({ type: CreateNotificationDto })
  @ApiResponse({
    status: 201,
    description: 'Notification created successfully',
    type: NotificationItemDto,
  })
  create(
    @Body() createDto: CreateNotificationDto,
    @CurrentUser() user: any,
  ) {
    return this.notificationsService.create(createDto, user);
  }

  @Patch('mark-all-read')
  @ApiOperation({
    summary: 'Mark All Notifications as Read',
    description:
      'Marks all unread notifications as read for current user / restaurant tenant.\n\n' +
      '🔒 **Allowed Roles**: Any Authenticated User',
  })
  @ApiResponse({
    status: 200,
    description: 'All notifications marked as read',
  })
  markAllAsRead(@CurrentUser() user: any) {
    return this.notificationsService.markAllAsRead(user);
  }

  @Delete('clear-all')
  @ApiOperation({
    summary: 'Clear All Notifications',
    description:
      'Permanently delete all notifications for current user / restaurant tenant.\n\n' +
      '🔒 **Allowed Roles**: Any Authenticated User',
  })
  @ApiResponse({
    status: 200,
    description: 'All notifications cleared successfully',
  })
  clearAll(@CurrentUser() user: any) {
    return this.notificationsService.clearAll(user);
  }

  @Patch(':id/read')
  @ApiOperation({
    summary: 'Mark Single Notification as Read',
    description:
      'Marks a specific notification as read.\n\n' +
      '🔒 **Allowed Roles**: Any Authenticated User',
  })
  @ApiParam({ name: 'id', description: 'Notification UUID' })
  @ApiResponse({
    status: 200,
    description: 'Notification updated',
    type: NotificationItemDto,
  })
  markAsRead(
    @Param('id') id: string,
    @CurrentUser() user: any,
  ) {
    return this.notificationsService.markAsRead(id, user);
  }

  @Patch(':id/toggle-read')
  @ApiOperation({
    summary: 'Toggle Single Notification Read/Unread Status',
    description:
      'Toggles read/unread state of a single notification item.\n\n' +
      '🔒 **Allowed Roles**: Any Authenticated User',
  })
  @ApiParam({ name: 'id', description: 'Notification UUID' })
  @ApiResponse({
    status: 200,
    description: 'Notification read status toggled',
    type: NotificationItemDto,
  })
  toggleRead(
    @Param('id') id: string,
    @CurrentUser() user: any,
  ) {
    return this.notificationsService.toggleReadStatus(id, user);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Delete Single Notification',
    description:
      'Delete a single notification item by ID.\n\n' +
      '🔒 **Allowed Roles**: Any Authenticated User',
  })
  @ApiParam({ name: 'id', description: 'Notification UUID' })
  @ApiResponse({
    status: 200,
    description: 'Notification deleted successfully',
  })
  remove(
    @Param('id') id: string,
    @CurrentUser() user: any,
  ) {
    return this.notificationsService.remove(id, user);
  }
}
