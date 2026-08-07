import api from './api';
import { PrintOrder, PrintConfig, OrderStatus } from '@/types/order';

export interface OrderQueueStatus {
  orderId: string;
  tokenNumber: number;
  orderStatus: OrderStatus;
  shopId: string;
  shopName: string;
  shopAddress: string | null;
  queuePosition: number;
  nowServingToken: number | null;
  nowServingOrderId: string | null;
  totalInQueue: number;
  estimatedMinutes: number;
  fileName: string;
  pageCount: number;
  totalAmount: number;
}

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

  getOrderQueueStatus: (orderId: string) =>
    api.get<OrderQueueStatus>(`/orders/${orderId}/queue-status`),
};
