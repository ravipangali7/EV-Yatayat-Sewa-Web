import { MapPin, ChevronRight } from "lucide-react";
import MiniMap, { MapPoint } from "@/components/app/MiniMap";

export interface RouteStop {
  name: string;
  lat: number;
  lng: number;
}

export interface RouteInfo {
  id: string;
  name: string;
  startPoint: RouteStop;
  endPoint: RouteStop;
  stops: RouteStop[];
}

interface RouteCardProps {
  route: RouteInfo;
  onSelect?: () => void;
  active?: boolean;
  showMap?: boolean;
}

const RouteCard = ({ route, onSelect, active = false, showMap = false }: RouteCardProps) => {
  const mapPoints: MapPoint[] = [
    { ...route.startPoint, type: "start" },
    ...route.stops.map((s) => ({ ...s, type: "stop" as const })),
    { ...route.endPoint, type: "end" },
  ];

  return (
    <button
      onClick={onSelect}
      className={`w-full text-left app-surface rounded-2xl p-4 border transition-all ${
        active ? "border-primary ring-2 ring-primary/20" : "border-border"
      }`}
    >
      <div className="flex items-center justify-between mb-2">
        <h4 className="font-bold text-sm">{route.name}</h4>
        {onSelect && <ChevronRight size={16} className="text-muted-foreground" />}
      </div>
      <div className="flex items-center gap-2 text-xs text-muted-foreground">
        <MapPin size={12} className="text-primary" />
        <span className="truncate">{route.startPoint.name}</span>
        <span>→</span>
        <MapPin size={12} className="text-destructive" />
        <span className="truncate">{route.endPoint.name}</span>
      </div>
      <p className="text-[10px] text-muted-foreground mt-1">
        {route.stops.length} stops
      </p>
      {showMap && <MiniMap points={mapPoints} className="mt-3" />}
    </button>
  );
};

export default RouteCard;
