import {
  WebSocketGateway, WebSocketServer,
  SubscribeMessage, OnGatewayConnection, OnGatewayDisconnect
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';

@WebSocketGateway({ cors: { origin: process.env.FRONTEND_URL || '*' }, namespace: '/queue' })
export class QueueGateway implements OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer() server: Server;

  handleConnection(client: Socket) {
    console.log(`Client connected: ${client.id}`);
  }

  handleDisconnect(client: Socket) {
    console.log(`Client disconnected: ${client.id}`);
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
}
