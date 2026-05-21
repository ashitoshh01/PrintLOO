'use client';
import { useEffect, useState } from 'react';
import { io } from 'socket.io-client';
import { orderService } from '@/services/orderService';
import { useAuthStore } from '@/store/authStore';
import OrderCard from '@/components/shop/OrderCard';
import { PrintOrder, OrderStatus } from '@/types/order';

export default function ShopQueuePage() {
  const { user } = useAuthStore();
  const [orders, setOrders] = useState<PrintOrder[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchOrders = async () => {
    if (!user?.shopId) return;
    try {
      const res = await orderService.getShopOrders(user.shopId);
      setOrders(res.data);
    } catch (err) {
      console.error('Failed to fetch shop orders', err);
    } finally {
      setLoading(false);
    }
  };

  const handleStatusChange = async (orderId: string, status: OrderStatus) => {
    try {
      await orderService.updateOrderStatus(orderId, status);
      setOrders(prev => prev.map(o => o.id === orderId ? { ...o, status } : o));
    } catch (err) {
      console.error('Failed to update status', err);
    }
  };

  useEffect(() => {
    fetchOrders();
    const interval = setInterval(fetchOrders, 10000);

    const socket = io(`${process.env.NEXT_PUBLIC_SOCKET_URL}/queue`, {
      transports: ['websocket'],
    });
    if (user?.shopId) socket.emit('join:shop', user.shopId);
    socket.on('queue:updated', fetchOrders);

    return () => {
      clearInterval(interval);
      socket.disconnect();
    };
  }, [user?.shopId]);

  const pending = orders.filter(o => o.status === 'QUEUED' || o.status === 'PENDING');
  const printing = orders.find(o => o.status === 'PRINTING' || o.status === 'PROCESSING');
  const completed = orders.filter(o => o.status === 'COMPLETED');

  return (
    <div className="min-h-screen bg-background p-6">
      <div className="max-w-7xl mx-auto">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-2xl font-semibold">Print Queue</h1>
          <div className="flex gap-3">
            <div className="px-3 py-1 bg-yellow-50 border border-yellow-200 rounded-full text-sm text-yellow-700">
              {pending.length} Pending
            </div>
            <div className="px-3 py-1 bg-blue-50 border border-blue-200 rounded-full text-sm text-blue-700">
              {printing ? '1 Printing' : 'Idle'}
            </div>
            <div className="px-3 py-1 bg-green-50 border border-green-200 rounded-full text-sm text-green-700">
              {completed.length} Done Today
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-3">
            <h2 className="text-sm font-medium text-muted-foreground uppercase tracking-wide">Queue</h2>
            {loading && <p className="text-muted-foreground text-sm">Loading orders...</p>}
            {!loading && pending.length === 0 && (
              <div className="p-8 text-center text-muted-foreground border border-dashed rounded-xl">
                No orders in queue right now
              </div>
            )}
            {pending.map(order => (
              <OrderCard key={order.id} order={order} onStatusChange={handleStatusChange} />
            ))}
          </div>

          <div>
            <h2 className="text-sm font-medium text-muted-foreground uppercase tracking-wide mb-3">Now Printing</h2>
            {printing ? (
              <OrderCard order={printing} onStatusChange={handleStatusChange} highlight />
            ) : (
              <div className="p-8 text-center text-muted-foreground border border-dashed rounded-xl">
                Nothing printing
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
