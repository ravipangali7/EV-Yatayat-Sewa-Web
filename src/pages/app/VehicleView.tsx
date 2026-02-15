import { useState, useEffect, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Edit, QrCode } from 'lucide-react';
import { useJsApiLoader } from '@react-google-maps/api';
import { PageHeader } from '@/components/common/PageHeader';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { StatusBadge } from '@/components/common/StatusBadge';
import { Badge } from '@/components/ui/badge';
import { SeatLayoutVisualizer } from '@/components/vehicles/SeatLayoutVisualizer';
import { MiniMap } from '@/components/maps/MiniMap';
import { QRCodeDisplay } from '@/components/common/QRCodeDisplay';
import { vehicleApi } from '@/modules/vehicles/services/vehicleApi';
import { userApi } from '@/modules/users/services/userApi';
import { routeApi } from '@/modules/routes/services/routeApi';
import { Vehicle, User, Route, VehicleSeat, VehicleImage } from '@/types';
import { toast } from 'sonner';
import { toNumber } from '@/lib/utils';
import { getDirectionsPath } from '@/lib/directions';
import { GOOGLE_MAPS_API_KEY } from '@/config/maps';

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

  const { isLoaded: isMapsLoaded } = useJsApiLoader({
    id: 'google-mini-map-script',
    googleMapsApiKey: GOOGLE_MAPS_API_KEY,
    libraries: ['places', 'geometry'],
  });

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
