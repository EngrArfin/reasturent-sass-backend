import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class NotificationItemDto {
  @ApiProperty({ example: 'a1b2c3d4-e5f6-7890-abcd-ef1234567890', description: 'Notification ID' })
  id!: string;

  @ApiProperty({ example: 'New Support Ticket #8821', description: 'Alert Title' })
  title!: string;

  @ApiProperty({ example: 'Hardware/Printer timeout error reported on Terminal 2.', description: 'Alert Message' })
  message!: string;

  @ApiProperty({ example: 'TICKETS', description: 'Category type (SYSTEM, TICKETS, ORDERS, SYNC, INVENTORY)' })
  type!: string;

  @ApiPropertyOptional({ example: 'Hardware Issue', description: 'Optional sub-category label' })
  category?: string;

  @ApiProperty({ example: false, description: 'Whether notification has been read' })
  isRead!: boolean;

  @ApiPropertyOptional({ example: '/tickets/8821', description: 'Navigation link' })
  link?: string;

  @ApiProperty({ example: '2 mins ago', description: 'Human-readable relative time' })
  relativeTime!: string;

  @ApiProperty({ example: '2026-09-24T13:45:00.000Z', description: 'Created timestamp' })
  createdAt!: string;

  @ApiPropertyOptional({ example: { ticketId: '8821' }, description: 'Additional metadata' })
  metadata?: any;
}

export class NotificationListResponseDto {
  @ApiProperty({ example: 3, description: 'Number of unread notifications' })
  unreadCount!: number;

  @ApiProperty({ example: 12, description: 'Total count of notifications matching query' })
  total!: number;

  @ApiProperty({ example: 1, description: 'Current page number' })
  page!: number;

  @ApiProperty({ example: 20, description: 'Page limit' })
  limit!: number;

  @ApiProperty({ type: [NotificationItemDto], description: 'List of notifications' })
  items!: NotificationItemDto[];
}

export class NotificationUnreadCountDto {
  @ApiProperty({ example: 3, description: 'Unread notifications count for badge' })
  unreadCount!: number;
}
