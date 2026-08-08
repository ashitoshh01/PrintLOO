import {
  WebSocketGateway, WebSocketServer,
  SubscribeMessage, OnGatewayConnection, OnGatewayDisconnect
} from '@nestjs/websockets';
import { Logger } from '@nestjs/common';
import { Server, Socket } from 'socket.io';

@WebSocketGateway({ cors: { origin: process.env.FRONTEND_URL || '*' }, namespace: '/queue' })
export class QueueGateway implements OnGatewayConnection, OnGatewayDisconnect {
  private readonly logger = new Logger(QueueGateway.name);
  @WebSocketServer() server: Server;

  handleConnection(client: Socket) {
    this.logger.debug(`Client connected: ${client.id}`);
  }

  handleDisconnect(client: Socket) {
    this.logger.debug(`Client disconnected: ${client.id}`);
  }

  @SubscribeMessage('join:order')
  handleJoinOrder(client: Socket, orderId: string) {
    client.join(`order:${orderId}`);
  }

  @SubscribeMessage('join:shop')
  handleJoinShop(client: Socket, shopId: string) {
    client.join(`shop:${shopId}`);
  }

  emitOrderUpdate(orderId: string, data: object) {
    this.server.to(`order:${orderId}`).emit('order:updated', data);
  }

  emitQueueUpdate(shopId: string, data: object) {
    this.server.to(`shop:${shopId}`).emit('queue:updated', data);
  }

  /**
   * Emit a specific "now serving" event to all clients in a shop room.
   * This tells every customer waiting which token is currently being served.
   */
  emitNowServing(shopId: string, data: {
    nowServingToken: number | null;
    nowServingOrderId: string | null;
    totalInQueue: number;
    estimatedWaitTime: number;
  }) {
    this.server.to(`shop:${shopId}`).emit('queue:now-serving', data);
  }
}
