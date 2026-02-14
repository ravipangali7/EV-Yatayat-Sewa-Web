import { useParams, useNavigate } from 'react-router-dom';
import { useState, useEffect } from 'react';
import { Download } from 'lucide-react';
import { PageHeader } from '@/components/common/PageHeader';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { vehicleTicketBookingApi, type VehicleTicketBookingRecord } from '@/modules/vehicle-ticket-bookings/services/vehicleTicketBookingApi';
import { toast } from 'sonner';
import { format } from 'date-fns';

export default function VehicleTicketBookingView() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [booking, setBooking] = useState<VehicleTicketBookingRecord | null>(null);
  const [loading, setLoading] = useState(true);
  const [pdfLoading, setPdfLoading] = useState(false);

  const handleDownloadPdf = async () => {
    if (!id) return;
    setPdfLoading(true);
    try {
      const blob = await vehicleTicketBookingApi.getTicketPdfBlob(id);
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = booking ? `ticket-${booking.pnr}.pdf` : 'ticket.pdf';
      a.click();
      URL.revokeObjectURL(url);
    } catch {
      toast.error('Failed to download ticket PDF');
    } finally {
      setPdfLoading(false);
    }
  };

  useEffect(() => {
    if (!id) return;
    vehicleTicketBookingApi.get(id, { expand: true })
      .then(setBooking)
      .catch(() => toast.error('Failed to load'))
      .finally(() => setLoading(false));
  }, [id]);

  if (loading || !booking) {
    return (
      <div>
        <PageHeader title="Vehicle Ticket Booking" backUrl="/admin/vehicle-ticket-bookings" />
        <p className="text-muted-foreground py-8">Loading...</p>
      </div>
    );
  }

  const sd = booking.schedule_details;
  const seatsStr = Array.isArray(booking.seat)
    ? booking.seat.map((s: { side?: string; number?: number }) => `${s?.side ?? ''}${s?.number ?? ''}`).join(', ')
    : '-';
  const routeStr = sd?.start_point_name && sd?.end_point_name ? `${sd.start_point_name} → ${sd.end_point_name}` : (sd?.route_name ?? '-');

  return (
    <div>
      <PageHeader title={booking.pnr} backUrl="/admin/vehicle-ticket-bookings" />

      {/* Ticket preview - 6:4 aspect ratio */}
      <div className="max-w-md mx-auto mb-6">
        <p className="text-sm font-medium text-muted-foreground mb-2">Ticket Preview</p>
        <div
          className="aspect-[6/4] w-full rounded-lg border-2 border-border bg-card text-card-foreground shadow-sm overflow-hidden flex flex-col"
          style={{ maxHeight: '280px' }}
        >
          <div className="flex-1 p-4 flex flex-col text-sm min-h-0">
            <div className="text-center border-b border-border pb-2 mb-2">
              <p className="font-bold text-base tracking-tight">EV YATAYAT SEWA</p>
              <p className="text-xs text-muted-foreground">E-Ticket</p>
            </div>
            <div className="grid grid-cols-2 gap-x-4 gap-y-1.5 flex-1">
              <div className="font-semibold">PNR: {booking.pnr}</div>
              <div className="text-right font-semibold">Ticket: {booking.ticket_id}</div>
              <div className="col-span-2 text-muted-foreground">Route: {routeStr}</div>
              <div>Vehicle: {sd?.vehicle_name ?? '-'}</div>
              <div className="text-right">{sd?.date ?? '-'} | {sd?.time ?? '-'}</div>
              <div>Name: {booking.name}</div>
              <div className="text-right">Phone: {booking.phone}</div>
              <div className="font-semibold">Seats: {seatsStr}</div>
              <div className="text-right font-semibold">Rs. {Number(booking.price).toFixed(2)}</div>
              <div className="col-span-2 text-right text-muted-foreground">Paid: {booking.is_paid ? 'Yes' : 'No'}</div>
            </div>
          </div>
        </div>
      </div>

      <Card className="max-w-xl">
        <CardHeader><CardTitle>Booking Details</CardTitle></CardHeader>
        <CardContent className="space-y-2">
          <div className="flex justify-between py-2 border-b"><span className="text-muted-foreground">PNR</span><span>{booking.pnr}</span></div>
          <div className="flex justify-between py-2 border-b"><span className="text-muted-foreground">Ticket ID</span><span>{booking.ticket_id}</span></div>
          <div className="flex justify-between py-2 border-b"><span className="text-muted-foreground">Name</span><span>{booking.name}</span></div>
          <div className="flex justify-between py-2 border-b"><span className="text-muted-foreground">Phone</span><span>{booking.phone}</span></div>
          <div className="flex justify-between py-2 border-b"><span className="text-muted-foreground">Vehicle Schedule</span><span>{booking.vehicle_schedule}</span></div>
          <div className="flex justify-between py-2 border-b"><span className="text-muted-foreground">Price</span><span>Rs. {Number(booking.price).toFixed(2)}</span></div>
          <div className="flex justify-between py-2 border-b"><span className="text-muted-foreground">Seats</span><span>{seatsStr}</span></div>
          <div className="flex justify-between py-2 border-b"><span className="text-muted-foreground">Paid</span><span>{booking.is_paid ? 'Yes' : 'No'}</span></div>
          <div className="flex justify-between py-2"><span className="text-muted-foreground">Created</span><span>{format(new Date(booking.created_at), 'PPpp')}</span></div>
        </CardContent>
      </Card>
      <div className="mt-4 flex gap-2">
        <Button onClick={handleDownloadPdf} disabled={pdfLoading}>
          <Download className="w-4 h-4 mr-2" />
          {pdfLoading ? 'Downloading...' : 'Download ticket PDF'}
        </Button>
        <Button variant="outline" onClick={() => navigate(`/admin/vehicle-ticket-bookings/${id}/edit`)}>Edit</Button>
        <Button variant="outline" onClick={() => navigate('/admin/vehicle-ticket-bookings')}>Back</Button>
      </div>
    </div>
  );
}
