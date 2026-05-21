import { useEffect } from 'react';
import { useQueueStore } from '@/store/queueStore';
import { orderService } from '@/services/orderService';
import { OrderStatus } from '@/types/order';

export const useQueue = (orderId?: string) => {
  const { queue, updateQueue, clearQueue } = useQueueStore();

  useEffect(() => {
    if (!orderId) return;

    let intervalId: NodeJS.Timeout;

    const fetchQueueStatus = async () => {
      try {
        const response = await orderService.getOrder(orderId);
        const order = response.data;
        
        updateQueue({
          yourToken: order.tokenNumber,
          nowPrinting: Math.max(1, order.tokenNumber - 2), // Mock now printing logic
          position: order.status === 'QUEUED' ? 2 : 0,
          eta: order.estimatedMinutes,
        });

        if (order.status === 'COMPLETED' || order.status === 'FAILED') {
          clearInterval(intervalId);
        }
      } catch (error) {
        console.error('Error fetching queue status:', error);
      }
    };

    fetchQueueStatus();
    intervalId = setInterval(fetchQueueStatus, 5000);

    return () => clearInterval(intervalId);
  }, [orderId, updateQueue]);

  return { queue, clearQueue };
};
