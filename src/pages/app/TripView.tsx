import { useParams, useNavigate } from 'react-router-dom';
import { useState, useEffect } from 'react';
import { PageHeader } from '@/components/common/PageHeader';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { api } from '@/lib/api';
import { toast } from 'sonner';
import { format } from 'date-fns';

interface TripDetail {
  id: string;
  trip_id: string;
  vehicle: string;
  driver: string;
  route: string;
  start_time: string | null;
  end_time: string | null;
  remarks: string;
  is_scheduled: boolean;
  vehicle_schedule: string | null;
  created_at: string;
  updated_at: string;
}

export default function TripView() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [trip, setTrip] = useState<TripDetail | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!id) return;
    api.get<TripDetail>(`trips/${id}/`)
      .then(setTrip)
      .catch(() => toast.error('Failed to load trip'))
      .finally(() => setLoading(false));
  }, [id]);

  if (loading || !trip) {
    return (
      <div>
        <PageHeader title="Trip" backUrl="/admin/trips" />
        <p className="text-muted-foreground py-8">Loading...</p>
      </div>
    );
  }

  return (
    <div>
      <PageHeader title={`Trip ${trip.trip_id}`} backUrl="/admin/trips" />
      <Card className="max-w-2xl">
        <CardHeader>
          <CardTitle>Trip Details</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex justify-between py-2 border-b">
            <span className="text-muted-foreground">Trip ID</span>
            <span className="font-medium">{trip.trip_id}</span>
          </div>
          <div className="flex justify-between py-2 border-b">
            <span className="text-muted-foreground">Vehicle</span>
            <span className="font-medium">{trip.vehicle}</span>
          </div>
          <div className="flex justify-between py-2 border-b">
            <span className="text-muted-foreground">Driver</span>
            <span className="font-medium">{trip.driver}</span>
          </div>
          <div className="flex justify-between py-2 border-b">
            <span className="text-muted-foreground">Route</span>
            <span className="font-medium">{trip.route}</span>
          </div>
          <div className="flex justify-between py-2 border-b">
            <span className="text-muted-foreground">Start Time</span>
            <span className="font-medium">{trip.start_time ? format(new Date(trip.start_time), 'PPpp') : '-'}</span>
          </div>
          <div className="flex justify-between py-2 border-b">
            <span className="text-muted-foreground">End Time</span>
            <span className="font-medium">{trip.end_time ? format(new Date(trip.end_time), 'PPpp') : 'Active'}</span>
          </div>
          {trip.remarks && (
            <div className="flex justify-between py-2 border-b">
              <span className="text-muted-foreground">Remarks</span>
              <span className="font-medium text-sm">{trip.remarks}</span>
            </div>
          )}
          <div className="flex justify-between py-2">
            <span className="text-muted-foreground">Created</span>
            <span className="font-medium text-sm">{format(new Date(trip.created_at), 'PPpp')}</span>
          </div>
        </CardContent>
      </Card>
      <div className="mt-4">
        <Button variant="outline" onClick={() => navigate('/admin/trips')}>
          Back to Trips
        </Button>
      </div>
    </div>
  );
}
