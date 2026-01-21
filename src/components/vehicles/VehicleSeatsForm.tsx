import { Plus, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { VehicleSeatSide, VehicleSeatStatus } from '@/types';
import { BusSeatVisualizer } from './BusSeatVisualizer';

interface SeatForm {
  id: string;
  side: VehicleSeatSide;
  number: number;
  status: VehicleSeatStatus;
}

interface VehicleSeatsFormProps {
  value: SeatForm[];
  onChange: (seats: SeatForm[]) => void;
}

export function VehicleSeatsForm({ value, onChange }: VehicleSeatsFormProps) {
  const addSeat = () => {
    const newSeat: SeatForm = {
      id: String(Date.now()),
      side: 'A',
      number: value.length + 1,
      status: 'available',
    };
    onChange([...value, newSeat]);
  };

  const removeSeat = (index: number) => {
    onChange(value.filter((_, i) => i !== index));
  };

  const updateSeat = (index: number, field: keyof SeatForm, fieldValue: string | number) => {
    const updated = [...value];
    updated[index] = { ...updated[index], [field]: fieldValue };
    onChange(updated);
  };

  // Convert to VehicleSeat format for visualizer
  const seatsForVisualizer = value.map((s, i) => ({
    id: s.id,
    vehicle: '',
    side: s.side,
    number: s.number,
    status: s.status,
    created_at: '',
    updated_at: '',
  }));

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="font-semibold text-foreground">Vehicle Seats</h3>
        <Button type="button" variant="outline" size="sm" onClick={addSeat}>
          <Plus className="w-4 h-4 mr-2" />
          Add Seat
        </Button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Seat Forms */}
        <div className="space-y-3 max-h-96 overflow-y-auto pr-2 scrollbar-thin">
          {value.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground bg-muted/30 rounded-lg border border-dashed border-border">
              No seats added. Click "Add Seat" to add seats.
            </div>
          ) : (
            value.map((seat, index) => (
              <div key={seat.id} className="multiform-item">
                <div className="grid grid-cols-3 gap-3">
                  <div className="space-y-1">
                    <Label className="text-xs">Side</Label>
                    <Select
                      value={seat.side}
                      onValueChange={(val: VehicleSeatSide) => updateSeat(index, 'side', val)}
                    >
                      <SelectTrigger className="h-9">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="A">A</SelectItem>
                        <SelectItem value="B">B</SelectItem>
                        <SelectItem value="C">C</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-1">
                    <Label className="text-xs">Number</Label>
                    <Input
                      type="number"
                      min="1"
                      value={seat.number}
                      onChange={(e) => updateSeat(index, 'number', parseInt(e.target.value) || 1)}
                      className="h-9"
                    />
                  </div>

                  <div className="space-y-1">
                    <Label className="text-xs">Status</Label>
                    <div className="flex gap-2">
                      <button
                        type="button"
                        onClick={() => updateSeat(index, 'status', 'available')}
                        className={`flex-1 h-9 rounded-md text-xs font-medium transition-colors ${
                          seat.status === 'available'
                            ? 'bg-success/20 text-success border-2 border-success'
                            : 'bg-muted text-muted-foreground border border-border hover:border-success/50'
                        }`}
                      >
                        Available
                      </button>
                      <button
                        type="button"
                        onClick={() => updateSeat(index, 'status', 'booked')}
                        className={`flex-1 h-9 rounded-md text-xs font-medium transition-colors ${
                          seat.status === 'booked'
                            ? 'bg-destructive/20 text-destructive border-2 border-destructive'
                            : 'bg-muted text-muted-foreground border border-border hover:border-destructive/50'
                        }`}
                      >
                        Booked
                      </button>
                    </div>
                  </div>
                </div>

                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  onClick={() => removeSeat(index)}
                  className="absolute top-2 right-2 h-6 w-6 text-destructive hover:text-destructive hover:bg-destructive/10"
                >
                  <Trash2 className="w-3 h-3" />
                </Button>
              </div>
            ))
          )}
        </div>

        {/* Bus Seat Visualizer */}
        {value.length > 0 && <BusSeatVisualizer seats={seatsForVisualizer} />}
      </div>
    </div>
  );
}
