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
  ApiBody,
} from '@nestjs/swagger';
import { ProductsService } from './products.service';
import { CreateProductDto } from './dto/create-product.dto';
import { UpdateProductDto } from './dto/update-product.dto';
import { QueryProductDto } from './dto/query-product.dto';
import { UpdateStockDto } from './dto/update-stock.dto';
import { ScanBarcodeDto } from './dto/scan-barcode.dto';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { UserRole } from '../../enums/user-role.enum';

@ApiTags('Manager - Inventory & Products')
@ApiBearerAuth('JWT-auth')
@Controller('products')
@UseGuards(JwtAuthGuard, RolesGuard)
export class ProductsController {
  constructor(private readonly productsService: ProductsService) {}

  @Post()
  @Roles(UserRole.MANAGER, UserRole.SUPERVISOR, UserRole.SUPER_ADMIN)
  @ApiOperation({
    summary: 'Add New Product',
    description:
      'Creates a new product in the restaurant inventory.\n' +
      'If Barcode / SKU is left blank, a unique code is automatically generated.\n\n' +
      '🔒 **Allowed Roles**: `MANAGER`, `SUPERVISOR`, `SUPER_ADMIN`',
  })
  @ApiResponse({ status: 201, description: 'Product created successfully' })
  @ApiResponse({ status: 400, description: 'Invalid input or missing business context' })
  @ApiResponse({ status: 409, description: 'Barcode or SKU already exists in business' })
  create(@Body() createProductDto: CreateProductDto, @CurrentUser() user: any) {
    return this.productsService.create(createProductDto, user);
  }

  @Get()
  @Roles(UserRole.MANAGER, UserRole.SUPERVISOR, UserRole.SUPER_ADMIN)
  @ApiOperation({
    summary: 'Get All Inventory Products',
    description:
      'Fetch paginated list of restaurant inventory items with support for search (by name or barcode/SKU) and stock status filters.\n\n' +
      '🔒 **Allowed Roles**: `MANAGER`, `SUPERVISOR`, `SUPER_ADMIN`',
  })
  @ApiResponse({ status: 200, description: 'List of inventory products with pagination info' })
  findAll(@Query() query: QueryProductDto, @CurrentUser() user: any) {
    return this.productsService.findAll(query, user);
  }

  @Get('summary')
  @Roles(UserRole.MANAGER, UserRole.SUPERVISOR, UserRole.SUPER_ADMIN)
  @ApiOperation({
    summary: 'Get Inventory Summary Metrics',
    description:
      'Retrieve high-level inventory statistics including total product count, in-stock count, low-stock count, out-of-stock count, and total valuation.\n\n' +
      '🔒 **Allowed Roles**: `MANAGER`, `SUPERVISOR`, `SUPER_ADMIN`',
  })
  @ApiQuery({ name: 'businessId', required: false, description: 'Optional business ID for Super Admin' })
  @ApiResponse({ status: 200, description: 'Inventory summary KPIs' })
  getSummary(@CurrentUser() user: any, @Query('businessId') businessId?: string) {
    return this.productsService.getSummary(user, businessId);
  }

  @Get('generate-sku')
  @Roles(UserRole.MANAGER, UserRole.SUPERVISOR, UserRole.SUPER_ADMIN)
  @ApiOperation({
    summary: 'Generate Barcode / SKU',
    description:
      'Generate a unique Barcode / SKU for a new product (e.g., `RENE-1007`) to populate the frontend form.\n\n' +
      '🔒 **Allowed Roles**: `MANAGER`, `SUPERVISOR`, `SUPER_ADMIN`',
  })
  @ApiQuery({ name: 'businessId', required: false, description: 'Optional business ID for Super Admin' })
  @ApiResponse({ status: 200, description: 'Generated unique SKU and barcode' })
  generateSku(@CurrentUser() user: any, @Query('businessId') businessId?: string) {
    return this.productsService.generateSku(user, businessId);
  }

  @Get('scan')
  @Roles(
    UserRole.MANAGER,
    UserRole.SUPERVISOR,
    UserRole.CASHIER,
    UserRole.SERVER,
    UserRole.SUPER_ADMIN,
  )
  @ApiOperation({
    summary: 'Barcode & QR Scanner (Query Lookup)',
    description:
      'Instantly look up inventory product details, stock level, and price by scanning a barcode, QR code, or SKU.\n\n' +
      '🔒 **Allowed Roles**: `MANAGER`, `SUPERVISOR`, `CASHIER`, `SERVER`, `SUPER_ADMIN`',
  })
  @ApiQuery({ name: 'code', required: true, description: 'Scanned barcode, QR code, or SKU (e.g. RENE-1001)' })
  @ApiQuery({ name: 'businessId', required: false, description: 'Optional business ID for Super Admin' })
  @ApiResponse({ status: 200, description: 'Product found with stock levels and pricing' })
  @ApiResponse({ status: 404, description: 'Product not found' })
  scanQuery(
    @Query('code') code: string,
    @CurrentUser() user: any,
    @Query('businessId') businessId?: string,
  ) {
    return this.productsService.scanBarcode(code, user, businessId);
  }

  @Get('scan/:code')
  @Roles(
    UserRole.MANAGER,
    UserRole.SUPERVISOR,
    UserRole.CASHIER,
    UserRole.SERVER,
    UserRole.SUPER_ADMIN,
  )
  @ApiOperation({
    summary: 'Barcode & QR Scanner (Path Param Lookup)',
    description:
      'Look up product stock and price by barcode path param (e.g. `/products/scan/RENE-1001`).\n\n' +
      '🔒 **Allowed Roles**: `MANAGER`, `SUPERVISOR`, `CASHIER`, `SERVER`, `SUPER_ADMIN`',
  })
  @ApiParam({ name: 'code', description: 'Barcode, SKU, or QR code value' })
  @ApiQuery({ name: 'businessId', required: false, description: 'Optional business ID for Super Admin' })
  @ApiResponse({ status: 200, description: 'Product found' })
  @ApiResponse({ status: 404, description: 'Product not found' })
  scanParam(
    @Param('code') code: string,
    @CurrentUser() user: any,
    @Query('businessId') businessId?: string,
  ) {
    return this.productsService.scanBarcode(code, user, businessId);
  }

