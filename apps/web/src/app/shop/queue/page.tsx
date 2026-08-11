'use client';

import { useState, useEffect, useRef, useCallback, Suspense } from 'react';
import { io, Socket } from 'socket.io-client';
import { orderService } from '@/services/orderService';
import { useAuthStore } from '@/store/authStore';
import { PrintOrder, OrderStatus } from '@/types/order';
import { formatCurrency } from '@/utils/formatters';
import FilePreviewModal from '@/components/shop/FilePreviewModal';
import { 
  Printer, FileText, Play, Check, XCircle, RotateCcw, 
  RefreshCw, Clock, Zap, AlertTriangle,
  Volume2, VolumeX, Layers, Eye, Download
} from 'lucide-react';

type QueueTab = 'active' | 'completed' | 'failed';

function QueueDashboard() {
  const { user } = useAuthStore();
  const shopId = user?.shopId;
  const [orders, setOrders] = useState<PrintOrder[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<QueueTab>('active');
  const [updatingId, setUpdatingId] = useState<string | null>(null);
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [previewOrder, setPreviewOrder] = useState<{ fileUrl: string; fileName: string } | null>(null);
  const [confirmCancel, setConfirmCancel] = useState<{ orderId: string; tokenNumber: number; customerName: string } | null>(null);
  const socketRef = useRef<Socket | null>(null);
  const pollRef = useRef<NodeJS.Timeout | null>(null);
  const prevOrderCountRef = useRef(0);

  const fetchOrders = useCallback(async () => {
    if (!shopId) return;
    try {
      const res = await orderService.getShopOrders(shopId);
      const newOrders = Array.isArray(res.data) ? res.data : [];
      
      // Play notification sound for new orders
      if (soundEnabled && prevOrderCountRef.current > 0 && newOrders.length > prevOrderCountRef.current) {
        try {
          const audio = new Audio('data:audio/wav;base64,UklGRnoGAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YQoGAACBhYqFbF1fdJivrJBhNjVgodDbsGczGiGA0teleERIOavS7N2BTj5Zj8Coverage==');
          audio.volume = 0.3;
          audio.play().catch(() => {});
        } catch {}
      }
      prevOrderCountRef.current = newOrders.length;
      
      setOrders(newOrders);
      setError(null);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to fetch queue');
    } finally {
      setLoading(false);
    }
  }, [shopId, soundEnabled]);

  useEffect(() => {
    fetchOrders();
    // Poll every 5 seconds
    pollRef.current = setInterval(fetchOrders, 5000);

    // WebSocket for real-time updates
    if (shopId) {
      socketRef.current = io(`${process.env.NEXT_PUBLIC_SOCKET_URL || 'http://localhost:3001'}/queue`, {
        transports: ['websocket', 'polling'],
      });
      socketRef.current.emit('join:shop', shopId);
      socketRef.current.on('queue:updated', () => fetchOrders());
      socketRef.current.on('order:updated', () => fetchOrders());
    }

    return () => {
      if (pollRef.current) clearInterval(pollRef.current);
      socketRef.current?.disconnect();
    };
  }, [fetchOrders, shopId]);

  const handleStatusChange = async (orderId: string, newStatus: OrderStatus) => {
    setUpdatingId(orderId);
    try {
      await orderService.updateOrderStatus(orderId, newStatus);
      // Optimistic update
      setOrders(prev => prev.map(o => o.id === orderId ? { ...o, status: newStatus } : o));
    } catch (err: any) {
      console.error('Failed to update order status:', err);
    } finally {
      setUpdatingId(null);
    }
  };

  const handleAutoPrint = async (order: PrintOrder) => {
    // 1. Mark as PRINTING
    handleStatusChange(order.id, 'PRINTING');

    if (!order.fileUrl) return;

    // 2. Alert the user of required printer settings
    const colorMode = order.config?.colorMode === 'bw' ? 'Black & White' : 'Color';
    const sides = order.config?.sides === 'single' ? 'Single Sided' : 'Double Sided';
    const copies = order.config?.copies || 1;
    
    alert(
      `🖨️ PRINTER CONFIGURATION REQUIRED:\n\n` +
      `Please set these in your Print Dialog:\n` +
      `• Color: ${colorMode}\n` +
      `• Sides: ${sides}\n` +
      `• Copies: ${copies}\n\n` +
      `Click OK to open the print dialog.`
    );

    // 3. Auto-trigger print using an iframe
    try {
      const response = await fetch(order.fileUrl);
      const blob = await response.blob();
      const blobUrl = URL.createObjectURL(blob);
      
      const iframe = document.createElement('iframe');
      iframe.style.display = 'none';
      iframe.src = blobUrl;
      document.body.appendChild(iframe);
      
      iframe.onload = () => {
        setTimeout(() => {
          try {
            iframe.contentWindow?.focus();
            iframe.contentWindow?.print();
          } catch (e) {
            console.error('Print iframe error:', e);
            window.open(blobUrl, '_blank');
          }
        }, 500);
      };
    } catch (error) {
      console.error('Failed to auto-print:', error);
      window.open(order.fileUrl, '_blank');
    }
  };

  // Filter orders
  const activeOrders = orders.filter(o => ['PENDING', 'QUEUED', 'PROCESSING', 'PRINTING'].includes(o.status));
  const completedOrders = orders.filter(o => o.status === 'COMPLETED');
  const failedOrders = orders.filter(o => o.status === 'FAILED');

  const displayedOrders = activeTab === 'active' ? activeOrders 
    : activeTab === 'completed' ? completedOrders 
    : failedOrders;

  // Stats
  const totalRevenue = orders.filter(o => o.status === 'COMPLETED').reduce((s, o) => s + (o.totalAmount || 0), 0);
  const totalPages = orders.reduce((s, o) => s + (o.pageCount || 0) * (o.config?.copies || 1), 0);
  const nowPrinting = orders.find(o => o.status === 'PRINTING');

  const formatTime = (dateString: string) => {
    try {
      return new Date(dateString).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' });
    } catch { return ''; }
  };

  const getStatusStyle = (status: OrderStatus) => {
    switch (status) {
      case 'PENDING': return { bg: 'bg-yellow-500/10', text: 'text-yellow-600', border: 'border-yellow-500/20', label: 'Pending Payment' };
      case 'QUEUED': return { bg: 'bg-blue-500/10', text: 'text-blue-500', border: 'border-blue-500/20', label: 'In Queue' };
      case 'PROCESSING': return { bg: 'bg-orange-500/10', text: 'text-orange-500', border: 'border-orange-500/20', label: 'Processing' };
      case 'PRINTING': return { bg: 'bg-brand-accent/10', text: 'text-brand-accent', border: 'border-brand-accent/20', label: 'Printing' };
      case 'COMPLETED': return { bg: 'bg-emerald-500/10', text: 'text-emerald-500', border: 'border-emerald-500/20', label: 'Completed' };
      case 'FAILED': return { bg: 'bg-rose-500/10', text: 'text-rose-500', border: 'border-rose-500/20', label: 'Failed' };
      default: return { bg: 'bg-muted', text: 'text-muted-foreground', border: 'border-border', label: status };
    }
  };

  if (!shopId) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-6">
        <div className="text-center">
          <AlertTriangle className="w-12 h-12 text-destructive mx-auto mb-4" />
          <h2 className="text-xl font-heading font-semibold">No Shop Assigned</h2>
          <p className="text-muted-foreground text-sm mt-2">Your account is not linked to any shop. Contact the admin.</p>
        </div>
      </div>
    );
  }

  return (
    <>
    <div className="min-h-screen bg-background">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">

        {/* Header */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl sm:text-3xl font-heading font-extrabold tracking-tight">Print Queue</h1>
            <p className="text-sm text-muted-foreground mt-0.5">Manage your live print jobs in real-time</p>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setSoundEnabled(!soundEnabled)}
              className={`p-2 rounded-lg border transition-colors ${soundEnabled ? 'border-primary bg-primary/5 text-primary' : 'border-border text-muted-foreground hover:bg-muted'}`}
              title={soundEnabled ? 'Mute notifications' : 'Enable notifications'}
            >
              {soundEnabled ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4" />}
            </button>
            <button
              onClick={fetchOrders}
              disabled={loading}
              className="flex items-center gap-2 px-4 py-2 rounded-lg border border-border bg-card hover:bg-muted text-sm font-medium transition-colors"
            >
              <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
              Refresh
            </button>
          </div>
        </div>

        {/* Now Printing Banner */}
        {nowPrinting && (
          <div className="bg-gradient-to-r from-brand-accent/10 via-brand-accent/5 to-transparent border border-brand-accent/20 rounded-2xl p-5 flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 rounded-xl bg-brand-accent/15 flex items-center justify-center">
                <Printer className="w-7 h-7 text-brand-accent animate-pulse" />
              </div>
              <div>
                <p className="text-xs text-brand-accent font-semibold uppercase tracking-wider">Now Printing</p>
                <h3 className="text-xl font-heading font-bold">Token #{nowPrinting.tokenNumber}</h3>
                <p className="text-sm text-muted-foreground">{nowPrinting.fileName} · {nowPrinting.pageCount} pages · {nowPrinting.config?.copies || 1} copies</p>
              </div>
            </div>
            <button
              onClick={() => handleStatusChange(nowPrinting.id, 'COMPLETED')}
              disabled={updatingId === nowPrinting.id}
              className="bg-emerald-500 hover:bg-emerald-600 text-white px-5 py-2.5 rounded-xl font-medium text-sm flex items-center gap-2 transition-all hover:scale-[1.02] disabled:opacity-50 shadow-sm"
            >
              <Check className="w-4 h-4" />
              Mark Complete
            </button>
          </div>
        )}

        {/* Stats Row */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          <div className="bg-card border border-border rounded-xl p-4">
            <div className="flex items-center gap-2 text-muted-foreground text-xs uppercase font-semibold mb-2">
              <Layers className="w-3.5 h-3.5" /> In Queue
            </div>
            <p className="text-2xl font-bold font-heading">{activeOrders.length}</p>
          </div>
          <div className="bg-card border border-border rounded-xl p-4">
            <div className="flex items-center gap-2 text-muted-foreground text-xs uppercase font-semibold mb-2">
              <Check className="w-3.5 h-3.5" /> Completed Today
            </div>
            <p className="text-2xl font-bold font-heading text-emerald-500">{completedOrders.length}</p>
          </div>
          <div className="bg-card border border-border rounded-xl p-4">
            <div className="flex items-center gap-2 text-muted-foreground text-xs uppercase font-semibold mb-2">
              <Zap className="w-3.5 h-3.5" /> Revenue Today
            </div>
            <p className="text-2xl font-bold font-heading text-brand-accent">{formatCurrency(totalRevenue)}</p>
          </div>
          <div className="bg-card border border-border rounded-xl p-4">
            <div className="flex items-center gap-2 text-muted-foreground text-xs uppercase font-semibold mb-2">
              <FileText className="w-3.5 h-3.5" /> Total Pages
            </div>
            <p className="text-2xl font-bold font-heading">{totalPages}</p>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="flex gap-1 border-b border-border">
          {([
            { id: 'active' as QueueTab, label: 'Active Queue', count: activeOrders.length },
            { id: 'completed' as QueueTab, label: 'Completed', count: completedOrders.length },
            { id: 'failed' as QueueTab, label: 'Failed', count: failedOrders.length },
          ]).map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`px-4 py-2.5 text-sm font-medium border-b-2 transition-colors flex items-center gap-2 ${
                activeTab === tab.id
                  ? 'border-primary text-primary'
                  : 'border-transparent text-muted-foreground hover:text-foreground'
              }`}
            >
              {tab.label}
              {tab.count > 0 && (
                <span className={`text-[10px] px-1.5 py-0.5 rounded-full font-bold ${
                  activeTab === tab.id ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground'
                }`}>
                  {tab.count}
                </span>
              )}
            </button>
          ))}
        </div>

        {/* Error State */}
        {error && (
          <div className="bg-destructive/10 border border-destructive/20 rounded-xl p-4 text-sm text-destructive flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 shrink-0" />
            {error}
          </div>
        )}

        {/* Orders List */}
        {loading ? (
          <div className="space-y-4">
            {[1, 2, 3].map(i => (
              <div key={i} className="bg-card border border-border rounded-xl p-5 animate-pulse">
                <div className="flex justify-between items-start mb-4">
                  <div className="flex items-center gap-3">
                    <div className="w-14 h-14 rounded-xl bg-muted"></div>
                    <div className="space-y-2">
                      <div className="h-5 w-32 bg-muted rounded"></div>
                      <div className="h-4 w-24 bg-muted rounded"></div>
                    </div>
                  </div>
                  <div className="h-8 w-20 bg-muted rounded-full"></div>
                </div>
                <div className="h-10 w-full bg-muted rounded-lg"></div>
              </div>
            ))}
          </div>
        ) : displayedOrders.length === 0 ? (
          <div className="bg-card border border-dashed border-border rounded-2xl p-12 text-center flex flex-col items-center">
            <div className="w-16 h-16 rounded-full bg-secondary flex items-center justify-center mb-4 text-muted-foreground">
              {activeTab === 'active' ? <Printer className="w-8 h-8" /> : activeTab === 'completed' ? <Check className="w-8 h-8" /> : <XCircle className="w-8 h-8" />}
            </div>
            <h3 className="font-heading font-semibold text-xl mb-2">
              {activeTab === 'active' ? 'Queue is empty' : activeTab === 'completed' ? 'No completed orders yet' : 'No failed orders'}
            </h3>
            <p className="text-muted-foreground text-sm max-w-md">
              {activeTab === 'active' 
                ? 'No pending print jobs. New orders will appear here automatically.' 
                : activeTab === 'completed'
                ? 'Completed print jobs for today will show up here.'
                : 'No failed jobs to show.'}
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {displayedOrders.map((order, idx) => {
              const statusStyle = getStatusStyle(order.status);
              const isUpdating = updatingId === order.id;
              
              return (
                <div
                  key={order.id}
                  className={`bg-card border rounded-xl p-5 transition-all duration-200 ${
                    order.status === 'PRINTING' 
                      ? 'border-brand-accent/40 ring-1 ring-brand-accent/20 shadow-md' 
                      : 'border-border shadow-sm hover:border-brand-accent/30'
                  } ${isUpdating ? 'opacity-60 pointer-events-none' : ''}`}
                >
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    {/* Left: Token + Details */}
                    <div className="flex items-start gap-4 flex-1 min-w-0">
                      {/* Token Badge */}
                      <div className={`w-14 h-14 rounded-xl flex items-center justify-center font-heading font-bold text-lg shrink-0 ${
                        order.status === 'PRINTING' ? 'bg-brand-accent text-white' : 'bg-secondary text-foreground'
                      }`}>
                        #{order.tokenNumber}
                      </div>

                      <div className="min-w-0 flex-1 space-y-2">
                        {/* Customer + File */}
                        <div className="flex items-center gap-2">
                          <span className="font-semibold text-sm">{(order as any)?.user?.name || `User ${order.userId.slice(0,6)}...`}</span>
                          <span className="text-muted-foreground text-xs">•</span>
                          <span className="text-xs text-muted-foreground">{formatTime(order.createdAt)}</span>
                        </div>

                        {/* File Info */}
                        <div className="flex items-center gap-2 text-xs text-muted-foreground bg-background/80 px-2.5 py-1.5 rounded-lg border border-border/50 w-fit max-w-full">
                          <FileText className="w-3.5 h-3.5 shrink-0" />
                          <span className="truncate">{order.fileName}</span>
                        </div>

                        {/* Config Summary */}
                        <div className="flex flex-wrap gap-x-3 gap-y-1 text-xs font-medium text-foreground/80">
                          <span>{order.pageCount} {order.pageCount === 1 ? 'pg' : 'pgs'}</span>
                          <span className="text-muted-foreground">·</span>
                          <span>{order.config?.colorMode === 'bw' ? 'B&W' : 'Color'}</span>
                          <span className="text-muted-foreground">·</span>
                          <span>{order.config?.sides === 'single' ? 'Single' : 'Duplex'}</span>
                          <span className="text-muted-foreground">·</span>
                          <span>{order.config?.copies || 1}x</span>
                          <span className="text-muted-foreground">·</span>
                          <span className="font-bold text-foreground">{formatCurrency(order.totalAmount)}</span>
                        </div>
                      </div>
                    </div>

                    {/* Right: Status + Actions */}
                    <div className="flex items-center gap-3 shrink-0 flex-wrap justify-end">
                      {/* Status Badge */}
                      <div className={`px-3 py-1.5 rounded-full border text-xs font-semibold flex items-center gap-1.5 ${statusStyle.bg} ${statusStyle.text} ${statusStyle.border}`}>
                        {order.status === 'PRINTING' && <span className="w-2 h-2 bg-brand-accent rounded-full animate-pulse"></span>}
                        {statusStyle.label}
                      </div>

                      {/* File Preview & Download */}
                      {order.fileUrl && (
                        <div className="flex items-center gap-1">
                          <button
                            onClick={() => setPreviewOrder({ fileUrl: order.fileUrl, fileName: order.fileName })}
                            className="p-2 rounded-lg text-primary hover:bg-primary/10 transition-colors"
                            title="Preview document"
                          >
                            <Eye className="w-4 h-4" />
                          </button>
                          <a
                            href={order.fileUrl}
                            download={order.fileName}
                            onClick={(e) => e.stopPropagation()}
                            className="p-2 rounded-lg text-emerald-600 hover:bg-emerald-500/10 transition-colors"
                            title="Download document"
                          >
                            <Download className="w-4 h-4" />
                          </a>
                        </div>
                      )}

                      {/* Action Buttons */}
                      <div className="flex items-center gap-1.5">
                        {(order.status === 'QUEUED' || order.status === 'PENDING' || order.status === 'PROCESSING') && (
                          <button
                            onClick={() => handleAutoPrint(order)}
                            className="bg-brand-accent hover:bg-brand-accent/90 text-white px-3.5 py-2 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-all hover:scale-[1.02] shadow-sm"
                          >
                            <Play className="w-3.5 h-3.5" /> Start Print
                          </button>
                        )}

                        {(order.status === 'PRINTING' || order.status === 'PROCESSING' || order.status === 'QUEUED' || order.status === 'PENDING') && (
                          <button
                            onClick={() => handleStatusChange(order.id, 'COMPLETED')}
                            className="bg-emerald-500 hover:bg-emerald-600 text-white px-4 py-2 rounded-lg text-xs font-bold flex items-center gap-1.5 transition-all hover:scale-[1.02] shadow-md shadow-emerald-500/30 ring-2 ring-emerald-500/20"
                          >
                            <Check className="w-3.5 h-3.5" /> Mark Complete
                          </button>
                        )}

                        {order.status === 'FAILED' && (
                          <button
                            onClick={() => handleStatusChange(order.id, 'QUEUED')}
                            className="border border-border hover:bg-muted px-3.5 py-2 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-colors"
                          >
                            <RotateCcw className="w-3.5 h-3.5" /> Retry
                          </button>
                        )}

                        {order.status !== 'COMPLETED' && order.status !== 'FAILED' && (
                          <button
                            onClick={() => setConfirmCancel({
                              orderId: order.id,
                              tokenNumber: order.tokenNumber,
                              customerName: (order as any)?.user?.name || `User ${order.userId.slice(0, 6)}`,
                            })}
                            className="p-2 rounded-lg text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors"
                            title="Cancel / Mark Failed"
                          >
                            <XCircle className="w-4 h-4" />
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Live indicator */}
        <div className="flex items-center justify-center gap-2 text-xs text-muted-foreground pt-4">
          <span className="relative flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
          </span>
          Live — auto-refreshing every 5 seconds
        </div>
      </div>
    </div>

    {/* File Preview Modal */}
    {previewOrder && (
      <FilePreviewModal
        fileUrl={previewOrder.fileUrl}
        fileName={previewOrder.fileName}
        onClose={() => setPreviewOrder(null)}
      />
    )}

    {/* ── Cancel Confirmation Dialog ── */}
    {confirmCancel && (
      <div
        className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/70 backdrop-blur-sm p-4 animate-in fade-in duration-150"
        onClick={(e) => { if (e.target === e.currentTarget) setConfirmCancel(null); }}
      >
        <div className="bg-card border border-border rounded-2xl shadow-2xl w-full max-w-sm animate-in zoom-in-95 duration-150 overflow-hidden">
          {/* Red accent top strip */}
          <div className="h-1.5 w-full bg-gradient-to-r from-rose-500 to-red-600" />

          <div className="p-6">
            {/* Icon */}
            <div className="w-14 h-14 rounded-2xl bg-rose-500/10 flex items-center justify-center mx-auto mb-4">
              <XCircle className="w-7 h-7 text-rose-500" />
            </div>

            {/* Title */}
            <h3 className="text-lg font-heading font-bold text-center mb-1">Cancel this job?</h3>
            <p className="text-sm text-muted-foreground text-center mb-5">
              You are about to cancel{' '}
              <span className="font-semibold text-foreground">Token #{confirmCancel.tokenNumber}</span>{' '}
              for{' '}
              <span className="font-semibold text-foreground">{confirmCancel.customerName}</span>.
              This will mark the order as <span className="text-rose-500 font-semibold">Failed</span> and remove it from the active queue.
            </p>

            {/* Warning callout */}
            <div className="flex items-start gap-2.5 bg-rose-500/8 border border-rose-500/20 rounded-xl p-3 mb-5 text-xs text-rose-600">
              <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />
              <span>This action cannot be undone. The customer will see their order as failed.</span>
            </div>

            {/* Buttons */}
            <div className="flex gap-3">
              <button
                onClick={() => setConfirmCancel(null)}
                className="flex-1 px-4 py-2.5 rounded-xl border border-border hover:bg-muted transition-colors text-sm font-semibold"
              >
                Keep Job
              </button>
              <button
                onClick={() => {
                  handleStatusChange(confirmCancel.orderId, 'FAILED');
                  setConfirmCancel(null);
                }}
                className="flex-1 px-4 py-2.5 rounded-xl bg-rose-500 hover:bg-rose-600 text-white text-sm font-bold transition-all hover:scale-[1.02] shadow-md shadow-rose-500/20 flex items-center justify-center gap-2"
              >
                <XCircle className="w-4 h-4" /> Yes, Cancel
              </button>
            </div>
          </div>
        </div>
      </div>
    )}
  </>);
}

export default function ShopQueuePage() {
  return (
    <Suspense fallback={
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
      </div>
    }>
      <QueueDashboard />
    </Suspense>
  );
}
