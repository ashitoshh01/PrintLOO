import { Injectable, BadRequestException, UnauthorizedException } from '@nestjs/common';
import { PrismaService } from '../../common/prisma/prisma.service';
import { QueueService } from '../queue/queue.service';
import * as crypto from 'crypto';
import Razorpay from 'razorpay';
import { VerifyPaymentDto } from './dto/verify-payment.dto';

@Injectable()
export class PaymentsService {
  private razorpay: any;

  constructor(
    private prisma: PrismaService,
    private queueService: QueueService,
  ) {
    this.razorpay = new Razorpay({
      key_id: process.env.RAZORPAY_KEY_ID || 'rzp_test_placeholder',
      key_secret: process.env.RAZORPAY_KEY_SECRET || 'secret_placeholder',
    });
  }

  async createRazorpayOrder(orderId: string, userId: string) {
    const order = await this.prisma.printOrder.findUnique({ where: { id: orderId } });
    if (!order || order.userId !== userId) throw new BadRequestException('Order not found or access denied');
    if (order.status !== 'PENDING') throw new BadRequestException('Order is not in PENDING state');

    const amountInPaise = Math.round(Number(order.totalAmount) * 100);
    
    const rzpOrder = await this.razorpay.orders.create({
      amount: amountInPaise,
      currency: 'INR',
      receipt: order.id,
    });

    await this.prisma.payment.create({
      data: {
        orderId: order.id,
        razorpayOrderId: rzpOrder.id,
        amount: order.totalAmount,
        currency: 'INR',
        status: 'PENDING',
      },
    });

    return {
      razorpayOrderId: rzpOrder.id,
      amount: order.totalAmount,
      currency: 'INR',
      orderId: order.id,
    };
  }

  async verifyPayment(dto: VerifyPaymentDto) {
    const payment = await this.prisma.payment.findUnique({
      where: { razorpayOrderId: dto.razorpayOrderId },
      include: { order: true },
    });

    if (!payment) throw new BadRequestException('Payment record not found');

    const body = dto.razorpayOrderId + '|' + dto.razorpayPaymentId;
    const expectedSignature = crypto
      .createHmac('sha256', process.env.RAZORPAY_KEY_SECRET || 'secret_placeholder')
      .update(body.toString())
      .digest('hex');

    if (expectedSignature !== dto.razorpaySignature) {
      throw new UnauthorizedException('Invalid payment signature');
    }

    await this.prisma.payment.update({
      where: { id: payment.id },
      data: {
        status: 'SUCCESS',
        verifiedAt: new Date(),
        razorpayPaymentId: dto.razorpayPaymentId,
        razorpaySignature: dto.razorpaySignature,
      },
    });

    await this.prisma.printOrder.update({
      where: { id: payment.orderId },
      data: { status: 'QUEUED' },
    });

    await this.queueService.addToQueue(payment.orderId, payment.order.shopId);

    return { success: true, orderId: payment.orderId };
  }

  async handleWebhook(body: any, signature: string) {
    const secret = process.env.RAZORPAY_WEBHOOK_SECRET || process.env.RAZORPAY_KEY_SECRET;
    const expectedSignature = crypto.createHmac('sha256', secret as string).update(JSON.stringify(body)).digest('hex');
    
    if (signature !== expectedSignature) {
      throw new UnauthorizedException('Invalid webhook signature');
    }

    // In a real app, process different events (e.g., payment.captured, payment.failed)
    // For MVP, fallback to verify logic or just log
    console.log('Webhook verified', body.event);
    return { success: true };
  }
}
