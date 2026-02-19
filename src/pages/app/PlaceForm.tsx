import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { PageHeader } from '@/components/common/PageHeader';
import { PlaceFormFields, type PlaceFormData } from '@/components/places/PlaceFormFields';
import { placeApi } from '@/modules/places/services/placeApi';
import { toast } from 'sonner';
import { toNumber } from '@/lib/utils';

export default function PlaceForm() {
  const { id } = useParams();
  const navigate = useNavigate();
  const isEdit = !!id;

  const [initialData, setInitialData] = useState<{
    name: string;
    code: string;
    latitude: number;
    longitude: number;
    address: string;
  } | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const fetchPlace = async () => {
      if (isEdit && id) {
        try {
          setLoading(true);
          const place = await placeApi.get(id);
          setInitialData({
            name: place.name || '',
            code: place.code || '',
            latitude: toNumber(place.latitude, 40.7128),
            longitude: toNumber(place.longitude, -74.006),
            address: place.address || '',
          });
        } catch (error) {
          toast.error('Failed to load place');
          console.error(error);
        } finally {
          setLoading(false);
        }
      }
    };
    fetchPlace();
  }, [id, isEdit]);

  const handleSubmit = async (data: PlaceFormData) => {
    if (isEdit && id) {
      return placeApi.edit(id, data);
    }
    return placeApi.create(data);
  };

  if (isEdit && loading && initialData === null) {
    return (
      <div>
        <PageHeader title="Edit Place" subtitle="Update place information" backUrl="/admin/places" />
        <p className="text-muted-foreground">Loading...</p>
      </div>
    );
  }

  return (
    <div>
      <PageHeader
        title={isEdit ? 'Edit Place' : 'Add Place'}
        subtitle={isEdit ? 'Update place information' : 'Create a new place'}
        backUrl="/admin/places"
      />

      <PlaceFormFields
        initialData={initialData ?? undefined}
        onSubmit={handleSubmit}
        onSuccess={() => {
          toast.success(isEdit ? 'Place updated successfully' : 'Place created successfully');
          navigate('/admin/places');
        }}
        onCancel={() => navigate('/admin/places')}
        cancelLabel="Cancel"
        isEdit={isEdit}
      />
    </div>
  );
}
