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
import { MenuItemsService } from './menu-items.service';
import { CreateMenuItemDto } from './dto/create-menu-item.dto';
import { UpdateMenuItemDto } from './dto/update-menu-item.dto';
import { QueryMenuItemDto } from './dto/query-menu-item.dto';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { UserRole } from '../../enums/user-role.enum';

@ApiTags('Manager - Food & Menu Catalog')
@ApiBearerAuth('JWT-auth')
@Controller('menu-items')
@UseGuards(JwtAuthGuard, RolesGuard)
export class MenuItemsController {
  constructor(private readonly menuItemsService: MenuItemsService) {}

  @Post()
  @Roles(UserRole.MANAGER, UserRole.SUPERVISOR, UserRole.SUPER_ADMIN)
  @ApiOperation({
    summary: 'Add New Menu Dish',
    description:
      'Creates a new menu item dish in the restaurant catalog.\n\n' +
      '🔒 **Allowed Roles**: `MANAGER`, `SUPERVISOR`, `SUPER_ADMIN`',
  })
  @ApiResponse({ status: 201, description: 'Menu item created successfully' })
  @ApiResponse({ status: 400, description: 'Invalid input' })
  create(
    @Body() createDto: CreateMenuItemDto,
    @CurrentUser() user: any,
  ) {
    return this.menuItemsService.create(createDto, user);
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
    summary: 'Get All Menu Catalog Items',
    description:
      'Fetch all restaurant menu catalog dishes with category filters (ALL, Main Course, Appetizer, Dessert, Beverage), search, and pagination.\n\n' +
      '🔒 **Allowed Roles**: `MANAGER`, `SUPERVISOR`, `SUPER_ADMIN`, `SERVER`, `CASHIER`, `KITCHEN`',
  })
  @ApiResponse({ status: 200, description: 'Menu catalog items list' })
  findAll(
    @Query() query: QueryMenuItemDto,
    @CurrentUser() user: any,
  ) {
    return this.menuItemsService.findAll(query, user);
  }

  @Get('categories')
  @Roles(
    UserRole.MANAGER,
    UserRole.SUPERVISOR,
    UserRole.SUPER_ADMIN,
    UserRole.SERVER,
    UserRole.CASHIER,
    UserRole.KITCHEN,
  )
  @ApiOperation({ summary: 'Get Menu Dish Categories' })
  @ApiQuery({ name: 'businessId', required: false, description: 'Optional business ID for Super Admin' })
  @ApiResponse({ status: 200, description: 'Category list and item counts' })
  getCategories(@CurrentUser() user: any, @Query('businessId') businessId?: string) {
    return this.menuItemsService.getCategories(user, businessId);
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
  @ApiOperation({ summary: 'Get Single Menu Item Dish' })
  @ApiParam({ name: 'id', description: 'Menu item UUID' })
  @ApiResponse({ status: 200, description: 'Menu item details' })
  @ApiResponse({ status: 404, description: 'Menu item not found' })
  findOne(@Param('id') id: string, @CurrentUser() user: any) {
    return this.menuItemsService.findOne(id, user);
  }

  @Patch(':id')
  @Roles(UserRole.MANAGER, UserRole.SUPERVISOR, UserRole.SUPER_ADMIN)
  @ApiOperation({ summary: 'Update Menu Item Dish' })
  @ApiParam({ name: 'id', description: 'Menu item UUID' })
  @ApiResponse({ status: 200, description: 'Menu item updated successfully' })
  @ApiResponse({ status: 404, description: 'Menu item not found' })
  update(
    @Param('id') id: string,
    @Body() updateDto: UpdateMenuItemDto,
    @CurrentUser() user: any,
  ) {
    return this.menuItemsService.update(id, updateDto, user);
  }

  @Patch(':id/toggle-availability')
  @Roles(UserRole.MANAGER, UserRole.SUPERVISOR, UserRole.SUPER_ADMIN, UserRole.KITCHEN)
  @ApiOperation({ summary: 'Toggle Dish Availability (In Stock / Out of Stock)' })
  @ApiParam({ name: 'id', description: 'Menu item UUID' })
  @ApiResponse({ status: 200, description: 'Availability status toggled' })
  toggleAvailability(@Param('id') id: string, @CurrentUser() user: any) {
    return this.menuItemsService.toggleAvailability(id, user);
  }

  @Delete(':id')
  @Roles(UserRole.MANAGER, UserRole.SUPERVISOR, UserRole.SUPER_ADMIN)
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Delete Menu Item Dish' })
  @ApiParam({ name: 'id', description: 'Menu item UUID' })
  @ApiResponse({ status: 200, description: 'Menu item deleted successfully' })
  @ApiResponse({ status: 404, description: 'Menu item not found' })
  remove(@Param('id') id: string, @CurrentUser() user: any) {
    return this.menuItemsService.remove(id, user);
  }
}
