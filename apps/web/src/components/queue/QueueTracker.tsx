'use client';
import { QueueState } from '@/types/queue';
import { OrderStatus } from '@/types/order';
import { CheckCircle, AlertCircle, Clock, Printer, RotateCcw } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface QueueTrackerProps {
  queueState: QueueState;
  orderStatus: OrderStatus;
  onRetry?: () => void;
}

export default function QueueTracker({ queueState, orderStatus, onRetry }: QueueTrackerProps) {
  
  if (orderStatus === 'COMPLETED') {
    return (
      <div className="flex flex-col items-center justify-center p-8 bg-green-500/10 rounded-2xl border border-green-500/20 text-center">
        <CheckCircle className="w-16 h-16 text-green-500 mb-4" />
        <h2 className="text-2xl font-heading font-bold text-green-500 mb-2">Print Ready!</h2>
        <p className="text-muted-foreground">Your document has been printed and is ready for pickup.</p>
        <p className="text-sm font-medium mt-4">Token #{queueState.yourToken}</p>
      </div>
    );
  }

  if (orderStatus === 'FAILED') {
    return (
      <div className="flex flex-col items-center justify-center p-8 bg-destructive/10 rounded-2xl border border-destructive/20 text-center">
        <AlertCircle className="w-16 h-16 text-destructive mb-4" />
        <h2 className="text-2xl font-heading font-bold text-destructive mb-2">Printing Failed</h2>
        <p className="text-muted-foreground mb-6">There was an issue printing your document. Please see the shop operator.</p>
        {onRetry && (
          <Button onClick={onRetry} variant="outline" className="border-destructive text-destructive hover:bg-destructive hover:text-white">
            <RotateCcw className="w-4 h-4 mr-2" /> Retry
          </Button>
        )}
      </div>
    );
  }

  const getStatusColor = (status: OrderStatus) => {
    switch (status) {
      case 'PENDING': return 'bg-yellow-500';
      case 'QUEUED': return 'bg-blue-500';
      case 'PROCESSING': return 'bg-purple-500';
      case 'PRINTING': return 'bg-brand-accent';
      default: return 'bg-secondary';
    }
  };

  return (
    <div className="bg-card rounded-2xl border border-border p-8 shadow-sm">
      <div className="flex justify-between items-center mb-8">
        <div className={`px-3 py-1 rounded-full text-xs font-bold text-white ${getStatusColor(orderStatus)}`}>
          {orderStatus}
        </div>
        <div className="flex items-center text-muted-foreground text-sm">
          <Clock className="w-4 h-4 mr-1" />
          ETA: ~{queueState.eta || 0} mins
        </div>
      </div>

      <div className="flex flex-col items-center justify-center mb-10">
        <p className="text-muted-foreground mb-2">Your Token</p>
        <h1 className="text-6xl font-heading font-black text-foreground mb-4">
          #{queueState.yourToken || '--'}
        </h1>
        
        {queueState.nowPrinting && (
          <div className="flex items-center bg-secondary/50 px-4 py-2 rounded-full mt-2">
            <span className="relative flex h-3 w-3 mr-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-3 w-3 bg-green-500"></span>
            </span>
            <span className="text-sm font-medium">Now Printing: #{queueState.nowPrinting}</span>
          </div>
        )}
      </div>

      {queueState.position !== null && queueState.position > 0 && (
        <div className="space-y-2">
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">Queue Position</span>
            <span className="font-medium">{queueState.position} ahead of you</span>
          </div>
          <div className="w-full h-2 bg-secondary rounded-full overflow-hidden">
            <div 
              className="h-full bg-brand-accent transition-all duration-1000"
              style={{ width: `${Math.max(10, 100 - (queueState.position * 10))}%` }}
            />
          </div>
        </div>
      )}
    </div>
  );
}
