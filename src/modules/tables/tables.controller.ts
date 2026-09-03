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
import { TablesService } from './tables.service';
import { CreateRestaurantTableDto } from './dto/create-table.dto';
import { UpdateRestaurantTableDto } from './dto/update-table.dto';
import { QueryRestaurantTableDto } from './dto/query-table.dto';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { UserRole } from '../../enums/user-role.enum';

@ApiTags('Manager - Food & Tables')
@ApiBearerAuth('JWT-auth')
@Controller('tables')
@UseGuards(JwtAuthGuard, RolesGuard)
export class TablesController {
  constructor(private readonly tablesService: TablesService) {}

  @Post()
  @Roles(UserRole.MANAGER, UserRole.SUPERVISOR, UserRole.SUPER_ADMIN)
  @ApiOperation({
    summary: 'Add New Floor Table',
    description:
      'Creates a new dining table configured with capacity, zone/section, and initial status.\n\n' +
      '🔒 **Allowed Roles**: `MANAGER`, `SUPERVISOR`, `SUPER_ADMIN`',
  })
  @ApiResponse({ status: 201, description: 'Table created successfully' })
  @ApiResponse({ status: 400, description: 'Invalid input' })
  create(
    @Body() createDto: CreateRestaurantTableDto,
    @CurrentUser() user: any,
  ) {
    return this.tablesService.create(createDto, user);
  }

  @Get()
  @Roles(
    UserRole.MANAGER,
    UserRole.SUPERVISOR,
    UserRole.SUPER_ADMIN,
    UserRole.SERVER,
    UserRole.CASHIER,
  )
  @ApiOperation({
    summary: 'Get All Tables (Overview)',
    description:
      'Fetch all restaurant floor tables with filter tabs (ALL, OCCUPIED, AVAILABLE, RESERVED), search by table ID / section, and real-time counts.\n\n' +
      '🔒 **Allowed Roles**: `MANAGER`, `SUPERVISOR`, `SUPER_ADMIN`, `SERVER`, `CASHIER`',
  })
  @ApiResponse({ status: 200, description: 'List of tables with status summary' })
  findAll(
    @Query() query: QueryRestaurantTableDto,
    @CurrentUser() user: any,
  ) {
    return this.tablesService.findAll(query, user);
  }

  @Get('summary')
  @Roles(
    UserRole.MANAGER,
    UserRole.SUPERVISOR,
    UserRole.SUPER_ADMIN,
    UserRole.SERVER,
    UserRole.CASHIER,
  )
  @ApiOperation({
    summary: 'Get Table Summary Counts',
    description: 'Get total, occupied, available, and reserved table counts.',
  })
  @ApiQuery({ name: 'businessId', required: false, description: 'Optional business ID for Super Admin' })
  @ApiResponse({ status: 200, description: 'Table metrics summary' })
  getSummary(@CurrentUser() user: any, @Query('businessId') businessId?: string) {
    return this.tablesService.getSummary(user, businessId);
  }

  @Get(':id')
  @Roles(
    UserRole.MANAGER,
    UserRole.SUPERVISOR,
    UserRole.SUPER_ADMIN,
    UserRole.SERVER,
    UserRole.CASHIER,
  )
  @ApiOperation({ summary: 'Get Table Details' })
  @ApiParam({ name: 'id', description: 'Table UUID or ID' })
  @ApiResponse({ status: 200, description: 'Table details' })
  @ApiResponse({ status: 404, description: 'Table not found' })
  findOne(@Param('id') id: string, @CurrentUser() user: any) {
    return this.tablesService.findOne(id, user);
  }

  @Patch(':id')
  @Roles(UserRole.MANAGER, UserRole.SUPERVISOR, UserRole.SUPER_ADMIN, UserRole.SERVER)
  @ApiOperation({
    summary: 'Update Table Information / Status',
    description: 'Update table capacity, section, or change status (AVAILABLE, OCCUPIED, RESERVED).',
  })
  @ApiParam({ name: 'id', description: 'Table UUID or ID' })
  @ApiResponse({ status: 200, description: 'Table updated successfully' })
  @ApiResponse({ status: 404, description: 'Table not found' })
  update(
    @Param('id') id: string,
    @Body() updateDto: UpdateRestaurantTableDto,
    @CurrentUser() user: any,
  ) {
    return this.tablesService.update(id, updateDto, user);
  }

  @Delete(':id')
  @Roles(UserRole.MANAGER, UserRole.SUPERVISOR, UserRole.SUPER_ADMIN)
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Delete Floor Table' })
  @ApiParam({ name: 'id', description: 'Table UUID or ID' })
  @ApiResponse({ status: 200, description: 'Table deleted successfully' })
  @ApiResponse({ status: 404, description: 'Table not found' })
  remove(@Param('id') id: string, @CurrentUser() user: any) {
    return this.tablesService.remove(id, user);
  }
}
