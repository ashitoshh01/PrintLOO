import { Process, Processor } from '@nestjs/bull';
import type { Job } from 'bull';
import { PrismaService } from '../../common/prisma/prisma.service';
import { QueueGateway } from '../../gateways/queue.gateway';
import { QueueService } from './queue.service';

@Processor('print-queue')
export class QueueProcessor {
  constructor(
    private prisma: PrismaService,
    private queueGateway: QueueGateway,
    private queueService: QueueService,
  ) {}

  @Process('process-order')
  async handlePrintJob(job: Job<{ orderId: string; shopId: string }>) {
    console.log(`Processing job for order: ${job.data.orderId}`);
    
    // Update queue job status
    await this.prisma.queueJob.update({
      where: { orderId: job.data.orderId },
      data: { status: 'PROCESSING' },
    });

    // Update order status
    await this.prisma.printOrder.update({
      where: { id: job.data.orderId },
      data: { status: 'PROCESSING' },
    });

    // Emit order-level update
    this.queueGateway.emitOrderUpdate(job.data.orderId, {
      orderId: job.data.orderId,
      status: 'PROCESSING',
      shopId: job.data.shopId,
    });

    // Emit shop-level "now serving" update so all waiting customers see the update
    const queueState = await this.queueService.getShopQueueState(job.data.shopId);
    this.queueGateway.emitQueueUpdate(job.data.shopId, queueState);
    this.queueGateway.emitNowServing(job.data.shopId, {
      nowServingToken: queueState.nowServingToken,
      nowServingOrderId: queueState.nowServingOrderId,
      totalInQueue: queueState.pendingJobs,
      estimatedWaitTime: queueState.estimatedWaitTime,
    });
  }
}
