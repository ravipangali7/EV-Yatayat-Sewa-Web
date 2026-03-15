import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus, Check, X, Search } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { PageHeader } from '@/components/common/PageHeader';
import { DataTable, Column } from '@/components/common/DataTable';
import { seatBookingApi } from '@/modules/seat-bookings/services/seatBookingApi';
import { SeatBooking } from '@/types';
import { toast } from 'sonner';
import { format } from 'date-fns';

export default function SeatBookings() {
  const navigate = useNavigate();
  const [bookings, setBookings] = useState<SeatBooking[]>([]);
  const [loading, setLoading] = useState(false);
  const [page, setPage] = useState(1);
  const [totalCount, setTotalCount] = useState(0);
  const perPage = 25;

  // Input state (user is typing / selecting — not yet applied)
  const [searchInput, setSearchInput] = useState('');
  const [dateFromInput, setDateFromInput] = useState('');
  const [dateToInput, setDateToInput] = useState('');
  const [isPaidInput, setIsPaidInput] = useState<'all' | 'true' | 'false'>('all');
  const [isGuestInput, setIsGuestInput] = useState<'all' | 'true' | 'false'>('all');

  // Applied state (drives the API call)
  const [appliedSearch, setAppliedSearch] = useState('');
  const [appliedDateFrom, setAppliedDateFrom] = useState('');
  const [appliedDateTo, setAppliedDateTo] = useState('');
  const [appliedIsPaid, setAppliedIsPaid] = useState<'all' | 'true' | 'false'>('all');
  const [appliedIsGuest, setAppliedIsGuest] = useState<'all' | 'true' | 'false'>('all');

  const fetchBookings = useCallback(async () => {
    setLoading(true);
    try {
      const response = await seatBookingApi.list({
        search: appliedSearch || undefined,
        date_from: appliedDateFrom || undefined,
        date_to: appliedDateTo || undefined,
        is_paid: appliedIsPaid !== 'all' ? appliedIsPaid === 'true' : undefined,
        is_guest: appliedIsGuest !== 'all' ? appliedIsGuest === 'true' : undefined,
        page,
        per_page: perPage,
      });
      setBookings(response.results);
      setTotalCount(response.count);
    } catch (error) {
      console.error('Failed to load seat bookings:', error);
      toast.error('Failed to load seat bookings');
    } finally {
      setLoading(false);
    }
  }, [appliedSearch, appliedDateFrom, appliedDateTo, appliedIsPaid, appliedIsGuest, page]);

  useEffect(() => {
    fetchBookings();
  }, [fetchBookings]);

  const handleSearch = () => {
    setAppliedSearch(searchInput);
    setAppliedDateFrom(dateFromInput);
    setAppliedDateTo(dateToInput);
    setAppliedIsPaid(isPaidInput);
    setAppliedIsGuest(isGuestInput);
    setPage(1);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') handleSearch();
  };

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
      key: 'trip',
      header: 'Trip',
      render: (booking) => booking.trip_details?.trip_id || booking.trip || '-',
    },
    {
      key: 'user',
      header: 'User',
      render: (booking) =>
        booking.is_guest ? 'Guest' : booking.user_details?.name || booking.user || 'N/A',
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
      key: 'check_in_address',
      header: 'From',
      render: (booking) => (
        <span className="line-clamp-1 max-w-[150px]">{(booking as any).check_in_address || '-'}</span>
      ),
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
      render: (booking) => {
        const amount = Number(booking.trip_amount);
        return Number.isFinite(amount) && amount > 0 ? `Rs. ${amount.toFixed(2)}` : '-';
      },
    },
    {
      key: 'is_paid',
      header: 'Paid',
      render: (booking) =>
        booking.is_paid ? (
          <Check className="w-4 h-4 text-success" />
        ) : (
          <X className="w-4 h-4 text-muted-foreground" />
        ),
    },
    {
      key: 'is_guest',
      header: 'Guest',
      render: (booking) =>
        booking.is_guest ? (
          <Check className="w-4 h-4 text-muted-foreground" />
        ) : (
          <X className="w-4 h-4 text-muted-foreground" />
        ),
    },
  ];

  const handleDelete = async (id: string) => {
    try {
      await seatBookingApi.delete(id);
      toast.success('Seat booking deleted successfully');
      fetchBookings();
    } catch (error) {
      console.error('Failed to delete seat booking:', error);
      toast.error('Failed to delete seat booking');
    }
  };

  const handleBulkDelete = async (ids: string[]) => {
    try {
      await Promise.all(ids.map((id) => seatBookingApi.delete(id)));
      toast.success(`${ids.length} seat bookings deleted successfully`);
      fetchBookings();
    } catch (error) {
      console.error('Failed to delete seat bookings:', error);
      toast.error('Failed to delete seat bookings');
    }
  };

  return (
    <div className="space-y-4">
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

      {/* Filter Bar */}
      <div className="flex flex-wrap gap-3 items-end p-4 bg-muted/30 rounded-lg border">
        <div className="flex flex-col gap-1 min-w-[220px]">
          <Label className="text-xs">Search</Label>
          <Input
            placeholder="Vehicle, user, address…"
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
        <div className="flex flex-col gap-1">
          <Label className="text-xs">Passenger Type</Label>
          <Select value={isGuestInput} onValueChange={(v) => setIsGuestInput(v as 'all' | 'true' | 'false')}>
            <SelectTrigger className="w-[120px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All</SelectItem>
              <SelectItem value="false">Registered</SelectItem>
              <SelectItem value="true">Guest</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <Button onClick={handleSearch} className="gap-2">
          <Search className="w-4 h-4" />
          Search
        </Button>
      </div>

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
