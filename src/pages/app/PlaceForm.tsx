import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { PageHeader } from '@/components/common/PageHeader';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { PlaceMap } from '@/components/places/PlaceMap';
import { getPlace, createPlace, updatePlace } from '@/stores/mockData';
import { toast } from 'sonner';

export default function PlaceForm() {
  const { id } = useParams();
  const navigate = useNavigate();
  const isEdit = !!id;

  const [formData, setFormData] = useState({
    name: '',
    code: '',
    latitude: 40.7128,
    longitude: -74.0060,
    address: '',
  });

  useEffect(() => {
    if (isEdit && id) {
      const place = getPlace(id);
      if (place) {
        setFormData({
          name: place.name,
          code: place.code,
          latitude: place.latitude,
          longitude: place.longitude,
          address: place.address,
        });
      }
    }
  }, [id, isEdit]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (isEdit && id) {
      updatePlace(id, formData);
      toast.success('Place updated successfully');
    } else {
      createPlace(formData);
      toast.success('Place created successfully');
    }
    navigate('/app/places');
  };

  const handleLocationChange = (lat: number, lng: number, address: string) => {
    setFormData((prev) => ({
      ...prev,
      latitude: lat,
      longitude: lng,
      address: address || prev.address,
    }));
  };

  return (
    <div>
      <PageHeader
        title={isEdit ? 'Edit Place' : 'Add Place'}
        subtitle={isEdit ? 'Update place information' : 'Create a new place'}
        backUrl="/app/places"
      />

      <form onSubmit={handleSubmit} className="space-y-6 max-w-2xl">
        <div className="form-section">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <Label htmlFor="name">Name</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="code">Code</Label>
              <Input
                id="code"
                value={formData.code}
                onChange={(e) => setFormData({ ...formData, code: e.target.value.toUpperCase() })}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="latitude">Latitude</Label>
              <Input
                id="latitude"
                type="number"
                step="any"
                value={formData.latitude}
                disabled
                className="bg-muted"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="longitude">Longitude</Label>
              <Input
                id="longitude"
                type="number"
                step="any"
                value={formData.longitude}
                disabled
                className="bg-muted"
              />
            </div>
          </div>
        </div>

        <div className="form-section">
          <Label className="mb-4 block">Location</Label>
          <PlaceMap
            latitude={formData.latitude}
            longitude={formData.longitude}
            onLocationChange={handleLocationChange}
          />
        </div>

        <div className="form-section">
          <div className="space-y-2">
            <Label htmlFor="address">Address</Label>
            <Textarea
              id="address"
              value={formData.address}
              onChange={(e) => setFormData({ ...formData, address: e.target.value })}
              rows={3}
            />
          </div>
        </div>

        <div className="flex gap-4">
          <Button type="submit">{isEdit ? 'Update' : 'Create'} Place</Button>
          <Button type="button" variant="outline" onClick={() => navigate('/app/places')}>
            Cancel
          </Button>
        </div>
      </form>
    </div>
  );
}
