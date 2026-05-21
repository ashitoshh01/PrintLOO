import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../common/prisma/prisma.service';
import { CalculatePriceDto } from './dto/calculate-price.dto';

@Injectable()
export class PricingService {
  constructor(private prisma: PrismaService) {}

  async calculatePrice(dto: CalculatePriceDto) {
    const shop = await this.prisma.shop.findUnique({ where: { id: dto.shopId } });
    if (!shop) throw new NotFoundException('Shop not found');

    const rule = await this.prisma.pricingRule.findFirst({
      where: {
        shopId: dto.shopId,
        colorMode: dto.colorMode,
        sides: dto.sides,
      },
    });

    let pricePerPage = 0;
    if (rule) {
      pricePerPage = Number(rule.pricePerPage);
    } else {
      // Default pricing if no rule found
      if (dto.colorMode === 'bw' && dto.sides === 'single') pricePerPage = 2;
      else if (dto.colorMode === 'bw' && dto.sides === 'duplex') pricePerPage = 3;
      else if (dto.colorMode === 'color' && dto.sides === 'single') pricePerPage = 10;
      else if (dto.colorMode === 'color' && dto.sides === 'duplex') pricePerPage = 20;
    }

    const subtotal = pricePerPage * dto.pageCount * dto.copies;

    return {
      total: subtotal,
      breakdown: {
        pricePerPage,
        pages: dto.pageCount,
        copies: dto.copies,
        subtotal,
        total: subtotal,
      },
    };
  }
}
