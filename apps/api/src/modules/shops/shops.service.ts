import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../common/prisma/prisma.service';
import { UpdateShopDto } from './dto/update-shop.dto';
import { UpdatePricingDto } from './dto/update-pricing.dto';

function calculateHaversineDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371; // Earth radius in km
  const dLat = (lat2 - lat1) * (Math.PI / 180);
  const dLon = (lon2 - lon1) * (Math.PI / 180);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * (Math.PI / 180)) * Math.cos(lat2 * (Math.PI / 180)) *
    Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

function formatDistance(distKm: number): string {
  if (distKm < 1) {
    return `${Math.round(distKm * 1000)}m away`;
  }
  return `${distKm.toFixed(1)}km away`;
}

@Injectable()
export class ShopsService {
  constructor(private prisma: PrismaService) {}

  async getNearbyShops(userLat?: number, userLng?: number, radiusKm: number = 2) {
    const shops = await this.prisma.shop.findMany({
      where: { isActive: true },
      include: {
        _count: {
          select: {
            orders: {
              where: {
                status: { in: ['PENDING', 'QUEUED', 'PROCESSING', 'PRINTING'] },
              },
            },
          },
        },
      },
    });

    let formattedShops = shops.map((shop) => {
      let distanceKm: number | null = null;
      let distanceFormatted: string | null = null;

      if (
        userLat !== undefined &&
        userLng !== undefined &&
        !isNaN(userLat) &&
        !isNaN(userLng) &&
        shop.latitude !== null &&
        shop.longitude !== null
      ) {
        distanceKm = calculateHaversineDistance(userLat, userLng, shop.latitude, shop.longitude);
        distanceFormatted = formatDistance(distanceKm);
      }

      return {
        ...shop,
        queueLength: shop._count.orders,
        distanceKm,
        distanceFormatted,
      };
    });

    if (userLat !== undefined && userLng !== undefined && !isNaN(userLat) && !isNaN(userLng)) {
      if (radiusKm && radiusKm > 0) {
        formattedShops = formattedShops.filter(
          (shop) => shop.distanceKm !== null && shop.distanceKm <= radiusKm
        );
      }

      formattedShops.sort((a, b) => {
        if (a.distanceKm === null) return 1;
        if (b.distanceKm === null) return -1;
        return a.distanceKm - b.distanceKm;
      });
    }

    return formattedShops;
  }

  async searchShops(q: string, userLat?: number, userLng?: number, radiusKm: number = 2) {
    const query = q ? q.trim() : '';
    if (!query) {
      return this.getNearbyShops(userLat, userLng, radiusKm);
    }

    const shops = await this.prisma.shop.findMany({
      where: {
        isActive: true,
        OR: [
          { name: { contains: query, mode: 'insensitive' } },
          { location: { contains: query, mode: 'insensitive' } },
          { address: { contains: query, mode: 'insensitive' } },
          { city: { contains: query, mode: 'insensitive' } },
          { state: { contains: query, mode: 'insensitive' } },
          { pincode: { contains: query, mode: 'insensitive' } },
        ],
      },
      include: {
        _count: {
          select: {
            orders: {
              where: {
                status: { in: ['PENDING', 'QUEUED', 'PROCESSING', 'PRINTING'] },
              },
            },
          },
        },
      },
    });

    let formattedShops = shops.map((shop) => {
      let distanceKm: number | null = null;
      let distanceFormatted: string | null = null;

      if (
        userLat !== undefined &&
        userLng !== undefined &&
        !isNaN(userLat) &&
        !isNaN(userLng) &&
        shop.latitude !== null &&
        shop.longitude !== null
      ) {
        distanceKm = calculateHaversineDistance(userLat, userLng, shop.latitude, shop.longitude);
        distanceFormatted = formatDistance(distanceKm);
      }

      return {
        ...shop,
        queueLength: shop._count.orders,
        distanceKm,
        distanceFormatted,
      };
    });

    if (userLat !== undefined && userLng !== undefined && !isNaN(userLat) && !isNaN(userLng)) {
      if (radiusKm && radiusKm > 0) {
        formattedShops = formattedShops.filter(
          (shop) => shop.distanceKm !== null && shop.distanceKm <= radiusKm
        );
      }

      formattedShops.sort((a, b) => {
        if (a.distanceKm === null) return 1;
        if (b.distanceKm === null) return -1;
        return a.distanceKm - b.distanceKm;
      });
    }

    return formattedShops;
  }

  async getShop(id: string) {
    const shop = await this.prisma.shop.findUnique({
      where: { id },
      include: {
        pricingRules: true,
        _count: {
          select: {
            orders: {
              where: {
                status: { in: ['PENDING', 'QUEUED', 'PROCESSING', 'PRINTING'] },
              },
            },
          },
        },
      },
    });
    if (!shop) throw new NotFoundException('Shop not found');

    return {
      ...shop,
      queueLength: shop._count.orders,
    };
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
      data: dto.rules.map((r) => ({ ...r, shopId })),
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
