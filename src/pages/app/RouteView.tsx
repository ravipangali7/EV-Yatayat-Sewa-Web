import { useState, useEffect, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Edit, Check, X } from 'lucide-react';
import { useJsApiLoader } from '@react-google-maps/api';
import { PageHeader } from '@/components/common/PageHeader';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { MiniMap } from '@/components/maps/MiniMap';
import { routeApi } from '@/modules/routes/services/routeApi';
import { Route } from '@/types';
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
  icon?: string;
}

export default function RouteView() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [route, setRoute] = useState<Route | null>(null);
  const [loading, setLoading] = useState(false);
  const [selectedMarker, setSelectedMarker] = useState<MarkerData | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  useEffect(() => {
    const fetchRoute = async () => {
      if (!id) return;
      setLoading(true);
      try {
        const routeData = await routeApi.get(id);
        setRoute(routeData);
      } catch (error) {
        toast.error('Failed to load route');
        console.error(error);
      } finally {
        setLoading(false);
      }
    };
    fetchRoute();
  }, [id]);

  const { isLoaded: isMapsLoaded } = useJsApiLoader({
    id: 'google-mini-map-script',
    googleMapsApiKey: GOOGLE_MAPS_API_KEY,
    libraries: ['places', 'geometry'],
  });

  // Prepare map data (markers with icons, straight path, waypoints for directions)
  const mapData = useMemo(() => {
    if (!route) return { markers: [] as MarkerData[], polylines: [] as Array<Array<{ lat: number; lng: number }>>, waypoints: [] as Array<{ lat: number; lng: number }> };

    const markers: MarkerData[] = [];
    const polylinePath: Array<{ lat: number; lng: number }> = [];

    if (route.start_point_details) {
      const lat = toNumber(route.start_point_details.latitude, 0);
      const lng = toNumber(route.start_point_details.longitude, 0);
      markers.push({
        lat,
        lng,
        label: 'start',
        name: route.start_point_details.name,
        code: route.start_point_details.code,
        type: 'start',
        icon: '/start_point.png',
      });
      polylinePath.push({ lat, lng });
    }

    if (route.stop_points && route.stop_points.length > 0) {
      const sortedStops = [...route.stop_points].sort((a, b) => (a.order || 0) - (b.order || 0));
      sortedStops.forEach((stop) => {
        if (stop.place_details) {
          const lat = toNumber(stop.place_details.latitude, 0);
          const lng = toNumber(stop.place_details.longitude, 0);
          markers.push({
            lat,
            lng,
            label: 'stop',
            name: stop.place_details.name,
            code: stop.place_details.code,
            type: 'stop',
            icon: '/stop_point.png',
          });
          polylinePath.push({ lat, lng });
        }
      });
    }

    if (route.end_point_details) {
      const lat = toNumber(route.end_point_details.latitude, 0);
      const lng = toNumber(route.end_point_details.longitude, 0);
      markers.push({
        lat,
        lng,
        label: 'end',
        name: route.end_point_details.name,
        code: route.end_point_details.code,
        type: 'end',
        icon: '/end_point.png',
      });
      polylinePath.push({ lat, lng });
    }

    return {
      markers,
      polylines: polylinePath.length > 1 ? [polylinePath] : [],
      waypoints: polylinePath,
    };
  }, [route]);

  const [roadPath, setRoadPath] = useState<Array<{ lat: number; lng: number }> | null>(null);
  const waypointsKey = useMemo(() => JSON.stringify(mapData.waypoints), [mapData.waypoints]);

  useEffect(() => {
    if (!isMapsLoaded || mapData.waypoints.length < 2) {
      setRoadPath(null);
      return;
    }
    let cancelled = false;
    getDirectionsPath(mapData.waypoints).then((path) => {
      if (!cancelled) setRoadPath(path);
    });
    return () => { cancelled = true; };
  }, [isMapsLoaded, waypointsKey, mapData.waypoints]);

  const polylinesToShow = useMemo(() => {
    const path = roadPath && roadPath.length >= 2 ? roadPath : (mapData.polylines[0] ?? []);
    return path.length >= 2 ? [path] : [];
  }, [roadPath, mapData.polylines]);

  const handleMarkerClick = (marker: MarkerData) => {
    setSelectedMarker(marker);
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

  if (loading) {
    return (
      <div className="text-center py-12">
        <p className="text-muted-foreground">Loading route...</p>
      </div>
    );
  }

  if (!route) {
    return (
      <div className="text-center py-12">
        <p className="text-muted-foreground">Route not found</p>
        <Button className="mt-4" onClick={() => navigate('/admin/routes')}>
          Back to Routes
        </Button>
      </div>
    );
  }

  const sortedStopPoints = route.stop_points
    ? [...route.stop_points].sort((a, b) => (a.order || 0) - (b.order || 0))
    : [];

  return (
    <div>
      <PageHeader
        title="Route Details"
        subtitle={route.name}
        backUrl="/admin/routes"
        actions={
          <Button onClick={() => navigate(`/admin/routes/${id}/edit`)}>
            <Edit className="w-4 h-4 mr-2" />
            Edit
          </Button>
        }
      />

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Route Information */}
        <Card>
          <CardHeader>
            <CardTitle>Route Information</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex justify-between items-center py-2 border-b border-border">
              <span className="text-muted-foreground">Name</span>
              <span className="font-medium">{route.name}</span>
            </div>
            <div className="flex justify-between items-center py-2 border-b border-border">
              <span className="text-muted-foreground">Bidirectional</span>
              {route.is_bidirectional ? (
                <Check className="w-5 h-5 text-success" />
              ) : (
                <X className="w-5 h-5 text-muted-foreground" />
              )}
            </div>
            <div className="flex justify-between items-center py-2 border-b border-border">
              <span className="text-muted-foreground">Start Point</span>
              <span className="font-medium">
                {route.start_point_details?.name || 'Unknown'}
              </span>
            </div>
            <div className="flex justify-between items-center py-2 border-b border-border">
              <span className="text-muted-foreground">End Point</span>
              <span className="font-medium">
                {route.end_point_details?.name || 'Unknown'}
              </span>
            </div>
            <div className="flex justify-between items-center py-2">
              <span className="text-muted-foreground">Stop Points</span>
              <span className="font-medium">{sortedStopPoints.length}</span>
            </div>
          </CardContent>
        </Card>

        {/* Stop Points List */}
        <Card>
          <CardHeader>
            <CardTitle>Stop Points</CardTitle>
          </CardHeader>
          <CardContent>
            {sortedStopPoints.length === 0 ? (
              <p className="text-muted-foreground text-center py-4">No stop points</p>
            ) : (
              <div className="space-y-2 max-h-96 overflow-y-auto">
                {sortedStopPoints.map((stop, index) => (
                  <div
                    key={stop.id}
                    className="p-3 border border-border rounded-lg hover:bg-muted/50 transition-colors"
                  >
                    <div className="flex justify-between items-center">
                      <div className="flex items-center gap-2">
                        <span className="font-semibold text-primary">#{index + 1}</span>
                        <span className="font-medium">
                          {stop.place_details?.name || 'Unknown Place'}
                        </span>
                      </div>
                      <span className="text-sm text-muted-foreground">
                        Order: {stop.order}
                      </span>
                    </div>
                    {stop.place_details?.code && (
                      <div className="text-sm text-muted-foreground mt-1">
                        Code: {stop.place_details.code}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Map */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Route Map</CardTitle>
          </CardHeader>
          <CardContent>
            <MiniMap
              markers={mapData.markers}
              polylines={polylinesToShow}
              height="500px"
              onMarkerClick={handleMarkerClick}
            />
          </CardContent>
        </Card>
      </div>

      {/* Marker Details Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{selectedMarker?.name || 'Place Details'}</DialogTitle>
            <DialogDescription>
              {getTypeLabel(selectedMarker?.type)}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="flex justify-between items-center">
              <span className="text-muted-foreground">Type</span>
              <span className="font-medium">{getTypeLabel(selectedMarker?.type)}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-muted-foreground">Name</span>
              <span className="font-medium">{selectedMarker?.name || 'Unknown'}</span>
            </div>
            {selectedMarker?.code && (
              <div className="flex justify-between items-center">
                <span className="text-muted-foreground">Code</span>
                <span className="font-medium">{selectedMarker.code}</span>
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
