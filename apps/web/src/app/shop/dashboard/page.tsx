'use client';
import { useState, useEffect } from 'react';
import { LineChart, Line, BarChart, Bar, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { analyticsService, DateRange, TopStats, RevenuePoint, PrintTypeBreakdown, HourData, TurnaroundData } from '@/services/analyticsService';
import { useAuthStore } from '@/store/authStore';

const DONUT_COLORS = ['#1a1a2e', '#e94560', '#16213e', '#0f3460'];

const ranges: { label: string; value: DateRange }[] = [
  { label: 'Today', value: 'today' },
  { label: 'This Week', value: 'week' },
  { label: 'This Month', value: 'month' },
];

function StatCard({ label, value, sub }: { label: string; value: string; sub?: string }) {
  return (
    <div className="bg-card border border-border rounded-xl p-4">
      <p className="text-xs text-muted-foreground mb-1">{label}</p>
      <p className="text-2xl font-semibold">{value}</p>
      {sub && <p className="text-xs text-muted-foreground mt-1">{sub}</p>}
    </div>
  );
}

export default function AnalyticsDashboard() {
  const { user } = useAuthStore();
  const [range, setRange] = useState<DateRange>('today');
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState<TopStats | null>(null);
  const [revenue, setRevenue] = useState<RevenuePoint[]>([]);
  const [printTypes, setPrintTypes] = useState<PrintTypeBreakdown[]>([]);
  const [peakHours, setPeakHours] = useState<HourData[]>([]);
  const [turnaround, setTurnaround] = useState<TurnaroundData | null>(null);

  const fetchAll = async () => {
    setLoading(true);
    try {
      const [statsRes, revenueRes, typesRes, hoursRes, turnRes] = await Promise.all([
        analyticsService.getStats(range),
        analyticsService.getRevenue(range),
        analyticsService.getPrintTypes(range),
        analyticsService.getPeakHours(range),
        analyticsService.getTurnaround(range),
      ]);
      setStats(statsRes.data);
      setRevenue(revenueRes.data);
      setPrintTypes(typesRes.data);
      setPeakHours(hoursRes.data);
      setTurnaround(turnRes.data);
    } catch (err) {
      console.error('Failed to fetch analytics', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { 
    if (user?.shopId) fetchAll(); 
  }, [range, user?.shopId]);

  const formatCurrency = (n: number) => `₹${n.toLocaleString('en-IN', { maximumFractionDigits: 0 })}`;

  const businessHours = peakHours.filter(h => h.hour >= 7 && h.hour <= 23);

  const revenueFormatted = revenue.map(r => ({
    ...r,
    date: range === 'today'
      ? r.date
      : new Date(r.date).toLocaleDateString('en-IN', { month: 'short', day: 'numeric' }),
    revenue: Number(r.revenue.toFixed(0)),
  }));

  return (
    <div className="min-h-screen bg-background p-6">
      <div className="max-w-7xl mx-auto space-y-6">

        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-semibold">Analytics</h1>
            <p className="text-sm text-muted-foreground mt-0.5">Track your shop's performance</p>
          </div>
          <div className="flex gap-2">
            {ranges.map(r => (
              <button
                key={r.value}
                onClick={() => setRange(r.value)}
                className={`px-4 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                  range === r.value
                    ? 'bg-primary text-primary-foreground'
                    : 'border border-border hover:bg-muted'
                }`}
              >
                {r.label}
              </button>
            ))}
          </div>
        </div>

        {/* KPI Cards */}
        {loading ? (
          <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
            {Array(5).fill(0).map((_, i) => (
              <div key={i} className="bg-card border border-border rounded-xl p-4 h-24 animate-pulse bg-muted" />
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
            <StatCard label="Today's Revenue" value={formatCurrency(stats?.todayRevenue || 0)} sub={`${stats?.todayOrders || 0} orders`} />
            <StatCard label="Period Revenue" value={formatCurrency(stats?.periodRevenue || 0)} />
            <StatCard label="Total Orders" value={String(stats?.periodOrders || 0)} />
            <StatCard label="Avg Turnaround" value={`${stats?.avgTurnaroundMinutes || 0} min`} sub="per order" />
            <StatCard label="Pages Processed" value={String(stats?.totalPagesProcessed || 0)} />
          </div>
        )}

        {/* Revenue Chart */}
        <div className="bg-card border border-border rounded-xl p-6">
          <h2 className="text-sm font-medium mb-4">Revenue Over Time</h2>
          {loading ? (
            <div className="h-48 animate-pulse bg-muted rounded-lg" />
          ) : (
            <ResponsiveContainer width="100%" height={200}>
              <LineChart data={revenueFormatted} margin={{ top: 5, right: 20, left: 0, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" strokeOpacity={0.5} />
                <XAxis dataKey="date" tick={{ fontSize: 11, fill: 'var(--muted-foreground)' }} />
                <YAxis tick={{ fontSize: 11, fill: 'var(--muted-foreground)' }} tickFormatter={v => `₹${v}`} />
                <Tooltip formatter={(v: any) => [`₹${v}`, 'Revenue']} />
                <Line type="monotone" dataKey="revenue" stroke="#e94560" strokeWidth={2} dot={false} activeDot={{ r: 4 }} />
              </LineChart>
            </ResponsiveContainer>
          )}
        </div>

        {/* Print Types + Peak Hours */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Donut Chart — Print Types */}
          <div className="bg-card border border-border rounded-xl p-6">
            <h2 className="text-sm font-medium mb-4">Orders by Print Type</h2>
            {loading ? (
              <div className="h-48 animate-pulse bg-muted rounded-lg" />
            ) : (
              <div className="flex items-center gap-4">
                <ResponsiveContainer width="50%" height={180}>
                  <PieChart>
                    <Pie
                      data={printTypes.filter(t => t.count > 0)}
                      dataKey="count"
                      nameKey="label"
                      cx="50%" cy="50%"
                      innerRadius={50} outerRadius={80}
                    >
                      {printTypes.map((_, i) => (
                        <Cell key={i} fill={DONUT_COLORS[i % DONUT_COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip formatter={(v: any, name: any) => [v, name]} />
                  </PieChart>
                </ResponsiveContainer>
                <div className="flex-1 space-y-2">
                  {printTypes.map((t, i) => (
                    <div key={t.label} className="flex items-center justify-between text-sm">
                      <div className="flex items-center gap-2">
                        <span className="w-2.5 h-2.5 rounded-full" style={{ background: DONUT_COLORS[i % DONUT_COLORS.length] }} />
                        <span className="text-muted-foreground">{t.label}</span>
                      </div>
                      <div className="text-right">
                        <span className="font-medium">{t.count}</span>
                        <span className="text-muted-foreground ml-1 text-xs">{formatCurrency(t.revenue)}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Bar Chart — Peak Hours */}
          <div className="bg-card border border-border rounded-xl p-6">
            <h2 className="text-sm font-medium mb-4">Peak Hours</h2>
            {loading ? (
              <div className="h-48 animate-pulse bg-muted rounded-lg" />
            ) : (
              <ResponsiveContainer width="100%" height={180}>
                <BarChart data={businessHours} margin={{ top: 5, right: 10, left: -20, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" strokeOpacity={0.5} />
                  <XAxis
                    dataKey="label"
                    tick={{ fontSize: 10, fill: 'var(--muted-foreground)' }}
                    interval={2}
                  />
                  <YAxis tick={{ fontSize: 10, fill: 'var(--muted-foreground)' }} allowDecimals={false} />
                  <Tooltip formatter={(v: any) => [v, 'Orders']} />
                  <Bar dataKey="orders" fill="#e94560" radius={[3, 3, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>

        {/* Turnaround Stats */}
        {!loading && turnaround && (
          <div className="bg-card border border-border rounded-xl p-6">
            <h2 className="text-sm font-medium mb-4">Order Turnaround Time</h2>
            <div className="grid grid-cols-3 gap-6 text-center">
              <div>
                <p className="text-3xl font-semibold">{turnaround.avgMinutes}<span className="text-base font-normal text-muted-foreground ml-1">min</span></p>
                <p className="text-xs text-muted-foreground mt-1">Average</p>
              </div>
              <div>
                <p className="text-3xl font-semibold text-green-600">{turnaround.fastest}<span className="text-base font-normal text-muted-foreground ml-1">min</span></p>
                <p className="text-xs text-muted-foreground mt-1">Fastest</p>
              </div>
              <div>
                <p className="text-3xl font-semibold text-red-500">{turnaround.slowest}<span className="text-base font-normal text-muted-foreground ml-1">min</span></p>
                <p className="text-xs text-muted-foreground mt-1">Slowest</p>
              </div>
            </div>
            <div className="mt-4 pt-4 border-t border-border text-center">
              <p className="text-sm text-muted-foreground">{turnaround.totalCompleted} orders completed in selected period</p>
            </div>
          </div>
        )}

      </div>
    </div>
  );
}
