import { useParams, useNavigate } from 'react-router-dom';
import { useState, useEffect } from 'react';
import { PageHeader } from '@/components/common/PageHeader';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { vehicleScheduleApi, type VehicleScheduleRecord } from '@/modules/vehicle-schedules/services/vehicleScheduleApi';
import { toast } from 'sonner';
import { format } from 'date-fns';

export default function VehicleScheduleView() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [schedule, setSchedule] = useState<VehicleScheduleRecord | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!id) return;
    vehicleScheduleApi.get(id)
      .then(setSchedule)
      .catch(() => toast.error('Failed to load schedule'))
      .finally(() => setLoading(false));
  }, [id]);

  if (loading || !schedule) {
    return (
      <div>
        <PageHeader title="Vehicle Schedule" backUrl="/admin/vehicle-schedules" />
        <p className="text-muted-foreground py-8">Loading...</p>
      </div>
    );
  }

  return (
    <div>
      <PageHeader title={`Schedule ${schedule.id}`} backUrl="/admin/vehicle-schedules" />
      <Card className="max-w-xl">
        <CardHeader><CardTitle>Schedule Details</CardTitle></CardHeader>
        <CardContent className="space-y-2">
          <div className="flex justify-between py-2 border-b"><span className="text-muted-foreground">Vehicle</span><span>{schedule.vehicle}</span></div>
          <div className="flex justify-between py-2 border-b"><span className="text-muted-foreground">Route</span><span>{schedule.route}</span></div>
          <div className="flex justify-between py-2 border-b"><span className="text-muted-foreground">Date</span><span>{format(new Date(schedule.date), 'PP')}</span></div>
          <div className="flex justify-between py-2 border-b"><span className="text-muted-foreground">Time</span><span>{schedule.time}</span></div>
          <div className="flex justify-between py-2 border-b"><span className="text-muted-foreground">Price</span><span>Rs. {Number(schedule.price).toFixed(2)}</span></div>
        </CardContent>
      </Card>
      <div className="mt-4 flex gap-2">
        <Button onClick={() => navigate(`/admin/vehicle-schedules/${id}/edit`)}>Edit</Button>
        <Button variant="outline" onClick={() => navigate('/admin/vehicle-schedules')}>Back</Button>
      </div>
    </div>
  );
}
