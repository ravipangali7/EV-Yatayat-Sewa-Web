import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Edit } from 'lucide-react';
import { PageHeader } from '@/components/common/PageHeader';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { StatusBadge } from '@/components/common/StatusBadge';
import { seatBookingApi } from '@/modules/seat-bookings/services/seatBookingApi';
import { SeatBooking } from '@/types';
import { toast } from 'sonner';
import { format } from 'date-fns';

export default function SeatBookingView() {
  const { id } = useParams();
  const navigate = useNavigate();
  
  const [booking, setBooking] = useState<SeatBooking | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const fetchBooking = async () => {
      if (!id) return;
      setLoading(true);
      try {
        const bookingData = await seatBookingApi.get(id);
        setBooking(bookingData);
      } catch (error) {
        toast.error('Failed to load seat booking');
        console.error(error);
      } finally {
        setLoading(false);
      }
    };
    fetchBooking();
  }, [id]);

  if (loading) {
    return (
      <div className="text-center py-12">
        <p className="text-muted-foreground">Loading seat booking...</p>
      </div>
    );
  }

  if (!booking) {
    return (
      <div className="text-center py-12">
        <p className="text-muted-foreground">Seat booking not found</p>
      </div>
    );
  }

  return (
    <div>
      <PageHeader
        title="Seat Booking Details"
        subtitle={`Booking for ${booking.vehicle_details?.name || booking.vehicle}`}
        actions={
          <Button onClick={() => navigate(`/admin/seat-bookings/${id}/edit`)}>
            <Edit className="w-4 h-4 mr-2" />
            Edit
          </Button>
        }
      />

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Basic Information */}
        <Card>
          <CardHeader>
            <CardTitle>Basic Information</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex justify-between items-center py-2 border-b border-border">
              <span className="text-muted-foreground">Vehicle</span>
              <span className="font-medium">{booking.vehicle_details?.name || booking.vehicle}</span>
            </div>

            <div className="flex justify-between items-center py-2 border-b border-border">
              <span className="text-muted-foreground">Seat</span>
              <Badge>
                {booking.vehicle_seat_details 
                  ? `${booking.vehicle_seat_details.side}${booking.vehicle_seat_details.number}`
                  : booking.vehicle_seat}
              </Badge>
            </div>

            <div className="flex justify-between items-center py-2 border-b border-border">
              <span className="text-muted-foreground">User Type</span>
              <Badge variant={booking.is_guest ? 'secondary' : 'default'}>
                {booking.is_guest ? 'Guest' : 'Registered User'}
              </Badge>
            </div>

            {!booking.is_guest && (
              <div className="flex justify-between items-center py-2 border-b border-border">
                <span className="text-muted-foreground">User</span>
                <span className="font-medium">
                  {booking.user_details?.name || booking.user || 'N/A'}
                </span>
              </div>
            )}

            <div className="flex justify-between items-center py-2 border-b border-border">
              <span className="text-muted-foreground">Payment Status</span>
              <StatusBadge status={booking.is_paid ? 'active' : 'inactive'} />
            </div>
          </CardContent>
        </Card>

        {/* Check In Information */}
        <Card>
          <CardHeader>
            <CardTitle>Check In</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex justify-between items-center py-2 border-b border-border">
              <span className="text-muted-foreground">Date & Time</span>
              <span className="font-medium">
                {booking.check_in_datetime 
                  ? format(new Date(booking.check_in_datetime), 'MMM dd, yyyy HH:mm')
                  : 'N/A'}
              </span>
            </div>

            <div className="flex justify-between items-center py-2 border-b border-border">
              <span className="text-muted-foreground">Location</span>
              <span className="font-medium text-right">
                {booking.check_in_lat ? parseFloat(booking.check_in_lat.toString()).toFixed(6) : 'N/A'}, {booking.check_in_lng ? parseFloat(booking.check_in_lng.toString()).toFixed(6) : 'N/A'}
              </span>
            </div>

            <div className="py-2">
              <span className="text-muted-foreground block mb-2">Address</span>
              <p className="text-sm">{booking.check_in_address || 'N/A'}</p>
            </div>
          </CardContent>
        </Card>

        {/* Check Out Information */}
        {booking.check_out_datetime && (
          <Card>
            <CardHeader>
              <CardTitle>Check Out</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex justify-between items-center py-2 border-b border-border">
                <span className="text-muted-foreground">Date & Time</span>
                <span className="font-medium">
                  {format(new Date(booking.check_out_datetime), 'MMM dd, yyyy HH:mm')}
                </span>
              </div>

              <div className="flex justify-between items-center py-2 border-b border-border">
                <span className="text-muted-foreground">Location</span>
                <span className="font-medium text-right">
                  {booking.check_out_lat ? parseFloat(booking.check_out_lat.toString()).toFixed(6) : 'N/A'}, {booking.check_out_lng ? parseFloat(booking.check_out_lng.toString()).toFixed(6) : 'N/A'}
                </span>
              </div>

              <div className="py-2">
                <span className="text-muted-foreground block mb-2">Address</span>
                <p className="text-sm">{booking.check_out_address || 'N/A'}</p>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Trip Information */}
        {(booking.trip_distance || booking.trip_duration || booking.trip_amount) && (
          <Card>
            <CardHeader>
              <CardTitle>Trip Information</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {booking.trip_distance && (
                <div className="flex justify-between items-center py-2 border-b border-border">
                  <span className="text-muted-foreground">Distance</span>
                  <span className="font-medium">{booking.trip_distance.toFixed(2)} km</span>
                </div>
              )}

              {booking.trip_duration && (
                <div className="flex justify-between items-center py-2 border-b border-border">
                  <span className="text-muted-foreground">Duration</span>
                  <span className="font-medium">
                    {Math.floor(booking.trip_duration / 3600)}h {Math.floor((booking.trip_duration % 3600) / 60)}m
                  </span>
                </div>
              )}

              {booking.trip_amount && (
                <div className="flex justify-between items-center py-2 border-b border-border">
                  <span className="text-muted-foreground">Amount</span>
                  <span className="font-medium text-lg">Rs. {booking.trip_amount.toFixed(2)}</span>
                </div>
              )}
            </CardContent>
          </Card>
        )}

        {/* Timestamps */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Timestamps</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex justify-between items-center py-2 border-b border-border">
              <span className="text-muted-foreground">Created At</span>
              <span className="font-medium">
                {format(new Date(booking.created_at), 'MMM dd, yyyy HH:mm:ss')}
              </span>
            </div>

            <div className="flex justify-between items-center py-2">
              <span className="text-muted-foreground">Updated At</span>
              <span className="font-medium">
                {format(new Date(booking.updated_at), 'MMM dd, yyyy HH:mm:ss')}
              </span>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
