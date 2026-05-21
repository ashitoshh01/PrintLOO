import { Controller, Get, Post, Param, Body, UseGuards } from '@nestjs/common';
import { PrintersService } from './printers.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';

@Controller('shops/:shopId/printers')
@UseGuards(JwtAuthGuard)
export class PrintersController {
  constructor(private readonly printersService: PrintersService) {}

  @Get()
  async getShopPrinters(@Param('shopId') shopId: string) {
    return this.printersService.getShopPrinters(shopId);
  }

  @Post()
  @UseGuards(RolesGuard)
  @Roles('ADMIN', 'OPERATOR')
  async addPrinter(@Param('shopId') shopId: string, @Body() data: any) {
    return this.printersService.addPrinter(shopId, data);
  }
}
