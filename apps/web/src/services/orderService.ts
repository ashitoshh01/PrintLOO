import api from './api';
import { PrintOrder, PrintConfig, OrderStatus } from '@/types/order';

export const orderService = {
  createOrder: (shopId: string, fileUrl: string, fileName: string, config: PrintConfig, pageCount: number) =>
    api.post<PrintOrder>('/orders', { shopId, fileUrl, fileName, config, pageCount }),

  getOrder: (orderId: string) =>
    api.get<PrintOrder>(`/orders/${orderId}`),

  getMyOrders: () =>
    api.get<PrintOrder[]>('/orders/my'),

  getShopOrders: (shopId: string) =>
    api.get<PrintOrder[]>(`/orders/shop/${shopId}`),

  updateOrderStatus: (orderId: string, status: OrderStatus) =>
    api.patch<PrintOrder>(`/orders/${orderId}/status`, { status }),
};
