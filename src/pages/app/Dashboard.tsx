import { useState, useEffect, useMemo } from 'react';
import {
  Users,
  Bus,
  MapPin,
  Wallet as WalletIcon,
  TrendingUp,
  Calendar,
  Car,
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { ChartContainer, ChartTooltip, ChartTooltipContent } from '@/components/ui/chart';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, LineChart, Line, ResponsiveContainer } from 'recharts';
import { dashboardApi, DashboardStatsResponse } from '@/modules/dashboard/services/dashboardApi';
import { transactionApi } from '@/modules/transactions/services/transactionApi';
import { Transaction } from '@/types';
import { toast } from 'sonner';
import { toNumber } from '@/lib/utils';
import { format, subDays } from 'date-fns';

type DateRangePreset = '7' | '30' | 'custom';

function getDateRange(preset: DateRangePreset, customFrom?: string, customTo?: string) {
  const today = format(new Date(), 'yyyy-MM-dd');
  if (preset === '7') {
    return { date_from: format(subDays(new Date(), 7), 'yyyy-MM-dd'), date_to: today };
  }
  if (preset === '30') {
    return { date_from: format(subDays(new Date(), 30), 'yyyy-MM-dd'), date_to: today };
  }
  return {
    date_from: customFrom || format(subDays(new Date(), 30), 'yyyy-MM-dd'),
    date_to: customTo || today,
  };
}

const tripsChartConfig = { count: { label: 'Trips' } };
const revenueChartConfig = { amount: { label: 'Revenue' } };

