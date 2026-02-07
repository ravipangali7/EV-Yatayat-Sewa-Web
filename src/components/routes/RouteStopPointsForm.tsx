import { useState } from 'react';
import { GripVertical, Plus, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { SearchableSelect } from '@/components/common/SearchableSelect';
import { Place } from '@/types';

interface StopPoint {
  id: string;
  place: string;
  order: number;
}

interface RouteStopPointsFormProps {
  value: StopPoint[];
  onChange: (stopPoints: StopPoint[]) => void;
  places?: Place[];
}

export function RouteStopPointsForm({ value, onChange, places = [] }: RouteStopPointsFormProps) {
  const placeOptions = places.map((p) => ({ value: p.id, label: p.name }));
  const [draggedIndex, setDraggedIndex] = useState<number | null>(null);

  const addStopPoint = () => {
    const newStopPoint: StopPoint = {
      id: String(Date.now()),
      place: '',
      order: value.length + 1,
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

  const handleDragStart = (index: number) => {
    setDraggedIndex(index);
  };

  const handleDragOver = (e: React.DragEvent, index: number) => {
    e.preventDefault();
    if (draggedIndex === null || draggedIndex === index) return;

    const updated = [...value];
    const [draggedItem] = updated.splice(draggedIndex, 1);
    updated.splice(index, 0, draggedItem);

    // Update order values
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

              <div className="flex-1">
                <SearchableSelect
                  options={placeOptions}
                  value={stopPoint.place}
                  onChange={(value) => updateStopPoint(index, value)}
                  placeholder="Select place..."
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
    </div>
  );
}
