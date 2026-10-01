import type { VehicleTicketBookingRecord } from "@/modules/vehicle-ticket-bookings/services/vehicleTicketBookingApi";

function escapeHtml(value: string) {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function seatLabel(booking: VehicleTicketBookingRecord) {
  const seat = booking.seat;
  if (Array.isArray(seat)) {
    return seat
      .map((s) => (s && typeof s === "object" && "side" in s && "number" in s ? `${s.side}${s.number}` : ""))
      .filter(Boolean)
      .join(", ") || "—";
  }
  if (seat && typeof seat === "object" && "side" in seat && "number" in seat) {
    const entry = seat as { side: string; number: number };
    return `${entry.side}${entry.number}`;
  }
  return "—";
}

export function printTicket(booking: VehicleTicketBookingRecord) {
  const sd = booking.schedule_details;
  const from = booking.pickup_point_name || sd?.start_point_name || "—";
  const to = booking.destination_point_name || sd?.end_point_name || "—";
  const vehicle = [sd?.vehicle_name, sd?.vehicle_no].filter(Boolean).join(" · ") || "—";
  const when = [sd?.date, sd?.time].filter(Boolean).join(" ") || "—";
  const html = `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8" />
  <title>Ticket ${escapeHtml(booking.pnr)}</title>
  <style>
    @page { size: 150mm 100mm; margin: 6mm; }
    body { font-family: Arial, Helvetica, sans-serif; margin: 0; color: #111; }
    .ticket { border: 1px solid #111; padding: 10px 12px; }
    h1 { font-size: 16px; text-align: center; margin: 0; letter-spacing: 0.04em; }
    .sub { text-align: center; font-size: 11px; margin: 2px 0 8px; }
    .row { display: flex; justify-content: space-between; gap: 12px; font-size: 12px; margin: 4px 0; }
    .strong { font-weight: 700; }
  </style>
</head>
<body>
  <div class="ticket">
    <h1>EV YATAYAT SEWA</h1>
    <p class="sub">E-Ticket</p>
    <div class="row"><span class="strong">PNR: ${escapeHtml(booking.pnr)}</span><span class="strong">Ticket: ${escapeHtml(booking.ticket_id)}</span></div>
    <div class="row"><span>Route: ${escapeHtml(from)} → ${escapeHtml(to)}</span></div>
    <div class="row"><span>Vehicle: ${escapeHtml(vehicle)}</span><span>${escapeHtml(when)}</span></div>
    <div class="row"><span>Name: ${escapeHtml(booking.name)}</span><span>Phone: ${escapeHtml(booking.phone)}</span></div>
    <div class="row strong"><span>Seats: ${escapeHtml(seatLabel(booking))}</span><span>Rs. ${escapeHtml(Number(booking.price).toFixed(2))}</span><span>Paid: ${booking.is_paid ? "Yes" : "No"}</span></div>
  </div>
</body>
</html>`;

  const frame = document.createElement("iframe");
  frame.setAttribute("aria-hidden", "true");
  frame.style.position = "fixed";
  frame.style.right = "0";
  frame.style.bottom = "0";
  frame.style.width = "0";
  frame.style.height = "0";
  frame.style.border = "0";
  document.body.appendChild(frame);
  const doc = frame.contentDocument;
  if (!doc) {
    frame.remove();
    return;
  }
  doc.open();
  doc.write(html);
  doc.close();
  frame.contentWindow?.focus();
  frame.contentWindow?.print();
  window.setTimeout(() => frame.remove(), 1500);
}
