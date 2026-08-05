import { Controller, Get, Patch, Param, Body, UseGuards, Put, Post, Delete, Query } from '@nestjs/common';
import { ShopsService } from './shops.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { UpdateShopDto } from './dto/update-shop.dto';
import { UpdatePricingDto } from './dto/update-pricing.dto';

@Controller('shops')
export class ShopsController {
  constructor(private readonly shopsService: ShopsService) {}

  @Get('nearby')
  async getNearbyShops(
    @Query('lat') lat?: string,
    @Query('lng') lng?: string,
    @Query('radius') radius?: string,
  ) {
    const latNum = lat !== undefined && lat !== null && lat !== '' ? parseFloat(lat) : undefined;
    const lngNum = lng !== undefined && lng !== null && lng !== '' ? parseFloat(lng) : undefined;
    const radiusNum = radius !== undefined && radius !== null && radius !== '' ? parseFloat(radius) : 2;
    return this.shopsService.getNearbyShops(latNum, lngNum, radiusNum);
  }

  @Get('search')
  async searchShops(
    @Query('q') q: string = '',
    @Query('lat') lat?: string,
    @Query('lng') lng?: string,
    @Query('radius') radius?: string,
  ) {
    const latNum = lat !== undefined && lat !== null && lat !== '' ? parseFloat(lat) : undefined;
    const lngNum = lng !== undefined && lng !== null && lng !== '' ? parseFloat(lng) : undefined;
    const radiusNum = radius !== undefined && radius !== null && radius !== '' ? parseFloat(radius) : 2;
    return this.shopsService.searchShops(q, latNum, lngNum, radiusNum);
  }

  @Get(':id')
  async getShop(@Param('id') id: string) {
    return this.shopsService.getShop(id);
  }

  @Patch(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN', 'OPERATOR')
  async updateShop(@Param('id') id: string, @Body() dto: UpdateShopDto) {
    return this.shopsService.updateShop(id, dto);
  }

  @Get(':id/pricing')
  async getPricingRules(@Param('id') id: string) {
    return this.shopsService.getPricingRules(id);
  }

  @Put(':id/pricing')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN', 'OPERATOR')
  async updatePricingRules(@Param('id') id: string, @Body() dto: UpdatePricingDto) {
    return this.shopsService.updatePricingRules(id, dto);
  }

  @Get(':id/printers')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('OPERATOR', 'ADMIN')
  async getPrinters(@Param('id') id: string) {
    return this.shopsService.getPrinters(id);
  }

  @Post(':id/printers')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN', 'OPERATOR')
  async addPrinter(@Param('id') id: string, @Body() data: any) {
    return this.shopsService.addPrinter(id, data);
  }

  @Patch(':id/printers/:pid')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN', 'OPERATOR')
  async updatePrinter(@Param('id') id: string, @Param('pid') pid: string, @Body() data: any) {
    return this.shopsService.updatePrinter(id, pid, data);
  }

  @Delete(':id/printers/:pid')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN', 'OPERATOR')
  async deletePrinter(@Param('id') id: string, @Param('pid') pid: string) {
    return this.shopsService.deletePrinter(id, pid);
  }
}
