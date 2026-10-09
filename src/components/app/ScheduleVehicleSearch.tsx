import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { SvgIcon } from "@/components/app/ride/SvgIcon";
import { rideBtn } from "@/components/app/ride/rideStyles";
import { SearchableSelect } from "@/components/common/SearchableSelect";
import {
  vehicleScheduleApi,
  type SchedulePlace,
} from "@/modules/vehicle-schedules/services/vehicleScheduleApi";
import { getSearchableVariants } from "@/lib/transliterate";
import { toast } from "sonner";

function todayStr() {
  return new Date().toISOString().slice(0, 10);
}

function tomorrowStr() {
  const d = new Date();
  d.setDate(d.getDate() + 1);
  return d.toISOString().slice(0, 10);
}

export function ScheduleVehicleSearch({ bookingPath }: { bookingPath: string }) {
  const navigate = useNavigate();
  const [startPlaces, setStartPlaces] = useState<SchedulePlace[]>([]);
  const [endPlaces, setEndPlaces] = useState<SchedulePlace[]>([]);
  const [fromPlaceId, setFromPlaceId] = useState("");
  const [toPlaceId, setToPlaceId] = useState("");
  const [date, setDate] = useState(todayStr());
  const [loadingEndPlaces, setLoadingEndPlaces] = useState(false);
  const [stopsError, setStopsError] = useState(false);
  const keepToOnEmptyFrom = useRef(false);

  const loadStartPlaces = () => {
    setStopsError(false);
    vehicleScheduleApi
      .startPlaces()
      .then((res) => setStartPlaces(Array.isArray(res) ? res : []))
      .catch((err) => {
        console.error("Failed to load boarding stops", err);
        setStartPlaces([]);
        setStopsError(true);
      });
  };

  useEffect(() => {
    loadStartPlaces();
  }, []);

  useEffect(() => {
    if (!fromPlaceId) {
      setEndPlaces([]);
      if (keepToOnEmptyFrom.current) {
        keepToOnEmptyFrom.current = false;
        return;
      }
      setToPlaceId("");
      return;
    }
    setLoadingEndPlaces(true);
    vehicleScheduleApi
      .endPlaces(fromPlaceId)
      .then((res) => setEndPlaces(Array.isArray(res) ? res : []))
      .catch(() => setEndPlaces([]))
      .finally(() => setLoadingEndPlaces(false));
  }, [fromPlaceId]);

  const fromOptions = startPlaces.map((p) => ({ id: p.id, name: p.name, code: p.code }));
  const toOptions = endPlaces.map((p) => ({ id: p.id, name: p.name, code: p.code }));

  const handleSwap = () => {
    if (!toPlaceId) keepToOnEmptyFrom.current = true;
    setFromPlaceId(toPlaceId);
    setToPlaceId(fromPlaceId);
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (!fromPlaceId || !toPlaceId || !date) {
      toast.error("Please select From, To and Date");
      return;
    }
    const params = new URLSearchParams({ from: fromPlaceId, to: toPlaceId, date });
    navigate(`${bookingPath}?${params.toString()}`);
  };

  const fieldClass = "h-12 rounded-xl border border-[#E4EEE8] bg-white px-3 pl-10 text-sm font-normal text-[#1C2430] shadow-sm";

  return (
    <form onSubmit={handleSearch} className="space-y-4 rounded-2xl border border-[#E4EEE8] bg-white p-4 shadow-sm">
      <div className="grid gap-3">
        <div>
          <p className="mb-1.5 flex items-center gap-1.5 text-sm font-bold text-[#163024]">
            <SvgIcon name="bus" className="h-4 w-4 text-[#1C8C42]" />
            Where to board?
          </p>
          <div className="relative">
            <SvgIcon name="bus" className="pointer-events-none absolute left-3 top-1/2 z-10 h-4 w-4 -translate-y-1/2 text-[#1C8C42]" />
            <SearchableSelect
              options={fromOptions}
              value={fromPlaceId}
              onChange={setFromPlaceId}
              placeholder="e.g. Bus Park"
              getOptionLabel={(o) => o.name}
              getOptionValue={(o) => o.id}
              getOptionFilterValue={(o) => getSearchableVariants(o.name || "")}
              emptyText={stopsError || fromOptions.length === 0 ? "No stops available right now" : "No results found."}
              className={fieldClass}
            />
          </div>
          {stopsError && (
            <button type="button" onClick={loadStartPlaces} className="mt-1 text-xs font-semibold text-[var(--ev-primary)]">
              Try again
            </button>
          )}
        </div>
        <div>
          <p className="mb-1.5 flex items-center gap-1.5 text-sm font-bold text-[#163024]">
            <SvgIcon name="map-pin" className="h-4 w-4 text-[#E23B3B]" />
            Where to go?
          </p>
          <div className="relative">
            <SvgIcon name="map-pin" className="pointer-events-none absolute left-3 top-1/2 z-10 h-4 w-4 -translate-y-1/2 text-[#E23B3B]" />
            <SearchableSelect
              options={toOptions}
              value={toPlaceId}
              onChange={setToPlaceId}
              placeholder={loadingEndPlaces ? "Loading..." : !fromPlaceId ? "Choose boarding point first" : "e.g. Kathmandu"}
              disabled={!fromPlaceId || loadingEndPlaces}
              getOptionLabel={(o) => o.name}
              getOptionValue={(o) => o.id}
              getOptionFilterValue={(o) => getSearchableVariants(o.name || "")}
              className={fieldClass}
            />
          </div>
        </div>
      </div>

      <div className="flex flex-col gap-3">
        <div className="flex flex-1 items-center gap-2">
          <button
            type="button"
            onClick={() => setDate(todayStr())}
            className={`shrink-0 rounded-xl px-3 py-2.5 text-sm font-semibold transition-colors ${
              date === todayStr() ? "bg-[#1C8C42] text-white" : "border border-[#E4EEE8] bg-white text-[#5E6B66]"
            }`}
          >
            Today
          </button>
          <button
            type="button"
            onClick={() => setDate(tomorrowStr())}
            className={`shrink-0 rounded-xl px-3 py-2.5 text-sm font-semibold transition-colors ${
              date === tomorrowStr() ? "bg-[#1C8C42] text-white" : "border border-[#E4EEE8] bg-white text-[#5E6B66]"
            }`}
          >
            Tomorrow
          </button>
          <input
            type="date"
            value={date}
            onChange={(e) => setDate(e.target.value)}
            aria-label="Date"
            className="h-12 min-w-0 flex-1 rounded-xl border border-[#E4EEE8] bg-white px-3 text-sm shadow-sm outline-none"
          />
          <button
            type="button"
            onClick={handleSwap}
            className="inline-flex h-12 shrink-0 items-center gap-1 rounded-xl border border-[#E4EEE8] px-3 text-xs font-semibold text-[#1C8C42]"
          >
            <SvgIcon name="arrow-left-right" className="h-3.5 w-3.5" />
            Swap
          </button>
        </div>
        <Button type="submit" className={rideBtn}>
          <SvgIcon name="search" className="mr-2 h-4 w-4" /> Search
        </Button>
      </div>
    </form>
  );
}