  @Post('scan')
  @Roles(
    UserRole.MANAGER,
    UserRole.SUPERVISOR,
    UserRole.CASHIER,
    UserRole.SERVER,
    UserRole.SUPER_ADMIN,
  )
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Barcode & QR Scanner (POST Body Lookup)',
    description:
      'POST barcode or QR code payload for inventory lookup and price verification.\n\n' +
      '🔒 **Allowed Roles**: `MANAGER`, `SUPERVISOR`, `CASHIER`, `SERVER`, `SUPER_ADMIN`',
  })
  @ApiBody({ type: ScanBarcodeDto })
  @ApiResponse({ status: 200, description: 'Product found' })
  @ApiResponse({ status: 404, description: 'Product not found' })
  scanPost(
    @Body() scanDto: ScanBarcodeDto,
    @CurrentUser() user: any,
  ) {
    return this.productsService.scanBarcode(scanDto.code, user, scanDto.businessId);
  }

  @Get(':id')
  @Roles(UserRole.MANAGER, UserRole.SUPERVISOR, UserRole.SUPER_ADMIN)
  @ApiOperation({
    summary: 'Get Product by ID',
    description:
      'Retrieve detailed information for a single product by its unique ID.\n\n' +
      '🔒 **Allowed Roles**: `MANAGER`, `SUPERVISOR`, `SUPER_ADMIN`',
  })
  @ApiParam({ name: 'id', description: 'Product UUID' })
  @ApiResponse({ status: 200, description: 'Product found' })
  @ApiResponse({ status: 404, description: 'Product not found' })
  findOne(@Param('id') id: string, @CurrentUser() user: any) {
    return this.productsService.findOne(id, user);
  }

  @Get(':id/barcode-label')
  @Roles(UserRole.MANAGER, UserRole.SUPERVISOR, UserRole.SUPER_ADMIN)
  @ApiOperation({
    summary: 'Get Barcode Label Data for Printing',
    description:
      'Retrieve printable barcode and product price tag data for label or thermal printers.\n\n' +
      '🔒 **Allowed Roles**: `MANAGER`, `SUPERVISOR`, `SUPER_ADMIN`',
  })
  @ApiParam({ name: 'id', description: 'Product UUID' })
  @ApiResponse({ status: 200, description: 'Barcode label printable payload' })
  getBarcodeLabel(@Param('id') id: string, @CurrentUser() user: any) {
    return this.productsService.getBarcodeLabel(id, user);
  }

  @Patch(':id')
  @Roles(UserRole.MANAGER, UserRole.SUPERVISOR, UserRole.SUPER_ADMIN)
  @ApiOperation({
    summary: 'Update Product Details',
    description:
      'Modify product attributes including name, price, stock, barcode, and active status.\n\n' +
      '🔒 **Allowed Roles**: `MANAGER`, `SUPERVISOR`, `SUPER_ADMIN`',
  })
  @ApiParam({ name: 'id', description: 'Product UUID' })
  @ApiBody({ type: UpdateProductDto })
  @ApiResponse({ status: 200, description: 'Product updated successfully' })
  @ApiResponse({ status: 404, description: 'Product not found' })
  @ApiResponse({ status: 409, description: 'Barcode collision' })
  update(
    @Param('id') id: string,
    @Body() updateProductDto: UpdateProductDto,
    @CurrentUser() user: any,
  ) {
    return this.productsService.update(id, updateProductDto, user);
  }

  @Patch(':id/stock')
  @Roles(UserRole.MANAGER, UserRole.SUPERVISOR, UserRole.SUPER_ADMIN)
  @ApiOperation({
    summary: 'Adjust Product Stock Level',
    description:
      'Quickly adjust the inventory stock level (SET direct value, ADD to restock, or SUBTRACT to deduct).\n\n' +
      '🔒 **Allowed Roles**: `MANAGER`, `SUPERVISOR`, `SUPER_ADMIN`',
  })
  @ApiParam({ name: 'id', description: 'Product UUID' })
  @ApiBody({ type: UpdateStockDto })
  @ApiResponse({ status: 200, description: 'Stock adjusted successfully' })
  @ApiResponse({ status: 400, description: 'Invalid stock adjustment (e.g. negative stock)' })
  @ApiResponse({ status: 404, description: 'Product not found' })
  updateStock(
    @Param('id') id: string,
    @Body() updateStockDto: UpdateStockDto,
    @CurrentUser() user: any,
  ) {
    return this.productsService.updateStock(id, updateStockDto, user);
  }

  @Delete(':id')
  @Roles(UserRole.MANAGER, UserRole.SUPER_ADMIN)
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Delete Product',
    description:
      'Permanently remove a product from the restaurant inventory.\n\n' +
      '🔒 **Allowed Roles**: `MANAGER`, `SUPER_ADMIN`',
  })
  @ApiParam({ name: 'id', description: 'Product UUID' })
  @ApiResponse({ status: 200, description: 'Product deleted successfully' })
  @ApiResponse({ status: 404, description: 'Product not found' })
  remove(@Param('id') id: string, @CurrentUser() user: any) {
    return this.productsService.remove(id, user);
  }
}
