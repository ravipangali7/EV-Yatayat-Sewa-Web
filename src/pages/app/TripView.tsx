import { useParams, useNavigate } from 'react-router-dom';
import { useState, useEffect, useRef } from 'react';
import { PageHeader } from '@/components/common/PageHeader';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { GoogleMap, Polyline, Marker } from '@react-google-maps/api';
import { useGoogleMaps } from '@/contexts/GoogleMapsContext';
import {
  VEHICLE_MARKER_ICON,
  VEHICLE_MARKER_WIDTH,
  VEHICLE_MARKER_HEIGHT,
  VEHICLE_MARKER_ANCHOR_X,
  VEHICLE_MARKER_ANCHOR_Y,
} from '@/config/mapConstants';
import { api } from '@/lib/api';
import { toast } from 'sonner';
import { format } from 'date-fns';
import { toNumber } from '@/lib/utils';
import { Play, Pause, RotateCcw } from 'lucide-react';

interface TripLocation {
  id: string;
  latitude: string;
  longitude: string;
  speed: string | null;
  created_at: string;
}

interface SeatBookingDetail {
  id: string;
  user_details?: { name?: string; phone?: string };
  is_guest: boolean;
  vehicle_seat_details?: { side: string; number: number };
  check_in_datetime: string;
  check_out_datetime: string | null;
  check_in_address: string;
  check_out_address: string | null;
  trip_amount: string;
  is_paid: boolean;
  destination_place_details?: { name?: string };
}

interface TicketBookingDetail {
  id: string;
  pnr: string;
  name: string;
  phone: string;
  seat: unknown;
  price: string;
  is_paid: boolean;
  pickup_point_name: string | null;
  destination_point_name: string | null;
}

interface TripDetail {
  id: string;
  trip_id: string;
  vehicle: string;
  vehicle_name: string | null;
  vehicle_no: string | null;
  driver: string;
  driver_name: string | null;
  driver_phone: string | null;
  route: string;
  route_name: string | null;
  start_time: string | null;
  end_time: string | null;
  remarks: string;
  is_scheduled: boolean;
  vehicle_schedule: { id: string; date: string; time: string; route_name: string; vehicle_name: string; vehicle_no: string } | null;
  reverse_direction?: boolean;
  created_at: string;
  updated_at: string;
  locations: TripLocation[];
  seat_bookings: SeatBookingDetail[];
  total_seat_booking_revenue: string;
  ticket_revenue: string;
  total_revenue: string;
  ticket_bookings: TicketBookingDetail[];
}

