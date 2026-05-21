import api from './api';
import { PrintConfig } from '@/types/order';

interface PriceBreakdown {
  pricePerPage: number;
  pages: number;
  copies: number;
  subtotal: number;
  total: number;
}

export const pricingService = {
  calculatePrice: (shopId: string, config: PrintConfig, pageCount: number) =>
    api.post<{ total: number; breakdown: PriceBreakdown }>('/pricing/calculate', {
      shopId, config, pageCount,
    }),
};
