import { useMemo } from 'react';
import { cn } from '@/lib/utils';

export type SeatPosition = { side: string; number: number };

/** Parse flat seat_layout (e.g. ["x","-","-","y",":","x","-","x","x",":"]) into rows.
 * ":" = new row, x = seat, y = driver, - = empty.
 * Returns list of rows, each row is list of cell chars.
 */
function parseSeatLayout(seatLayout: string[] | undefined): string[][] {
  if (!seatLayout || !Array.isArray(seatLayout) || seatLayout.length === 0) {
    return [];
  }
  const rows: string[][] = [];
  let currentRow: string[] = [];
  for (const cell of seatLayout) {
    if (cell === ':') {
      if (currentRow.length) {
        rows.push(currentRow);
        currentRow = [];
      }
    } else {
      currentRow.push(String(cell));
    }
  }
  if (currentRow.length) rows.push(currentRow);
  return rows;
}

/** Build (rowIndex, cellIndex) -> { side, number } for each "x" cell.
 * Layout structure comes from rows; labels/keys come from seats by index:
 * i-th "x" cell (row-major) uses seats[i] so numbering and status match the seats list.
 */
function buildPositionMap(
  rows: string[][],
  seats: Array<{ side: string; number: number }>
): Map<string, SeatPosition> {
  const map = new Map<string, SeatPosition>();
  const sides = 'ABCDEFGHIJ'.split('');
  let seatIndex = 0;
  for (let ri = 0; ri < rows.length; ri++) {
    let num = 0;
    const row = rows[ri];
    for (let ci = 0; ci < row.length; ci++) {
      if (row[ci] === 'x') {
        num += 1;
        const key = `${ri}-${ci}`;
        if (seatIndex < seats.length) {
          map.set(key, { side: seats[seatIndex].side, number: seats[seatIndex].number });
        } else {
          const side = sides[ri] || String.fromCharCode(65 + ri);
          map.set(key, { side, number: num });
        }
        seatIndex += 1;
      }
    }
  }
  return map;
}

function seatKey(s: SeatPosition): string {
  return `${s.side}${s.number}`;
}

interface SeatLayoutVisualizerProps {
  seatLayout: string[];
  seats?: Array<{ side: string; number: number }>;
  bookedSeats?: Set<string> | Array<string>;
  selectedSeats?: SeatPosition[];
  multiSelect?: boolean;
  onSeatClick?: (position: SeatPosition) => void;
  onlyAvailable?: boolean;
  size?: 'default' | 'large';
}

const cellSize = (size: 'default' | 'large') => (size === 'large' ? 'h-12 w-12' : 'h-8 w-8');

export function SeatLayoutVisualizer({
  seatLayout,
  seats = [],
  bookedSeats,
  selectedSeats = [],
  multiSelect = false,
  onSeatClick,
  onlyAvailable = false,
  size = 'default',
}: SeatLayoutVisualizerProps) {
  const cellClass = cellSize(size);
  const rows = useMemo(() => parseSeatLayout(seatLayout), [seatLayout]);
  const positionMap = useMemo(() => buildPositionMap(rows, seats), [rows, seats]);

  const bookedSet = useMemo(() => {
    if (!bookedSeats) return new Set<string>();
    if (bookedSeats instanceof Set) return bookedSeats;
    return new Set(bookedSeats);
  }, [bookedSeats]);

  const selectedSet = useMemo(
    () => new Set(selectedSeats.map(seatKey)),
    [selectedSeats]
  );

  const seatExistsSet = useMemo(() => {
    const s = new Set<string>();
    for (const se of seats) {
      s.add(`${se.side}${se.number}`);
    }
    return s;
  }, [seats]);

  const getPositionAt = (ri: number, ci: number): SeatPosition | null => {
    return positionMap.get(`${ri}-${ci}`) ?? null;
  };

  const isBooked = (pos: SeatPosition) => bookedSet.has(seatKey(pos));
  const isSelected = (pos: SeatPosition) => selectedSet.has(seatKey(pos));
  const hasSeat = (pos: SeatPosition) => seatExistsSet.size === 0 || seatExistsSet.has(seatKey(pos));

  const handleCellClick = (ri: number, ci: number) => {
    const pos = getPositionAt(ri, ci);
    if (pos && onSeatClick && (hasSeat(pos) || !onlyAvailable)) {
      if (onlyAvailable && isBooked(pos)) return;
      onSeatClick(pos);
    }
  };

  if (rows.length === 0) {
    return (
      <div className="rounded-lg border border-border bg-muted/30 p-4 text-center text-sm text-muted-foreground">
        No seat layout defined.
      </div>
    );
  }

  return (
    <div className="rounded-xl border border-border bg-muted/30 p-4">
      <h4 className="mb-3 text-center font-semibold text-foreground">Seat Layout</h4>
      <div className="flex flex-col items-center gap-1">
        {rows.map((row, ri) => (
          <div key={ri} className="flex items-center gap-1">
            {row.map((cell, ci) => {
              if (cell === '-') {
                return <div key={ci} className={cellClass} />;
              }
              if (cell === 'y') {
                return (
                  <div
                    key={ci}
                    className={cn('flex items-center justify-center rounded bg-amber-500/30 text-xs font-bold text-amber-700', cellClass)}
                    title="Driver"
                  >
                    D
                  </div>
                );
              }
              if (cell === 'x') {
                const pos = getPositionAt(ri, ci);
                if (!pos) {
                  return <div key={ci} className={cellClass} />;
                }
                const booked = isBooked(pos);
                const selected = isSelected(pos);
                const clickable = onSeatClick && (!onlyAvailable || !booked);
                return (
                  <button
                    key={ci}
                    type="button"
                    title={`${pos.side}${pos.number}${booked ? ' (booked)' : ''}`}
                    className={cn(
                      'flex items-center justify-center rounded text-xs font-medium transition-colors',
                      cellClass,
                      selected && 'ring-2 ring-primary ring-offset-1',
                      booked && 'bg-destructive/20 text-destructive cursor-not-allowed opacity-70',
                      !booked && !selected && 'bg-success/20 text-success hover:bg-success/40',
                      clickable && !booked && 'cursor-pointer'
                    )}
                    onClick={() => handleCellClick(ri, ci)}
                    disabled={booked && onlyAvailable}
                  >
                    {pos.side}{pos.number}
                  </button>
                );
              }
              return <div key={ci} className={cellClass} />;
            })}
          </div>
        ))}
      </div>
    </div>
  );
}
