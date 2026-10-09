import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeftRight, Calendar, MapPin, Search } from "lucide-react";
import { Button } from "@/components/ui/button";
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

  const fieldTrigger =
    "h-auto min-h-0 min-w-0 w-full justify-start rounded-none border-0 bg-transparent px-0 py-0 shadow-none hover:bg-transparent focus-visible:ring-0 focus-visible:ring-offset-0";
  const isToday = date === todayStr();
  const isTomorrow = date === tomorrowStr();

  return (
    <form onSubmit={handleSearch} className="rounded-[24px] bg-[var(--ev-surface)] p-4 shadow-[var(--ev-shadow-float)]">
      <div className="mb-3 flex items-start gap-2.5">
        <span className="mt-0.5 grid h-8 w-8 shrink-0 place-items-center text-[var(--ev-primary)]">
          <MapPin size={26} strokeWidth={2.25} className="fill-[var(--ev-primary)] text-white" />
        </span>
        <div>
          <h3 className="text-[18px] font-bold leading-tight text-[var(--ev-primary-dark)]">Where to go?</h3>
          <p className="text-[13px] text-[var(--ev-text-muted)]">Plan your trip and book your ride</p>
        </div>
      </div>

      <div className="relative space-y-2.5">
        <div className="flex items-center gap-2.5 rounded-2xl border border-[var(--ev-border)] px-3 py-2 pr-8">
          <span className="grid h-7 w-7 shrink-0 place-items-center" aria-hidden>
            <span className="h-3.5 w-3.5 rounded-full border-[3px] border-[var(--ev-primary)]" />
          </span>
          <div className="min-w-0 flex-1">
          <SearchableSelect
            options={fromOptions}
            value={fromPlaceId}
            onChange={setFromPlaceId}
            placeholder="e.g. Bus Park"
            fieldLabel="Boarding Point"
            getOptionLabel={(o) => o.name}
            getOptionValue={(o) => o.id}
            getOptionFilterValue={(o) => getSearchableVariants(o.name || "")}
            emptyText={stopsError || fromOptions.length === 0 ? "No stops available right now" : "No results found."}
            className={fieldTrigger}
          />
          </div>
        </div>
        {stopsError && (
          <button type="button" onClick={loadStartPlaces} className="text-xs font-semibold text-[var(--ev-primary)]">
            Try again
          </button>
        )}
        <div className="flex items-center gap-2.5 rounded-2xl border border-[var(--ev-border)] px-3 py-2 pr-8">
          <MapPin size={18} className="shrink-0 text-[var(--ev-danger)]" aria-hidden />
          <div className="min-w-0 flex-1">
          <SearchableSelect
            options={toOptions}
            value={toPlaceId}
            onChange={setToPlaceId}
            placeholder={loadingEndPlaces ? "Loading..." : !fromPlaceId ? "Choose boarding point first" : "e.g. Kathmandu"}
            fieldLabel="Destination"
            disabled={!fromPlaceId || loadingEndPlaces}
            getOptionLabel={(o) => o.name}
            getOptionValue={(o) => o.id}
            getOptionFilterValue={(o) => getSearchableVariants(o.name || "")}
            className={fieldTrigger}
          />
          </div>
        </div>
        <button
          type="button"
          onClick={handleSwap}
          className="absolute -right-1 top-1/2 grid h-9 w-9 -translate-y-1/2 place-items-center rounded-full border border-[var(--ev-mint-200)] bg-[var(--ev-surface)] text-[var(--ev-primary)] shadow-[var(--ev-shadow-card)]"
          aria-label="Swap"
        >
          <ArrowLeftRight size={16} strokeWidth={1.75} />
        </button>
      </div>

      <div className="mt-3 flex items-center gap-2">
        <label className="relative grid h-10 w-10 shrink-0 cursor-pointer place-items-center rounded-full border border-[var(--ev-border)] text-[var(--ev-text-muted)]">
          <Calendar size={16} />
          <input
            type="date"
            value={date}
            onChange={(e) => setDate(e.target.value)}
            aria-label="Date"
            className="absolute inset-0 cursor-pointer opacity-0"
          />
        </label>
        <button
          type="button"
          onClick={() => setDate(todayStr())}
          className={`h-10 rounded-full px-4 text-sm font-semibold ${
            isToday
              ? "bg-[var(--ev-mint-100)] text-[var(--ev-primary)]"
              : "border border-[var(--ev-border)] bg-[var(--ev-surface)] text-[var(--ev-text-muted)]"
          }`}
        >
          Today
        </button>
        <button
          type="button"
          onClick={() => setDate(tomorrowStr())}
          className={`h-10 rounded-full px-4 text-sm font-semibold ${
            isTomorrow
              ? "bg-[var(--ev-mint-100)] text-[var(--ev-primary)]"
              : "border border-[var(--ev-border)] bg-[var(--ev-surface)] text-[var(--ev-text-muted)]"
          }`}
        >
          Tomorrow
        </button>
      </div>

      <Button type="submit" className="ev-btn mt-3 gap-2">
        <Search size={18} strokeWidth={2} /> Search
      </Button>
    </form>
  );
}
