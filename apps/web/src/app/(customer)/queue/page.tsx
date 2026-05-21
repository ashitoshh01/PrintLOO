'use client';
import { useEffect, useState, useRef, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { io, Socket } from 'socket.io-client';
import { orderService } from '@/services/orderService';
import QueueTracker from '@/components/queue/QueueTracker';
import { PrintOrder } from '@/types/order';

function QueueContent() {
  const searchParams = useSearchParams();
  const orderId = searchParams.get('orderId');
  const tokenNumber = searchParams.get('token');
  const [order, setOrder] = useState<PrintOrder | null>(null);
  const [loading, setLoading] = useState(true);
  const socketRef = useRef<Socket | null>(null);
  const pollRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    if (!orderId) return;

    const fetchOrder = async () => {
      try {
        const res = await orderService.getOrder(orderId);
        setOrder(res.data);
      } catch (err) {
        console.error('Failed to fetch order', err);
      } finally {
        setLoading(false);
      }
    };
    fetchOrder();

    pollRef.current = setInterval(fetchOrder, 5000);

    socketRef.current = io(`${process.env.NEXT_PUBLIC_SOCKET_URL}/queue`, {
      transports: ['websocket'],
    });
    
    socketRef.current.emit('join:order', orderId);
    
    socketRef.current.on('order:updated', (data: Partial<PrintOrder>) => {
      setOrder(prev => prev ? { ...prev, ...data } : prev);
    });

    return () => {
      if (pollRef.current) clearInterval(pollRef.current);
      socketRef.current?.disconnect();
    };
  }, [orderId]);

  useEffect(() => {
    if (order?.status === 'COMPLETED' || order?.status === 'FAILED') {
      if (pollRef.current) clearInterval(pollRef.current);
      socketRef.current?.disconnect();
    }
  }, [order?.status]);

  if (loading) return <div className="flex items-center justify-center min-h-screen"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" /></div>;

  return (
    <div className="min-h-screen bg-background flex flex-col items-center justify-center p-4">
      <div className="w-full max-w-lg">
        <h1 className="text-2xl font-semibold text-center mb-8">Your Print Order</h1>
        {order && <QueueTracker 
          queueState={{
            yourToken: order.tokenNumber,
            nowPrinting: null,
            position: null,
            eta: order.estimatedMinutes,
            totalInQueue: 0
          }}
          orderStatus={order.status}
        />}
        {order?.status === 'COMPLETED' && (
          <div className="mt-6 p-4 bg-green-50 border border-green-200 rounded-xl text-center">
            <p className="text-green-700 font-medium">Your order is ready! 🎉</p>
            <p className="text-green-600 text-sm mt-1">Show Token #{tokenNumber || order.tokenNumber} at the counter</p>
          </div>
        )}
      </div>
    </div>
  );
}

export default function QueuePage() {
  return (
    <Suspense fallback={<div className="flex items-center justify-center min-h-screen"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" /></div>}>
      <QueueContent />
    </Suspense>
  );
}
