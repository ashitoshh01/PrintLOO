import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../common/prisma/prisma.service';

@Injectable()
export class PrintersService {
  constructor(private prisma: PrismaService) {}

  async getShopPrinters(shopId: string) {
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
}
