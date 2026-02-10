import { Car, Phone } from "lucide-react";

export interface VehicleInfo {
  id: string;
  name: string;
  phone: string;
  images: string[];
  plateNumber: string;
  type: string;
}

interface VehicleCardProps {
  vehicle: VehicleInfo;
  compact?: boolean;
}

const VehicleCard = ({ vehicle, compact = false }: VehicleCardProps) => {
  return (
    <div className="app-surface rounded-2xl p-4 border border-border">
      <div className="flex items-center gap-3">
        <div className="w-12 h-12 rounded-xl gradient-primary flex items-center justify-center">
          <Car size={24} className="text-primary-foreground" />
        </div>
        <div className="flex-1 min-w-0">
          <h3 className="font-bold text-sm">{vehicle.name}</h3>
          <p className="text-xs text-muted-foreground">{vehicle.plateNumber}</p>
          {!compact && (
            <div className="flex items-center gap-1 mt-1 text-xs text-muted-foreground">
              <Phone size={10} />
              <span>{vehicle.phone}</span>
            </div>
          )}
        </div>
        <span className="text-[10px] px-2 py-1 rounded-full bg-accent text-accent-foreground font-medium">
          {vehicle.type}
        </span>
      </div>
    </div>
  );
};

export default VehicleCard;
