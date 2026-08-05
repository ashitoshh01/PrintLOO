import api from './api';
import { Shop } from '@/types/shop';

export const shopService = {
  getNearbyShops: (lat?: number, lng?: number, radius: number = 2) => {
    const params = new URLSearchParams();
    if (lat !== undefined && lat !== null) params.append('lat', lat.toString());
    if (lng !== undefined && lng !== null) params.append('lng', lng.toString());
    if (radius !== undefined && radius !== null) params.append('radius', radius.toString());
    const queryStr = params.toString() ? `?${params.toString()}` : '';
    return api.get<any, { data: Shop[] }>(`/shops/nearby${queryStr}`);
  },

  searchShops: (q: string, lat?: number, lng?: number, radius: number = 2) => {
    const params = new URLSearchParams();
    if (q) params.append('q', q);
    if (lat !== undefined && lat !== null) params.append('lat', lat.toString());
    if (lng !== undefined && lng !== null) params.append('lng', lng.toString());
    if (radius !== undefined && radius !== null) params.append('radius', radius.toString());
    const queryStr = params.toString() ? `?${params.toString()}` : '';
    return api.get<any, { data: Shop[] }>(`/shops/search${queryStr}`);
  },

  getShop: (shopId: string) => api.get<any, { data: Shop }>(`/shops/${shopId}`),
  updateShop: (shopId: string, data: any) => api.patch<any, { data: any }>(`/shops/${shopId}`, data),
  getPricingRules: (shopId: string) => api.get<any, { data: any[] }>(`/shops/${shopId}/pricing`),
  updatePricingRules: (shopId: string, rules: any[]) => api.put<any, { data: any[] }>(`/shops/${shopId}/pricing`, { rules }),
  getPrinters: (shopId: string) => api.get<any, { data: any[] }>(`/shops/${shopId}/printers`),
  addPrinter: (shopId: string, data: any) => api.post<any, { data: any }>(`/shops/${shopId}/printers`, data),
  updatePrinter: (shopId: string, printerId: string, data: any) =>
    api.patch<any, { data: any }>(`/shops/${shopId}/printers/${printerId}`, data),
  deletePrinter: (shopId: string, printerId: string) =>
    api.delete<any, { data: any }>(`/shops/${shopId}/printers/${printerId}`),
};
