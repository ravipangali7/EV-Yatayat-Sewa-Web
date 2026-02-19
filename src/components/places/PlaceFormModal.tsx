import { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { PlaceFormFields, type PlaceFormData } from '@/components/places/PlaceFormFields';
import { placeApi } from '@/modules/places/services/placeApi';
import { Place } from '@/types';
import { toast } from 'sonner';
import { toNumber } from '@/lib/utils';

interface PlaceFormModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  mode: 'add' | 'edit';
  placeId?: string;
  /** Pre-fill for add mode (e.g. Current location). Ignored in edit mode. */
  initialData?: Partial<PlaceFormData> | null;
  onSuccess: (place: Place) => void;
}

export function PlaceFormModal({
  open,
  onOpenChange,
  mode,
  placeId,
  initialData,
  onSuccess,
}: PlaceFormModalProps) {
  const [loadedData, setLoadedData] = useState<PlaceFormData | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!open) {
      setLoadedData(null);
      return;
    }
    if (mode === 'edit' && placeId) {
      setLoading(true);
      placeApi
        .get(placeId)
        .then((place) => {
          setLoadedData({
            name: place.name || '',
            code: place.code || '',
            latitude: toNumber(place.latitude, 0),
            longitude: toNumber(place.longitude, 0),
            address: place.address || '',
          });
        })
        .catch((error) => {
          console.error(error);
          toast.error('Failed to load place');
          onOpenChange(false);
        })
        .finally(() => setLoading(false));
    } else {
      setLoadedData(null);
    }
  }, [open, mode, placeId]);

  const handleSubmit = async (data: PlaceFormData) => {
    if (mode === 'edit' && placeId) {
      return placeApi.edit(placeId, data);
    }
    return placeApi.create(data);
  };

  const handleSuccess = (place: Place) => {
    toast.success(mode === 'edit' ? 'Place updated successfully' : 'Place created successfully');
    onSuccess(place);
    onOpenChange(false);
  };

  const handleCancel = () => {
    onOpenChange(false);
  };

  const formInitialData = mode === 'edit' ? loadedData : (initialData ?? undefined);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{mode === 'edit' ? 'Edit Place' : 'Add Place'}</DialogTitle>
        </DialogHeader>
        {mode === 'edit' && loading ? (
          <p className="text-muted-foreground py-4">Loading...</p>
        ) : (
          <PlaceFormFields
            key={open ? (mode === 'edit' ? placeId : 'add') : 'closed'}
            initialData={formInitialData ?? undefined}
            onSubmit={handleSubmit}
            onSuccess={handleSuccess}
            onCancel={handleCancel}
            submitLabel={mode === 'edit' ? 'Update Place' : 'Create Place'}
            cancelLabel="Cancel"
            isEdit={mode === 'edit'}
            idPrefix="place-modal"
          />
        )}
      </DialogContent>
    </Dialog>
  );
}
