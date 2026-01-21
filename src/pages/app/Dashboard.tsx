import { Users, Bus, MapPin, Route as RouteIcon, Wallet, TrendingUp } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { getUsers, getVehicles, getPlaces, getRoutes, getWallets, getTransactions } from '@/stores/mockData';

export default function Dashboard() {
  const users = getUsers();
  const vehicles = getVehicles();
  const places = getPlaces();
  const routes = getRoutes();
  const wallets = getWallets();
  const transactions = getTransactions();

  const totalBalance = wallets.reduce((sum, w) => sum + w.balance, 0);
  const activeVehicles = vehicles.filter(v => v.is_active).length;
  const drivers = users.filter(u => u.is_driver).length;

  const stats = [
    {
      title: 'Total Users',
      value: users.length,
      icon: <Users className="w-5 h-5" />,
      change: '+12%',
      changeType: 'positive' as const,
    },
    {
      title: 'Active Vehicles',
      value: activeVehicles,
      icon: <Bus className="w-5 h-5" />,
      change: `${vehicles.length} total`,
      changeType: 'neutral' as const,
    },
    {
      title: 'Total Places',
      value: places.length,
      icon: <MapPin className="w-5 h-5" />,
      change: '+3 new',
      changeType: 'positive' as const,
    },
    {
      title: 'Active Routes',
      value: routes.length,
      icon: <RouteIcon className="w-5 h-5" />,
      change: '2 bidirectional',
      changeType: 'neutral' as const,
    },
    {
      title: 'Total Balance',
      value: `$${totalBalance.toLocaleString()}`,
      icon: <Wallet className="w-5 h-5" />,
      change: '+8.2%',
      changeType: 'positive' as const,
    },
    {
      title: 'Transactions',
      value: transactions.length,
      icon: <TrendingUp className="w-5 h-5" />,
      change: 'This month',
      changeType: 'neutral' as const,
    },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Dashboard</h1>
        <p className="text-muted-foreground mt-1">Welcome back! Here's an overview of your fleet.</p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {stats.map((stat, index) => (
          <Card key={index} className="stat-card hover:border-primary/20 transition-colors">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                {stat.title}
              </CardTitle>
              <div className="p-2 rounded-lg bg-primary/10 text-primary">
                {stat.icon}
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stat.value}</div>
              <p className={`text-xs mt-1 ${
                stat.changeType === 'positive' ? 'text-success' : 'text-muted-foreground'
              }`}>
                {stat.change}
              </p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Driver Overview</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <span className="text-muted-foreground">Total Drivers</span>
                <span className="font-semibold">{drivers}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-muted-foreground">Active Staff</span>
                <span className="font-semibold">{users.filter(u => u.is_active && u.is_staff).length}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-muted-foreground">Super Users</span>
                <span className="font-semibold">{users.filter(u => u.is_superuser).length}</span>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Recent Activity</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {transactions.slice(0, 3).map((tx) => (
                <div key={tx.id} className="flex justify-between items-center">
                  <div>
                    <p className="font-medium">{tx.remarks || 'Transaction'}</p>
                    <p className="text-sm text-muted-foreground">{tx.type === 'add' ? 'Credit' : 'Debit'}</p>
                  </div>
                  <span className={`font-semibold ${tx.type === 'add' ? 'text-success' : 'text-destructive'}`}>
                    {tx.type === 'add' ? '+' : '-'}${tx.amount}
                  </span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
