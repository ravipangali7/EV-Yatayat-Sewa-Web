import { useEffect, useRef } from "react";
import { io, Socket } from "socket.io-client";

function getTripSocketServerUrl(): string {
  if (typeof import.meta.env.VITE_PTT_SERVER_URL === "string" && import.meta.env.VITE_PTT_SERVER_URL) {
    return import.meta.env.VITE_PTT_SERVER_URL.replace(/\/$/, "");
  }
  if (typeof window !== "undefined" && window.location.hostname === "localhost") {
    return `${window.location.protocol}//${window.location.hostname}:8001`;
  }
  return typeof window !== "undefined" ? "https://node.evyatayatsewa.com" : "";
}

export interface SeatBookedPayload {
  trip_id: string;
  vehicle_id: string | null;
  seats: Array<{ vehicle_seat_id?: string; side: string; number: number }>;
}

interface UseTripSocketOptions {
  tripId: string | null;
  enabled: boolean;
  onSeatBooked: (payload: SeatBookedPayload) => void;
  /** When false (e.g. in WebView waiting for Flutter to inject token), socket is not connected. Default true. */
  authReady?: boolean;
}

export function useTripSocket({ tripId, enabled, onSeatBooked, authReady = true }: UseTripSocketOptions): void {
  const socketRef = useRef<Socket | null>(null);
  const onSeatBookedRef = useRef(onSeatBooked);
  onSeatBookedRef.current = onSeatBooked;

  useEffect(() => {
    if (!enabled || !tripId || !authReady) {
      if (socketRef.current) {
        socketRef.current.disconnect();
        socketRef.current.removeAllListeners();
        socketRef.current = null;
      }
      return;
    }

    const token = typeof localStorage !== "undefined" ? localStorage.getItem("auth_token") : null;
    if (!token) return;

    const serverUrl = getTripSocketServerUrl();
    if (!serverUrl) return;

    const socket = io(serverUrl, { path: "/socket.io/", transports: ["websocket", "polling"] });
    socketRef.current = socket;

    socket.on("connect", () => {
      socket.emit("auth", { token }, (ack: { success?: boolean }) => {
        if (ack?.success) {
          socket.emit("join_trip", { trip_id: tripId, token }, (joinAck: { success?: boolean }) => {
            if (!joinAck?.success) {
              socket.disconnect();
            }
          });
        } else {
          socket.disconnect();
        }
      });
    });

    socket.on("seat_booked", (payload: SeatBookedPayload) => {
      onSeatBookedRef.current(payload);
    });

    socket.on("connect_error", () => {
      socketRef.current = null;
    });

    socket.on("disconnect", () => {
      socketRef.current = null;
    });

    return () => {
      socket.disconnect();
      socket.removeAllListeners();
      socketRef.current = null;
    };
  }, [enabled, tripId, authReady]);
}
