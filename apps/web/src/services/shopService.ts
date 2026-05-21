import api from './api';

export const shopService = {
  getShop: (shopId: string) => api.get<any, { data: any }>(`/shops/${shopId}`),
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
