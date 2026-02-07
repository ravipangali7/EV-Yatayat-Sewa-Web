import { useState, useEffect } from 'react';
import { Users, Bus, MapPin, Route as RouteIcon, Wallet as WalletIcon, TrendingUp } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { userApi } from '@/modules/users/services/userApi';
import { vehicleApi } from '@/modules/vehicles/services/vehicleApi';
import { placeApi } from '@/modules/places/services/placeApi';
import { routeApi } from '@/modules/routes/services/routeApi';
import { walletApi } from '@/modules/wallets/services/walletApi';
import { transactionApi } from '@/modules/transactions/services/transactionApi';
import { User, Vehicle, Place, Route, Wallet, Transaction } from '@/types';
import { toast } from 'sonner';
import { toNumber } from '@/lib/utils';

export default function Dashboard() {
  const [users, setUsers] = useState<User[]>([]);
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [places, setPlaces] = useState<Place[]>([]);
  const [routes, setRoutes] = useState<Route[]>([]);
  const [wallets, setWallets] = useState<Wallet[]>([]);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const fetchDashboardData = async () => {
      setLoading(true);
      try {
        const [usersRes, vehiclesRes, placesRes, routesRes, walletsRes, transactionsRes] = 
          await Promise.all([
            userApi.list({ per_page: 1000 }),
            vehicleApi.list({ per_page: 1000 }),
            placeApi.list({ per_page: 1000 }),
            routeApi.list({ per_page: 1000 }),
            walletApi.list({ per_page: 1000 }),
            transactionApi.list({ per_page: 1000 }),
          ]);
        
        setUsers(usersRes.results);
        setVehicles(vehiclesRes.results);
        setPlaces(placesRes.results);
        setRoutes(routesRes.results);
        setWallets(walletsRes.results);
        setTransactions(transactionsRes.results);
      } catch (error) {
        toast.error('Failed to load dashboard data');
        console.error(error);
      } finally {
        setLoading(false);
      }
    };
    fetchDashboardData();
  }, []);

  const totalBalance = wallets.reduce((sum, w) => sum + toNumber(w.balance, 0), 0);
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
      icon: <WalletIcon className="w-5 h-5" />,
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

  if (loading) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Dashboard</h1>
          <p className="text-muted-foreground mt-1">Welcome back! Here's an overview of your fleet.</p>
        </div>
        <div className="text-center py-12">
          <p className="text-muted-foreground">Loading dashboard data...</p>
        </div>
      </div>
    );
  }

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
                    {tx.type === 'add' ? '+' : '-'}${toNumber(tx.amount, 0)}
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
