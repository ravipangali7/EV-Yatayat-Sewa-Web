import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus, Check, X, Search } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { PageHeader } from '@/components/common/PageHeader';
import { DataTable, Column } from '@/components/common/DataTable';
import { vehicleTicketBookingApi, type VehicleTicketBookingRecord } from '@/modules/vehicle-ticket-bookings/services/vehicleTicketBookingApi';
import { toast } from 'sonner';
import { format } from 'date-fns';

export default function VehicleTicketBookings() {
  const navigate = useNavigate();
  const [bookings, setBookings] = useState<VehicleTicketBookingRecord[]>([]);
  const [loading, setLoading] = useState(false);
  const [page, setPage] = useState(1);
  const [totalCount, setTotalCount] = useState(0);
  const perPage = 25;

  // Input state
  const [searchInput, setSearchInput] = useState('');
  const [dateFromInput, setDateFromInput] = useState('');
  const [dateToInput, setDateToInput] = useState('');
  const [isPaidInput, setIsPaidInput] = useState<'all' | 'true' | 'false'>('all');

  // Applied state
  const [appliedSearch, setAppliedSearch] = useState('');
  const [appliedDateFrom, setAppliedDateFrom] = useState('');
  const [appliedDateTo, setAppliedDateTo] = useState('');
  const [appliedIsPaid, setAppliedIsPaid] = useState<'all' | 'true' | 'false'>('all');

  const fetchBookings = useCallback(async () => {
    setLoading(true);
    try {
      const response = await vehicleTicketBookingApi.list({
        search: appliedSearch || undefined,
        date_from: appliedDateFrom || undefined,
        date_to: appliedDateTo || undefined,
        is_paid: appliedIsPaid !== 'all' ? appliedIsPaid === 'true' : undefined,
        page,
        per_page: perPage,
        expand: true,
      });
      setBookings(response.results || []);
      setTotalCount(response.count);
    } catch {
      toast.error('Failed to load vehicle ticket bookings');
      setBookings([]);
    } finally {
      setLoading(false);
    }
  }, [appliedSearch, appliedDateFrom, appliedDateTo, appliedIsPaid, page]);

  useEffect(() => {
    fetchBookings();
  }, [fetchBookings]);

  const handleSearch = () => {
    setAppliedSearch(searchInput);
    setAppliedDateFrom(dateFromInput);
    setAppliedDateTo(dateToInput);
    setAppliedIsPaid(isPaidInput);
    setPage(1);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') handleSearch();
  };

  const columns: Column<VehicleTicketBookingRecord>[] = [
    { key: 'pnr', header: 'PNR', render: (b) => b.pnr },
    { key: 'ticket_id', header: 'Ticket ID', render: (b) => b.ticket_id },
    { key: 'name', header: 'Passenger', render: (b) => b.name },
    { key: 'phone', header: 'Phone', render: (b) => b.phone },
    {
      key: 'vehicle_schedule',
      header: 'Schedule / Route',
      render: (b) => {
        if (b.schedule_details?.route_name) {
          return (
            <div className="flex flex-col">
              <span className="text-xs font-medium">{b.schedule_details.route_name}</span>
              <span className="text-xs text-muted-foreground">
                {b.schedule_details.date} {b.schedule_details.time}
              </span>
            </div>
          );
        }
        return b.vehicle_schedule;
      },
    },
    { key: 'price', header: 'Price', render: (b) => `Rs. ${Number(b.price).toFixed(2)}` },
    {
      key: 'is_paid',
      header: 'Paid',
      render: (b) =>
        b.is_paid ? (
          <Check className="w-4 h-4 text-success" />
        ) : (
          <X className="w-4 h-4 text-muted-foreground" />
        ),
    },
    { key: 'created_at', header: 'Booked', render: (b) => format(new Date(b.created_at), 'MMM dd, HH:mm') },
  ];

  const handleDelete = async (id: string) => {
    try {
      await vehicleTicketBookingApi.delete(id);
      toast.success('Deleted');
      fetchBookings();
    } catch {
      toast.error('Failed to delete');
    }
  };

  const handleBulkDelete = async (ids: string[]) => {
    try {
      await Promise.all(ids.map((id) => vehicleTicketBookingApi.delete(id)));
      toast.success(`${ids.length} bookings deleted`);
      fetchBookings();
    } catch {
      toast.error('Failed to delete bookings');
    }
  };

  return (
    <div className="space-y-4">
      <PageHeader
        title="Vehicle Ticket Bookings"
        subtitle="EYS scheduled ticket bookings"
        actions={
          <Button onClick={() => navigate('/admin/vehicle-ticket-bookings/add')}>
            <Plus className="w-4 h-4 mr-2" />
            Add Booking
          </Button>
        }
      />

      {/* Filter Bar */}
      <div className="flex flex-wrap gap-3 items-end p-4 bg-muted/30 rounded-lg border">
        <div className="flex flex-col gap-1 min-w-[220px]">
          <Label className="text-xs">Search</Label>
          <Input
            placeholder="PNR, ticket ID, name, phone…"
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            onKeyDown={handleKeyDown}
          />
        </div>
        <div className="flex flex-col gap-1">
          <Label className="text-xs">From Date</Label>
          <Input
            type="date"
            value={dateFromInput}
            onChange={(e) => setDateFromInput(e.target.value)}
            className="w-[145px]"
          />
        </div>
        <div className="flex flex-col gap-1">
          <Label className="text-xs">To Date</Label>
          <Input
            type="date"
            value={dateToInput}
            onChange={(e) => setDateToInput(e.target.value)}
            className="w-[145px]"
          />
        </div>
        <div className="flex flex-col gap-1">
          <Label className="text-xs">Paid Status</Label>
          <Select value={isPaidInput} onValueChange={(v) => setIsPaidInput(v as 'all' | 'true' | 'false')}>
            <SelectTrigger className="w-[120px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All</SelectItem>
              <SelectItem value="true">Paid</SelectItem>
              <SelectItem value="false">Unpaid</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <Button onClick={handleSearch} className="gap-2">
          <Search className="w-4 h-4" />
          Search
        </Button>
      </div>

      {loading ? (
        <p className="text-muted-foreground py-8">Loading...</p>
      ) : (
        <DataTable
          data={bookings}
          columns={columns}
          searchPlaceholder="Search ticket bookings..."
          onView={(b) => navigate(`/admin/vehicle-ticket-bookings/${b.id}`)}
          onEdit={(b) => navigate(`/admin/vehicle-ticket-bookings/${b.id}/edit`)}
          onDelete={handleDelete}
          onBulkDelete={handleBulkDelete}
          serverSide
          searchValue={searchInput}
          onSearchChange={(v) => setSearchInput(v)}
          totalCount={totalCount}
          page={page}
          onPageChange={setPage}
          perPage={perPage}
        />
      )}
    </div>
  );
}
