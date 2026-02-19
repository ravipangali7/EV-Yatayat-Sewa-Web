import { useState } from 'react';
import { GripVertical, Plus, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { SearchableSelect } from '@/components/common/SearchableSelect';
import { PlaceFormModal } from '@/components/places/PlaceFormModal';
import type { PlaceFormData } from '@/components/places/PlaceFormFields';
import { Place } from '@/types';
import { toast } from 'sonner';

const LEADING_ADD_NEW = '__add_new_place__';
const LEADING_CURRENT_LOCATION = '__current_location__';

const leadingOptions = [
  { value: LEADING_ADD_NEW, label: 'Add New place' },
  { value: LEADING_CURRENT_LOCATION, label: 'Current location' },
];

async function reverseGeocode(lat: number, lng: number): Promise<string> {
  try {
    const response = await fetch(
      `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}&zoom=18&addressdetails=1`,
      { headers: { 'Accept-Language': 'en' } }
    );
    const data = await response.json();
    return data.display_name || '';
  } catch {
    return '';
  }
}

interface StopPoint {
  id: string;
  place: string;
  order: number;
  announcement_text?: string;
}

interface RouteStopPointsFormProps {
  value: StopPoint[];
  onChange: (stopPoints: StopPoint[]) => void;
  places?: Place[];
  onPlaceCreated?: (place: { id: string; name: string }) => void;
  onPlaceUpdated?: (place: { id: string; name: string }) => void;
}

export function RouteStopPointsForm({
  value,
  onChange,
  places = [],
  onPlaceCreated,
  onPlaceUpdated,
}: RouteStopPointsFormProps) {
  const placeOptions = places.map((p) => ({ value: p.id, label: p.name }));
  const [draggedIndex, setDraggedIndex] = useState<number | null>(null);

  const [placeModalOpen, setPlaceModalOpen] = useState(false);
  const [placeModalMode, setPlaceModalMode] = useState<'add' | 'edit'>('add');
  const [placeModalPlaceId, setPlaceModalPlaceId] = useState<string | undefined>(undefined);
  const [placeModalInitialData, setPlaceModalInitialData] = useState<Partial<PlaceFormData> | null>(null);
  const [placeModalStopIndex, setPlaceModalStopIndex] = useState<number>(0);

  const addStopPoint = () => {
    const newStopPoint: StopPoint = {
      id: String(Date.now()),
      place: '',
      order: value.length + 1,
      announcement_text: '',
    };
    onChange([...value, newStopPoint]);
  };

  const removeStopPoint = (index: number) => {
    const updated = value.filter((_, i) => i !== index).map((sp, i) => ({
      ...sp,
      order: i + 1,
    }));
    onChange(updated);
  };

  const updateStopPoint = (index: number, placeId: string) => {
    const updated = [...value];
    updated[index] = { ...updated[index], place: placeId };
    onChange(updated);
  };

  const updateStopPointAnnouncement = (index: number, announcementText: string) => {
    const updated = [...value];
    updated[index] = { ...updated[index], announcement_text: announcementText };
    onChange(updated);
  };

  const openAddPlaceModal = (stopIndex: number, initialData?: Partial<PlaceFormData> | null) => {
    setPlaceModalStopIndex(stopIndex);
    setPlaceModalMode('add');
    setPlaceModalPlaceId(undefined);
    setPlaceModalInitialData(initialData ?? null);
    setPlaceModalOpen(true);
  };

  const handlePlaceModalSuccess = (place: Place) => {
    if (placeModalMode === 'edit') {
      onPlaceUpdated?.({ id: place.id, name: place.name });
    } else {
      onPlaceCreated?.({ id: place.id, name: place.name });
      updateStopPoint(placeModalStopIndex, place.id);
    }
    setPlaceModalOpen(false);
  };

  const handleLeadingSelect = (stopIndex: number, leadingValue: string) => {
    if (leadingValue === LEADING_ADD_NEW) {
      openAddPlaceModal(stopIndex);
      return;
    }
    if (leadingValue === LEADING_CURRENT_LOCATION) {
      if (!navigator.geolocation) {
        toast.error('Geolocation is not supported by your browser');
        return;
      }
      navigator.geolocation.getCurrentPosition(
        async (position) => {
          const lat = position.coords.latitude;
          const lng = position.coords.longitude;
          const address = await reverseGeocode(lat, lng);
          openAddPlaceModal(stopIndex, {
            name: 'Current location',
            code: 'CURR',
            latitude: lat,
            longitude: lng,
            address: address || '',
          });
        },
        () => {
          toast.error('Could not get your location. Check permissions or try again.');
        }
      );
    }
  };

  const handleDragStart = (index: number) => {
    setDraggedIndex(index);
  };

  const handleDragOver = (e: React.DragEvent, index: number) => {
    e.preventDefault();
    if (draggedIndex === null || draggedIndex === index) return;

    const updated = [...value];
    const [draggedItem] = updated.splice(draggedIndex, 1);
    updated.splice(index, 0, draggedItem);

    const reordered = updated.map((sp, i) => ({ ...sp, order: i + 1 }));
    onChange(reordered);
    setDraggedIndex(index);
  };

  const handleDragEnd = () => {
    setDraggedIndex(null);
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="font-semibold text-foreground">Route Stop Points</h3>
        <Button type="button" variant="outline" size="sm" onClick={addStopPoint}>
          <Plus className="w-4 h-4 mr-2" />
          Add Stop
        </Button>
      </div>

      {value.length === 0 ? (
        <div className="text-center py-8 text-muted-foreground bg-muted/30 rounded-lg border border-dashed border-border">
          No stop points added. Click "Add Stop" to add intermediate stops.
        </div>
      ) : (
        <div className="space-y-2">
          {value.map((stopPoint, index) => (
            <div
              key={stopPoint.id}
              draggable
              onDragStart={() => handleDragStart(index)}
              onDragOver={(e) => handleDragOver(e, index)}
              onDragEnd={handleDragEnd}
              className={`multiform-item flex items-center gap-4 ${
                draggedIndex === index ? 'opacity-50 border-primary' : ''
              }`}
            >
              <div className="drag-handle">
                <GripVertical className="w-5 h-5" />
              </div>

              <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                <span className="font-semibold text-primary">{stopPoint.order}</span>
              </div>

              <div className="flex-1 grid grid-cols-1 md:grid-cols-2 gap-2">
                <SearchableSelect
                  options={placeOptions}
                  value={stopPoint.place}
                  onChange={(val) => updateStopPoint(index, val)}
                  placeholder="Select place..."
                  leadingOptions={leadingOptions}
                  onLeadingSelect={(val) => handleLeadingSelect(index, val)}
                />
                <Input
                  value={stopPoint.announcement_text ?? ''}
                  onChange={(e) => updateStopPointAnnouncement(index, e.target.value)}
                  placeholder="Announcement text (optional)"
                  className="text-sm"
                />
              </div>

              <Button
                type="button"
                variant="ghost"
                size="icon"
                onClick={() => removeStopPoint(index)}
                className="text-destructive hover:text-destructive hover:bg-destructive/10"
              >
                <Trash2 className="w-4 h-4" />
              </Button>
            </div>
          ))}
        </div>
      )}

      <PlaceFormModal
        open={placeModalOpen}
        onOpenChange={setPlaceModalOpen}
        mode={placeModalMode}
        placeId={placeModalPlaceId}
        initialData={placeModalInitialData}
        onSuccess={handlePlaceModalSuccess}
      />
    </div>
  );
}
