import { Module } from '@nestjs/common';
import { OrdersController } from './orders.controller';
import { OrdersService } from './orders.service';
import { PricingModule } from '../pricing/pricing.module';
import { QueueGateway } from '../../gateways/queue.gateway';

@Module({
  imports: [PricingModule],
  controllers: [OrdersController],
  providers: [OrdersService, QueueGateway],
  exports: [OrdersService],
})
export class OrdersModule {}
