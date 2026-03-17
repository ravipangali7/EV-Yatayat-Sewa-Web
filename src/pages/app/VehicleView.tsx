import { useState, useEffect, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Edit, QrCode, Calendar, BarChart3 } from 'lucide-react';
import { useGoogleMaps } from '@/contexts/GoogleMapsContext';
import { PageHeader } from '@/components/common/PageHeader';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { StatusBadge } from '@/components/common/StatusBadge';
import { Badge } from '@/components/ui/badge';
import { SeatLayoutVisualizer } from '@/components/vehicles/SeatLayoutVisualizer';
import { MiniMap } from '@/components/maps/MiniMap';
import { QRCodeDisplay } from '@/components/common/QRCodeDisplay';
import { ChartContainer, ChartTooltip, ChartTooltipContent } from '@/components/ui/chart';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, LineChart, Line } from 'recharts';
import { vehicleApi } from '@/modules/vehicles/services/vehicleApi';
import { userApi } from '@/modules/users/services/userApi';
import { routeApi } from '@/modules/routes/services/routeApi';
import { Vehicle, User, Route, VehicleSeat, VehicleImage, VehicleAnalyticsResponse, AnalyticsDatePreset } from '@/types';
import { toast } from 'sonner';
import { toNumber } from '@/lib/utils';
import { getDirectionsPath } from '@/lib/directions';
import { format, subDays } from 'date-fns';

interface MarkerData {
  lat: number;
  lng: number;
  label?: string;
  name?: string;
  code?: string;
  type?: 'start' | 'end' | 'stop';
  routeId?: string;
  routeName?: string;
  icon?: string;
}

// Color palette for routes
const routeColors = ['#4285F4', '#EA4335', '#34A853', '#FBBC04', '#9C27B0', '#FF5722', '#00BCD4'];

