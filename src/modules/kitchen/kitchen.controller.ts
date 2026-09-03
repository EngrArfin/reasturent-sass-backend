import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
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
import { KitchenService } from './kitchen.service';
import { BumpKitchenTicketDto } from './dto/bump-ticket.dto';
import { QueryKitchenDto } from './dto/query-kitchen.dto';
import { CreateKitchenTicketDto } from './dto/create-kitchen-ticket.dto';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { UserRole } from '../../enums/user-role.enum';

@ApiTags('Kitchen - Kitchen Production & KDS')
@ApiBearerAuth('JWT-auth')
@Controller('kitchen')
@UseGuards(JwtAuthGuard, RolesGuard)
export class KitchenController {
  constructor(private readonly kitchenService: KitchenService) {}

  @Get('summary')
  @Roles(
    UserRole.KITCHEN,
    UserRole.MANAGER,
    UserRole.SUPERVISOR,
    UserRole.SUPER_ADMIN,
    UserRole.SERVER,
  )
  @ApiOperation({
    summary: 'Get Kitchen KPI Summary Metrics',
    description:
      'Fetches live kitchen KPIs: Completed Today (count & growth), Avg Prep Time, and Station Capacity Alert (Grill operating load).',
  })
  @ApiQuery({ name: 'businessId', required: false, description: 'Optional business ID for Super Admin' })
  @ApiResponse({ status: 200, description: 'Kitchen summary metrics' })
  getSummary(@CurrentUser() user: any, @Query('businessId') businessId?: string) {
    return this.kitchenService.getSummary(user, businessId);
  }

  @Get('tickets')
  @Roles(
    UserRole.KITCHEN,
    UserRole.MANAGER,
    UserRole.SUPERVISOR,
    UserRole.SUPER_ADMIN,
    UserRole.SERVER,
  )
  @ApiOperation({
    summary: 'Get Kitchen Live Tickets Stream',
    description:
      'Fetch active or completed kitchen tickets formatted with table tokens, station tags, in-time, item modifiers, and bump action states.',
  })
  @ApiResponse({ status: 200, description: 'Kitchen tickets stream' })
  getTickets(
    @Query() query: QueryKitchenDto,
    @CurrentUser() user: any,
  ) {
    return this.kitchenService.getTickets(query, user);
  }

  @Patch('tickets/:id/bump')
  @Roles(
    UserRole.KITCHEN,
    UserRole.MANAGER,
    UserRole.SUPERVISOR,
    UserRole.SUPER_ADMIN,
    UserRole.SERVER,
  )
  @ApiOperation({
    summary: 'Bump Ticket Status (Bump To Ready / Complete)',
    description:
      'Bumps ticket to the next stage (PREPARING -> READY -> COMPLETED) and automatically updates table sub-status.',
  })
  @ApiParam({ name: 'id', description: 'Order / Ticket UUID' })
  @ApiResponse({ status: 200, description: 'Ticket bumped successfully' })
  bumpTicket(
    @Param('id') id: string,
    @Body() bumpDto: BumpKitchenTicketDto,
    @CurrentUser() user: any,
  ) {
    return this.kitchenService.bumpTicket(id, bumpDto, user);
  }

  @Post('tickets')
  @Roles(
    UserRole.KITCHEN,
    UserRole.MANAGER,
    UserRole.SUPERVISOR,
    UserRole.SUPER_ADMIN,
    UserRole.SERVER,
  )
  @ApiOperation({
    summary: 'Create Manual Kitchen Ticket (+ New Ticket)',
    description: 'Manually dispatch a ticket to the kitchen display stream.',
  })
  @ApiResponse({ status: 201, description: 'Kitchen ticket created' })
  createTicket(
    @Body() dto: CreateKitchenTicketDto,
    @CurrentUser() user: any,
  ) {
    return this.kitchenService.createTicket(dto, user);
  }
}
