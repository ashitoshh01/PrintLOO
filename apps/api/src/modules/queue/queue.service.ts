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

    const queueState = await this.getQueueState(shopId);
    this.queueGateway.emitQueueUpdate(shopId, queueState);

    return position;
  }

  async getQueueState(shopId: string) {
    const pendingJobs = await this.prisma.queueJob.count({
      where: { shopId, status: 'WAITING' },
    });

    // Default 3 min per job
    const estimatedWaitTime = pendingJobs * 3;

    return {
      pendingJobs,
      estimatedWaitTime,
      activeShop: shopId,
    };
  }

  async removeFromQueue(orderId: string) {
    const job = await this.prisma.queueJob.findUnique({ where: { orderId } });
    if (job) {
      await this.prisma.queueJob.delete({ where: { orderId } });
      const queueState = await this.getQueueState(job.shopId);
      this.queueGateway.emitQueueUpdate(job.shopId, queueState);
    }
  }
}
