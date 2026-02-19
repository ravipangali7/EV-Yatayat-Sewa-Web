import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { PlaceMap } from '@/components/places/PlaceMap';
import { Place } from '@/types';
import { toNumber } from '@/lib/utils';

export interface PlaceFormData {
  name: string;
  code: string;
  latitude: number;
  longitude: number;
  address: string;
}

const defaultFormData: PlaceFormData = {
  name: '',
  code: '',
  latitude: 0,
  longitude: 0,
  address: '',
};

interface PlaceFormFieldsProps {
  /** Initial values (for edit or pre-fill e.g. Current location). When placeId changes, form resets from initialData. */
  initialData?: Partial<PlaceFormData> | null;
  /** Submit handler: perform create or edit, return the saved Place */
  onSubmit: (data: PlaceFormData) => Promise<Place>;
  onSuccess: (place: Place) => void;
  onCancel: () => void;
  submitLabel?: string;
  cancelLabel?: string;
  isEdit?: boolean;
  /** Optional form id prefix to avoid duplicate ids when multiple forms exist (e.g. modal) */
  idPrefix?: string;
}

export function PlaceFormFields({
  initialData,
  onSubmit,
  onSuccess,
  onCancel,
  submitLabel,
  cancelLabel = 'Cancel',
  isEdit = false,
  idPrefix = 'place',
}: PlaceFormFieldsProps) {
  const [formData, setFormData] = useState<PlaceFormData>(() => ({
    ...defaultFormData,
    ...initialData,
  }));
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (initialData != null) {
      setFormData((prev) => ({
        ...defaultFormData,
        ...prev,
        ...initialData,
      }));
    }
  }, [initialData]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const place = await onSubmit(formData);
      onSuccess(place);
    } catch (error) {
      console.error(error);
      // Error is already handled by API interceptor
    } finally {
      setLoading(false);
    }
  };

  const handleLocationChange = (lat: number, lng: number, address: string) => {
    setFormData((prev) => ({
      ...prev,
      latitude: lat,
      longitude: lng,
      address: address || prev.address,
    }));
  };

  const nameId = `${idPrefix}-name`;
  const codeId = `${idPrefix}-code`;
  const latId = `${idPrefix}-latitude`;
  const lngId = `${idPrefix}-longitude`;
  const addressId = `${idPrefix}-address`;

  return (
    <form onSubmit={handleSubmit} className="space-y-6 max-w-2xl">
      <div className="form-section">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-2">
            <Label htmlFor={nameId}>Name</Label>
            <Input
              id={nameId}
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor={codeId}>Code</Label>
            <Input
              id={codeId}
              value={formData.code}
              onChange={(e) => setFormData({ ...formData, code: e.target.value.toUpperCase() })}
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor={latId}>Latitude</Label>
            <Input
              id={latId}
              type="number"
              step="any"
              value={formData.latitude}
              disabled
              className="bg-muted"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor={lngId}>Longitude</Label>
            <Input
              id={lngId}
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
          <Label htmlFor={addressId}>Address</Label>
          <Textarea
            id={addressId}
            value={formData.address}
            onChange={(e) => setFormData({ ...formData, address: e.target.value })}
            rows={3}
          />
        </div>
      </div>

      <div className="flex gap-4">
        <Button type="submit" disabled={loading}>
          {submitLabel ?? (isEdit ? 'Update' : 'Create') + ' Place'}
        </Button>
        <Button type="button" variant="outline" onClick={onCancel} disabled={loading}>
          {cancelLabel}
        </Button>
      </div>
    </form>
  );
}
