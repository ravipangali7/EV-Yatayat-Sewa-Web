import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { PageHeader } from '@/components/common/PageHeader';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { SearchableSelect } from '@/components/common/SearchableSelect';
import { RouteStopPointsForm } from '@/components/routes/RouteStopPointsForm';
import { getRoute, getPlaces, getRouteStopPoints, createRoute, updateRoute, createRouteStopPoint, deleteRouteStopPoints } from '@/stores/mockData';
import { toast } from 'sonner';

interface StopPoint {
  id: string;
  place: string;
  order: number;
}

export default function RouteForm() {
  const { id } = useParams();
  const navigate = useNavigate();
  const isEdit = !!id;
  const places = getPlaces();

  const [formData, setFormData] = useState({
    name: '',
    is_bidirectional: false,
    start_point: '',
    end_point: '',
  });

  const [stopPoints, setStopPoints] = useState<StopPoint[]>([]);

  useEffect(() => {
    if (isEdit && id) {
      const route = getRoute(id);
      if (route) {
        setFormData({
          name: route.name,
          is_bidirectional: route.is_bidirectional,
          start_point: route.start_point,
          end_point: route.end_point,
        });

        const existingStopPoints = getRouteStopPoints(id);
        setStopPoints(
          existingStopPoints.map((sp) => ({
            id: sp.id,
            place: sp.place,
            order: sp.order,
          }))
        );
      }
    }
  }, [id, isEdit]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (isEdit && id) {
      updateRoute(id, formData);
      // Update stop points
      deleteRouteStopPoints(id);
      stopPoints.forEach((sp) => {
        createRouteStopPoint({
          route: id,
          place: sp.place,
          order: sp.order,
        });
      });
      toast.success('Route updated successfully');
    } else {
      const newRoute = createRoute(formData);
      // Create stop points
      stopPoints.forEach((sp) => {
        createRouteStopPoint({
          route: newRoute.id,
          place: sp.place,
          order: sp.order,
        });
      });
      toast.success('Route created successfully');
    }
    navigate('/app/routes');
  };

  const placeOptions = places.map((p) => ({ value: p.id, label: p.name }));

  return (
    <div>
      <PageHeader
        title={isEdit ? 'Edit Route' : 'Add Route'}
        subtitle={isEdit ? 'Update route information' : 'Create a new route'}
        backUrl="/app/routes"
      />

      <form onSubmit={handleSubmit} className="space-y-6 max-w-2xl">
        <div className="form-section">
          <div className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="name">Route Name</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                required
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <Label>Start Point</Label>
                <SearchableSelect
                  options={placeOptions}
                  value={formData.start_point}
                  onChange={(value) => setFormData({ ...formData, start_point: value })}
                  placeholder="Select start point..."
                />
              </div>

              <div className="space-y-2">
                <Label>End Point</Label>
                <SearchableSelect
                  options={placeOptions}
                  value={formData.end_point}
                  onChange={(value) => setFormData({ ...formData, end_point: value })}
                  placeholder="Select end point..."
                />
              </div>
            </div>

            <div className="flex items-center gap-3">
              <Switch
                id="is_bidirectional"
                checked={formData.is_bidirectional}
                onCheckedChange={(checked) => setFormData({ ...formData, is_bidirectional: checked })}
              />
              <Label htmlFor="is_bidirectional">Bidirectional Route</Label>
            </div>
          </div>
        </div>

        <div className="form-section">
          <RouteStopPointsForm value={stopPoints} onChange={setStopPoints} />
        </div>

        <div className="flex gap-4">
          <Button type="submit">{isEdit ? 'Update' : 'Create'} Route</Button>
          <Button type="button" variant="outline" onClick={() => navigate('/app/routes')}>
            Cancel
          </Button>
        </div>
      </form>
    </div>
  );
}
