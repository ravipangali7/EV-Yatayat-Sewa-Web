import { useState, useEffect, useCallback } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { vehicleApi } from "@/modules/vehicles/services/vehicleApi";

const REFETCH_INTERVAL_MS = 45_000;

function hasActiveTripFromVehicle(vehicle: { active_trip?: { id?: string; start_time?: string | null; end_time?: string | null } | null } | null): boolean {
  const at = vehicle?.active_trip;
  return !!(at?.id && at.start_time && !at.end_time);
}

/**
 * Returns whether the current driver has an active trip (trip started, not ended).
 * Non-drivers always get `true` so walkie-talkie is not gated for them.
 */
export function useDriverActiveTrip(): { hasActiveTrip: boolean } {
  const { user } = useAuth();
  const [hasActiveTrip, setHasActiveTrip] = useState(true);

  const fetchActiveTrip = useCallback(async () => {
    if (!user?.is_driver) {
      setHasActiveTrip(true);
      return;
    }
    try {
      const vehicle = await vehicleApi.getMyActiveVehicle();
      setHasActiveTrip(hasActiveTripFromVehicle(vehicle));
    } catch {
      setHasActiveTrip(false);
    }
  }, [user?.is_driver]);

  useEffect(() => {
    fetchActiveTrip();
  }, [fetchActiveTrip]);

  useEffect(() => {
    if (!user?.is_driver) return;
    const interval = setInterval(fetchActiveTrip, REFETCH_INTERVAL_MS);
    return () => clearInterval(interval);
  }, [user?.is_driver, fetchActiveTrip]);

  useEffect(() => {
    if (!user?.is_driver) return;
    const onFocus = () => fetchActiveTrip();
    window.addEventListener("focus", onFocus);
    return () => window.removeEventListener("focus", onFocus);
  }, [user?.is_driver, fetchActiveTrip]);

  return { hasActiveTrip };
}
