import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus, Check, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { PageHeader } from '@/components/common/PageHeader';
import { DataTable, Column } from '@/components/common/DataTable';
import { StatusBadge } from '@/components/common/StatusBadge';
import { seatBookingApi } from '@/modules/seat-bookings/services/seatBookingApi';
import { SeatBooking } from '@/types';
import { toast } from 'sonner';
import { format } from 'date-fns';

export default function SeatBookings() {
  const navigate = useNavigate();
  const [bookings, setBookings] = useState<SeatBooking[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const fetchBookings = async () => {
      setLoading(true);
      try {
        const response = await seatBookingApi.list({ per_page: 1000 });
        setBookings(response.results);
      } catch (error) {
        console.error('Failed to load seat bookings:', error);
        toast.error('Failed to load seat bookings');
      } finally {
        setLoading(false);
      }
    };
    fetchBookings();
  }, []);

  const columns: Column<SeatBooking>[] = [
    {
      key: 'vehicle_details',
      header: 'Vehicle',
      render: (booking) => booking.vehicle_details?.name || booking.vehicle || 'N/A',
    },
    {
      key: 'vehicle_seat_details',
      header: 'Seat',
      render: (booking) => 
        booking.vehicle_seat_details 
          ? `${booking.vehicle_seat_details.side}${booking.vehicle_seat_details.number}`
          : 'N/A',
    },
    {
      key: 'user',
      header: 'User',
      render: (booking) => 
        booking.is_guest 
          ? 'Guest' 
          : (booking.user_details?.name || booking.user || 'N/A'),
    },
    {
      key: 'check_in_datetime',
      header: 'Check In',
      render: (booking) => 
        booking.check_in_datetime 
          ? format(new Date(booking.check_in_datetime), 'MMM dd, yyyy HH:mm')
          : 'N/A',
    },
    {
      key: 'check_out_datetime',
      header: 'Check Out',
      render: (booking) => 
        booking.check_out_datetime 
          ? format(new Date(booking.check_out_datetime), 'MMM dd, yyyy HH:mm')
          : 'Active',
    },
    {
      key: 'trip_amount',
      header: 'Amount',
      render: (booking) => 
        booking.trip_amount 
          ? `Rs. ${booking.trip_amount.toFixed(2)}`
          : '-',
    },
    {
      key: 'is_paid',
      header: 'Paid',
      render: (booking) => 
        booking.is_paid 
          ? <Check className="w-4 h-4 text-success" /> 
          : <X className="w-4 h-4 text-muted-foreground" />,
    },
  ];

  const handleDelete = async (id: string) => {
    try {
      await seatBookingApi.delete(id);
      setBookings(bookings.filter(booking => booking.id !== id));
      toast.success('Seat booking deleted successfully');
    } catch (error) {
      console.error('Failed to delete seat booking:', error);
      toast.error('Failed to delete seat booking');
    }
  };

  const handleBulkDelete = async (ids: string[]) => {
    try {
      await Promise.all(ids.map(id => seatBookingApi.delete(id)));
      setBookings(bookings.filter(booking => !ids.includes(booking.id)));
      toast.success(`${ids.length} seat bookings deleted successfully`);
    } catch (error) {
      console.error('Failed to delete seat bookings:', error);
      toast.error('Failed to delete seat bookings');
    }
  };

  return (
    <div>
      <PageHeader
        title="Seat Bookings"
        subtitle="Manage seat bookings"
        actions={
          <Button onClick={() => navigate('/admin/seat-bookings/add')}>
            <Plus className="w-4 h-4 mr-2" />
            Add Booking
          </Button>
        }
      />

      {loading ? (
        <div className="text-center py-12">
          <p className="text-muted-foreground">Loading seat bookings...</p>
        </div>
      ) : (
        <DataTable
          data={bookings}
          columns={columns}
          searchPlaceholder="Search bookings..."
          onView={(booking) => navigate(`/admin/seat-bookings/${booking.id}`)}
          onEdit={(booking) => navigate(`/admin/seat-bookings/${booking.id}/edit`)}
          onDelete={handleDelete}
          onBulkDelete={handleBulkDelete}
        />
      )}
    </div>
  );
}
