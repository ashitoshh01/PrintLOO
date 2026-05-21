import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../common/prisma/prisma.service';
import { UpdateShopDto } from './dto/update-shop.dto';
import { UpdatePricingDto } from './dto/update-pricing.dto';

@Injectable()
export class ShopsService {
  constructor(private prisma: PrismaService) {}

  async getShop(id: string) {
    const shop = await this.prisma.shop.findUnique({
      where: { id },
      include: { pricingRules: true },
    });
    if (!shop) throw new NotFoundException('Shop not found');
    return shop;
  }

  async updateShop(id: string, dto: UpdateShopDto) {
    const shop = await this.prisma.shop.findUnique({ where: { id } });
    if (!shop) throw new NotFoundException('Shop not found');
    
    return this.prisma.shop.update({
      where: { id },
      data: dto as any,
    });
  }

  async getPricingRules(shopId: string) {
    return this.prisma.pricingRule.findMany({ where: { shopId } });
  }

  async updatePricingRules(shopId: string, dto: UpdatePricingDto) {
    await this.prisma.pricingRule.deleteMany({ where: { shopId } });
    await this.prisma.pricingRule.createMany({
      data: dto.rules.map(r => ({ ...r, shopId })),
    });
    return this.getPricingRules(shopId);
  }

  async getPrinters(shopId: string) {
    return this.prisma.printer.findMany({ where: { shopId } });
  }

  async addPrinter(shopId: string, data: any) {
    return this.prisma.printer.create({
      data: {
        ...data,
        shopId,
      },
    });
  }

  async updatePrinter(shopId: string, printerId: string, data: any) {
    return this.prisma.printer.update({
      where: { id: printerId, shopId },
      data,
    });
  }

  async deletePrinter(shopId: string, printerId: string) {
    return this.prisma.printer.delete({
      where: { id: printerId, shopId },
    });
  }
}
