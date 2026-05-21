'use client';
import { Button } from '@/components/ui/button';
import { formatCurrency } from '@/utils/formatters';
import { Loader2 } from 'lucide-react';
import { PrintConfig } from '@/types/order';

interface PriceSummaryProps {
  breakdown: any;
  isLoading: boolean;
  onProceed: () => void;
  config: PrintConfig;
}

export default function PriceSummary({ breakdown, isLoading, onProceed, config }: PriceSummaryProps) {
  return (
    <div className="bg-card rounded-xl border border-border p-6 shadow-sm flex flex-col h-full justify-between">
      <div>
        <h3 className="font-heading font-semibold text-xl mb-4">Order Summary</h3>
        
        <div className="space-y-3 text-sm mb-6">
          <div className="flex justify-between">
            <span className="text-muted-foreground">Print Type</span>
            <span className="font-medium capitalize">{config.colorMode === 'bw' ? 'Black & White' : 'Color'}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">Sides</span>
            <span className="font-medium capitalize">{config.sides === 'single' ? 'Single Sided' : 'Double Sided'}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">Pages</span>
            <span className="font-medium">{breakdown?.pages || 0}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">Copies</span>
            <span className="font-medium">{config.copies}</span>
          </div>
        </div>

        <div className="border-t border-border pt-4">
          <div className="flex justify-between items-center mb-2">
            <span className="font-medium">Total Amount</span>
            {isLoading ? (
              <div className="h-8 w-24 bg-secondary animate-pulse rounded"></div>
            ) : (
              <span className="font-heading font-bold text-2xl text-brand-accent transition-all duration-300">
                {formatCurrency(breakdown?.total || 0)}
              </span>
            )}
          </div>
          <p className="text-xs text-muted-foreground text-right">Includes all taxes</p>
        </div>
      </div>

      <div className="mt-8">
        <Button 
          className="w-full h-12 text-lg font-semibold rounded-xl"
          onClick={onProceed}
          disabled={isLoading || !breakdown}
        >
          {isLoading && <Loader2 className="mr-2 h-5 w-5 animate-spin" />}
          Proceed to Pay
        </Button>
      </div>
    </div>
  );
}
