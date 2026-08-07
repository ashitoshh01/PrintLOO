import { Controller, Post, Get, Param, Patch, Body, UseGuards } from '@nestjs/common';
import { OrdersService } from './orders.service';
import { CreateOrderDto } from './dto/create-order.dto';
import { UpdateOrderStatusDto } from './dto/update-order-status.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { QueueService } from '../queue/queue.service';

@Controller('orders')
@UseGuards(JwtAuthGuard, RolesGuard)
export class OrdersController {
  constructor(
    private readonly ordersService: OrdersService,
    private readonly queueService: QueueService,
  ) {}

  @Post()
  @Roles('CUSTOMER')
  async createOrder(@Body() dto: CreateOrderDto, @CurrentUser() user: any) {
    return this.ordersService.createOrder(user.id, dto);
  }

  @Get('my')
  @Roles('CUSTOMER')
  async getMyOrders(@CurrentUser() user: any) {
    return this.ordersService.getMyOrders(user.id);
  }

  @Get('shop/:shopId')
  @Roles('OPERATOR', 'ADMIN')
  async getShopOrders(@Param('shopId') shopId: string, @CurrentUser() user: any) {
    return this.ordersService.getShopOrders(shopId, user.id);
  }

  @Get(':id/queue-status')
  @Roles('CUSTOMER')
  async getOrderQueueStatus(@Param('id') id: string, @CurrentUser() user: any) {
    // First verify the user owns this order
    const order = await this.ordersService.getOrder(id, user.id, user.role, user.shopId);
    // Then get detailed queue status
    const queueStatus = await this.queueService.getOrderQueueStatus(id);
    return queueStatus;
  }

  @Get(':id')
  async getOrder(@Param('id') id: string, @CurrentUser() user: any) {
    return this.ordersService.getOrder(id, user.id, user.role, user.shopId);
  }

  @Patch(':id/status')
  @Roles('OPERATOR', 'ADMIN')
  async updateOrderStatus(
    @Param('id') id: string,
    @Body() dto: UpdateOrderStatusDto,
    @CurrentUser() user: any,
  ) {
    return this.ordersService.updateOrderStatus(id, dto.status, user.id);
  }
}
