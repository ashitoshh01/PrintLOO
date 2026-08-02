import { Module, Global } from '@nestjs/common';
import { QueueGateway } from './queue.gateway';

@Global()
@Module({
  providers: [QueueGateway],
  exports: [QueueGateway],
})
export class QueueGatewayModule {}
