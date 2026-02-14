import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus, Check, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { PageHeader } from '@/components/common/PageHeader';
import { DataTable, Column } from '@/components/common/DataTable';
import { vehicleTicketBookingApi, type VehicleTicketBookingRecord } from '@/modules/vehicle-ticket-bookings/services/vehicleTicketBookingApi';
import { toast } from 'sonner';
import { format } from 'date-fns';

export default function VehicleTicketBookings() {
  const navigate = useNavigate();
  const [bookings, setBookings] = useState<VehicleTicketBookingRecord[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const fetchBookings = async () => {
      setLoading(true);
      try {
        const response = await vehicleTicketBookingApi.list({ per_page: 1000 });
        setBookings(response.results || []);
      } catch {
        toast.error('Failed to load vehicle ticket bookings');
        setBookings([]);
      } finally {
        setLoading(false);
      }
    };
    fetchBookings();
  }, []);

  const columns: Column<VehicleTicketBookingRecord>[] = [
    { key: 'pnr', header: 'PNR', render: (b) => b.pnr },
    { key: 'ticket_id', header: 'Ticket ID', render: (b) => b.ticket_id },
    { key: 'name', header: 'Name', render: (b) => b.name },
    { key: 'phone', header: 'Phone', render: (b) => b.phone },
    { key: 'vehicle_schedule', header: 'Schedule', render: (b) => b.vehicle_schedule },
    { key: 'price', header: 'Price', render: (b) => `Rs. ${Number(b.price).toFixed(2)}` },
    { key: 'is_paid', header: 'Paid', render: (b) => b.is_paid ? <Check className="w-4 h-4 text-success" /> : <X className="w-4 h-4 text-muted-foreground" /> },
    { key: 'created_at', header: 'Created', render: (b) => format(new Date(b.created_at), 'MMM dd, HH:mm') },
  ];

  const handleDelete = async (id: string) => {
    try {
      await vehicleTicketBookingApi.delete(id);
      setBookings(bookings.filter((b) => b.id !== id));
      toast.success('Deleted');
    } catch {
      toast.error('Failed to delete');
    }
  };

  return (
    <div>
      <PageHeader
        title="Vehicle Ticket Bookings"
        subtitle="EYS ticket bookings"
        actions={
          <Button onClick={() => navigate('/admin/vehicle-ticket-bookings/add')}>
            <Plus className="w-4 h-4 mr-2" />
            Add Booking
          </Button>
        }
      />
      {loading ? (
        <p className="text-muted-foreground py-8">Loading...</p>
      ) : (
        <DataTable
          data={bookings}
          columns={columns}
          searchPlaceholder="Search..."
          onView={(b) => navigate(`/admin/vehicle-ticket-bookings/${b.id}`)}
          onEdit={(b) => navigate(`/admin/vehicle-ticket-bookings/${b.id}/edit`)}
          onDelete={handleDelete}
        />
      )}
    </div>
  );
}
