import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeftRight, Calendar, Search } from "lucide-react";
import { Input } from "@/components/ui/input";
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
  const keepToOnEmptyFrom = useRef(false);

  useEffect(() => {
    vehicleScheduleApi
      .startPlaces()
      .then((res) => setStartPlaces(Array.isArray(res) ? res : []))
      .catch(() => setStartPlaces([]));
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

  const fieldClass = "h-11 rounded-xl px-3 text-sm font-normal";

  return (
    <form onSubmit={handleSearch} className="space-y-3">
      <div className="grid grid-cols-[minmax(0,1fr)_auto_minmax(0,1fr)] items-center gap-x-2 gap-y-1.5">
        <label className="text-xs font-medium text-muted-foreground">From</label>
        <span aria-hidden />
        <label className="text-xs font-medium text-muted-foreground">To</label>

        <SearchableSelect
          options={fromOptions}
          value={fromPlaceId}
          onChange={setFromPlaceId}
          placeholder="Select place"
          getOptionLabel={(o) => o.name}
          getOptionValue={(o) => o.id}
          getOptionFilterValue={(o) => getSearchableVariants(o.name || "")}
          className={fieldClass}
        />
        <button
          type="button"
          onClick={handleSwap}
          className="flex h-9 w-9 items-center justify-center rounded-full border border-border bg-background text-primary hover:bg-primary/10"
          aria-label="Swap from and to"
        >
          <ArrowLeftRight size={16} />
        </button>
        <SearchableSelect
          options={toOptions}
          value={toPlaceId}
          onChange={setToPlaceId}
          placeholder={loadingEndPlaces ? "Loading..." : !fromPlaceId ? "Select from first" : "Select place"}
          disabled={!fromPlaceId || loadingEndPlaces}
          getOptionLabel={(o) => o.name}
          getOptionValue={(o) => o.id}
          getOptionFilterValue={(o) => getSearchableVariants(o.name || "")}
          className={fieldClass}
        />
      </div>

      <div className="flex items-center gap-2">
        <button
          type="button"
          onClick={() => setDate(todayStr())}
          className={`shrink-0 rounded-xl px-3 py-2.5 text-sm font-medium transition-colors ${
            date === todayStr() ? "bg-primary text-primary-foreground" : "bg-muted/50 border border-border/50"
          }`}
        >
          Today
        </button>
        <button
          type="button"
          onClick={() => setDate(tomorrowStr())}
          className={`shrink-0 rounded-xl px-3 py-2.5 text-sm font-medium transition-colors ${
            date === tomorrowStr() ? "bg-primary text-primary-foreground" : "bg-muted/50 border border-border/50"
          }`}
        >
          Tomorrow
        </button>
        <div className="relative min-w-0 flex-1">
          <Input
            type="date"
            value={date}
            onChange={(e) => setDate(e.target.value)}
            aria-label="Date"
            className="h-11 rounded-xl pr-9 [&::-webkit-calendar-picker-indicator]:absolute [&::-webkit-calendar-picker-indicator]:inset-0 [&::-webkit-calendar-picker-indicator]:h-full [&::-webkit-calendar-picker-indicator]:w-full [&::-webkit-calendar-picker-indicator]:cursor-pointer [&::-webkit-calendar-picker-indicator]:opacity-0"
          />
          <Calendar size={16} className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
        </div>
      </div>

      <Button type="submit" className="h-12 w-full rounded-xl font-semibold">
        <Search size={16} className="mr-2" /> Search Vehicle
      </Button>
    </form>
  );
}
