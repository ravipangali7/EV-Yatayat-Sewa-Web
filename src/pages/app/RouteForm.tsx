import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { PageHeader } from '@/components/common/PageHeader';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { SearchableSelect } from '@/components/common/SearchableSelect';
import { RouteStopPointsForm } from '@/components/routes/RouteStopPointsForm';
import { routeApi } from '@/modules/routes/services/routeApi';
import { placeApi } from '@/modules/places/services/placeApi';
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
  const [places, setPlaces] = useState<Array<{ id: string; name: string }>>([]);

  const [formData, setFormData] = useState({
    name: '',
    is_bidirectional: false,
    start_point: '',
    end_point: '',
  });

  const [stopPoints, setStopPoints] = useState<StopPoint[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const fetchPlaces = async () => {
      try {
        const response = await placeApi.list({ per_page: 1000 });
        setPlaces(response.results.map(p => ({ id: p.id, name: p.name })));
      } catch (error) {
        console.error('Failed to load places:', error);
      }
    };
    fetchPlaces();
  }, []);

  useEffect(() => {
    const fetchRoute = async () => {
      if (isEdit && id) {
        try {
          setLoading(true);
          const route = await routeApi.get(id);
          setFormData({
            name: route.name || '',
            is_bidirectional: route.is_bidirectional || false,
            start_point: route.start_point || '',
            end_point: route.end_point || '',
          });

          if (route.stop_points) {
            setStopPoints(
              route.stop_points.map((sp) => ({
                id: sp.id,
                place: sp.place,
                order: sp.order,
              }))
            );
          }
        } catch (error) {
          toast.error('Failed to load route');
          console.error(error);
        } finally {
          setLoading(false);
        }
      }
    };
    fetchRoute();
  }, [id, isEdit]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const routeData = {
        ...formData,
        stop_points: stopPoints.map(sp => ({ place: sp.place, order: sp.order })),
      };

      if (isEdit && id) {
        await routeApi.edit(id, routeData);
        toast.success('Route updated successfully');
      } else {
        await routeApi.create(routeData);
        toast.success('Route created successfully');
      }
      navigate('/app/routes');
    } catch (error) {
      console.error(error);
      // Error is already handled by API interceptor
    } finally {
      setLoading(false);
    }
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
          <RouteStopPointsForm value={stopPoints} onChange={setStopPoints} places={places} />
        </div>

        <div className="flex gap-4">
          <Button type="submit" disabled={loading}>{isEdit ? 'Update' : 'Create'} Route</Button>
          <Button type="button" variant="outline" onClick={() => navigate('/app/routes')} disabled={loading}>
            Cancel
          </Button>
        </div>
      </form>
    </div>
  );
}
