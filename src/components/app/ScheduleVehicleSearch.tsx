import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Calendar, Search } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { SearchableSelect } from "@/components/common/SearchableSelect";
import { VoiceSearchButton } from "@/components/app/VoiceSearchButton";
import {
  vehicleScheduleApi,
  type SchedulePlace,
} from "@/modules/vehicle-schedules/services/vehicleScheduleApi";
import { getSearchableVariants, matchesSearch } from "@/lib/transliterate";
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

  useEffect(() => {
    vehicleScheduleApi
      .startPlaces()
      .then((res) => setStartPlaces(Array.isArray(res) ? res : []))
      .catch(() => setStartPlaces([]));
  }, []);

  useEffect(() => {
    if (!fromPlaceId) {
      setEndPlaces([]);
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

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (!fromPlaceId || !toPlaceId || !date) {
      toast.error("Please select From, To and Date");
      return;
    }
    const params = new URLSearchParams({ from: fromPlaceId, to: toPlaceId, date });
    navigate(`${bookingPath}?${params.toString()}`);
  };

  return (
    <form
      onSubmit={handleSearch}
      className="space-y-3 bg-white dark:bg-card/80 backdrop-blur-xl rounded-2xl border border-border/50 p-4 shadow-md"
    >
      <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
        Schedule vehicle
      </p>
      <div>
        <div className="flex items-center justify-between mb-1">
          <label className="text-xs text-muted-foreground">From</label>
          <VoiceSearchButton
            onResult={(t) => {
              const match = fromOptions.find((o) => matchesSearch(o.name, t));
              if (match) setFromPlaceId(match.id);
            }}
            size="sm"
            variant="ghost"
          />
        </div>
        <SearchableSelect
          options={fromOptions}
          value={fromPlaceId}
          onChange={setFromPlaceId}
          placeholder="Select departure place"
          getOptionLabel={(o) => o.name}
          getOptionValue={(o) => o.id}
          getOptionFilterValue={(o) => getSearchableVariants(o.name || "")}
          className="h-12 rounded-xl"
        />
      </div>
      <div>
        <div className="flex items-center justify-between mb-1">
          <label className="text-xs text-muted-foreground">To</label>
          <VoiceSearchButton
            onResult={(t) => {
              const match = toOptions.find((o) => matchesSearch(o.name, t));
              if (match) setToPlaceId(match.id);
            }}
            disabled={!fromPlaceId || loadingEndPlaces}
            size="sm"
            variant="ghost"
          />
        </div>
        <SearchableSelect
          options={toOptions}
          value={toPlaceId}
          onChange={setToPlaceId}
          placeholder={
            loadingEndPlaces ? "Loading..." : !fromPlaceId ? "Select From first" : "Select destination"
          }
          disabled={!fromPlaceId || loadingEndPlaces}
          getOptionLabel={(o) => o.name}
          getOptionValue={(o) => o.id}
          getOptionFilterValue={(o) => getSearchableVariants(o.name || "")}
          className="h-12 rounded-xl"
        />
      </div>
      <div>
        <label className="text-xs text-muted-foreground mb-2 block">Date</label>
        <div className="flex gap-2 mb-2">
          <button
            type="button"
            onClick={() => setDate(todayStr())}
            className={`flex-1 py-2.5 rounded-xl font-medium text-sm transition-colors ${
              date === todayStr() ? "bg-primary text-primary-foreground" : "bg-muted/50 border border-border/50"
            }`}
          >
            Today
          </button>
          <button
            type="button"
            onClick={() => setDate(tomorrowStr())}
            className={`flex-1 py-2.5 rounded-xl font-medium text-sm transition-colors ${
              date === tomorrowStr() ? "bg-primary text-primary-foreground" : "bg-muted/50 border border-border/50"
            }`}
          >
            Tomorrow
          </button>
        </div>
        <div className="relative">
          <Calendar size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
          <Input
            type="date"
            value={date}
            onChange={(e) => setDate(e.target.value)}
            className="pl-10 h-12 rounded-xl"
          />
        </div>
      </div>
      <Button type="submit" className="w-full h-12 rounded-xl font-semibold">
        <Search size={16} className="mr-2" /> Search Vehicles
      </Button>
    </form>
  );
}