export default function Dashboard() {
  const [preset, setPreset] = useState<DateRangePreset>('30');
  const [customFrom, setCustomFrom] = useState(format(subDays(new Date(), 30), 'yyyy-MM-dd'));
  const [customTo, setCustomTo] = useState(format(new Date(), 'yyyy-MM-dd'));
  const [stats, setStats] = useState<DashboardStatsResponse | null>(null);
  const [recentTransactions, setRecentTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(false);

  const { date_from, date_to } = useMemo(
    () => getDateRange(preset, customFrom, customTo),
    [preset, customFrom, customTo]
  );

  useEffect(() => {
    const fetch = async () => {
      setLoading(true);
      try {
        const [statsRes, txRes] = await Promise.all([
          dashboardApi.getStats({ date_from, date_to }),
          transactionApi.list({ date_from, date_to, per_page: 5 }),
        ]);
        setStats(statsRes);
        setRecentTransactions(txRes.results || []);
      } catch (error) {
        toast.error('Failed to load dashboard data');
        console.error(error);
      } finally {
        setLoading(false);
      }
    };
    fetch();
  }, [date_from, date_to]);

  const totals = stats?.totals;
  const period = stats?.period;
  const dailyTrips = stats?.daily_trips ?? [];
  const dailyRevenue = (stats?.daily_revenue ?? []).map((d) => ({ ...d, amount: Number(d.amount) }));

  const statCards = [
    {
      title: 'Total Users',
      value: totals?.users ?? 0,
      icon: <Users className="w-5 h-5" />,
      sub: `${totals?.drivers ?? 0} drivers`,
    },
    {
      title: 'Active Vehicles',
      value: totals?.active_vehicles ?? 0,
      icon: <Bus className="w-5 h-5" />,
      sub: `${totals?.total_vehicles ?? 0} total`,
    },
    {
      title: 'Places & Routes',
      value: `${totals?.places ?? 0} / ${totals?.routes ?? 0}`,
      icon: <MapPin className="w-5 h-5" />,
      sub: 'Places / Routes',
    },
    {
      title: 'Total Balance',
      value: `Rs. ${toNumber(totals?.total_balance, 0).toLocaleString()}`,
      icon: <WalletIcon className="w-5 h-5" />,
      sub: 'All wallets',
    },
    {
      title: 'Trips (period)',
      value: period?.trip_count ?? 0,
      icon: <Car className="w-5 h-5" />,
      sub: `${date_from} to ${date_to}`,
    },
    {
      title: 'Revenue (period)',
      value: `Rs. ${toNumber(period?.total_revenue, 0).toLocaleString()}`,
      icon: <TrendingUp className="w-5 h-5" />,
      sub: `Seat: Rs.${toNumber(period?.seat_revenue, 0)} + Ticket: Rs.${toNumber(period?.ticket_revenue, 0)}`,
    },
  ];

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Dashboard</h1>
          <p className="text-muted-foreground mt-1">Overview and analytics for your fleet.</p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Select value={preset} onValueChange={(v) => setPreset(v as DateRangePreset)}>
            <SelectTrigger className="w-[140px]">
              <Calendar className="w-4 h-4 mr-2" />
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="7">Last 7 days</SelectItem>
              <SelectItem value="30">Last 30 days</SelectItem>
              <SelectItem value="custom">Custom range</SelectItem>
            </SelectContent>
          </Select>
          {preset === 'custom' && (
            <>
              <div className="flex items-center gap-1">
                <Label className="text-xs whitespace-nowrap">From</Label>
                <Input
                  type="date"
                  value={customFrom}
                  onChange={(e) => setCustomFrom(e.target.value)}
                  className="w-[130px]"
                />
              </div>
              <div className="flex items-center gap-1">
                <Label className="text-xs whitespace-nowrap">To</Label>
                <Input
                  type="date"
                  value={customTo}
                  onChange={(e) => setCustomTo(e.target.value)}
                  className="w-[130px]"
                />
              </div>
            </>
          )}
        </div>
      </div>

      {loading ? (
        <div className="text-center py-12 text-muted-foreground">Loading dashboard...</div>
      ) : (
        <>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {statCards.map((stat, index) => (
              <Card key={index} className="stat-card hover:border-primary/20 transition-colors">
                <CardHeader className="flex flex-row items-center justify-between pb-2">
                  <CardTitle className="text-sm font-medium text-muted-foreground">{stat.title}</CardTitle>
                  <div className="p-2 rounded-lg bg-primary/10 text-primary">{stat.icon}</div>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{stat.value}</div>
                  <p className="text-xs mt-1 text-muted-foreground">{stat.sub}</p>
                </CardContent>
              </Card>
            ))}
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Trips per day</CardTitle>
                <p className="text-sm text-muted-foreground">Period: {date_from} to {date_to}</p>
              </CardHeader>
              <CardContent>
                {dailyTrips.length > 0 ? (
                  <ChartContainer config={tripsChartConfig} className="h-[240px] w-full">
                    <BarChart data={dailyTrips} margin={{ top: 5, right: 10, left: 10, bottom: 0 }}>
                      <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                      <XAxis dataKey="date" tickLine={false} />
                      <YAxis allowDecimals={false} tickLine={false} />
                      <ChartTooltip content={<ChartTooltipContent />} />
                      <Bar dataKey="count" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
                    </BarChart>
                  </ChartContainer>
                ) : (
                  <p className="text-muted-foreground text-sm py-8 text-center">No trips in this period.</p>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Revenue per day</CardTitle>
                <p className="text-sm text-muted-foreground">Period: {date_from} to {date_to}</p>
              </CardHeader>
              <CardContent>
                {dailyRevenue.length > 0 ? (
                  <ChartContainer config={revenueChartConfig} className="h-[240px] w-full">
                    <LineChart data={dailyRevenue} margin={{ top: 5, right: 10, left: 10, bottom: 0 }}>
                      <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                      <XAxis dataKey="date" tickLine={false} />
                      <YAxis tickLine={false} tickFormatter={(v) => `Rs.${Number(v).toLocaleString()}`} />
                      <ChartTooltip content={<ChartTooltipContent formatter={(v) => `Rs. ${Number(v).toLocaleString()}`} />} />
                      <Line type="monotone" dataKey="amount" stroke="hsl(var(--primary))" strokeWidth={2} dot={false} />
                    </LineChart>
                  </ChartContainer>
                ) : (
                  <p className="text-muted-foreground text-sm py-8 text-center">No revenue in this period.</p>
                )}
              </CardContent>
            </Card>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Driver overview</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex justify-between items-center">
                    <span className="text-muted-foreground">Total Drivers</span>
                    <span className="font-semibold">{totals?.drivers ?? 0}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-muted-foreground">Total Users</span>
                    <span className="font-semibold">{totals?.users ?? 0}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-muted-foreground">Bookings (period)</span>
                    <span className="font-semibold">{period?.seat_booking_count ?? 0}</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Recent activity</CardTitle>
                <p className="text-sm text-muted-foreground">Transactions in selected period</p>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {recentTransactions.length === 0 ? (
                    <p className="text-muted-foreground text-sm">No recent transactions.</p>
                  ) : (
                    recentTransactions.map((tx) => (
                      <div key={tx.id} className="flex justify-between items-center">
                        <div>
                          <p className="font-medium">{tx.remarks || 'Transaction'}</p>
                          <p className="text-sm text-muted-foreground">{tx.type === 'add' ? 'Credit' : 'Debit'}</p>
                        </div>
                        <span
                          className={`font-semibold ${tx.type === 'add' ? 'text-success' : 'text-destructive'}`}
                        >
                          {tx.type === 'add' ? '+' : '-'} Rs.{toNumber(tx.amount, 0).toLocaleString()}
                        </span>
                      </div>
                    ))
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
        </>
      )}
    </div>
  );
}
