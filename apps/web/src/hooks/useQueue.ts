import { useEffect, useRef } from 'react';
import { useQueueStore } from '@/store/queueStore';
import { orderService } from '@/services/orderService';
import { OrderStatus } from '@/types/order';

export const useQueue = (orderId?: string) => {
  const { queue, updateQueue, clearQueue } = useQueueStore();

  // Store updateQueue in a ref so the polling effect never needs it as a dep.
  // Zustand actions are stable, but using a ref is the safest React pattern
  // to avoid stale closure issues when the effect's dep array only tracks orderId.
  const updateQueueRef = useRef(updateQueue);
  updateQueueRef.current = updateQueue;

  useEffect(() => {
    if (!orderId) return;

    let intervalId: NodeJS.Timeout;

    const fetchQueueStatus = async () => {
      try {
        const response = await orderService.getOrder(orderId);
        const order = response.data;

        // Always calls the latest version of updateQueue via ref
        updateQueueRef.current({
          yourToken: order.tokenNumber,
          nowPrinting: Math.max(1, order.tokenNumber - 2),
          position: order.status === 'QUEUED' ? 2 : 0,
          eta: order.estimatedMinutes,
        });

        // Stop polling once the order reaches a terminal state
        if (order.status === 'COMPLETED' || order.status === 'FAILED') {
          clearInterval(intervalId);
        }
      } catch (error) {
        console.error('Error fetching queue status:', error);
      }
    };

    fetchQueueStatus();
    intervalId = setInterval(fetchQueueStatus, 5000);

    // Cleanup: always clear the interval when orderId changes or component unmounts
    return () => clearInterval(intervalId);
  }, [orderId]); // updateQueue intentionally omitted — accessed via stable ref above

  return { queue, clearQueue };
};