export default function VehicleView() {
  const { id } = useParams();
  const navigate = useNavigate();
  
  const [vehicle, setVehicle] = useState<Vehicle | null>(null);
  const [users, setUsers] = useState<User[]>([]);
  const [routes, setRoutes] = useState<Route[]>([]);
  const [seats, setSeats] = useState<VehicleSeat[]>([]);
  const [images, setImages] = useState<VehicleImage[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedMarker, setSelectedMarker] = useState<MarkerData | null>(null);
  const [selectedRoute, setSelectedRoute] = useState<Route | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isQRDialogOpen, setIsQRDialogOpen] = useState(false);

  // Analytics
  const [analyticsPreset, setAnalyticsPreset] = useState<AnalyticsDatePreset>('last_month');
  const [analyticsCustomFrom, setAnalyticsCustomFrom] = useState(format(subDays(new Date(), 30), 'yyyy-MM-dd'));
  const [analyticsCustomTo, setAnalyticsCustomTo] = useState(format(new Date(), 'yyyy-MM-dd'));
  const [analyticsData, setAnalyticsData] = useState<VehicleAnalyticsResponse | null>(null);
  const [analyticsLoading, setAnalyticsLoading] = useState(false);

  const analyticsParams = useMemo(() => {
    if (analyticsPreset === 'custom') {
      return { preset: 'custom' as const, date_from: analyticsCustomFrom, date_to: analyticsCustomTo };
    }
    return { preset: analyticsPreset };
  }, [analyticsPreset, analyticsCustomFrom, analyticsCustomTo]);

  useEffect(() => {
    const fetchAnalytics = async () => {
      if (!id) return;
      setAnalyticsLoading(true);
      try {
        const data = await vehicleApi.getAnalytics(id, analyticsParams);
        setAnalyticsData(data);
      } catch (err) {
        toast.error('Failed to load vehicle analytics');
        console.error(err);
      } finally {
        setAnalyticsLoading(false);
      }
    };
    fetchAnalytics();
  }, [id, analyticsParams]);

  useEffect(() => {
    const fetchData = async () => {
      if (!id) return;
      setLoading(true);
      try {
        const [vehicleData, usersResponse, routesResponse, seatsData, imagesData] = await Promise.all([
          vehicleApi.get(id),
          userApi.list({ per_page: 1000 }),
          routeApi.list({ per_page: 1000 }),
          vehicleApi.getSeats(id),
          vehicleApi.getImages(id),
        ]);
        setVehicle(vehicleData);
        setUsers(usersResponse.results);
        setRoutes(routesResponse.results);
        setSeats(seatsData);
        setImages(imagesData);
      } catch (error) {
        toast.error('Failed to load vehicle data');
        console.error(error);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [id]);

  const { isLoaded: isMapsLoaded } = useGoogleMaps();

  // Prepare map data for all routes (markers with icons, straight paths, waypoints per route)
  const mapData = useMemo(() => {
    if (!vehicle || !vehicle.routes || !Array.isArray(vehicle.routes)) {
      return { markers: [] as MarkerData[], polylines: [] as Array<{ path: Array<{ lat: number; lng: number }>; color: string; routeId: string; routeName: string }>, routeWaypoints: [] as Array<Array<{ lat: number; lng: number }>> };
    }

    const markers: MarkerData[] = [];
    const polylines: Array<{
      path: Array<{ lat: number; lng: number }>;
      color: string;
      routeId: string;
      routeName: string;
    }> = [];
    const routeWaypoints: Array<Array<{ lat: number; lng: number }>> = [];

    const vehicleRoutes = routes.filter((r) => vehicle.routes?.includes(r.id));

    vehicleRoutes.forEach((route, routeIndex) => {
      const routeColor = routeColors[routeIndex % routeColors.length];
      const polylinePath: Array<{ lat: number; lng: number }> = [];

      const isValidCoordinate = (lat: number, lng: number): boolean =>
        !(lat === 0 && lng === 0) && !isNaN(lat) && !isNaN(lng);

      if (route.start_point_details) {
        const lat = toNumber(route.start_point_details.latitude, 0);
        const lng = toNumber(route.start_point_details.longitude, 0);
        if (isValidCoordinate(lat, lng)) {
          markers.push({
            lat,
            lng,
            label: 'start',
            name: route.start_point_details.name,
            code: route.start_point_details.code,
            type: 'start',
            routeId: route.id,
            routeName: route.name,
            icon: '/start_point.png',
          });
          polylinePath.push({ lat, lng });
        }
      }

      if (route.stop_points && route.stop_points.length > 0) {
        const sortedStops = [...route.stop_points].sort((a, b) => (a.order || 0) - (b.order || 0));
        sortedStops.forEach((stop) => {
          if (stop.place_details) {
            const lat = toNumber(stop.place_details.latitude, 0);
            const lng = toNumber(stop.place_details.longitude, 0);
            if (isValidCoordinate(lat, lng)) {
              markers.push({
                lat,
                lng,
                label: 'stop',
                name: stop.place_details.name,
                code: stop.place_details.code,
                type: 'stop',
                routeId: route.id,
                routeName: route.name,
                icon: '/stop_point.png',
              });
              polylinePath.push({ lat, lng });
            }
          }
        });
      }

      if (route.end_point_details) {
        const lat = toNumber(route.end_point_details.latitude, 0);
        const lng = toNumber(route.end_point_details.longitude, 0);
        if (isValidCoordinate(lat, lng)) {
          markers.push({
            lat,
            lng,
            label: 'end',
            name: route.end_point_details.name,
            code: route.end_point_details.code,
            type: 'end',
            routeId: route.id,
            routeName: route.name,
            icon: '/end_point.png',
          });
          polylinePath.push({ lat, lng });
        }
      }

      if (polylinePath.length > 1) {
        polylines.push({
          path: polylinePath,
          color: routeColor,
          routeId: route.id,
          routeName: route.name,
        });
        routeWaypoints.push(polylinePath);
      }
    });

    return { markers, polylines, routeWaypoints };
  }, [vehicle, routes]);

  const [roadPaths, setRoadPaths] = useState<Array<Array<{ lat: number; lng: number }> | null>>([]);
  const routeWaypointsKey = useMemo(() => JSON.stringify(mapData.routeWaypoints), [mapData.routeWaypoints]);

  useEffect(() => {
    if (!isMapsLoaded || mapData.routeWaypoints.length === 0) {
      setRoadPaths([]);
      return;
    }
    let cancelled = false;
    const promises = mapData.routeWaypoints.map((waypoints) => getDirectionsPath(waypoints));
    Promise.all(promises).then((paths) => {
      if (!cancelled) setRoadPaths(paths.map((p) => p ?? null));
    });
    return () => { cancelled = true; };
  }, [isMapsLoaded, routeWaypointsKey, mapData.routeWaypoints]);

  const polylinesToShow = useMemo(() => {
    return mapData.polylines.map((p, i) => ({
      ...p,
      path: (roadPaths[i] != null && roadPaths[i]!.length >= 2) ? roadPaths[i]! : p.path,
    }));
  }, [mapData.polylines, roadPaths]);

  const handleMarkerClick = (marker: MarkerData) => {
    setSelectedMarker(marker);
    setSelectedRoute(routes.find(r => r.id === marker.routeId) || null);
    setIsDialogOpen(true);
  };

  const handlePolylineClick = (routeId: string, routeName: string) => {
    const route = routes.find(r => r.id === routeId);
    setSelectedRoute(route || null);
    setSelectedMarker(null);
    setIsDialogOpen(true);
  };

  const getTypeLabel = (type?: string) => {
    switch (type) {
      case 'start':
        return 'Start Point';
      case 'end':
        return 'End Point';
      case 'stop':
        return 'Stop Point';
      default:
        return 'Point';
    }
  };

  if (!vehicle) {
    return (
      <div className="text-center py-12">
        <p className="text-muted-foreground">Vehicle not found</p>
        <Button className="mt-4" onClick={() => navigate('/admin/vehicles')}>
          Back to Vehicles
        </Button>
      </div>
    );
  }

  const getDriverNames = () => {
    if (!vehicle.drivers || !Array.isArray(vehicle.drivers)) return [];
    return vehicle.drivers.map(dId => {
      const driver = users.find(u => u.id === dId);
      return driver?.name || driver?.username || 'Unknown';
    });
  };

  const getRouteNames = () => {
    if (!vehicle.routes || !Array.isArray(vehicle.routes)) return [];
    return vehicle.routes.map(rId => {
      const route = routes.find(r => r.id === rId);
      return route?.name || 'Unknown';
    });
  };

  const totalDrivers = vehicle.drivers && Array.isArray(vehicle.drivers) ? vehicle.drivers.length : 0;
  const totalRoutes = vehicle.routes && Array.isArray(vehicle.routes) ? vehicle.routes.length : 0;

  // Construct full media URL for featured image
  const featuredImageUrl = vehicle.featured_image
    ? vehicle.featured_image.startsWith('http')
      ? vehicle.featured_image
      : `http://127.0.0.1:8000${vehicle.featured_image}`
    : null;

  // Helper function to construct full media URL for images
  const getImageUrl = (imagePath: string): string => {
    if (!imagePath) return '';
    return imagePath.startsWith('http')
      ? imagePath
      : `http://127.0.0.1:8000${imagePath}`;
  };

  return (
    <div>
      <PageHeader
        title="Vehicle Details"
        subtitle={vehicle.name}
        backUrl="/admin/vehicles"
        actions={
          <>
            <Button
              variant="outline"
              onClick={() => setIsQRDialogOpen(true)}
              className="mr-2"
            >
              <QrCode className="w-4 h-4 mr-2" />
              QR Code
            </Button>
            <Button onClick={() => navigate(`/admin/vehicles/${id}/edit`)}>
              <Edit className="w-4 h-4 mr-2" />
              Edit
            </Button>
          </>
        }
      />

      {/* Featured Image */}
      {featuredImageUrl && (
        <Card className="mb-6">
          <CardContent className="p-0">
            <img
              src={featuredImageUrl}
              alt={vehicle.name}
              className="w-full h-64 object-cover rounded-lg"
            />
          </CardContent>
        </Card>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Basic Info */}
        <Card>
          <CardHeader>
            <CardTitle>Basic Information</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex justify-between items-center py-2 border-b border-border">
              <span className="text-muted-foreground">Name</span>
              <span className="font-medium">{vehicle.name}</span>
            </div>
            <div className="flex justify-between items-center py-2 border-b border-border">
              <span className="text-muted-foreground">Vehicle No</span>
              <span className="font-medium">{vehicle.vehicle_no}</span>
            </div>
            <div className="flex justify-between items-center py-2 border-b border-border">
              <span className="text-muted-foreground">Type</span>
              <span className="font-medium">{vehicle.vehicle_type}</span>
            </div>
            <div className="flex justify-between items-center py-2 border-b border-border">
              <span className="text-muted-foreground">IMEI</span>
              <span className="font-medium">{vehicle.imei || 'N/A'}</span>
            </div>
            <div className="flex justify-between items-center py-2 border-b border-border">
              <span className="text-muted-foreground">Odometer</span>
              <span className="font-medium">{toNumber(vehicle.odometer, 0).toLocaleString()} km</span>
            </div>
            <div className="flex justify-between items-center py-2 border-b border-border">
              <span className="text-muted-foreground">Overspeed Limit</span>
              <span className="font-medium">{toNumber(vehicle.overspeed_limit, 0)} km/h</span>
            </div>
            {vehicle.description && (
              <div className="flex justify-between items-start py-2 border-b border-border">
                <span className="text-muted-foreground">Description</span>
                <span className="font-medium text-right max-w-xs">{vehicle.description}</span>
              </div>
            )}
            <div className="flex justify-between items-center py-2">
              <span className="text-muted-foreground">Status</span>
              <StatusBadge status={vehicle.is_active ? 'active' : 'inactive'} />
            </div>
          </CardContent>
        </Card>

        {/* Drivers & Routes */}
        <Card>
          <CardHeader>
            <CardTitle>Drivers & Routes</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div>
              <div className="flex justify-between items-center mb-2">
                <h4 className="text-sm font-medium text-muted-foreground">Assigned Drivers</h4>
                <Badge variant="outline">{totalDrivers} Total</Badge>
              </div>
              <div className="flex flex-wrap gap-2">
                {getDriverNames().map((name, i) => (
                  <Badge key={i} variant="secondary">{name}</Badge>
                ))}
                {getDriverNames().length === 0 && (
                  <span className="text-muted-foreground text-sm">No drivers assigned</span>
                )}
              </div>
            </div>

            <div>
              <div className="flex justify-between items-center mb-2">
                <h4 className="text-sm font-medium text-muted-foreground">Assigned Routes</h4>
                <Badge variant="outline">{totalRoutes} Total</Badge>
              </div>
              <div className="flex flex-wrap gap-2">
                {getRouteNames().map((name, i) => (
                  <Badge key={i} variant="secondary">{name}</Badge>
                ))}
                {getRouteNames().length === 0 && (
                  <span className="text-muted-foreground text-sm">No routes assigned</span>
                )}
              </div>
            </div>

            {vehicle.active_driver && (
              <div className="flex justify-between items-center py-2 border-t border-border">
                <span className="text-muted-foreground">Active Driver</span>
                <Badge>{users.find(u => u.id === vehicle.active_driver)?.name || 'Unknown'}</Badge>
              </div>
            )}

            {vehicle.active_route && (
              <div className="flex justify-between items-center py-2">
                <span className="text-muted-foreground">Active Route</span>
                <Badge>{routes.find(r => r.id === vehicle.active_route)?.name || 'Unknown'}</Badge>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Seat Layout (from vehicle seat_layout JSON) */}
        {vehicle?.seat_layout?.length > 0 && seats.length > 0 && (
          <Card className="lg:col-span-2">
            <CardHeader>
              <CardTitle>Seat Layout</CardTitle>
            </CardHeader>
            <CardContent>
              <SeatLayoutVisualizer
                seatLayout={vehicle.seat_layout}
                seats={seats.map((s) => ({ side: s.side, number: s.number }))}
                bookedSeats={new Set(seats.filter((s) => s.status === 'booked').map((s) => `${s.side}${s.number}`))}
              />
            </CardContent>
          </Card>
        )}

        {/* Routes Map */}
        {polylinesToShow.length > 0 && (
          <Card className="lg:col-span-2">
            <CardHeader>
              <CardTitle>Routes Map</CardTitle>
            </CardHeader>
            <CardContent>
              <MiniMap
                markers={mapData.markers}
                polylines={polylinesToShow}
                height="500px"
                onMarkerClick={handleMarkerClick}
                onPolylineClick={handlePolylineClick}
              />
            </CardContent>
          </Card>
        )}


        {/* Images Gallery */}
        {images.length > 0 && (
          <Card className="lg:col-span-2">
            <CardHeader>
              <CardTitle>Vehicle Images Gallery</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {images.map((img) => (
                  <div key={img.id} className="space-y-3">
                    <img
                      src={getImageUrl(img.image)}
                      alt={img.title || 'Vehicle image'}
                      className="w-full h-48 object-cover rounded-lg border border-border"
                    />
                    {img.title && (
                      <h4 className="font-semibold text-base">{img.title}</h4>
                    )}
                    {img.description && (
                      <p className="text-sm text-muted-foreground">{img.description}</p>
                    )}
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

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
                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
                  <Card>
                    <CardContent className="pt-4">
                      <p className="text-xs text-muted-foreground">Seat revenue</p>
                      <p className="text-lg font-semibold">Rs. {toNumber(analyticsData.summary.total_seat_revenue, 0).toLocaleString()}</p>
                    </CardContent>
                  </Card>
                  <Card>
                    <CardContent className="pt-4">
                      <p className="text-xs text-muted-foreground">Ticket revenue</p>
                      <p className="text-lg font-semibold">Rs. {toNumber(analyticsData.summary.total_ticket_revenue, 0).toLocaleString()}</p>
                    </CardContent>
                  </Card>
                  <Card>
                    <CardContent className="pt-4">
                      <p className="text-xs text-muted-foreground">Total revenue</p>
                      <p className="text-lg font-semibold">Rs. {toNumber(analyticsData.summary.total_revenue, 0).toLocaleString()}</p>
                    </CardContent>
                  </Card>
                  <Card>
                    <CardContent className="pt-4">
                      <p className="text-xs text-muted-foreground">Trips</p>
                      <p className="text-lg font-semibold">{analyticsData.summary.trip_count}</p>
                    </CardContent>
                  </Card>
                  <Card>
                    <CardContent className="pt-4">
                      <p className="text-xs text-muted-foreground">Seat bookings</p>
                      <p className="text-lg font-semibold">{analyticsData.summary.seat_booking_count}</p>
                    </CardContent>
                  </Card>
                  <Card>
                    <CardContent className="pt-4">
                      <p className="text-xs text-muted-foreground">Ticket bookings</p>
                      <p className="text-lg font-semibold">{analyticsData.summary.ticket_booking_count}</p>
                    </CardContent>
                  </Card>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  <div>
                    <h4 className="text-sm font-medium mb-2">Revenue by seat</h4>
                    <div className="border rounded-md overflow-auto max-h-64">
                      <table className="w-full text-sm">
                        <thead>
                          <tr className="border-b bg-muted/50">
                            <th className="text-left p-2">Seat</th>
                            <th className="text-right p-2">Bookings</th>
                            <th className="text-right p-2">Revenue</th>
                          </tr>
                        </thead>
                        <tbody>
                          {analyticsData.by_seat
                            .filter((s) => s.booking_count > 0)
                            .map((s) => (
                              <tr key={s.seat_id} className="border-b">
                                <td className="p-2 font-medium">{s.seat_label}</td>
                                <td className="p-2 text-right">{s.booking_count}</td>
                                <td className="p-2 text-right">Rs. {toNumber(s.total_revenue, 0).toLocaleString()}</td>
                              </tr>
                            ))}
                        </tbody>
                      </table>
                      {analyticsData.by_seat.every((s) => s.booking_count === 0) && (
                        <p className="p-4 text-center text-muted-foreground text-sm">No seat bookings in period.</p>
                      )}
                    </div>
                  </div>
                  <div>
                    <h4 className="text-sm font-medium mb-2">Most booked by side (A/B/C)</h4>
                    {analyticsData.most_booked_by_side.length > 0 ? (
                      <div className="space-y-2">
                        {analyticsData.most_booked_by_side.map((row) => (
                          <div key={row.side} className="flex justify-between items-center p-2 rounded border">
                            <span className="font-medium">Side {row.side}</span>
                            <span>{row.booking_count} bookings, Rs. {toNumber(row.revenue, 0).toLocaleString()}</span>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className="text-muted-foreground text-sm">No data in period.</p>
                    )}
                    <h4 className="text-sm font-medium mt-4 mb-2">Top seats by revenue</h4>
                    {analyticsData.top_seats_by_revenue.length > 0 ? (
                      <div className="flex flex-wrap gap-2">
                        {analyticsData.top_seats_by_revenue.slice(0, 5).map((s) => (
                          <Badge key={s.seat_id} variant="secondary">
                            {s.seat_label}: Rs.{toNumber(s.total_revenue, 0).toLocaleString()}
                          </Badge>
                        ))}
                      </div>
                    ) : (
                      <p className="text-muted-foreground text-sm">No data in period.</p>
                    )}
                  </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-base">Daily trips</CardTitle>
                    </CardHeader>
                    <CardContent>
                      {analyticsData.daily_trips.length > 0 ? (
                        <ChartContainer config={{ count: { label: 'Trips' } }} className="h-[220px] w-full">
                          <BarChart data={analyticsData.daily_trips} margin={{ top: 5, right: 10, left: 10, bottom: 0 }}>
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
                      <CardTitle className="text-base">Daily revenue</CardTitle>
                    </CardHeader>
                    <CardContent>
                      {analyticsData.daily_revenue.length > 0 ? (
                        <ChartContainer config={{ amount: { label: 'Revenue' } }} className="h-[220px] w-full">
                          <LineChart
                            data={analyticsData.daily_revenue.map((d) => ({ ...d, amount: Number(d.amount) }))}
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

                {analyticsData.by_driver.length > 0 && (
                  <div>
                    <h4 className="text-sm font-medium mb-2">By driver</h4>
                    <div className="border rounded-md overflow-auto">
                      <table className="w-full text-sm">
                        <thead>
                          <tr className="border-b bg-muted/50">
                            <th className="text-left p-2">Driver</th>
                            <th className="text-right p-2">Trips</th>
                            <th className="text-right p-2">Seat revenue</th>
                          </tr>
                        </thead>
                        <tbody>
                          {analyticsData.by_driver.map((d) => (
                            <tr key={d.driver_id} className="border-b">
                              <td className="p-2 font-medium">{d.driver_name}</td>
                              <td className="p-2 text-right">{d.trip_count}</td>
                              <td className="p-2 text-right">Rs. {toNumber(d.seat_revenue, 0).toLocaleString()}</td>
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

      {/* Marker/Route Details Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {selectedMarker ? (selectedMarker.name || 'Place Details') : (selectedRoute?.name || 'Route Details')}
            </DialogTitle>
            <DialogDescription>
              {selectedMarker ? getTypeLabel(selectedMarker.type) : 'Route Information'}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            {selectedMarker ? (
              <>
                <div className="flex justify-between items-center">
                  <span className="text-muted-foreground">Type</span>
                  <span className="font-medium">{getTypeLabel(selectedMarker.type)}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-muted-foreground">Name</span>
                  <span className="font-medium">{selectedMarker.name || 'Unknown'}</span>
                </div>
                {selectedMarker.code && (
                  <div className="flex justify-between items-center">
                    <span className="text-muted-foreground">Code</span>
                    <span className="font-medium">{selectedMarker.code}</span>
                  </div>
                )}
                {selectedMarker.routeName && (
                  <div className="flex justify-between items-center">
                    <span className="text-muted-foreground">Route</span>
                    <span className="font-medium">{selectedMarker.routeName}</span>
                  </div>
                )}
              </>
            ) : selectedRoute ? (
              <>
                <div className="flex justify-between items-center">
                  <span className="text-muted-foreground">Route Name</span>
                  <span className="font-medium">{selectedRoute.name}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-muted-foreground">Start Point</span>
                  <span className="font-medium">
                    {selectedRoute.start_point_details?.name || 'Unknown'}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-muted-foreground">End Point</span>
                  <span className="font-medium">
                    {selectedRoute.end_point_details?.name || 'Unknown'}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-muted-foreground">Stop Points</span>
                  <span className="font-medium">
                    {selectedRoute.stop_points?.length || 0}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-muted-foreground">Bidirectional</span>
                  <span className="font-medium">
                    {selectedRoute.is_bidirectional ? 'Yes' : 'No'}
                  </span>
                </div>
              </>
            ) : null}
          </div>
        </DialogContent>
      </Dialog>

      {/* QR Code Dialog */}
      <Dialog open={isQRDialogOpen} onOpenChange={setIsQRDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Vehicle QR Code</DialogTitle>
            <DialogDescription>
              Scan this QR code to connect to this vehicle. The QR code contains the vehicle ID: {vehicle.id}
            </DialogDescription>
          </DialogHeader>
          <div className="py-4">
            <QRCodeDisplay value={vehicle.id} size={256} downloadable={true} />
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
