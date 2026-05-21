import api from './api';

export type DateRange = 'today' | 'week' | 'month' | 'custom';

export interface TopStats {
  todayRevenue: number;
  todayOrders: number;
  periodRevenue: number;
  periodOrders: number;
  avgTurnaroundMinutes: number;
  totalPagesProcessed: number;
}

export interface RevenuePoint { date: string; revenue: number; }
export interface PrintTypeBreakdown { label: string; count: number; revenue: number; }
export interface HourData { hour: number; label: string; orders: number; }
export interface TurnaroundData { avgMinutes: number; totalCompleted: number; fastest: number; slowest: number; }

const params = (range: DateRange, from?: string, to?: string) =>
  ({ range, ...(from && { from }), ...(to && { to }) });

export const analyticsService = {
  getStats: (range: DateRange, from?: string, to?: string) =>
    api.get<any, { data: TopStats }>('/analytics/stats', { params: params(range, from, to) }),

  getRevenue: (range: DateRange, from?: string, to?: string) =>
    api.get<any, { data: RevenuePoint[] }>('/analytics/revenue', { params: params(range, from, to) }),

  getPrintTypes: (range: DateRange, from?: string, to?: string) =>
    api.get<any, { data: PrintTypeBreakdown[] }>('/analytics/print-types', { params: params(range, from, to) }),

  getPeakHours: (range: DateRange, from?: string, to?: string) =>
    api.get<any, { data: HourData[] }>('/analytics/peak-hours', { params: params(range, from, to) }),

  getTurnaround: (range: DateRange, from?: string, to?: string) =>
    api.get<any, { data: TurnaroundData }>('/analytics/turnaround', { params: params(range, from, to) }),
};
