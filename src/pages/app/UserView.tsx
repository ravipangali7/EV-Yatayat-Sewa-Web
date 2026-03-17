import { useState, useEffect, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Edit, Check, X, BarChart3, Calendar } from 'lucide-react';
import { PageHeader } from '@/components/common/PageHeader';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { StatusBadge } from '@/components/common/StatusBadge';
import { ChartContainer, ChartTooltip, ChartTooltipContent } from '@/components/ui/chart';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, LineChart, Line } from 'recharts';
import { userApi } from '@/modules/users/services/userApi';
import { User, UserAnalyticsResponse, AnalyticsDatePreset } from '@/types';
import { toast } from 'sonner';
import { toNumber } from '@/lib/utils';
import { format, subDays } from 'date-fns';

export default function UserView() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(false);

  const [analyticsPreset, setAnalyticsPreset] = useState<AnalyticsDatePreset>('last_month');
  const [analyticsCustomFrom, setAnalyticsCustomFrom] = useState(format(subDays(new Date(), 30), 'yyyy-MM-dd'));
  const [analyticsCustomTo, setAnalyticsCustomTo] = useState(format(new Date(), 'yyyy-MM-dd'));
  const [analyticsData, setAnalyticsData] = useState<UserAnalyticsResponse | null>(null);
  const [analyticsLoading, setAnalyticsLoading] = useState(false);

  const analyticsParams = useMemo(() => {
    if (analyticsPreset === 'custom') {
      return { preset: 'custom' as const, date_from: analyticsCustomFrom, date_to: analyticsCustomTo };
    }
    return { preset: analyticsPreset };
  }, [analyticsPreset, analyticsCustomFrom, analyticsCustomTo]);

  useEffect(() => {
    const fetchUser = async () => {
      if (!id) return;
      setLoading(true);
      try {
        const userData = await userApi.get(id);
        setUser(userData);
      } catch (error) {
        toast.error('Failed to load user');
        console.error(error);
      } finally {
        setLoading(false);
      }
    };
    fetchUser();
  }, [id]);

  useEffect(() => {
    const fetchAnalytics = async () => {
      if (!id) return;
      setAnalyticsLoading(true);
      try {
        const data = await userApi.getAnalytics(id, analyticsParams);
        setAnalyticsData(data);
      } catch (err) {
        toast.error('Failed to load user analytics');
        console.error(err);
      } finally {
        setAnalyticsLoading(false);
      }
    };
    fetchAnalytics();
  }, [id, analyticsParams]);

  if (loading) {
    return (
      <div className="text-center py-12">
        <p className="text-muted-foreground">Loading user...</p>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="text-center py-12">
        <p className="text-muted-foreground">User not found</p>
        <Button className="mt-4" onClick={() => navigate('/admin/users')}>
          Back to Users
        </Button>
      </div>
    );
  }

  const fields = [
    { label: 'Name', value: user.name },
    { label: 'Username', value: user.username },
    { label: 'Phone', value: user.phone },
    { label: 'Email', value: user.email },
    { label: 'Created At', value: new Date(user.created_at).toLocaleString() },
    { label: 'Updated At', value: new Date(user.updated_at).toLocaleString() },
  ];

  // Construct full media URL for profile picture
  const profilePictureUrl = user.profile_picture
    ? user.profile_picture.startsWith('http')
      ? user.profile_picture
      : `http://127.0.0.1:8000${user.profile_picture}`
    : null;

  return (
    <div>
      <PageHeader
        title="User Details"
        subtitle={user.name}
        backUrl="/admin/users"
        actions={
          <Button onClick={() => navigate(`/admin/users/${id}/edit`)}>
            <Edit className="w-4 h-4 mr-2" />
            Edit
          </Button>
        }
      />

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Basic Information</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Profile Picture */}
            <div className="flex flex-col items-center py-4 border-b border-border">
              <div className="relative">
                {profilePictureUrl ? (
                  <img
                    src={profilePictureUrl}
                    alt={`${user.name}'s profile`}
                    className="w-32 h-32 object-cover rounded-full border-4 border-border"
                  />
                ) : (
                  <div className="w-32 h-32 rounded-full border-4 border-border bg-muted flex items-center justify-center">
                    <span className="text-4xl font-semibold text-muted-foreground">
                      {user.name?.charAt(0)?.toUpperCase() || 'U'}
                    </span>
                  </div>
                )}
              </div>
              <p className="text-sm text-muted-foreground mt-2">Profile Picture</p>
            </div>
            
            {fields.map((field) => (
              <div key={field.label} className="flex justify-between items-center py-2 border-b border-border last:border-0">
                <span className="text-muted-foreground">{field.label}</span>
                <span className="font-medium">{field.value}</span>
              </div>
            ))}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Status & Permissions</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex justify-between items-center py-2 border-b border-border">
              <span className="text-muted-foreground">Status</span>
              <StatusBadge status={user.is_active ? 'active' : 'inactive'} />
            </div>
            <div className="flex justify-between items-center py-2 border-b border-border">
              <span className="text-muted-foreground">Is Driver</span>
              {user.is_driver ? <Check className="w-5 h-5 text-success" /> : <X className="w-5 h-5 text-muted-foreground" />}
            </div>
            <div className="flex justify-between items-center py-2 border-b border-border">
              <span className="text-muted-foreground">Is Staff</span>
              {user.is_staff ? <Check className="w-5 h-5 text-success" /> : <X className="w-5 h-5 text-muted-foreground" />}
            </div>
            <div className="flex justify-between items-center py-2 border-b border-border">
              <span className="text-muted-foreground">Super User</span>
              {user.is_superuser ? <Check className="w-5 h-5 text-success" /> : <X className="w-5 h-5 text-muted-foreground" />}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>License & Dealer</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex justify-between items-center py-2 border-b border-border">
              <span className="text-muted-foreground">License No</span>
              <span className="font-medium">{user.license_no || '—'}</span>
            </div>
            <div className="flex justify-between items-center py-2 border-b border-border">
              <span className="text-muted-foreground">License Type</span>
              <span className="font-medium">{user.license_type || '—'}</span>
            </div>
            <div className="flex justify-between items-center py-2 border-b border-border">
              <span className="text-muted-foreground">License Expiry</span>
              <span className="font-medium">{user.license_expiry_date ? new Date(user.license_expiry_date).toLocaleDateString() : '—'}</span>
            </div>
            {user.license_image && (
              <div className="flex justify-between items-center py-2 border-b border-border">
                <span className="text-muted-foreground">License Image</span>
                <img src={user.license_image.startsWith('http') ? user.license_image : `http://127.0.0.1:8000${user.license_image}`} alt="License" className="h-12 object-contain" />
              </div>
            )}
            <div className="flex justify-between items-center py-2 border-b border-border">
              <span className="text-muted-foreground">Ticket Dealer</span>
              {user.is_ticket_dealer ? <Check className="w-5 h-5 text-success" /> : <X className="w-5 h-5 text-muted-foreground" />}
            </div>
            <div className="flex justify-between items-center py-2 border-b border-border">
              <span className="text-muted-foreground">Ticket Commission</span>
              <span className="font-medium">{user.ticket_commission != null ? String(user.ticket_commission) : '—'}</span>
            </div>
          </CardContent>
        </Card>

        {/* Analytics */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <CardTitle className="flex items-center gap-2">
                <BarChart3 className="w-5 h-5" />
                Analytics
              </CardTitle>
              <div className="flex flex-wrap items-center gap-2">
                <Select value={analyticsPreset} onValueChange={(v) => setAnalyticsPreset(v as AnalyticsDatePreset)}>
                  <SelectTrigger className="w-[140px]">
                    <Calendar className="w-4 h-4 mr-2" />
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All time</SelectItem>
                    <SelectItem value="last_day">Last day</SelectItem>
                    <SelectItem value="last_week">Last week</SelectItem>
                    <SelectItem value="last_month">Last month</SelectItem>
                    <SelectItem value="custom">Custom range</SelectItem>
                  </SelectContent>
                </Select>
                {analyticsPreset === 'custom' && (
                  <>
                    <div className="flex items-center gap-1">
                      <Label className="text-xs whitespace-nowrap">From</Label>
                      <Input
                        type="date"
                        value={analyticsCustomFrom}
                        onChange={(e) => setAnalyticsCustomFrom(e.target.value)}
                        className="w-[130px]"
                      />
                    </div>
                    <div className="flex items-center gap-1">
                      <Label className="text-xs whitespace-nowrap">To</Label>
                      <Input
                        type="date"
                        value={analyticsCustomTo}
                        onChange={(e) => setAnalyticsCustomTo(e.target.value)}
                        className="w-[130px]"
                      />
                    </div>
                  </>
                )}
              </div>
            </div>
            {analyticsData && (
              <p className="text-sm text-muted-foreground">
                {analyticsData.date_from} to {analyticsData.date_to}
              </p>
            )}
          </CardHeader>
          <CardContent className="space-y-6">
            {analyticsLoading ? (
              <div className="text-center py-12 text-muted-foreground">Loading analytics...</div>
            ) : analyticsData ? (
              <>
                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4">
                  <Card>
                    <CardContent className="pt-4">
                      <p className="text-xs text-muted-foreground">Trips (as driver)</p>
                      <p className="text-lg font-semibold">{analyticsData.summary.trip_count_as_driver}</p>
                    </CardContent>
                  </Card>
                  <Card>
                    <CardContent className="pt-4">
                      <p className="text-xs text-muted-foreground">Seat revenue (driver)</p>
                      <p className="text-lg font-semibold">Rs. {toNumber(analyticsData.summary.total_seat_revenue_as_driver, 0).toLocaleString()}</p>
                    </CardContent>
                  </Card>
                  <Card>
                    <CardContent className="pt-4">
                      <p className="text-xs text-muted-foreground">Ticket revenue (driver)</p>
                      <p className="text-lg font-semibold">Rs. {toNumber(analyticsData.summary.total_ticket_revenue_as_driver, 0).toLocaleString()}</p>
                    </CardContent>
                  </Card>
                  <Card>
                    <CardContent className="pt-4">
                      <p className="text-xs text-muted-foreground">Bookings (passenger)</p>
                      <p className="text-lg font-semibold">{analyticsData.summary.seat_booking_count_as_passenger}</p>
                    </CardContent>
                  </Card>
                  <Card>
                    <CardContent className="pt-4">
                      <p className="text-xs text-muted-foreground">Spend (passenger)</p>
                      <p className="text-lg font-semibold">Rs. {toNumber(analyticsData.summary.total_spend_as_passenger, 0).toLocaleString()}</p>
                    </CardContent>
                  </Card>
                </div>

                {user.is_driver && analyticsData.as_driver.by_vehicle.length > 0 && (
                  <div>
                    <h4 className="text-sm font-medium mb-2">As driver — by vehicle</h4>
                    <div className="border rounded-md overflow-auto">
                      <table className="w-full text-sm">
                        <thead>
                          <tr className="border-b bg-muted/50">
                            <th className="text-left p-2">Vehicle</th>
                            <th className="text-right p-2">Trips</th>
                            <th className="text-right p-2">Seat revenue</th>
                          </tr>
                        </thead>
                        <tbody>
                          {analyticsData.as_driver.by_vehicle.map((v) => (
                            <tr key={v.vehicle_id} className="border-b">
                              <td className="p-2 font-medium">{v.vehicle_name}</td>
                              <td className="p-2 text-right">{v.trip_count}</td>
                              <td className="p-2 text-right">Rs. {toNumber(v.seat_revenue, 0).toLocaleString()}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}

                {user.is_driver && (analyticsData.as_driver.most_booked_by_side.length > 0 || analyticsData.as_driver.top_seats.length > 0) && (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {analyticsData.as_driver.most_booked_by_side.length > 0 && (
                      <div>
                        <h4 className="text-sm font-medium mb-2">Most booked seat type (by side, as driver)</h4>
                        <div className="space-y-2">
                          {analyticsData.as_driver.most_booked_by_side.map((row) => (
                            <div key={row.side} className="flex justify-between items-center p-2 rounded border">
                              <span className="font-medium">Side {row.side}</span>
                              <span>{row.booking_count} bookings, Rs. {toNumber(row.revenue, 0).toLocaleString()}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                    {analyticsData.as_driver.top_seats.length > 0 && (
                      <div>
                        <h4 className="text-sm font-medium mb-2">Top seats (as driver)</h4>
                        <div className="flex flex-wrap gap-2">
                          {analyticsData.as_driver.top_seats.map((s) => (
                            <span key={s.seat_label} className="text-sm px-2 py-1 rounded bg-muted">
                              {s.seat_label}: {s.booking_count} bookings, Rs.{toNumber(s.total_revenue, 0).toLocaleString()}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                )}

                {user.is_driver && (analyticsData.as_driver.daily_trips.length > 0 || analyticsData.as_driver.daily_revenue.length > 0) && (
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    <Card>
                      <CardHeader>
                        <CardTitle className="text-base">Daily trips (as driver)</CardTitle>
                      </CardHeader>
                      <CardContent>
                        {analyticsData.as_driver.daily_trips.length > 0 ? (
                          <ChartContainer config={{ count: { label: 'Trips' } }} className="h-[220px] w-full">
                            <BarChart data={analyticsData.as_driver.daily_trips} margin={{ top: 5, right: 10, left: 10, bottom: 0 }}>
                              <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                              <XAxis dataKey="date" tickLine={false} />
                              <YAxis allowDecimals={false} tickLine={false} />
                              <ChartTooltip content={<ChartTooltipContent />} />
                              <Bar dataKey="count" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
                            </BarChart>
                          </ChartContainer>
                        ) : (
                          <p className="text-muted-foreground text-sm py-6 text-center">No trips in period.</p>
                        )}
                      </CardContent>
                    </Card>
                    <Card>
                      <CardHeader>
                        <CardTitle className="text-base">Daily revenue (as driver)</CardTitle>
                      </CardHeader>
                      <CardContent>
                        {analyticsData.as_driver.daily_revenue.length > 0 ? (
                          <ChartContainer config={{ amount: { label: 'Revenue' } }} className="h-[220px] w-full">
                            <LineChart
                              data={analyticsData.as_driver.daily_revenue.map((d) => ({ ...d, amount: Number(d.amount) }))}
                              margin={{ top: 5, right: 10, left: 10, bottom: 0 }}
                            >
                              <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                              <XAxis dataKey="date" tickLine={false} />
                              <YAxis tickLine={false} tickFormatter={(v) => `Rs.${Number(v).toLocaleString()}`} />
                              <ChartTooltip content={<ChartTooltipContent formatter={(v) => `Rs. ${Number(v).toLocaleString()}`} />} />
                              <Line type="monotone" dataKey="amount" stroke="hsl(var(--primary))" strokeWidth={2} dot={false} />
                            </LineChart>
                          </ChartContainer>
                        ) : (
                          <p className="text-muted-foreground text-sm py-6 text-center">No revenue in period.</p>
                        )}
                      </CardContent>
                    </Card>
                  </div>
                )}

                {analyticsData.as_passenger.by_vehicle.length > 0 && (
                  <div>
                    <h4 className="text-sm font-medium mb-2">As passenger — by vehicle</h4>
                    <div className="border rounded-md overflow-auto">
                      <table className="w-full text-sm">
                        <thead>
                          <tr className="border-b bg-muted/50">
                            <th className="text-left p-2">Vehicle</th>
                            <th className="text-right p-2">Bookings</th>
                            <th className="text-right p-2">Total spend</th>
                          </tr>
                        </thead>
                        <tbody>
                          {analyticsData.as_passenger.by_vehicle.map((v) => (
                            <tr key={v.vehicle_id} className="border-b">
                              <td className="p-2 font-medium">{v.vehicle_name}</td>
                              <td className="p-2 text-right">{v.booking_count}</td>
                              <td className="p-2 text-right">Rs. {toNumber(v.total_spend, 0).toLocaleString()}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}
              </>
            ) : (
              <div className="text-center py-8 text-muted-foreground text-sm">Select a date range to view analytics.</div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
