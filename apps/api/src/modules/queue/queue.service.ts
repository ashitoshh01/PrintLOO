import { Injectable } from '@nestjs/common';
import { InjectQueue } from '@nestjs/bull';
import type { Queue } from 'bull';
import { PrismaService } from '../../common/prisma/prisma.service';
import { QueueGateway } from '../../gateways/queue.gateway';

@Injectable()
export class QueueService {
  constructor(
    @InjectQueue('print-queue') private printQueue: Queue,
    private prisma: PrismaService,
    private queueGateway: QueueGateway,
  ) {}

  async addToQueue(orderId: string, shopId: string) {
    const activeJobs = await this.prisma.queueJob.count({
      where: {
        shopId,
        status: { in: ['WAITING', 'PROCESSING'] },
      },
    });

    const position = activeJobs + 1;

    const queueJob = await this.prisma.queueJob.create({
      data: {
        orderId,
        shopId,
        position,
        status: 'WAITING',
      },
    });

    try {
      await this.printQueue.add(
        'process-order',
        { orderId, shopId },
        { attempts: 3, backoff: { type: 'exponential', delay: 5000 } }
      );
    } catch (err) {
      console.error('Queue error — is Redis running?', err);
    }

    const queueState = await this.getShopQueueState(shopId);
    this.queueGateway.emitQueueUpdate(shopId, queueState);

    return position;
  }

  /**
   * Get detailed queue info for a specific customer order.
   * Returns their position, currently serving token, ETA, etc.
   */
  async getOrderQueueStatus(orderId: string) {
    const order = await this.prisma.printOrder.findUnique({
      where: { id: orderId },
      include: {
        queueJob: true,
        shop: { select: { id: true, name: true, address: true } },
      },
    });

    if (!order) return null;

    const shopId = order.shopId;

    // Run all independent queries in parallel for better latency
    const [currentlyServing, positionAhead, totalInQueue] = await Promise.all([
      // Get the currently processing/printing order for this shop
      this.prisma.printOrder.findFirst({
        where: {
          shopId,
          status: { in: ['PROCESSING', 'PRINTING'] },
        },
        orderBy: { tokenNumber: 'asc' },
        select: { tokenNumber: true, id: true },
      }),
      // Count how many orders are ahead of this one in the queue
      (order.queueJob && order.status === 'QUEUED')
        ? this.prisma.queueJob.count({
            where: {
              shopId,
              status: { in: ['WAITING', 'PROCESSING'] },
              position: { lt: order.queueJob.position },
            },
          })
        : Promise.resolve(0),
      // Total pending in queue
      this.prisma.queueJob.count({
        where: {
          shopId,
          status: { in: ['WAITING', 'PROCESSING'] },
        },
      }),
    ]);

    // Estimated wait: 3 minutes per job ahead
    const estimatedMinutes = positionAhead * 3;

    return {
      orderId: order.id,
      tokenNumber: order.tokenNumber,
      orderStatus: order.status,
      shopId,
      shopName: order.shop.name,
      shopAddress: order.shop.address,
      queuePosition: positionAhead,
      nowServingToken: currentlyServing?.tokenNumber || null,
      nowServingOrderId: currentlyServing?.id || null,
      totalInQueue,
      estimatedMinutes,
      fileName: order.fileName,
      pageCount: order.pageCount,
      totalAmount: Number(order.totalAmount),
    };
  }

  /**
   * Get overall shop queue state (for shop-level broadcasts).
   */
  async getShopQueueState(shopId: string) {
    const pendingJobs = await this.prisma.queueJob.count({
      where: { shopId, status: 'WAITING' },
    });

    const currentlyServing = await this.prisma.printOrder.findFirst({
      where: {
        shopId,
        status: { in: ['PROCESSING', 'PRINTING'] },
      },
      orderBy: { tokenNumber: 'asc' },
      select: { tokenNumber: true, id: true },
    });

    // Default 3 min per job
    const estimatedWaitTime = pendingJobs * 3;

    return {
      pendingJobs,
      estimatedWaitTime,
      activeShop: shopId,
      nowServingToken: currentlyServing?.tokenNumber || null,
      nowServingOrderId: currentlyServing?.id || null,
    };
  }

  /** @deprecated Use getShopQueueState instead */
  async getQueueState(shopId: string) {
    return this.getShopQueueState(shopId);
  }

  async removeFromQueue(orderId: string) {
    const job = await this.prisma.queueJob.findUnique({ where: { orderId } });
    if (job) {
      await this.prisma.queueJob.delete({ where: { orderId } });
      const queueState = await this.getShopQueueState(job.shopId);
      this.queueGateway.emitQueueUpdate(job.shopId, queueState);
    }
  }
}
