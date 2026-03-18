import { useState, useEffect, useCallback, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { GoogleMap, Marker, InfoWindow } from '@react-google-maps/api';
import { useGoogleMaps } from '@/contexts/GoogleMapsContext';
import { Button } from '@/components/ui/button';
import {
  ArrowLeft,
  Bus,
  User,
  Phone,
  TrendingUp,
  Wallet,
  ChevronRight,
  Search,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { monitoringApi } from '@/modules/monitoring/services/monitoringApi';
import type { MonitoringVehicle, HeavyDue } from '@/types';
import { toast } from 'sonner';

// ---------------------------------------------------------------------------
// Types (display vehicle = API vehicle + color + today_revenue as number)
// ---------------------------------------------------------------------------

interface DisplayVehicle extends Omit<MonitoringVehicle, 'today_revenue'> {
  today_revenue: number;
  color: string;
}

const POLL_INTERVAL_MS = 10_000;
const VEHICLE_COLORS = ['#22c55e', '#3b82f6', '#f59e0b', '#6b7280', '#a855f7', '#ec4899', '#14b8a6', '#eab308'];

// ---------------------------------------------------------------------------
// Map config
// ---------------------------------------------------------------------------

const MAP_CENTER = { lat: 27.7041, lng: 85.3131 };

const MAP_OPTIONS: google.maps.MapOptions = {
  mapTypeId: 'roadmap',
  disableDefaultUI: false,
  zoomControl: true,
  streetViewControl: false,
  mapTypeControl: false,
  fullscreenControl: false,
  styles: [
    { elementType: 'geometry', stylers: [{ color: '#1a1a2e' }] },
    { elementType: 'labels.text.fill', stylers: [{ color: '#a0aec0' }] },
    { elementType: 'labels.text.stroke', stylers: [{ color: '#1a1a2e' }] },
    { featureType: 'road', elementType: 'geometry', stylers: [{ color: '#2d3748' }] },
    { featureType: 'road', elementType: 'geometry.stroke', stylers: [{ color: '#1a1a2e' }] },
    { featureType: 'road.highway', elementType: 'geometry', stylers: [{ color: '#2c5282' }] },
    { featureType: 'water', elementType: 'geometry', stylers: [{ color: '#0f2027' }] },
    { featureType: 'poi', stylers: [{ visibility: 'off' }] },
    { featureType: 'transit', stylers: [{ visibility: 'off' }] },
    { featureType: 'administrative', elementType: 'geometry', stylers: [{ color: '#2d3748' }] },
  ],
};

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function formatRs(amount: number): string {
  return `Rs. ${amount.toLocaleString('en-IN')}`;
}

function occupancyColor(booked: number, total: number): string {
  const pct = total > 0 ? booked / total : 0;
  if (pct >= 0.85) return 'bg-red-500';
  if (pct >= 0.6) return 'bg-amber-500';
  return 'bg-emerald-500';
}

// ---------------------------------------------------------------------------
// Sub-components
// ---------------------------------------------------------------------------

function LiveClock() {
  const [time, setTime] = useState(() => new Date());
  useEffect(() => {
    const id = setInterval(() => setTime(new Date()), 1000);
    return () => clearInterval(id);
  }, []);
  return (
    <span className="font-mono text-sm text-slate-300">
      {time.toLocaleTimeString('en-US', { hour12: false })}
    </span>
  );
}

interface VehicleCardProps {
  vehicle: DisplayVehicle;
  selected: boolean;
  onClick: () => void;
}

function VehicleCard({ vehicle, selected, onClick }: VehicleCardProps) {
  const pct = vehicle.seats_total > 0 ? vehicle.seats_booked / vehicle.seats_total : 0;
  return (
    <button
      onClick={onClick}
      className={cn(
        'w-full text-left rounded-xl border p-3 transition-all duration-200 cursor-pointer',
        selected
          ? 'border-blue-500 bg-blue-500/10 shadow-lg shadow-blue-500/10'
          : 'border-slate-700 bg-slate-800/60 hover:border-slate-500 hover:bg-slate-800'
      )}
    >
      {/* Header row */}
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2 min-w-0">
          <div
            className="w-2.5 h-2.5 rounded-full flex-shrink-0"
            style={{ backgroundColor: vehicle.color }}
          />
          <span className="text-sm font-semibold text-white truncate">{vehicle.name}</span>
        </div>
        <span
          className={cn(
            'text-xs font-bold px-2 py-0.5 rounded-full flex-shrink-0',
            vehicle.status === 'on_trip'
              ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
              : 'bg-slate-700 text-slate-400 border border-slate-600'
          )}
        >
          {vehicle.status === 'on_trip' ? 'ON TRIP' : 'IDLE'}
        </span>
      </div>

      {/* Vehicle no */}
      <div className="text-xs text-slate-500 mb-2">{vehicle.vehicle_no}</div>

      {/* Route */}
      <div className="flex items-center gap-1.5 text-xs text-slate-400 mb-3">
        <ChevronRight className="w-3 h-3 text-slate-600" />
        <span className="truncate">{vehicle.start_point} → {vehicle.end_point}</span>
      </div>

      {/* Driver */}
      <div className="flex items-center gap-1.5 mb-3">
        <User className="w-3 h-3 text-slate-500 flex-shrink-0" />
        <span className="text-xs text-slate-400 truncate">{vehicle.active_driver_name ?? '—'}</span>
        <Phone className="w-3 h-3 text-slate-600 flex-shrink-0 ml-auto" />
        <span className="text-xs text-slate-500">{vehicle.active_driver_phone ?? '—'}</span>
      </div>

      {/* Seat occupancy bar */}
      <div className="mb-1.5">
        <div className="flex items-center justify-between text-xs mb-1">
          <span className="text-slate-500">Seats</span>
          <span className={cn(
            'font-semibold',
            pct >= 0.85 ? 'text-red-400' : pct >= 0.6 ? 'text-amber-400' : 'text-emerald-400'
          )}>
            {vehicle.seats_booked}/{vehicle.seats_total}
          </span>
        </div>
        <div className="h-1.5 bg-slate-700 rounded-full overflow-hidden">
          <div
            className={cn('h-full rounded-full transition-all', occupancyColor(vehicle.seats_booked, vehicle.seats_total))}
            style={{ width: `${Math.round(pct * 100)}%` }}
          />
        </div>
      </div>

      {/* Revenue & speed row */}
      <div className="flex items-center justify-between mt-2.5">
        <div className="flex items-center gap-1">
          <TrendingUp className="w-3.5 h-3.5 text-emerald-500" />
          <span className="text-sm font-bold text-emerald-400">{formatRs(vehicle.today_revenue)}</span>
        </div>
        <div className="flex items-center gap-3 text-xs text-slate-500">
          <span>{vehicle.today_trips} trips</span>
          {vehicle.status === 'on_trip' && (
            <span className="text-blue-400">{vehicle.speed_kmh} km/h</span>
          )}
        </div>
      </div>
    </button>
  );
}

// ---------------------------------------------------------------------------
// Main Page
// ---------------------------------------------------------------------------

export default function Monitoring() {
  const navigate = useNavigate();
  const { isLoaded } = useGoogleMaps();

  const [vehicles, setVehicles] = useState<DisplayVehicle[]>([]);
  const [heavyDues, setHeavyDues] = useState<HeavyDue[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [fleetSearch, setFleetSearch] = useState('');
  const [selectedVehicleId, setSelectedVehicleId] = useState<string | null>(null);
  const [infoWindowVehicleId, setInfoWindowVehicleId] = useState<string | null>(null);
  const mapRef = useRef<google.maps.Map | null>(null);
  const colorByVehicleIdRef = useRef<Map<string, string>>(new Map());

  const fetchSnapshot = useCallback(async () => {
    try {
      setError(null);
      const snapshot = await monitoringApi.getSnapshot();
      const withColors = snapshot.vehicles.map((v) => {
        let color = colorByVehicleIdRef.current.get(v.id);
        if (!color) {
          color = VEHICLE_COLORS[colorByVehicleIdRef.current.size % VEHICLE_COLORS.length];
          colorByVehicleIdRef.current.set(v.id, color);
        }
        return {
          ...v,
          today_revenue: parseFloat(v.today_revenue) || 0,
          color,
          lat: v.lat ?? 0,
          lng: v.lng ?? 0,
        } as DisplayVehicle;
      });
      setVehicles(withColors);
      setHeavyDues(snapshot.heavy_dues ?? []);
    } catch (e: unknown) {
      const message = e instanceof Error ? e.message : 'Failed to load monitoring data';
      setError(message);
      toast.error(message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchSnapshot();
    const id = setInterval(fetchSnapshot, POLL_INTERVAL_MS);
    return () => clearInterval(id);
  }, [fetchSnapshot]);

  const onMapLoad = useCallback((map: google.maps.Map) => {
    mapRef.current = map;
  }, []);

  const focusVehicle = (vehicle: DisplayVehicle) => {
    setSelectedVehicleId(vehicle.id);
    setInfoWindowVehicleId(vehicle.id);
    if (mapRef.current && vehicle.lat != null && vehicle.lng != null) {
      mapRef.current.panTo({ lat: vehicle.lat, lng: vehicle.lng });
      mapRef.current.setZoom(15);
    }
  };

  const handleMarkerClick = (vehicle: DisplayVehicle) => {
    setSelectedVehicleId(vehicle.id);
    setInfoWindowVehicleId(vehicle.id);
  };

  const selectedVehicle = vehicles.find((v) => v.id === selectedVehicleId);
  const infoWindowVehicle = vehicles.find((v) => v.id === infoWindowVehicleId);
  const vehiclesWithLocation = vehicles.filter((v) => v.lat != null && v.lng != null && (v.lat !== 0 || v.lng !== 0));

  const fleetFiltered = fleetSearch.trim()
    ? vehicles.filter((v) => {
        const q = fleetSearch.trim().toLowerCase();
        return (
          (v.name && v.name.toLowerCase().includes(q)) ||
          (v.vehicle_no && v.vehicle_no.toLowerCase().includes(q))
        );
      })
    : vehicles;

  const totalRevenue = vehicles.reduce((s, v) => s + v.today_revenue, 0);
  const onTripCount = vehicles.filter((v) => v.status === 'on_trip').length;
  const totalSeatsBooked = vehicles.reduce((s, v) => s + v.seats_booked, 0);

  if (loading && vehicles.length === 0) {
    return (
      <div className="h-screen flex flex-col bg-slate-900 text-white items-center justify-center">
        <div className="text-slate-400 animate-pulse">Loading monitoring…</div>
      </div>
    );
  }

  return (
    <div className="h-screen flex flex-col bg-slate-900 overflow-hidden text-white">
      {error && (
        <div className="flex-shrink-0 bg-amber-500/20 border-b border-amber-500/40 px-4 py-2 text-amber-200 text-sm">
          {error}
        </div>
      )}
      {/* ------------------------------------------------------------------ */}
      {/* HEADER                                                              */}
      {/* ------------------------------------------------------------------ */}
      <header className="h-14 flex-shrink-0 border-b border-slate-700/60 bg-slate-900/95 backdrop-blur flex items-center px-4 gap-4 z-10">
        {/* Back */}
        <Button
          variant="ghost"
          size="sm"
          onClick={() => navigate('/admin')}
          className="text-slate-400 hover:text-white hover:bg-slate-800 gap-1.5 flex-shrink-0"
        >
          <ArrowLeft className="w-4 h-4" />
          <span className="hidden sm:inline">Back</span>
        </Button>

        {/* Title */}
        <div className="flex items-center gap-2 flex-1 min-w-0">
          <Bus className="w-5 h-5 text-blue-400 flex-shrink-0" />
          <h1 className="text-sm font-bold tracking-widest uppercase text-slate-100 truncate">
            Monitoring Control Room
          </h1>
        </div>

        {/* KPI pills */}
        <div className="hidden md:flex items-center gap-3">
          <div className="flex items-center gap-1.5 bg-slate-800 border border-slate-700 rounded-lg px-3 py-1.5">
            <span className="text-xs text-slate-500">Active</span>
            <span className="text-sm font-bold text-emerald-400">{onTripCount}/{vehicles.length}</span>
          </div>
          <div className="flex items-center gap-1.5 bg-slate-800 border border-slate-700 rounded-lg px-3 py-1.5">
            <span className="text-xs text-slate-500">Passengers</span>
            <span className="text-sm font-bold text-blue-400">{totalSeatsBooked}</span>
          </div>
          <div className="flex items-center gap-1.5 bg-slate-800 border border-slate-700 rounded-lg px-3 py-1.5">
            <span className="text-xs text-slate-500">Revenue Today</span>
            <span className="text-sm font-bold text-emerald-400">{formatRs(totalRevenue)}</span>
          </div>
        </div>

        {/* Live indicator + clock */}
        <div className="flex items-center gap-3 flex-shrink-0">
          <div className="flex items-center gap-1.5">
            <span className="relative flex h-2.5 w-2.5">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75" />
              <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-red-500" />
            </span>
            <span className="text-xs font-semibold text-red-400 tracking-widest">LIVE</span>
          </div>
          <LiveClock />
        </div>
      </header>

      {/* ------------------------------------------------------------------ */}
      {/* BODY — 3-column                                                     */}
      {/* ------------------------------------------------------------------ */}
      <div className="flex flex-1 min-h-0">

        {/* ---------------------------------------------------------------- */}
        {/* LEFT PANEL — Vehicle cards                                        */}
        {/* ---------------------------------------------------------------- */}
        <aside className="w-80 flex-shrink-0 border-r border-slate-700/60 bg-slate-900 flex flex-col min-h-0">
          {/* Panel header */}
          <div className="px-4 py-3 border-b border-slate-700/40 flex items-center justify-between flex-shrink-0">
            <div className="flex items-center gap-2">
              <Bus className="w-4 h-4 text-blue-400" />
              <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">
                Fleet Status
              </span>
            </div>
            <span className="text-xs text-slate-600">
              {fleetFiltered.length}{vehicles.length !== fleetFiltered.length ? ` / ${vehicles.length}` : ''} vehicles
            </span>
          </div>

          {/* Search by name or vehicle no */}
          <div className="px-3 py-2 border-b border-slate-700/40 flex-shrink-0">
            <div className="relative">
              <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-500 pointer-events-none" />
              <input
                type="text"
                placeholder="Search by name or number"
                value={fleetSearch}
                onChange={(e) => setFleetSearch(e.target.value)}
                className="w-full pl-8 pr-3 py-2 text-sm bg-slate-800 border border-slate-700 rounded-lg text-white placeholder:text-slate-500 focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
          </div>

          {/* Cards list */}
          <div className="flex-1 overflow-y-auto p-3 space-y-2 scrollbar-thin scrollbar-thumb-slate-700 scrollbar-track-transparent">
            {fleetFiltered
              .slice()
              .sort((a, b) => (b.status === 'on_trip' ? 1 : 0) - (a.status === 'on_trip' ? 1 : 0))
              .map(vehicle => (
                <VehicleCard
                  key={vehicle.id}
                  vehicle={vehicle}
                  selected={selectedVehicleId === vehicle.id}
                  onClick={() => focusVehicle(vehicle)}
                />
              ))}
          </div>
        </aside>

        {/* ---------------------------------------------------------------- */}
        {/* CENTER — Google Map                                               */}
        {/* ---------------------------------------------------------------- */}
        <main className="flex-1 relative">
          {isLoaded ? (
            <GoogleMap
              mapContainerStyle={{ width: '100%', height: '100%' }}
              center={MAP_CENTER}
              zoom={13}
              options={MAP_OPTIONS}
              onLoad={onMapLoad}
            >
              {vehiclesWithLocation.map((vehicle) => (
                <Marker
                  key={vehicle.id}
                  position={{ lat: vehicle.lat, lng: vehicle.lng }}
                  title={vehicle.name}
                  onClick={() => handleMarkerClick(vehicle)}
                  icon={{
                    path: 'M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7z',
                    fillColor: vehicle.color,
                    fillOpacity: 1,
                    strokeColor: '#ffffff',
                    strokeWeight: 1.5,
                    scale: selectedVehicleId === vehicle.id ? 2 : 1.5,
                    anchor: new window.google.maps.Point(12, 22),
                  }}
                />
              ))}

              {infoWindowVehicle && vehiclesWithLocation.some((v) => v.id === infoWindowVehicle.id) && (
                <InfoWindow
                  position={{ lat: infoWindowVehicle.lat, lng: infoWindowVehicle.lng }}
                  onCloseClick={() => setInfoWindowVehicleId(null)}
                >
                  <div className="min-w-[180px] p-1">
                    <div className="font-bold text-slate-900 text-sm mb-1">
                      {infoWindowVehicle.name}
                    </div>
                    <div className="text-xs text-slate-600 mb-0.5">{infoWindowVehicle.vehicle_no}</div>
                    <div className="text-xs text-slate-700 mb-0.5">
                      {infoWindowVehicle.start_point} → {infoWindowVehicle.end_point}
                    </div>
                    <div className="text-xs text-slate-600 mb-0.5">
                      Driver: {infoWindowVehicle.active_driver_name ?? '—'}
                    </div>
                    <div className="text-xs text-slate-600 mb-0.5">
                      Seats: {infoWindowVehicle.seats_booked}/{infoWindowVehicle.seats_total}
                    </div>
                    <div className="text-xs font-semibold text-green-700">
                      Revenue: {formatRs(infoWindowVehicle.today_revenue)}
                    </div>
                    {infoWindowVehicle.status === 'on_trip' && (
                      <div className="text-xs text-blue-600 mt-0.5">
                        Speed: {infoWindowVehicle.speed_kmh} km/h
                      </div>
                    )}
                  </div>
                </InfoWindow>
              )}
            </GoogleMap>
          ) : (
            <div className="h-full flex items-center justify-center bg-slate-800">
              <div className="text-slate-500 text-sm animate-pulse">Loading map…</div>
            </div>
          )}

          {/* Map overlay legend */}
          <div className="absolute bottom-4 left-4 bg-slate-900/90 border border-slate-700 rounded-xl p-3 backdrop-blur space-y-1.5">
            <div className="text-xs font-semibold text-slate-400 mb-2 uppercase tracking-wider">Legend</div>
            <div className="flex items-center gap-2 text-xs text-slate-400">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 flex-shrink-0" />
              On Trip
            </div>
            <div className="flex items-center gap-2 text-xs text-slate-400">
              <span className="w-2.5 h-2.5 rounded-full bg-slate-500 flex-shrink-0" />
              Idle
            </div>
            <div className="flex items-center gap-2 text-xs text-slate-400">
              <span className="w-2.5 h-2.5 rounded-full bg-red-500 flex-shrink-0" />
              Alert
            </div>
          </div>

          {/* Selected vehicle speed overlay */}
          {selectedVehicle && selectedVehicle.status === 'on_trip' && (
            <div className="absolute top-4 left-1/2 -translate-x-1/2 bg-slate-900/90 border border-slate-700 rounded-xl px-4 py-2 backdrop-blur flex items-center gap-3">
              <div
                className="w-2 h-2 rounded-full flex-shrink-0"
                style={{ backgroundColor: selectedVehicle.color }}
              />
              <span className="text-xs font-semibold text-white">{selectedVehicle.name}</span>
              <span className="text-xs text-slate-400">{selectedVehicle.active_driver_name ?? '—'}</span>
              <span className="text-sm font-bold text-blue-400">{selectedVehicle.speed_kmh} km/h</span>
            </div>
          )}
        </main>

        {/* ---------------------------------------------------------------- */}
        {/* RIGHT PANEL                                                       */}
        {/* ---------------------------------------------------------------- */}
        <aside className="w-80 flex-shrink-0 border-l border-slate-700/60 bg-slate-900 flex flex-col min-h-0">

          {/* --- Drivers with Heavy Dues (full height, list scrolls) ------- */}
          <div className="flex-1 flex flex-col min-h-0 border-b border-slate-700/40">
            <div className="px-4 py-3 flex items-center justify-between flex-shrink-0">
              <div className="flex items-center gap-2">
                <Wallet className="w-4 h-4 text-red-400" />
                <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">
                  Heavy Dues
                </span>
              </div>
              <span className="text-xs text-slate-600">{heavyDues.length} drivers</span>
            </div>

            <div className="flex-1 overflow-y-auto px-3 pb-3 space-y-2 scrollbar-thin scrollbar-thumb-slate-700 scrollbar-track-transparent min-h-0">
              {[...heavyDues]
                .sort((a, b) => parseFloat(b.to_pay) - parseFloat(a.to_pay))
                .map((driver) => (
                  <div
                    key={driver.id}
                    className="flex items-center gap-3 bg-slate-800/60 border border-slate-700 rounded-xl p-2.5"
                  >
                    <div className="w-8 h-8 rounded-full bg-red-500/20 border border-red-500/30 flex items-center justify-center flex-shrink-0">
                      <span className="text-xs font-bold text-red-400">{driver.avatar_initial}</span>
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="text-xs font-semibold text-white truncate">{driver.name}</div>
                      <div className="flex items-center gap-1 text-xs text-slate-500">
                        <Phone className="w-2.5 h-2.5" />
                        <span>{driver.phone}</span>
                      </div>
                    </div>
                    <div className="text-right flex-shrink-0">
                      <div className="text-xs font-bold text-red-400">
                        {formatRs(parseFloat(driver.to_pay) || 0)}
                      </div>
                      <div className="text-xs text-slate-600">{driver.trips_this_month} trips</div>
                    </div>
                  </div>
                ))}
            </div>
          </div>
        </aside>
      </div>
    </div>
  );
}
