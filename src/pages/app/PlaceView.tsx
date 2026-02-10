import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Edit } from 'lucide-react';
import { PageHeader } from '@/components/common/PageHeader';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { MiniMap } from '@/components/maps/MiniMap';
import { placeApi } from '@/modules/places/services/placeApi';
import { Place } from '@/types';
import { toast } from 'sonner';
import { toNumber } from '@/lib/utils';

export default function PlaceView() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [place, setPlace] = useState<Place | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const fetchPlace = async () => {
      if (!id) return;
      setLoading(true);
      try {
        const placeData = await placeApi.get(id);
        setPlace(placeData);
      } catch (error) {
        toast.error('Failed to load place');
        console.error(error);
      } finally {
        setLoading(false);
      }
    };
    fetchPlace();
  }, [id]);

  if (loading) {
    return (
      <div className="text-center py-12">
        <p className="text-muted-foreground">Loading place...</p>
      </div>
    );
  }

  if (!place) {
    return (
      <div className="text-center py-12">
        <p className="text-muted-foreground">Place not found</p>
        <Button className="mt-4" onClick={() => navigate('/admin/places')}>
          Back to Places
        </Button>
      </div>
    );
  }

  const lat = toNumber(place.latitude, 0);
  const lng = toNumber(place.longitude, 0);

  return (
    <div>
      <PageHeader
        title="Place Details"
        subtitle={place.name}
        backUrl="/admin/places"
        actions={
          <Button onClick={() => navigate(`/admin/places/${id}/edit`)}>
            <Edit className="w-4 h-4 mr-2" />
            Edit
          </Button>
        }
      />

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Place Information */}
        <Card>
          <CardHeader>
            <CardTitle>Place Information</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex justify-between items-center py-2 border-b border-border">
              <span className="text-muted-foreground">Name</span>
              <span className="font-medium">{place.name}</span>
            </div>
            <div className="flex justify-between items-center py-2 border-b border-border">
              <span className="text-muted-foreground">Code</span>
              <span className="font-medium">{place.code}</span>
            </div>
            <div className="flex justify-between items-center py-2 border-b border-border">
              <span className="text-muted-foreground">Latitude</span>
              <span className="font-medium font-mono">{lat.toFixed(6)}</span>
            </div>
            <div className="flex justify-between items-center py-2 border-b border-border">
              <span className="text-muted-foreground">Longitude</span>
              <span className="font-medium font-mono">{lng.toFixed(6)}</span>
            </div>
            <div className="flex justify-between items-start py-2 border-b border-border">
              <span className="text-muted-foreground">Coordinates</span>
              <span className="font-medium font-mono text-right">
                {lat.toFixed(6)}, {lng.toFixed(6)}
              </span>
            </div>
            {place.address && (
              <div className="flex justify-between items-start py-2 border-b border-border">
                <span className="text-muted-foreground">Address</span>
                <span className="font-medium text-right max-w-xs">{place.address}</span>
              </div>
            )}
            <div className="flex justify-between items-center py-2">
              <span className="text-muted-foreground">Created At</span>
              <span className="font-medium text-sm">
                {new Date(place.created_at).toLocaleString()}
              </span>
            </div>
          </CardContent>
        </Card>

        {/* Map */}
        <Card>
          <CardHeader>
            <CardTitle>Location Map</CardTitle>
          </CardHeader>
          <CardContent>
            <MiniMap
              markers={[
                {
                  lat,
                  lng,
                  label: place.name,
                },
              ]}
              height="400px"
              zoom={15}
              center={{ lat, lng }}
            />
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
