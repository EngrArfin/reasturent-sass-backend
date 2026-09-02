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
  ApiBody,
  ApiResponse,
  ApiParam,
  ApiQuery,
} from '@nestjs/swagger';
import { TicketsService } from './tickets.service';
import { CreateTicketDto } from './dto/create-ticket.dto';
import { UpdateTicketDto } from './dto/update-ticket.dto';
import { AddTicketMessageDto } from './dto/ticket-message.dto';
import { QueryTicketDto } from './dto/query-ticket.dto';
import { Roles } from '../../common/decorators/roles.decorator';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { UserRole } from '../../enums/user-role.enum';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';

@ApiTags('Manager & Admin - Support Tickets')
@ApiBearerAuth('JWT-auth')
@Controller('tickets')
@UseGuards(JwtAuthGuard, RolesGuard)
export class TicketsController {
  constructor(private readonly ticketsService: TicketsService) {}

  @Post()
  @Roles(UserRole.MANAGER, UserRole.SUPERVISOR, UserRole.SUPER_ADMIN)
  @ApiOperation({
    summary: 'Submit Ticket to Global Dashboard',
    description:
      'Creates a new support ticket with issue category (Sync Issue, Hardware/Printer Error, Inventory/Barcode Error, Payment Failure), ' +
      'description, and auto-captured diagnostic metadata (device ID, software version, last sync).\n\n' +
      '🔒 **Allowed Roles**: `MANAGER`, `SUPERVISOR`, `SUPER_ADMIN`',
  })
  @ApiBody({ type: CreateTicketDto })
  @ApiResponse({ status: 201, description: 'Ticket created and submitted successfully' })
  @ApiResponse({ status: 400, description: 'Invalid input' })
  create(
    @Body() createTicketDto: CreateTicketDto,
    @CurrentUser() user: any,
  ) {
    return this.ticketsService.create(createTicketDto, user);
  }

  @Get()
  @Roles(UserRole.MANAGER, UserRole.SUPERVISOR, UserRole.SUPER_ADMIN)
  @ApiOperation({
    summary: 'Get Support History / Global Ticket Queue',
    description:
      'Fetch support tickets. For Managers, fetches their restaurant support history cards with status badges (OPEN, RESOLVED).\n' +
      'For Super Admin, fetches global ticket queue across all restaurants.\n\n' +
      '🔒 **Allowed Roles**: `MANAGER`, `SUPERVISOR`, `SUPER_ADMIN`',
  })
  @ApiResponse({ status: 200, description: 'List of tickets' })
  findAll(
    @CurrentUser() user: any,
    @Query() query: QueryTicketDto,
  ) {
    return this.ticketsService.findAll(user, query);
  }

  @Get(':id')
  @Roles(UserRole.MANAGER, UserRole.SUPERVISOR, UserRole.SUPER_ADMIN)
  @ApiOperation({
    summary: 'Get Support Ticket Details & Communication Thread',
    description:
      'Retrieve ticket details, auto-captured diagnostics, and live chat message history.\n\n' +
      '🔒 **Allowed Roles**: `MANAGER`, `SUPERVISOR`, `SUPER_ADMIN`',
  })
  @ApiParam({ name: 'id', description: 'Ticket UUID' })
  @ApiResponse({ status: 200, description: 'Ticket details with communication messages' })
  @ApiResponse({ status: 404, description: 'Ticket not found' })
  findOne(
    @Param('id') id: string,
    @CurrentUser() user: any,
  ) {
    return this.ticketsService.findOne(id, user);
  }

  @Post(':id/messages')
  @Roles(UserRole.MANAGER, UserRole.SUPERVISOR, UserRole.SUPER_ADMIN)
  @ApiOperation({
    summary: 'Send Message in Ticket Communication Thread',
    description:
      'Post a reply in the ticket chat thread between Manager and Super Admin.\n\n' +
      '🔒 **Allowed Roles**: `MANAGER`, `SUPERVISOR`, `SUPER_ADMIN`',
  })
  @ApiParam({ name: 'id', description: 'Ticket UUID' })
  @ApiBody({ type: AddTicketMessageDto })
  @ApiResponse({ status: 201, description: 'Message sent successfully' })
  @ApiResponse({ status: 404, description: 'Ticket not found' })
  addMessage(
    @Param('id') id: string,
    @Body() dto: AddTicketMessageDto,
    @CurrentUser() user: any,
  ) {
    return this.ticketsService.addMessage(id, dto.message, user);
  }

  @Patch(':id/status')
  @Roles(UserRole.SUPER_ADMIN, UserRole.MANAGER)
  @ApiOperation({
    summary: 'Update Ticket Status (e.g. RESOLVED, CLOSED)',
    description:
      'Update the status of a ticket.\n\n' +
      '🔒 **Allowed Roles**: `SUPER_ADMIN`, `MANAGER`',
  })
  @ApiParam({ name: 'id', description: 'Ticket UUID' })
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        status: {
          type: 'string',
          enum: ['OPEN', 'IN_PROGRESS', 'RESOLVED', 'CLOSED'],
          example: 'RESOLVED',
        },
      },
      required: ['status'],
    },
  })
  @ApiResponse({ status: 200, description: 'Status updated successfully' })
  updateStatus(
    @Param('id') id: string,
    @Body('status') status: string,
    @CurrentUser() user: any,
  ) {
    return this.ticketsService.updateStatus(id, status, user);
  }

  @Patch(':id')
  @Roles(UserRole.SUPER_ADMIN, UserRole.MANAGER)
  @ApiOperation({
    summary: 'Update Support Ticket',
    description:
      'Modify ticket information or priority.\n\n' +
      '🔒 **Allowed Roles**: `SUPER_ADMIN`, `MANAGER`',
  })
  @ApiParam({ name: 'id', description: 'Ticket UUID' })
  @ApiBody({ type: UpdateTicketDto })
  @ApiResponse({ status: 200, description: 'Ticket updated successfully' })
  update(
    @Param('id') id: string,
    @Body() updateTicketDto: UpdateTicketDto,
    @CurrentUser() user: any,
  ) {
    return this.ticketsService.update(id, updateTicketDto, user);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.OK)
  @Roles(UserRole.SUPER_ADMIN)
  @ApiOperation({
    summary: 'Delete Support Ticket',
    description:
      'Permanently remove a support ticket.\n\n' +
      '🔒 **Allowed Roles**: `SUPER_ADMIN`',
  })
  @ApiParam({ name: 'id', description: 'Ticket UUID' })
  @ApiResponse({ status: 200, description: 'Ticket deleted successfully' })
  remove(
    @Param('id') id: string,
    @CurrentUser() user: any,
  ) {
    return this.ticketsService.remove(id, user);
  }
}
