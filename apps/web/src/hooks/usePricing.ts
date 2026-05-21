import { useState } from 'react';
import { pricingService } from '@/services/pricingService';
import { PrintConfig } from '@/types/order';

export const usePricing = () => {
  const [total, setTotal] = useState(0);
  const [breakdown, setBreakdown] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const calculatePrice = async (shopId: string, config: PrintConfig, pageCount: number) => {
    setIsLoading(true);
    setError(null);
    try {
      // Mocking the price calculation since there's no real backend yet for immediate feedback
      // Actually we should call the API:
      // const response = await pricingService.calculatePrice(shopId, config, pageCount);
      // setTotal(response.data.total);
      // setBreakdown(response.data.breakdown);

      // Using mock for smooth UI dev experience
      setTimeout(() => {
        const pricePerPage = config.colorMode === 'color' ? 10 : 2;
        const multiplier = config.sides === 'duplex' ? 1.8 : 1; // Slight discount for duplex
        const subtotal = pageCount * pricePerPage * multiplier * config.copies;
        setBreakdown({
          pricePerPage,
          pages: pageCount,
          copies: config.copies,
          subtotal,
          total: subtotal
        });
        setTotal(subtotal);
        setIsLoading(false);
      }, 500);
      
    } catch (err: any) {
      setError('Failed to calculate price');
      setIsLoading(false);
    }
  };

  return { total, breakdown, isLoading, error, calculatePrice };
};
