'use client';
import { PrintOrder, OrderStatus } from '@/types/order';
import { Button } from '@/components/ui/button';
import { formatCurrency } from '@/utils/formatters';
import { FileText, Play, Check, XCircle, RotateCcw } from 'lucide-react';

interface OrderCardProps {
  order: PrintOrder;
  onStatusChange: (orderId: string, status: OrderStatus) => void | Promise<void>;
  highlight?: boolean;
}

export default function OrderCard({ order, onStatusChange, highlight }: OrderCardProps) {
  
  const getStatusBadge = (status: OrderStatus) => {
    switch (status) {
      case 'QUEUED': return 'bg-blue-500/10 text-blue-500 border-blue-500/20';
      case 'PRINTING': return 'bg-brand-accent/10 text-brand-accent border-brand-accent/20';
      case 'COMPLETED': return 'bg-green-500/10 text-green-500 border-green-500/20';
      case 'FAILED': return 'bg-destructive/10 text-destructive border-destructive/20';
      default: return 'bg-secondary text-muted-foreground border-border';
    }
  };

  return (
    <div className={`bg-card rounded-xl border p-5 transition-colors ${highlight ? 'border-brand-accent shadow-md ring-1 ring-brand-accent' : 'border-border shadow-sm hover:border-brand-accent/30'}`}>
      <div className="flex justify-between items-start mb-4">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-lg bg-secondary flex items-center justify-center font-heading font-bold text-xl text-foreground">
            #{order.tokenNumber}
          </div>
          <div>
            <h4 className="font-semibold">{order.userId.slice(0,8)}...</h4>
            <div className={`text-xs px-2 py-0.5 rounded border inline-block mt-1 font-medium ${getStatusBadge(order.status)}`}>
              {order.status}
            </div>
          </div>
        </div>
        <div className="text-right">
          <div className="font-bold text-lg">{formatCurrency(order.totalAmount)}</div>
          <div className="text-xs text-muted-foreground">Paid</div>
        </div>
      </div>

      <div className="flex items-center gap-2 text-sm text-muted-foreground mb-5 bg-background p-2 rounded border border-border">
        <FileText className="w-4 h-4" />
        <span className="truncate flex-1">{order.fileName}</span>
      </div>

      <div className="flex flex-wrap gap-x-3 gap-y-1 text-sm font-medium text-foreground mb-6">
        <span>{order.pageCount} pages</span>
        <span className="text-muted-foreground">•</span>
        <span className="capitalize">{order.config.colorMode === 'bw' ? 'B&W' : 'Color'}</span>
        <span className="text-muted-foreground">•</span>
        <span className="capitalize">{order.config.sides === 'single' ? 'Single' : 'Duplex'}</span>
        <span className="text-muted-foreground">•</span>
        <span>{order.config.copies} copies</span>
      </div>

      <div className="flex gap-2">
        {order.status === 'QUEUED' && (
          <Button 
            className="flex-1 bg-brand-accent hover:bg-brand-accent/90" 
            onClick={() => onStatusChange(order.id, 'PRINTING')}
          >
            <Play className="w-4 h-4 mr-2" /> Start Printing
          </Button>
        )}
        
        {order.status === 'PRINTING' && (
          <Button 
            className="flex-1 bg-green-500 hover:bg-green-600 text-white" 
            onClick={() => onStatusChange(order.id, 'COMPLETED')}
          >
            <Check className="w-4 h-4 mr-2" /> Mark Complete
          </Button>
        )}
        
        {order.status === 'FAILED' && (
          <Button 
            className="flex-1" 
            variant="outline"
            onClick={() => onStatusChange(order.id, 'QUEUED')}
          >
            <RotateCcw className="w-4 h-4 mr-2" /> Retry
          </Button>
        )}
        
        {order.status !== 'COMPLETED' && order.status !== 'FAILED' && (
          <Button 
            variant="ghost" 
            className="text-destructive hover:bg-destructive/10 hover:text-destructive px-3"
            onClick={() => onStatusChange(order.id, 'FAILED')}
            title="Cancel/Fail"
          >
            <XCircle className="w-5 h-5" />
          </Button>
        )}
      </div>
    </div>
  );
}
