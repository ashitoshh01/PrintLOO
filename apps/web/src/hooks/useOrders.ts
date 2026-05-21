import { useState, useCallback } from 'react';
import { orderService } from '@/services/orderService';
import { PrintOrder, OrderStatus } from '@/types/order';

export const useOrders = (shopId?: string) => {
  const [orders, setOrders] = useState<PrintOrder[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchOrders = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const response = shopId 
        ? await orderService.getShopOrders(shopId)
        : await orderService.getMyOrders();
      setOrders(response.data);
    } catch (err: any) {
      setError(err.message || 'Failed to fetch orders');
    } finally {
      setIsLoading(false);
    }
  }, [shopId]);

  const updateStatus = async (orderId: string, status: OrderStatus) => {
    try {
      await orderService.updateOrderStatus(orderId, status);
      setOrders(prev => prev.map(o => o.id === orderId ? { ...o, status } : o));
    } catch (err: any) {
      console.error('Failed to update status', err);
    }
  };

  return { orders, isLoading, error, fetchOrders, updateStatus };
};
