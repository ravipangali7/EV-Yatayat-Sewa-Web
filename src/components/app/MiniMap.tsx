import { MapPin, Navigation } from "lucide-react";

export interface MapPoint {
  name: string;
  lat: number;
  lng: number;
  type: "start" | "end" | "stop" | "current";
}

interface MiniMapProps {
  points: MapPoint[];
  className?: string;
}

const MiniMap = ({ points, className = "" }: MiniMapProps) => {
  const getColor = (type: MapPoint["type"]) => {
    switch (type) {
      case "start": return "text-primary";
      case "end": return "text-destructive";
      case "stop": return "text-app-warning";
      case "current": return "text-app-info";
    }
  };

  const getIcon = (type: MapPoint["type"]) => {
    if (type === "current") return <Navigation size={12} className="fill-current" />;
    return <MapPin size={12} className={type === "start" ? "fill-current" : ""} />;
  };

  return (
    <div className={`bg-accent/50 rounded-xl p-4 ${className}`}>
      <div className="relative">
        <div className="flex flex-col gap-0">
          {points.map((point, i) => (
            <div key={i} className="flex items-start gap-3">
              <div className="flex flex-col items-center">
                <div className={`w-6 h-6 rounded-full flex items-center justify-center ${getColor(point.type)} bg-background`}>
                  {getIcon(point.type)}
                </div>
                {i < points.length - 1 && (
                  <div className="w-0.5 h-6 bg-border" />
                )}
              </div>
              <div className="pb-2">
                <p className="text-xs font-medium">{point.name}</p>
                <p className="text-[10px] text-muted-foreground">
                  {Number(point.lat).toFixed(4)}, {Number(point.lng).toFixed(4)}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default MiniMap;
