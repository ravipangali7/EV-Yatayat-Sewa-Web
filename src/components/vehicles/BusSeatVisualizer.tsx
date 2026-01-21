import { VehicleSeat, VehicleSeatSide, VehicleSeatStatus } from '@/types';
import { cn } from '@/lib/utils';

interface BusSeatVisualizerProps {
  seats: VehicleSeat[];
}

export function BusSeatVisualizer({ seats }: BusSeatVisualizerProps) {
  // Group seats by side
  const seatsBySide: Record<VehicleSeatSide, VehicleSeat[]> = {
    A: seats.filter(s => s.side === 'A').sort((a, b) => a.number - b.number),
    B: seats.filter(s => s.side === 'B').sort((a, b) => a.number - b.number),
    C: seats.filter(s => s.side === 'C').sort((a, b) => a.number - b.number),
  };

  // Calculate max rows (seats are in pairs, so divide by 2)
  const maxSeatsPerColumn = 2;
  const maxRows = Math.max(
    Math.ceil(seatsBySide.A.length / maxSeatsPerColumn),
    Math.ceil(seatsBySide.B.length / maxSeatsPerColumn)
  );

  // Render a single seat
  const renderSeat = (seat: VehicleSeat | undefined, placeholder = false) => {
    if (!seat || placeholder) {
      return <div className="seat seat-empty opacity-20" />;
    }

    return (
      <div
        className={cn(
          'seat',
          seat.status === 'available' ? 'seat-available' : 'seat-booked'
        )}
        title={`${seat.side}${seat.number} - ${seat.status}`}
      >
        {seat.side}{seat.number}
      </div>
    );
  };

  // Render seats in rows for A and B sections
  const renderRows = () => {
    const rows = [];

    for (let row = 0; row < maxRows; row++) {
      const aSeat1Index = row * 2;
      const aSeat2Index = row * 2 + 1;
      const bSeat1Index = row * 2;
      const bSeat2Index = row * 2 + 1;

      rows.push(
        <div key={row} className="flex items-center gap-2 justify-center">
          {/* Side A - 2 columns */}
          <div className="flex gap-1">
            {renderSeat(seatsBySide.A[aSeat1Index])}
            {renderSeat(seatsBySide.A[aSeat2Index])}
          </div>

          {/* Aisle */}
          <div className="w-8" />

          {/* Side B - 2 columns */}
          <div className="flex gap-1">
            {renderSeat(seatsBySide.B[bSeat1Index])}
            {renderSeat(seatsBySide.B[bSeat2Index])}
          </div>
        </div>
      );
    }

    return rows;
  };

  return (
    <div className="bg-muted/30 rounded-xl p-6 border border-border">
      <h4 className="font-semibold text-center mb-4 text-foreground">Bus Seat Layout</h4>

      {/* Legend */}
      <div className="flex justify-center gap-4 mb-6">
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 rounded bg-success/20 border-2 border-success/50" />
          <span className="text-xs text-muted-foreground">Available</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 rounded bg-destructive/20 border-2 border-destructive/50" />
          <span className="text-xs text-muted-foreground">Booked</span>
        </div>
      </div>

      {/* Bus Container */}
      <div className="bus-container mx-auto max-w-xs">
        {/* Bus Front */}
        <div className="bus-front" />

        {/* Column Headers */}
        <div className="flex justify-center gap-2 mb-4 mt-4">
          <div className="flex gap-1 w-[84px] justify-center">
            <span className="text-xs font-semibold text-muted-foreground w-10 text-center">A</span>
          </div>
          <div className="w-8" />
          <div className="flex gap-1 w-[84px] justify-center">
            <span className="text-xs font-semibold text-muted-foreground w-10 text-center">B</span>
          </div>
        </div>

        {/* Main seating area */}
        <div className="space-y-2">
          {renderRows()}
        </div>

        {/* Side C - Back row */}
        {seatsBySide.C.length > 0 && (
          <div className="mt-4 pt-4 border-t border-border">
            <div className="flex justify-center">
              <div className="flex gap-1 items-center">
                <span className="text-xs font-semibold text-muted-foreground mr-2">C</span>
                {seatsBySide.C.map((seat) => renderSeat(seat))}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
