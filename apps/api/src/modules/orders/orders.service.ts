import { Injectable, NotFoundException, ForbiddenException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../../common/prisma/prisma.service';
import { PricingService } from '../pricing/pricing.service';
import { QueueGateway } from '../../gateways/queue.gateway';
import { CreateOrderDto } from './dto/create-order.dto';
import { UpdateOrderStatusDto, OrderStatus } from './dto/update-order-status.dto';

@Injectable()
export class OrdersService {
  constructor(
    private prisma: PrismaService,
    private pricingService: PricingService,
    private queueGateway: QueueGateway,
  ) {}

  async createOrder(userId: string, dto: CreateOrderDto) {
    const shop = await this.prisma.shop.findUnique({ where: { id: dto.shopId } });
    if (!shop || !shop.isActive) throw new BadRequestException('Shop is not available');

    const pricing = await this.pricingService.calculatePrice({
      shopId: dto.shopId,
      pageCount: dto.pageCount,
      copies: dto.config.copies,
      colorMode: dto.config.colorMode,
      sides: dto.config.sides,
    });

    // Generate token number (simple approach: count orders for shop today + 1)
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const orderCount = await this.prisma.printOrder.count({
      where: {
        shopId: dto.shopId,
        createdAt: { gte: today },
      },
    });

    const tokenNumber = orderCount + 1;

    const order = await this.prisma.printOrder.create({
      data: {
        shopId: dto.shopId,
        userId,
        fileUrl: dto.fileUrl,
        fileName: dto.fileName,
        pageCount: dto.pageCount,
        config: dto.config,
        tokenNumber,
        totalAmount: pricing.total,
        status: 'PENDING',
      },
    });
    return { ...order, totalAmount: Number(order.totalAmount) };
  }

  async getOrder(orderId: string, userId: string, role: string, shopId?: string) {
    const order = await this.prisma.printOrder.findUnique({
      where: { id: orderId },
      include: { payment: true, queueJob: true },
    });

    if (!order) throw new NotFoundException('Order not found');

    if (role === 'CUSTOMER' && order.userId !== userId) {
      throw new ForbiddenException('Access denied');
    }

    if (role === 'OPERATOR' && order.shopId !== shopId) {
      throw new ForbiddenException('Access denied');
    }

    return {
      ...order,
      totalAmount: Number(order.totalAmount),
      payment: order.payment ? { ...order.payment, amount: Number(order.payment.amount) } : null
    };
  }

  async getMyOrders(userId: string) {
    const orders = await this.prisma.printOrder.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      include: { payment: true },
    });
    return orders.map(o => ({
      ...o,
      totalAmount: Number(o.totalAmount),
      payment: o.payment ? { ...o.payment, amount: Number(o.payment.amount) } : null
    }));
  }

  async getShopOrders(shopId: string, operatorId: string) {
    // Verify operator belongs to this shop
    const user = await this.prisma.user.findUnique({ where: { id: operatorId } });
    if (user?.shopId !== shopId) throw new ForbiddenException('Access denied');

    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const orders = await this.prisma.printOrder.findMany({
      where: {
        shopId,
        createdAt: { gte: today },
      },
      orderBy: { tokenNumber: 'asc' },
      include: { payment: true, user: { select: { name: true, email: true } } },
    });
    return orders.map(o => ({
      ...o,
      totalAmount: Number(o.totalAmount),
      payment: o.payment ? { ...o.payment, amount: Number(o.payment.amount) } : null
    }));
  }

  async updateOrderStatus(orderId: string, status: OrderStatus, operatorId: string) {
    const order = await this.prisma.printOrder.findUnique({ where: { id: orderId } });
    if (!order) throw new NotFoundException('Order not found');

    const user = await this.prisma.user.findUnique({ where: { id: operatorId } });
    if (user?.shopId !== order.shopId) throw new ForbiddenException('Access denied');

    const updatedOrder = await this.prisma.printOrder.update({
      where: { id: orderId },
      data: { status },
    });

    this.queueGateway.emitOrderUpdate(orderId, { orderId, status, shopId: order.shopId });

    return { ...updatedOrder, totalAmount: Number(updatedOrder.totalAmount) };
  }
}
