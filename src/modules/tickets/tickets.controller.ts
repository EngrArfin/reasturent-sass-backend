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
import { TicketsService } from './tickets.service';
import { CreateTicketDto } from './dto/create-ticket.dto';
import { UpdateTicketDto } from './dto/update-ticket.dto';
import { Roles } from '../../common/decorators/roles.decorator';
import { UserRole } from '../../enums/user-role.enum';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';

@ApiTags('Support Tickets')
@ApiBearerAuth('JWT-auth')
@Controller('tickets')
@UseGuards(JwtAuthGuard, RolesGuard)
export class TicketsController {
  constructor(private readonly ticketsService: TicketsService) { }

  @Post()
  @ApiOperation({
    summary: 'File a Support Ticket',
    description: 'File a new support ticket.\n\n🔒 **Allowed Roles**: Any Authenticated User',
  })
  @ApiBody({ type: CreateTicketDto })
  create(@Body() createTicketDto: CreateTicketDto) {
    return this.ticketsService.create(createTicketDto);
  }

  @Get()
  @Roles(UserRole.SUPER_ADMIN)
  @ApiOperation({
    summary: 'Get Support Ticket Queue',
    description: 'Retrieve all filed support tickets.\n\n🔒 **Allowed Roles**: `SUPER_ADMIN`',
  })
  findAll() {
    return this.ticketsService.findAll();
  }

  @Get(':id')
  @Roles(UserRole.SUPER_ADMIN)
  @ApiOperation({
    summary: 'Get Support Ticket by ID',
    description: 'Retrieve details of a support ticket.\n\n🔒 **Allowed Roles**: `SUPER_ADMIN`',
  })
  findOne(@Param('id') id: string) {
    return this.ticketsService.findOne(id);
  }

  @Patch(':id')
  @Roles(UserRole.SUPER_ADMIN)
  @ApiOperation({
    summary: 'Resolve Support Ticket',
    description: 'Update the status or resolve a support ticket.\n\n🔒 **Allowed Roles**: `SUPER_ADMIN`',
  })
  @ApiBody({ type: UpdateTicketDto })
  update(
    @Param('id') id: string,
    @Body() updateTicketDto: UpdateTicketDto,
  ) {
    return this.ticketsService.update(id, updateTicketDto);
  }

  @Delete(':id')
  @Roles(UserRole.SUPER_ADMIN)
  @ApiOperation({
    summary: 'Delete Support Ticket',
    description: 'Permanently remove a support ticket.\n\n🔒 **Allowed Roles**: `SUPER_ADMIN`',
  })
  remove(@Param('id') id: string) {
    return this.ticketsService.remove(id);
  }
}
