'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { orderService } from '@/services/orderService';
import { PrintOrder, OrderStatus } from '@/types/order';
import { formatCurrency } from '@/utils/formatters';
import { 
  Printer, 
  FileText, 
  Calendar, 
  Clock, 
  CreditCard, 
  ExternalLink, 
  Search, 
  Filter, 
  ArrowRight,
  Sparkles,
  CheckCircle2,
  AlertCircle,
  Loader2,
  RefreshCw,
  Image as ImageIcon
} from 'lucide-react';

export default function MyOrdersPage() {
  const [orders, setOrders] = useState<PrintOrder[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('ALL');

  const fetchOrders = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await orderService.getMyOrders();
      setOrders(res.data);
    } catch (err: any) {
      setError(err.response?.data?.message || err.message || 'Failed to fetch order history');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOrders();
  }, []);

  const isImageFile = (urlOrName: string) => {
    if (!urlOrName) return false;
    const lower = urlOrName.toLowerCase();
    return lower.endsWith('.jpg') || lower.endsWith('.jpeg') || lower.endsWith('.png') || lower.includes('data:image');
  };

  // Helper to format date & time nicely
  const formatDate = (dateString: string) => {
    try {
      const date = new Date(dateString);
      return new Intl.DateTimeFormat('en-IN', {
        dateStyle: 'medium',
        timeStyle: 'short',
      }).format(date);
    } catch (e) {
      return dateString;
    }
  };

  const getStatusBadge = (status: OrderStatus) => {
    switch (status) {
      case 'QUEUED':
        return {
          label: 'In Queue',
          className: 'bg-blue-500/10 text-blue-500 border-blue-500/20',
          icon: Clock
        };
      case 'PRINTING':
      case 'PROCESSING':
        return {
          label: 'Printing Now',
          className: 'bg-amber-500/10 text-amber-500 border-amber-500/20 animate-pulse',
          icon: Printer
        };
      case 'COMPLETED':
        return {
          label: 'Completed',
          className: 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20',
          icon: CheckCircle2
        };
      case 'FAILED':
        return {
          label: 'Failed',
          className: 'bg-rose-500/10 text-rose-500 border-rose-500/20',
          icon: AlertCircle
        };
      default:
        return {
          label: status,
          className: 'bg-secondary text-muted-foreground border-border',
          icon: Clock
        };
    }
  };

  const filteredOrders = orders.filter(order => {
    const matchesSearch = 
      (order.shop?.name || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      (order.fileName || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      (order.tokenNumber?.toString() || '').includes(searchTerm);

    if (statusFilter === 'ALL') return matchesSearch;
    if (statusFilter === 'IN_PROGRESS') {
      return matchesSearch && ['QUEUED', 'PRINTING', 'PROCESSING', 'PENDING'].includes(order.status);
    }
    return matchesSearch && order.status === statusFilter;
  });

  const totalSpent = orders.reduce((sum, o) => sum + (o.totalAmount || 0), 0);
  const activeOrdersCount = orders.filter(o => ['QUEUED', 'PRINTING', 'PROCESSING', 'PENDING'].includes(o.status)).length;

  return (
    <div className="min-h-screen bg-background text-foreground py-10 px-4 sm:px-6 lg:px-8">
      <div className="max-w-6xl mx-auto space-y-8">
        
        {/* Page Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-border pb-6">
          <div>
            <div className="flex items-center gap-2 text-brand-accent text-sm font-semibold tracking-wide uppercase mb-1">
              <Sparkles className="w-4 h-4" /> User Transaction & Print History
            </div>
            <h1 className="text-3xl sm:text-4xl font-heading font-extrabold tracking-tight">My Print Orders</h1>
            <p className="text-muted-foreground text-sm mt-1">View all your previous document print requests, receipts, and order statuses</p>
          </div>
          <div className="flex items-center gap-3">
            <button 
              onClick={fetchOrders}
              disabled={loading}
              className="p-2.5 rounded-xl border border-border bg-card hover:bg-muted transition-colors text-muted-foreground hover:text-foreground flex items-center gap-2 text-sm font-medium"
              title="Refresh history"
            >
              <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
              <span className="hidden sm:inline">Refresh</span>
            </button>
            <Link 
              href="/upload"
              className="bg-primary text-primary-foreground hover:bg-primary/90 px-5 py-2.5 rounded-xl font-medium text-sm flex items-center gap-2 shadow-sm transition-all hover:scale-[1.02]"
            >
              <Printer className="w-4 h-4" />
              New Print Job
            </Link>
          </div>
        </div>

        {/* Stats Overview */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="bg-card border border-border rounded-xl p-5 shadow-sm flex items-center justify-between">
            <div>
              <p className="text-xs text-muted-foreground uppercase font-semibold">Total Orders</p>
              <h3 className="text-2xl font-bold font-heading mt-1">{orders.length}</h3>
            </div>
            <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center text-primary">
              <FileText className="w-6 h-6" />
            </div>
          </div>

          <div className="bg-card border border-border rounded-xl p-5 shadow-sm flex items-center justify-between">
            <div>
              <p className="text-xs text-muted-foreground uppercase font-semibold">Total Spent</p>
              <h3 className="text-2xl font-bold font-heading mt-1 text-emerald-500">{formatCurrency(totalSpent)}</h3>
            </div>
            <div className="w-12 h-12 rounded-xl bg-emerald-500/10 flex items-center justify-center text-emerald-500">
              <CreditCard className="w-6 h-6" />
            </div>
          </div>

          <div className="bg-card border border-border rounded-xl p-5 shadow-sm flex items-center justify-between">
            <div>
              <p className="text-xs text-muted-foreground uppercase font-semibold">Active Jobs</p>
              <h3 className="text-2xl font-bold font-heading mt-1 text-blue-500">{activeOrdersCount}</h3>
            </div>
            <div className="w-12 h-12 rounded-xl bg-blue-500/10 flex items-center justify-center text-blue-500">
              <Clock className="w-6 h-6" />
            </div>
          </div>
        </div>

        {/* Filters & Search Bar */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4 bg-card border border-border p-4 rounded-xl shadow-sm">
          <div className="relative flex-1">
            <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-muted-foreground" />
            <input 
              type="text" 
              placeholder="Search by shop name, file name, token #"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 text-sm bg-background border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/50"
            />
          </div>

          <div className="flex items-center gap-2 overflow-x-auto pb-1 sm:pb-0">
            <Filter className="w-4 h-4 text-muted-foreground shrink-0 hidden sm:block" />
            {[
              { id: 'ALL', label: 'All Orders' },
              { id: 'IN_PROGRESS', label: 'In Progress' },
              { id: 'COMPLETED', label: 'Completed' },
              { id: 'FAILED', label: 'Failed' },
            ].map(tab => (
              <button
                key={tab.id}
                onClick={() => setStatusFilter(tab.id)}
                className={`text-xs px-3 py-2 rounded-lg font-medium whitespace-nowrap transition-colors ${
                  statusFilter === tab.id 
                    ? 'bg-primary text-primary-foreground' 
                    : 'bg-muted/50 hover:bg-muted text-muted-foreground'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>

        {/* Orders List */}
        {loading ? (
          <div className="space-y-4">
            {[1, 2, 3].map(i => (
              <div key={i} className="h-44 bg-card border border-border rounded-2xl animate-pulse p-6 flex flex-col justify-between">
                <div className="flex justify-between items-start">
                  <div className="space-y-2">
                    <div className="h-6 w-48 bg-muted rounded"></div>
                    <div className="h-4 w-32 bg-muted rounded"></div>
                  </div>
                  <div className="h-8 w-24 bg-muted rounded-full"></div>
                </div>
                <div className="h-10 w-full bg-muted rounded-xl"></div>
              </div>
            ))}
          </div>
        ) : error ? (
          <div className="bg-destructive/10 border border-destructive/20 rounded-2xl p-8 text-center text-destructive">
            <AlertCircle className="w-10 h-10 mx-auto mb-3" />
            <h3 className="font-semibold text-lg">Failed to load orders</h3>
            <p className="text-sm mt-1 opacity-80">{error}</p>
            <button 
              onClick={fetchOrders}
              className="mt-4 px-4 py-2 bg-destructive text-destructive-foreground rounded-lg text-sm font-medium hover:bg-destructive/90"
            >
              Try Again
            </button>
          </div>
        ) : filteredOrders.length === 0 ? (
          <div className="bg-card border border-dashed border-border rounded-2xl p-12 text-center flex flex-col items-center">
            <div className="w-16 h-16 rounded-full bg-secondary flex items-center justify-center mb-4 text-muted-foreground">
              <FileText className="w-8 h-8" />
            </div>
            <h3 className="font-heading font-semibold text-xl mb-2">No print orders found</h3>
            <p className="text-muted-foreground text-sm max-w-md mb-6">
              {searchTerm || statusFilter !== 'ALL' 
                ? 'No orders match your current search criteria or filter.' 
                : 'You have not submitted any print jobs yet. Upload your first document to get started.'}
            </p>
            {searchTerm || statusFilter !== 'ALL' ? (
              <button
                onClick={() => { setSearchTerm(''); setStatusFilter('ALL'); }}
                className="text-sm text-primary font-medium underline"
              >
                Reset filters
              </button>
            ) : (
              <Link 
                href="/upload"
                className="bg-primary text-primary-foreground px-6 py-2.5 rounded-xl font-medium text-sm flex items-center gap-2 hover:bg-primary/90"
              >
                Upload Document Now <ArrowRight className="w-4 h-4" />
              </Link>
            )}
          </div>
        ) : (
          <div className="space-y-6">
            {filteredOrders.map(order => {
              const statusInfo = getStatusBadge(order.status);
              const StatusIcon = statusInfo.icon;
              const isImg = isImageFile(order.fileName) || isImageFile(order.fileUrl);

              return (
                <div 
                  key={order.id} 
                  className="bg-card border border-border rounded-2xl p-6 shadow-sm hover:border-brand-accent/40 transition-all duration-200"
                >
                  {/* Card Header: Shop Name (Main Title) & Token + Status */}
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-border">
                    <div className="flex items-start gap-3">
                      <div className="w-12 h-12 rounded-xl bg-primary/10 text-primary flex items-center justify-center font-heading font-bold text-lg shrink-0">
                        #{order.tokenNumber}
                      </div>
                      <div>
                        {/* MAIN TITLE: Shop Name */}
                        <h2 className="text-xl font-heading font-bold text-foreground hover:text-brand-accent transition-colors">
                          {order.shop?.name || 'PrintLOO Partner Shop'}
                        </h2>
                        {order.shop?.location && (
                          <p className="text-xs text-muted-foreground mt-0.5">{order.shop.location}</p>
                        )}
                      </div>
                    </div>

                    <div className="flex items-center gap-3 self-end sm:self-auto">
                      <div className={`px-3 py-1.5 rounded-full border text-xs font-semibold flex items-center gap-1.5 ${statusInfo.className}`}>
                        <StatusIcon className="w-3.5 h-3.5" />
                        <span>{statusInfo.label}</span>
                      </div>

                      {['QUEUED', 'PRINTING', 'PROCESSING'].includes(order.status) && (
                        <Link 
                          href={`/queue?orderId=${order.id}&token=${order.tokenNumber}`}
                          className="text-xs font-semibold bg-brand-accent/10 text-brand-accent hover:bg-brand-accent/20 px-3 py-1.5 rounded-full transition-colors flex items-center gap-1"
                        >
                          Queue View <ArrowRight className="w-3 h-3" />
                        </Link>
                      )}
                    </div>
                  </div>

                  {/* Card Content: File Preview & Details Grid */}
                  <div className="py-4 grid grid-cols-1 md:grid-cols-12 gap-6 items-center">
                    
                    {/* Uploaded File Photo / Preview Thumbnail */}
                    <div className="md:col-span-4 flex items-center gap-4 bg-background p-3 rounded-xl border border-border">
                      <div className="w-16 h-16 rounded-lg bg-secondary border border-border overflow-hidden flex items-center justify-center shrink-0 relative group">
                        {isImg ? (
                          // Display image preview thumbnail
                          <img 
                            src={order.fileUrl} 
                            alt={order.fileName} 
                            className="w-full h-full object-cover"
                            onError={(e) => {
                              // Fallback if image fails to load
                              (e.target as HTMLElement).style.display = 'none';
                            }}
                          />
                        ) : (
                          <FileText className="w-8 h-8 text-primary" />
                        )}
                        {!isImg && (
                          <div className="absolute inset-0 bg-background/50 flex items-center justify-center">
                            <FileText className="w-7 h-7 text-primary" />
                          </div>
                        )}
                      </div>

                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-1.5">
                          {isImg ? <ImageIcon className="w-3.5 h-3.5 text-brand-accent" /> : <FileText className="w-3.5 h-3.5 text-primary" />}
                          <p className="font-medium text-sm text-foreground truncate" title={order.fileName}>
                            {order.fileName}
                          </p>
                        </div>
                        <p className="text-xs text-muted-foreground mt-1">
                          {order.pageCount} {order.pageCount === 1 ? 'page' : 'pages'} total
                        </p>
                        {order.fileUrl && (
                          <a 
                            href={order.fileUrl} 
                            target="_blank" 
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-1 text-xs text-brand-accent hover:underline mt-1 font-medium"
                          >
                            View Document <ExternalLink className="w-3 h-3" />
                          </a>
                        )}
                      </div>
                    </div>

                    {/* Print Configuration Details */}
                    <div className="md:col-span-5 grid grid-cols-2 gap-3 text-xs">
                      <div className="bg-secondary/40 p-2.5 rounded-lg border border-border/50">
                        <span className="text-muted-foreground block text-[10px] uppercase font-semibold">Color Mode</span>
                        <span className="font-semibold text-sm capitalize">{order.config?.colorMode === 'bw' ? 'Black & White' : 'Full Color'}</span>
                      </div>

                      <div className="bg-secondary/40 p-2.5 rounded-lg border border-border/50">
                        <span className="text-muted-foreground block text-[10px] uppercase font-semibold">Sides</span>
                        <span className="font-semibold text-sm capitalize">{order.config?.sides === 'single' ? 'Single Sided' : 'Double Sided'}</span>
                      </div>

                      <div className="bg-secondary/40 p-2.5 rounded-lg border border-border/50">
                        <span className="text-muted-foreground block text-[10px] uppercase font-semibold">Copies</span>
                        <span className="font-semibold text-sm">{order.config?.copies || 1} copies</span>
                      </div>

                      <div className="bg-secondary/40 p-2.5 rounded-lg border border-border/50">
                        <span className="text-muted-foreground block text-[10px] uppercase font-semibold">Paper Size</span>
                        <span className="font-semibold text-sm">{order.config?.paperSize || 'A4'}</span>
                      </div>
                    </div>

                    {/* Cost & Date Timestamp */}
                    <div className="md:col-span-3 text-right md:border-l md:border-border md:pl-6 space-y-1">
                      <p className="text-xs text-muted-foreground flex items-center justify-end gap-1">
                        <Calendar className="w-3.5 h-3.5" />
                        {formatDate(order.createdAt)}
                      </p>
                      <div className="text-2xl font-bold font-heading text-brand-accent">
                        {formatCurrency(order.totalAmount)}
                      </div>
                      <div className="flex items-center justify-end gap-1.5 text-xs text-muted-foreground">
                        <CreditCard className="w-3.5 h-3.5 text-emerald-500" />
                        <span className="text-emerald-500 font-medium">Payment Successful</span>
                      </div>
                      {order.payment?.razorpayPaymentId && (
                        <p className="text-[10px] text-muted-foreground/80 truncate font-mono">
                          ID: {order.payment.razorpayPaymentId}
                        </p>
                      )}
                    </div>

                  </div>
                </div>
              );
            })}
          </div>
        )}

      </div>
    </div>
  );
}