export default function TripView() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [trip, setTrip] = useState<TripDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [playbackIndex, setPlaybackIndex] = useState(0);
  const [playing, setPlaying] = useState(false);
  const [playbackSpeed, setPlaybackSpeed] = useState(1);
  const playbackRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const { isLoaded } = useGoogleMaps();

  useEffect(() => {
    if (!id) return;
    api.get<TripDetail>(`trips/${id}/`)
      .then(setTrip)
      .catch(() => toast.error('Failed to load trip'))
      .finally(() => setLoading(false));
  }, [id]);

  useEffect(() => {
    if (!playing || !trip?.locations?.length) return;
    const locations = trip.locations;
    playbackRef.current = setInterval(() => {
      setPlaybackIndex((i) => {
        if (i >= locations.length - 1) {
          setPlaying(false);
          return locations.length - 1;
        }
        return i + 1;
      });
    }, 500 / playbackSpeed);
    return () => {
      if (playbackRef.current) clearInterval(playbackRef.current);
    };
  }, [playing, playbackSpeed, trip?.locations]);

  const path = (trip?.locations ?? []).map((loc) => ({ lat: Number(loc.latitude), lng: Number(loc.longitude) }));
  const center = path.length ? path[Math.min(playbackIndex, path.length - 1)] : { lat: 27.7172, lng: 85.324 };
  const startPoint = path[0];
  const endPoint = path[path.length - 1];
  const playbackPoint = path[playbackIndex];

  if (loading || !trip) {
    return (
      <div>
        <PageHeader title="Trip" backUrl="/admin/trips" />
        <p className="text-muted-foreground py-8">Loading...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <PageHeader title={`Trip ${trip.trip_id}`} backUrl="/admin/trips" />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle>Trip path & playback</CardTitle>
              {path.length > 1 && (
                <div className="flex items-center gap-2">
                  <Button variant="outline" size="sm" onClick={() => setPlaying((p) => !p)}>
                    {playing ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
                  </Button>
                  <Button variant="outline" size="sm" onClick={() => { setPlaybackIndex(0); setPlaying(false); }}>
                    <RotateCcw className="w-4 h-4" />
                  </Button>
                  <select value={playbackSpeed} onChange={(e) => setPlaybackSpeed(Number(e.target.value))} className="rounded border px-2 py-1 text-sm">
                    <option value={0.5}>0.5x</option>
                    <option value={1}>1x</option>
                    <option value={2}>2x</option>
                    <option value={4}>4x</option>
                  </select>
                  <span className="text-xs text-muted-foreground">
                    {playbackIndex + 1} / {path.length}
                  </span>
                </div>
              )}
            </CardHeader>
            <CardContent>
              {path.length > 1 && isLoaded ? (
                <div className="rounded overflow-hidden border">
                  <GoogleMap
                    mapContainerStyle={{ width: '100%', height: '400px' }}
                    center={center}
                    zoom={14}
                    options={{ zoomControl: true, streetViewControl: false, mapTypeControl: false }}
                  >
                    <Polyline path={path} options={{ strokeColor: '#2563eb', strokeWeight: 4, strokeOpacity: 0.8 }} />
                    {startPoint && <Marker position={startPoint} label="S" title="Start" />}
                    {endPoint && endPoint !== startPoint && <Marker position={endPoint} label="E" title="End" />}
                    {playbackPoint && typeof window !== 'undefined' && window.google?.maps && (
                      <Marker
                        position={playbackPoint}
                        title="Vehicle"
                        icon={{
                          url: VEHICLE_MARKER_ICON,
                          scaledSize: new window.google.maps.Size(VEHICLE_MARKER_WIDTH, VEHICLE_MARKER_HEIGHT),
                          anchor: new window.google.maps.Point(VEHICLE_MARKER_ANCHOR_X, VEHICLE_MARKER_ANCHOR_Y),
                        }}
                      />
                    )}
                  </GoogleMap>
                </div>
              ) : path.length <= 1 ? (
                <p className="text-muted-foreground py-8 text-center">No location data for this trip.</p>
              ) : (
                <p className="text-muted-foreground py-8 text-center">Loading map...</p>
              )}
              {path.length > 1 && (
                <input type="range" min={0} max={path.length - 1} value={playbackIndex} onChange={(e) => setPlaybackIndex(Number(e.target.value))} className="w-full mt-2" />
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader><CardTitle>Trip details</CardTitle></CardHeader>
            <CardContent className="space-y-2">
              <div className="flex justify-between py-2 border-b"><span className="text-muted-foreground">Trip ID</span><span className="font-medium">{trip.trip_id}</span></div>
              <div className="flex justify-between py-2 border-b"><span className="text-muted-foreground">Vehicle</span><span className="font-medium">{trip.vehicle_no || trip.vehicle_name || trip.vehicle}</span></div>
              <div className="flex justify-between py-2 border-b"><span className="text-muted-foreground">Driver</span><span className="font-medium">{trip.driver_name || trip.driver_phone || trip.driver}</span></div>
              <div className="flex justify-between py-2 border-b"><span className="text-muted-foreground">Route</span><span className="font-medium">{trip.route_name || trip.route}</span></div>
              {trip.reverse_direction != null && <div className="flex justify-between py-2 border-b"><span className="text-muted-foreground">Direction</span><span className="font-medium">{trip.reverse_direction ? 'Return' : 'Forward'}</span></div>}
              <div className="flex justify-between py-2 border-b"><span className="text-muted-foreground">Start</span><span className="font-medium">{trip.start_time ? format(new Date(trip.start_time), 'PPpp') : '-'}</span></div>
              <div className="flex justify-between py-2 border-b"><span className="text-muted-foreground">End</span><span className="font-medium">{trip.end_time ? format(new Date(trip.end_time), 'PPpp') : 'Active'}</span></div>
              {trip.remarks && <div className="flex justify-between py-2 border-b"><span className="text-muted-foreground">Remarks</span><span className="text-sm">{trip.remarks}</span></div>}
            </CardContent>
          </Card>
        </div>

        <div className="space-y-6">
          <Card>
            <CardHeader><CardTitle>Revenue</CardTitle></CardHeader>
            <CardContent className="space-y-2">
              <div className="flex justify-between"><span className="text-muted-foreground">Seat bookings</span><span>Rs. {toNumber(trip.total_seat_booking_revenue, 0).toLocaleString()}</span></div>
              <div className="flex justify-between"><span className="text-muted-foreground">Tickets</span><span>Rs. {toNumber(trip.ticket_revenue, 0).toLocaleString()}</span></div>
              <div className="flex justify-between font-semibold pt-2 border-t"><span>Total</span><span>Rs. {toNumber(trip.total_revenue, 0).toLocaleString()}</span></div>
            </CardContent>
          </Card>

          {trip.vehicle_schedule && (
            <Card>
              <CardHeader><CardTitle>Schedule</CardTitle></CardHeader>
              <CardContent className="space-y-1 text-sm">
                <p><span className="text-muted-foreground">Date:</span> {trip.vehicle_schedule.date}</p>
                <p><span className="text-muted-foreground">Time:</span> {trip.vehicle_schedule.time}</p>
                <p><span className="text-muted-foreground">Route:</span> {trip.vehicle_schedule.route_name}</p>
              </CardContent>
            </Card>
          )}
        </div>
      </div>

      <Card>
        <CardHeader><CardTitle>Seat bookings</CardTitle></CardHeader>
        <CardContent>
          {!trip.seat_bookings?.length ? <p className="text-muted-foreground py-4">None</p> : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead><tr className="border-b"><th className="text-left py-2">User</th><th className="text-left py-2">Seat</th><th className="text-left py-2">Check-in</th><th className="text-left py-2">Check-out</th><th className="text-left py-2">Destination</th><th className="text-right py-2">Amount</th><th className="text-left py-2">Paid</th></tr></thead>
                <tbody>
                  {trip.seat_bookings.map((sb) => (
                    <tr key={sb.id} className="border-b">
                      <td className="py-2">{sb.is_guest ? 'Guest' : (sb.user_details?.name || sb.user_details?.phone || '-')}</td>
                      <td>{sb.vehicle_seat_details ? `${sb.vehicle_seat_details.side}${sb.vehicle_seat_details.number}` : '-'}</td>
                      <td>{format(new Date(sb.check_in_datetime), 'MMM dd HH:mm')}<br /><span className="text-muted-foreground text-xs">{sb.check_in_address?.slice(0, 30)}...</span></td>
                      <td>{sb.check_out_datetime ? format(new Date(sb.check_out_datetime), 'MMM dd HH:mm') : 'Active'}</td>
                      <td>{sb.destination_place_details?.name || '-'}</td>
                      <td className="text-right">Rs. {toNumber(sb.trip_amount, 0).toLocaleString()}</td>
                      <td>{sb.is_paid ? 'Yes' : 'No'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>

      {trip.ticket_bookings?.length > 0 && (
        <Card>
          <CardHeader><CardTitle>Ticket bookings</CardTitle></CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead><tr className="border-b"><th className="text-left py-2">PNR</th><th className="text-left py-2">Name</th><th className="text-left py-2">Phone</th><th className="text-left py-2">Pickup</th><th className="text-left py-2">Destination</th><th className="text-right py-2">Price</th><th className="text-left py-2">Paid</th></tr></thead>
                <tbody>
                  {trip.ticket_bookings.map((tb) => (
                    <tr key={tb.id} className="border-b">
                      <td className="py-2 font-mono">{tb.pnr}</td>
                      <td>{tb.name}</td>
                      <td>{tb.phone}</td>
                      <td>{tb.pickup_point_name || '-'}</td>
                      <td>{tb.destination_point_name || '-'}</td>
                      <td className="text-right">Rs. {toNumber(tb.price, 0).toLocaleString()}</td>
                      <td>{tb.is_paid ? 'Yes' : 'No'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      )}

      <Button variant="outline" onClick={() => navigate('/admin/trips')}>Back to Trips</Button>
    </div>
  );
}
