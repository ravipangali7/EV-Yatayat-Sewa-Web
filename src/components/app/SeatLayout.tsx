import { useState } from "react";
import { User } from "lucide-react";

export interface Seat {
  id: string;
  label: string;
  row: number;
  col: number;
  status: "available" | "booked" | "empty" | "driver";
  bookingId?: string;
  passengerName?: string;
}

interface SeatLayoutProps {
  seats: Seat[];
  onSeatSelect: (selectedSeats: Seat[]) => void;
  selectedSeats: Seat[];
}

const SeatLayout = ({ seats, onSeatSelect, selectedSeats }: SeatLayoutProps) => {
  const toggleSeat = (seat: Seat) => {
    if (seat.status === "empty" || seat.status === "driver") return;

    const isSelected = selectedSeats.some((s) => s.id === seat.id);
    if (isSelected) {
      onSeatSelect(selectedSeats.filter((s) => s.id !== seat.id));
    } else {
      onSeatSelect([...selectedSeats, seat]);
    }
  };

  const maxRow = Math.max(...seats.map((s) => s.row));
  const maxCol = Math.max(...seats.map((s) => s.col));

  const grid: (Seat | null)[][] = [];
  for (let r = 0; r <= maxRow; r++) {
    grid[r] = [];
    for (let c = 0; c <= maxCol; c++) {
      grid[r][c] = seats.find((s) => s.row === r && s.col === c) || null;
    }
  }

  const getSeatClass = (seat: Seat) => {
    const isSelected = selectedSeats.some((s) => s.id === seat.id);
    if (isSelected) return "seat-selected";
    switch (seat.status) {
      case "available": return "seat-available";
      case "booked": return "seat-booked";
      case "driver": return "seat-driver";
      case "empty": return "seat-empty";
      default: return "seat-empty";
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap gap-3 justify-center text-xs">
        <div className="flex items-center gap-1">
          <div className="w-4 h-4 rounded seat-available" />
          <span>Available</span>
        </div>
        <div className="flex items-center gap-1">
          <div className="w-4 h-4 rounded seat-booked" />
          <span>Booked</span>
        </div>
        <div className="flex items-center gap-1">
          <div className="w-4 h-4 rounded seat-selected" />
          <span>Selected</span>
        </div>
        <div className="flex items-center gap-1">
          <div className="w-4 h-4 rounded seat-driver" />
          <span>Driver</span>
        </div>
      </div>

      <div className="flex flex-col items-center gap-2">
        {grid.map((row, rowIdx) => (
          <div key={rowIdx} className="flex gap-2 items-center">
            {row.map((seat, colIdx) => {
              if (!seat) {
                return <div key={colIdx} className="w-14 h-14" />;
              }
              if (seat.status === "empty") {
                return <div key={colIdx} className="w-14 h-14" />;
              }
              return (
                <button
                  key={seat.id}
                  onClick={() => toggleSeat(seat)}
                  disabled={seat.status === "driver"}
                  className={`w-14 h-14 rounded-xl flex flex-col items-center justify-center transition-all active:scale-95 ${getSeatClass(seat)}`}
                >
                  <User size={14} />
                  <span className="text-[9px] font-bold mt-0.5">{seat.label}</span>
                </button>
              );
            })}
          </div>
        ))}
      </div>
    </div>
  );
};

export default SeatLayout;
