import { Module } from '@nestjs/common';
import { BullModule } from '@nestjs/bull';
import { QueueService } from './queue.service';
import { QueueProcessor } from './queue.processor';
import { QueueGateway } from '../../gateways/queue.gateway';

@Module({
  imports: [
    BullModule.registerQueue({ name: 'print-queue' }),
  ],
  providers: [QueueService, QueueProcessor, QueueGateway],
  exports: [QueueService],
})
export class QueueModule {}
