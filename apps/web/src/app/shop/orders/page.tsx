'use client';

import { useState, useEffect, useCallback } from 'react';
import { orderService } from '@/services/orderService';
import { useAuthStore } from '@/store/authStore';
import { PrintOrder, OrderStatus } from '@/types/order';
import { formatCurrency, formatDate } from '@/utils/formatters';
import FilePreviewModal from '@/components/shop/FilePreviewModal';
import {
  FileText, Calendar, Clock, CreditCard, Search, Filter,
  RefreshCw, AlertTriangle, Printer, Check, XCircle,
  Download, ChevronDown, ChevronUp, TrendingUp,
  Hash, Eye
} from 'lucide-react';

type DateFilter = 'today' | 'week' | 'month' | 'all';
type StatusTab = 'ALL' | 'QUEUED' | 'PRINTING' | 'COMPLETED' | 'FAILED';

export default function ShopOrdersPage() {
  const { user } = useAuthStore();
  const shopId = user?.shopId;
  const [orders, setOrders] = useState<PrintOrder[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusTab, setStatusTab] = useState<StatusTab>('ALL');
  const [dateFilter, setDateFilter] = useState<DateFilter>('today');
  const [expandedOrderId, setExpandedOrderId] = useState<string | null>(null);
  const [updatingId, setUpdatingId] = useState<string | null>(null);
  const [previewOrder, setPreviewOrder] = useState<{ fileUrl: string; fileName: string } | null>(null);

  const fetchOrders = useCallback(async () => {
    if (!shopId) return;
    setLoading(true);
    setError(null);
    try {
      const res = await orderService.getShopOrders(shopId);
      setOrders(res.data);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to fetch orders');
    } finally {
      setLoading(false);
    }
  }, [shopId]);

  useEffect(() => {
    fetchOrders();
  }, [fetchOrders]);

  const handleStatusChange = async (orderId: string, newStatus: OrderStatus) => {
    setUpdatingId(orderId);
    try {
      await orderService.updateOrderStatus(orderId, newStatus);
      setOrders(prev => prev.map(o => o.id === orderId ? { ...o, status: newStatus } : o));
    } catch (err: any) {
      console.error('Status update failed:', err);
    } finally {
      setUpdatingId(null);
    }
  };

  // Date filtering logic
  const filterByDate = (order: PrintOrder) => {
    const orderDate = new Date(order.createdAt);
    const now = new Date();
    
    switch (dateFilter) {
      case 'today': {
        const startOfDay = new Date(now);
        startOfDay.setHours(0, 0, 0, 0);
        return orderDate >= startOfDay;
      }
      case 'week': {
        const startOfWeek = new Date(now);
        startOfWeek.setDate(now.getDate() - 7);
        startOfWeek.setHours(0, 0, 0, 0);
        return orderDate >= startOfWeek;
      }
      case 'month': {
        const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
        return orderDate >= startOfMonth;
      }
      case 'all':
        return true;
      default:
        return true;
    }
  };

  const filteredOrders = orders.filter(order => {
    // Date filter
    if (!filterByDate(order)) return false;
    
    // Status tab
    if (statusTab !== 'ALL' && order.status !== statusTab) return false;

    // Search
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      return (
        (order.fileName || '').toLowerCase().includes(term) ||
        (order.tokenNumber?.toString() || '').includes(term) ||
        ((order as any)?.user?.name || '').toLowerCase().includes(term) ||
        ((order as any)?.user?.email || '').toLowerCase().includes(term) ||
        order.id.toLowerCase().includes(term)
      );
    }
    return true;
  });

  // Sort by most recent
  const sortedOrders = [...filteredOrders].sort((a, b) => 
    new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
  );

  // Stats
  const completedOrders = filteredOrders.filter(o => o.status === 'COMPLETED');
  const totalRevenue = completedOrders.reduce((s, o) => s + (o.totalAmount || 0), 0);
  const totalPages = filteredOrders.reduce((s, o) => s + (o.pageCount || 0) * (o.config?.copies || 1), 0);
  const avgOrderValue = completedOrders.length > 0 ? totalRevenue / completedOrders.length : 0;

  const getStatusBadge = (status: OrderStatus) => {
    switch (status) {
      case 'QUEUED': return { cls: 'bg-blue-500/10 text-blue-500 border-blue-500/20', label: 'Queued' };
      case 'PRINTING': return { cls: 'bg-amber-500/10 text-amber-500 border-amber-500/20', label: 'Printing' };
      case 'PROCESSING': return { cls: 'bg-orange-500/10 text-orange-500 border-orange-500/20', label: 'Processing' };
      case 'COMPLETED': return { cls: 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20', label: 'Completed' };
      case 'FAILED': return { cls: 'bg-rose-500/10 text-rose-500 border-rose-500/20', label: 'Failed' };
      case 'PENDING': return { cls: 'bg-yellow-500/10 text-yellow-600 border-yellow-500/20', label: 'Pending' };
      default: return { cls: 'bg-muted text-muted-foreground border-border', label: status };
    }
  };

  if (!shopId) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-6">
        <div className="text-center">
          <AlertTriangle className="w-12 h-12 text-destructive mx-auto mb-4" />
          <h2 className="text-xl font-heading font-semibold">No Shop Assigned</h2>
          <p className="text-muted-foreground text-sm mt-2">Your account is not linked to any shop.</p>
        </div>
      </div>
    );
  }

  return (
    <>
    <div className="min-h-screen bg-background">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">

        {/* Header */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-border pb-6">
          <div>
            <h1 className="text-2xl sm:text-3xl font-heading font-extrabold tracking-tight">Order Management</h1>
            <p className="text-sm text-muted-foreground mt-0.5">Complete order history and management for your shop</p>
          </div>
          <button
            onClick={fetchOrders}
            disabled={loading}
            className="flex items-center gap-2 px-4 py-2 rounded-lg border border-border bg-card hover:bg-muted text-sm font-medium transition-colors"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </button>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          <div className="bg-card border border-border rounded-xl p-4">
            <div className="flex items-center gap-2 text-muted-foreground text-xs uppercase font-semibold mb-2">
              <Hash className="w-3.5 h-3.5" /> Total Orders
            </div>
            <p className="text-2xl font-bold font-heading">{filteredOrders.length}</p>
          </div>
          <div className="bg-card border border-border rounded-xl p-4">
            <div className="flex items-center gap-2 text-muted-foreground text-xs uppercase font-semibold mb-2">
              <CreditCard className="w-3.5 h-3.5" /> Revenue
            </div>
            <p className="text-2xl font-bold font-heading text-emerald-500">{formatCurrency(totalRevenue)}</p>
          </div>
          <div className="bg-card border border-border rounded-xl p-4">
            <div className="flex items-center gap-2 text-muted-foreground text-xs uppercase font-semibold mb-2">
              <TrendingUp className="w-3.5 h-3.5" /> Avg. Order Value
            </div>
            <p className="text-2xl font-bold font-heading">{formatCurrency(avgOrderValue)}</p>
          </div>
          <div className="bg-card border border-border rounded-xl p-4">
            <div className="flex items-center gap-2 text-muted-foreground text-xs uppercase font-semibold mb-2">
              <FileText className="w-3.5 h-3.5" /> Total Pages
            </div>
            <p className="text-2xl font-bold font-heading">{totalPages}</p>
          </div>
        </div>

        {/* Filters Bar */}
        <div className="bg-card border border-border rounded-xl p-4 space-y-4">
          {/* Date Range + Search */}
          <div className="flex flex-col sm:flex-row gap-4 justify-between">
            {/* Date Range Tabs */}
            <div className="flex items-center gap-2">
              <Calendar className="w-4 h-4 text-muted-foreground shrink-0" />
              {([
                { id: 'today' as DateFilter, label: 'Today' },
                { id: 'week' as DateFilter, label: 'This Week' },
                { id: 'month' as DateFilter, label: 'This Month' },
                { id: 'all' as DateFilter, label: 'All Time' },
              ]).map(df => (
                <button
                  key={df.id}
                  onClick={() => setDateFilter(df.id)}
                  className={`text-xs px-3 py-1.5 rounded-lg font-medium whitespace-nowrap transition-colors ${
                    dateFilter === df.id 
                      ? 'bg-primary text-primary-foreground' 
                      : 'bg-muted/50 hover:bg-muted text-muted-foreground'
                  }`}
                >
                  {df.label}
                </button>
              ))}
            </div>

            {/* Search */}
            <div className="relative w-full sm:w-72">
              <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
              <input
                type="text"
                placeholder="Search by token #, customer, file..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-9 pr-4 py-2 text-sm bg-background border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/50"
              />
            </div>
          </div>

          {/* Status Filter Tabs */}
          <div className="flex items-center gap-2 overflow-x-auto pb-1">
            <Filter className="w-4 h-4 text-muted-foreground shrink-0" />
            {([
              { id: 'ALL' as StatusTab, label: 'All' },
              { id: 'QUEUED' as StatusTab, label: 'Queued' },
              { id: 'PRINTING' as StatusTab, label: 'Printing' },
              { id: 'COMPLETED' as StatusTab, label: 'Completed' },
              { id: 'FAILED' as StatusTab, label: 'Failed' },
            ]).map(tab => (
              <button
                key={tab.id}
                onClick={() => setStatusTab(tab.id)}
                className={`text-xs px-3 py-1.5 rounded-lg font-medium whitespace-nowrap transition-colors ${
                  statusTab === tab.id 
                    ? 'bg-foreground text-background' 
                    : 'bg-muted/50 hover:bg-muted text-muted-foreground'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>

        {/* Error */}
        {error && (
          <div className="bg-destructive/10 border border-destructive/20 rounded-xl p-4 text-sm text-destructive flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 shrink-0" />
            {error}
            <button onClick={fetchOrders} className="ml-auto underline font-medium text-xs">Retry</button>
          </div>
        )}

        {/* Orders Table */}
        {loading ? (
          <div className="space-y-3">
            {[1, 2, 3, 4].map(i => (
              <div key={i} className="bg-card border border-border rounded-xl p-5 animate-pulse">
                <div className="flex justify-between items-center mb-3">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-lg bg-muted"></div>
                    <div className="space-y-1.5"><div className="h-4 w-40 bg-muted rounded"></div><div className="h-3 w-24 bg-muted rounded"></div></div>
                  </div>
                  <div className="h-6 w-16 bg-muted rounded-full"></div>
                </div>
              </div>
            ))}
          </div>
        ) : sortedOrders.length === 0 ? (
          <div className="bg-card border border-dashed border-border rounded-2xl p-12 text-center flex flex-col items-center">
            <div className="w-16 h-16 rounded-full bg-secondary flex items-center justify-center mb-4 text-muted-foreground">
              <FileText className="w-8 h-8" />
            </div>
            <h3 className="font-heading font-semibold text-xl mb-2">No orders found</h3>
            <p className="text-muted-foreground text-sm max-w-md">
              {searchTerm || statusTab !== 'ALL'
                ? 'No orders match your current filters. Try adjusting the search or filters.'
                : 'No orders have been placed for this period yet.'}
            </p>
            {(searchTerm || statusTab !== 'ALL' || dateFilter !== 'today') && (
              <button
                onClick={() => { setSearchTerm(''); setStatusTab('ALL'); setDateFilter('today'); }}
                className="mt-4 text-sm text-primary font-medium underline"
              >
                Reset all filters
              </button>
            )}
          </div>
        ) : (
          <div className="space-y-3">
            {/* Table Header */}
            <div className="hidden md:grid grid-cols-12 gap-4 px-5 py-2 text-xs font-semibold text-muted-foreground uppercase tracking-wider">
              <div className="col-span-1">Token</div>
              <div className="col-span-3">Customer & File</div>
              <div className="col-span-3">Configuration</div>
              <div className="col-span-1">Pages</div>
              <div className="col-span-1">Amount</div>
              <div className="col-span-1">Status</div>
              <div className="col-span-2 text-right">Actions</div>
            </div>

            {sortedOrders.map(order => {
              const statusInfo = getStatusBadge(order.status);
              const isExpanded = expandedOrderId === order.id;
              const isUpdating = updatingId === order.id;

              return (
                <div key={order.id} className={`bg-card border rounded-xl overflow-hidden transition-all ${
                  order.status === 'PRINTING' ? 'border-brand-accent/30' : 'border-border'
                } ${isUpdating ? 'opacity-60' : ''}`}>
                  
                  {/* Main Row */}
                  <div 
                    className="grid grid-cols-1 md:grid-cols-12 gap-4 p-5 items-center cursor-pointer hover:bg-muted/30 transition-colors"
                    onClick={() => setExpandedOrderId(isExpanded ? null : order.id)}
                  >
                    {/* Token */}
                    <div className="col-span-1">
                      <div className={`w-10 h-10 rounded-lg flex items-center justify-center font-heading font-bold text-sm ${
                        order.status === 'PRINTING' ? 'bg-brand-accent text-white' : 'bg-secondary text-foreground'
                      }`}>
                        #{order.tokenNumber}
                      </div>
                    </div>

                    {/* Customer & File */}
                    <div className="col-span-3 min-w-0">
                      <p className="font-semibold text-sm truncate">{(order as any)?.user?.name || `User ${order.userId.slice(0,6)}...`}</p>
                      <div className="flex items-center gap-1.5 text-xs text-muted-foreground mt-0.5">
                        <FileText className="w-3 h-3 shrink-0" />
                        <span className="truncate">{order.fileName}</span>
                      </div>
                    </div>

                    {/* Configuration */}
                    <div className="col-span-3">
                      <div className="flex flex-wrap gap-1.5">
                        <span className="text-[10px] px-2 py-0.5 bg-secondary rounded-full border border-border font-medium">
                          {order.config?.colorMode === 'bw' ? 'B&W' : 'Color'}
                        </span>
                        <span className="text-[10px] px-2 py-0.5 bg-secondary rounded-full border border-border font-medium">
                          {order.config?.sides === 'single' ? 'Single' : 'Duplex'}
                        </span>
                        <span className="text-[10px] px-2 py-0.5 bg-secondary rounded-full border border-border font-medium">
                          {order.config?.copies || 1}x copy
                        </span>
                        <span className="text-[10px] px-2 py-0.5 bg-secondary rounded-full border border-border font-medium">
                          {order.config?.paperSize || 'A4'}
                        </span>
                      </div>
                    </div>

                    {/* Pages */}
                    <div className="col-span-1">
                      <span className="text-sm font-medium">{order.pageCount}</span>
                      <span className="text-xs text-muted-foreground ml-0.5">pg</span>
                    </div>

                    {/* Amount */}
                    <div className="col-span-1">
                      <span className="text-sm font-bold text-brand-accent">{formatCurrency(order.totalAmount)}</span>
                    </div>

                    {/* Status */}
                    <div className="col-span-1">
                      <span className={`text-[10px] px-2 py-1 rounded-full border font-semibold ${statusInfo.cls}`}>
                        {statusInfo.label}
                      </span>
                    </div>

                    {/* Actions */}
                    <div className="col-span-2 flex items-center justify-end gap-1.5">
                      {(order.status === 'QUEUED' || order.status === 'PENDING') && (
                        <button
                          onClick={(e) => { e.stopPropagation(); handleStatusChange(order.id, 'PRINTING'); }}
                          className="bg-brand-accent hover:bg-brand-accent/90 text-white px-3 py-1.5 rounded-lg text-[10px] font-bold flex items-center gap-1 transition-colors"
                        >
                          <Printer className="w-3 h-3" /> Print
                        </button>
                      )}
                      {order.status === 'PRINTING' && (
                        <button
                          onClick={(e) => { e.stopPropagation(); handleStatusChange(order.id, 'COMPLETED'); }}
                          className="bg-emerald-500 hover:bg-emerald-600 text-white px-3 py-1.5 rounded-lg text-[10px] font-bold flex items-center gap-1 transition-colors"
                        >
                          <Check className="w-3 h-3" /> Done
                        </button>
                      )}
                      {order.status !== 'COMPLETED' && order.status !== 'FAILED' && (
                        <button
                          onClick={(e) => { e.stopPropagation(); handleStatusChange(order.id, 'FAILED'); }}
                          className="p-1.5 rounded-lg text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors"
                        >
                          <XCircle className="w-3.5 h-3.5" />
                        </button>
                      )}
                      <button className="p-1.5 rounded-lg text-muted-foreground hover:bg-muted transition-colors">
                        {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                      </button>
                    </div>
                  </div>

                  {/* Expanded Details */}
                  {isExpanded && (
                    <div className="border-t border-border bg-muted/20 p-5 space-y-4">
                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-sm">
                        <div>
                          <p className="text-xs text-muted-foreground uppercase font-semibold mb-1">Order ID</p>
                          <p className="font-mono text-xs text-foreground/80 break-all">{order.id}</p>
                        </div>
                        <div>
                          <p className="text-xs text-muted-foreground uppercase font-semibold mb-1">Placed At</p>
                          <p className="text-sm font-medium">{formatDate(order.createdAt)}</p>
                        </div>
                        <div>
                          <p className="text-xs text-muted-foreground uppercase font-semibold mb-1">Customer</p>
                          <p className="text-sm font-medium">{(order as any)?.user?.name || 'Unknown'}</p>
                          <p className="text-xs text-muted-foreground">{(order as any)?.user?.email || ''}</p>
                        </div>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-sm">
                        <div>
                           <p className="text-xs text-muted-foreground uppercase font-semibold mb-1">File</p>
                           <div className="flex items-center gap-2 mb-2">
                             <FileText className="w-4 h-4 text-primary shrink-0" />
                             <span className="truncate font-medium text-sm">{order.fileName}</span>
                           </div>
                           {order.fileUrl && (
                             <div className="flex items-center gap-2 flex-wrap">
                               <button
                                 onClick={(e) => { e.stopPropagation(); setPreviewOrder({ fileUrl: order.fileUrl, fileName: order.fileName }); }}
                                 className="inline-flex items-center gap-1.5 text-xs bg-primary/10 text-primary hover:bg-primary/20 px-3 py-1.5 rounded-lg font-semibold transition-colors"
                               >
                                 <Eye className="w-3.5 h-3.5" /> Preview
                               </button>
                               <a
                                 href={order.fileUrl}
                                 download={order.fileName}
                                 onClick={(e) => e.stopPropagation()}
                                 className="inline-flex items-center gap-1.5 text-xs bg-emerald-500/10 text-emerald-600 hover:bg-emerald-500/20 px-3 py-1.5 rounded-lg font-semibold transition-colors"
                               >
                                 <Download className="w-3.5 h-3.5" /> Download
                               </a>
                             </div>
                           )}
                        </div>
                        <div>
                          <p className="text-xs text-muted-foreground uppercase font-semibold mb-1">Print Config</p>
                          <div className="space-y-0.5 text-sm">
                            <p><span className="text-muted-foreground">Color:</span> <span className="font-medium">{order.config?.colorMode === 'bw' ? 'Black & White' : 'Full Color'}</span></p>
                            <p><span className="text-muted-foreground">Sides:</span> <span className="font-medium">{order.config?.sides === 'single' ? 'Single Sided' : 'Double Sided'}</span></p>
                            <p><span className="text-muted-foreground">Copies:</span> <span className="font-medium">{order.config?.copies || 1}</span></p>
                            <p><span className="text-muted-foreground">Paper:</span> <span className="font-medium">{order.config?.paperSize || 'A4'}</span></p>
                          </div>
                        </div>
                        <div>
                          <p className="text-xs text-muted-foreground uppercase font-semibold mb-1">Payment</p>
                          <p className="text-xl font-bold text-brand-accent">{formatCurrency(order.totalAmount)}</p>
                          <p className="text-xs text-muted-foreground mt-0.5">{order.pageCount} pages × {order.config?.copies || 1} copies</p>
                          {order.payment?.razorpayPaymentId && (
                            <p className="text-[10px] font-mono text-muted-foreground mt-1">
                              Payment: {order.payment.razorpayPaymentId}
                            </p>
                          )}
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}

        {/* Results Summary */}
        {!loading && sortedOrders.length > 0 && (
          <div className="text-center text-xs text-muted-foreground pt-2 pb-4">
            Showing {sortedOrders.length} of {orders.length} total orders
          </div>
        )}

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
  </>);
}
