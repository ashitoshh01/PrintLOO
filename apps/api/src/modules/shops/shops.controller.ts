import { Controller, Get, Patch, Param, Body, UseGuards, Put, Post, Delete } from '@nestjs/common';
import { ShopsService } from './shops.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { UpdateShopDto } from './dto/update-shop.dto';
import { UpdatePricingDto } from './dto/update-pricing.dto';

@Controller('shops')
@UseGuards(JwtAuthGuard, RolesGuard)
export class ShopsController {
  constructor(private readonly shopsService: ShopsService) {}

  @Get(':id')
  @Roles('OPERATOR', 'ADMIN')
  async getShop(@Param('id') id: string) {
    return this.shopsService.getShop(id);
  }

  @Patch(':id')
  @Roles('ADMIN', 'OPERATOR')
  async updateShop(@Param('id') id: string, @Body() dto: UpdateShopDto) {
    return this.shopsService.updateShop(id, dto);
  }

  @Get(':id/pricing')
  @Roles('OPERATOR', 'ADMIN')
  async getPricingRules(@Param('id') id: string) {
    return this.shopsService.getPricingRules(id);
  }

  @Put(':id/pricing')
  @Roles('ADMIN', 'OPERATOR')
  async updatePricingRules(@Param('id') id: string, @Body() dto: UpdatePricingDto) {
    return this.shopsService.updatePricingRules(id, dto);
  }

  @Get(':id/printers')
  @Roles('OPERATOR', 'ADMIN')
  async getPrinters(@Param('id') id: string) {
    return this.shopsService.getPrinters(id);
  }

  @Post(':id/printers')
  @Roles('ADMIN', 'OPERATOR')
  async addPrinter(@Param('id') id: string, @Body() data: any) {
    return this.shopsService.addPrinter(id, data);
  }

  @Patch(':id/printers/:pid')
  @Roles('ADMIN', 'OPERATOR')
  async updatePrinter(@Param('id') id: string, @Param('pid') pid: string, @Body() data: any) {
    return this.shopsService.updatePrinter(id, pid, data);
  }

  @Delete(':id/printers/:pid')
  @Roles('ADMIN', 'OPERATOR')
  async deletePrinter(@Param('id') id: string, @Param('pid') pid: string) {
    return this.shopsService.deletePrinter(id, pid);
  }
}
