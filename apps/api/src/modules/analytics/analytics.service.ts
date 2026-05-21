import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../common/prisma/prisma.service';
import { startOfDay, endOfDay, subDays, format } from 'date-fns';
import { DateRange } from './dto/analytics-query.dto';

@Injectable()
export class AnalyticsService {
  constructor(private prisma: PrismaService) {}

  getDateRange(range: DateRange, from?: string, to?: string): { from: Date; to: Date } {
    const now = new Date();
    switch (range) {
      case DateRange.TODAY:
        return { from: startOfDay(now), to: endOfDay(now) };
      case DateRange.WEEK:
        return { from: startOfDay(subDays(now, 6)), to: endOfDay(now) };
      case DateRange.MONTH:
        return { from: startOfDay(subDays(now, 29)), to: endOfDay(now) };
      case DateRange.CUSTOM:
        return { from: startOfDay(new Date(from!)), to: endOfDay(new Date(to!)) };
    }
  }

  async getDailySummary(shopId: string, date: Date) {
    const start = startOfDay(date);
    const end = endOfDay(date);

    const orders = await this.prisma.printOrder.findMany({
      where: { shopId, createdAt: { gte: start, lte: end }, status: { in: ['COMPLETED', 'PRINTING'] } },
      include: { payment: true },
    });

    const totalRevenue = orders.reduce((sum, o) => sum + Number(o.totalAmount), 0);
    const totalOrders = orders.length;
    const bwOrders = orders.filter(o => (o.config as any).colorMode === 'bw').length;
    const colorOrders = orders.filter(o => (o.config as any).colorMode === 'color').length;
    const totalPages = orders.reduce((sum, o) => sum + (o.pageCount * (o.config as any).copies), 0);
    const avgOrderValue = totalOrders > 0 ? totalRevenue / totalOrders : 0;

    return { totalRevenue, totalOrders, bwOrders, colorOrders, totalPages, avgOrderValue, date: date.toISOString() };
  }

  async getRevenueTimeline(shopId: string, from: Date, to: Date) {
    const orders = await this.prisma.printOrder.findMany({
      where: {
        shopId,
        createdAt: { gte: startOfDay(from), lte: endOfDay(to) },
        status: { in: ['COMPLETED', 'PRINTING'] },
      },
      select: { totalAmount: true, createdAt: true },
    });

    const grouped: Record<string, number> = {};
    const cursor = new Date(from);
    while (cursor <= to) {
      grouped[format(cursor, 'yyyy-MM-dd')] = 0;
      cursor.setDate(cursor.getDate() + 1);
    }

    orders.forEach(order => {
      const key = format(order.createdAt, 'yyyy-MM-dd');
      if (grouped[key] !== undefined) grouped[key] += Number(order.totalAmount);
    });

    return Object.entries(grouped).map(([date, revenue]) => ({ date, revenue }));
  }

  async getOrdersByPrintType(shopId: string, from: Date, to: Date) {
    const orders = await this.prisma.printOrder.findMany({
      where: { shopId, createdAt: { gte: startOfDay(from), lte: endOfDay(to) } },
      select: { config: true, totalAmount: true },
    });

    const breakdown: Record<string, { count: number; revenue: number }> = {
      bwSingle: { count: 0, revenue: 0 },
      bwDuplex: { count: 0, revenue: 0 },
      colorSingle: { count: 0, revenue: 0 },
      colorDuplex: { count: 0, revenue: 0 },
    };

    orders.forEach(order => {
      const config = order.config as any;
      const key = `${config.colorMode === 'bw' ? 'bw' : 'color'}${config.sides === 'duplex' ? 'Duplex' : 'Single'}`;
      if (breakdown[key]) {
        breakdown[key].count++;
        breakdown[key].revenue += Number(order.totalAmount);
      }
    });

    return [
      { label: 'B&W Single', ...breakdown.bwSingle },
      { label: 'B&W Duplex', ...breakdown.bwDuplex },
      { label: 'Color Single', ...breakdown.colorSingle },
      { label: 'Color Duplex', ...breakdown.colorDuplex },
    ];
  }

  async getPeakHours(shopId: string, from: Date, to: Date) {
    const orders = await this.prisma.printOrder.findMany({
      where: { shopId, createdAt: { gte: startOfDay(from), lte: endOfDay(to) } },
      select: { createdAt: true },
    });

    const hours = Array.from({ length: 24 }, (_, i) => ({ hour: i, label: this.formatHour(i), orders: 0 }));
    orders.forEach(order => {
      const hour = new Date(order.createdAt).getHours();
      hours[hour].orders++;
    });

    return hours;
  }

  private formatHour(h: number): string {
    if (h === 0) return '12 AM';
    if (h < 12) return `${h} AM`;
    if (h === 12) return '12 PM';
    return `${h - 12} PM`;
  }

  async getTokenTurnaround(shopId: string, from: Date, to: Date) {
    const completed = await this.prisma.printOrder.findMany({
      where: {
        shopId,
        status: 'COMPLETED',
        createdAt: { gte: startOfDay(from), lte: endOfDay(to) },
      },
      select: { createdAt: true, updatedAt: true, tokenNumber: true },
    });

    if (completed.length === 0) return { avgMinutes: 0, totalCompleted: 0, fastest: 0, slowest: 0 };

    const durations = completed.map(o => {
      const ms = new Date(o.updatedAt).getTime() - new Date(o.createdAt).getTime();
      return Math.round(ms / 60000); // minutes
    });

    const avgMinutes = Math.round(durations.reduce((a, b) => a + b, 0) / durations.length);
    const fastest = Math.min(...durations);
    const slowest = Math.max(...durations);

    return { avgMinutes, totalCompleted: completed.length, fastest, slowest };
  }

  async getTopStats(shopId: string, from: Date, to: Date) {
    const [summary, turnaround] = await Promise.all([
      this.getDailySummary(shopId, new Date()),
      this.getTokenTurnaround(shopId, from, to),
    ]);

    const totalRevenuePeriod = await this.prisma.printOrder.aggregate({
      where: { shopId, createdAt: { gte: from, lte: to }, status: { in: ['COMPLETED', 'PRINTING'] } },
      _sum: { totalAmount: true },
      _count: { id: true },
    });

    return {
      todayRevenue: summary.totalRevenue,
      todayOrders: summary.totalOrders,
      periodRevenue: Number(totalRevenuePeriod._sum.totalAmount || 0),
      periodOrders: totalRevenuePeriod._count.id,
      avgTurnaroundMinutes: turnaround.avgMinutes,
      totalPagesProcessed: summary.totalPages,
    };
  }
}
