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
  Zap,
  Wallet,
  ChevronRight,
} from 'lucide-react';
import { cn } from '@/lib/utils';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface MockVehicle {
  id: string;
  name: string;
  vehicle_no: string;
  route_name: string;
  start_point: string;
  end_point: string;
  active_driver_name: string;
  active_driver_phone: string;
  seats_booked: number;
  seats_total: number;
  today_revenue: number;
  today_trips: number;
  lat: number;
  lng: number;
  speed_kmh: number;
  status: 'on_trip' | 'idle';
  color: string;
}

interface MockDriverDue {
  id: string;
  name: string;
  phone: string;
  avatar_initial: string;
  to_pay: number;
  last_trip_date: string;
  trips_this_month: number;
}

// ---------------------------------------------------------------------------
// Static Mock Data
// ---------------------------------------------------------------------------

const BASE_VEHICLES: MockVehicle[] = [
  {
    id: 'v1',
    name: 'Sajha Yatayat 01',
    vehicle_no: 'BA 1 KHA 2345',
    route_name: 'Kalanki - Koteshwor',
    start_point: 'Kalanki',
    end_point: 'Koteshwor',
    active_driver_name: 'Ram Bahadur Thapa',
    active_driver_phone: '9841234567',
    seats_booked: 18,
    seats_total: 24,
    today_revenue: 4320,
    today_trips: 6,
    lat: 27.6939,
    lng: 85.2869,
    speed_kmh: 32,
    status: 'on_trip',
    color: '#22c55e',
  },
  {
    id: 'v2',
    name: 'Sajha Yatayat 02',
    vehicle_no: 'BA 2 KHA 6789',
    route_name: 'Ratnapark - Bhaktapur',
    start_point: 'Ratnapark',
    end_point: 'Bhaktapur',
    active_driver_name: 'Sita Kumari Sharma',
    active_driver_phone: '9851098765',
    seats_booked: 22,
    seats_total: 24,
    today_revenue: 6750,
    today_trips: 9,
    lat: 27.7041,
    lng: 85.3131,
    speed_kmh: 28,
    status: 'on_trip',
    color: '#3b82f6',
  },
  {
    id: 'v3',
    name: 'EV Bus 03',
    vehicle_no: 'BA 3 CHA 1122',
    route_name: 'Lagankhel - Thankot',
    start_point: 'Lagankhel',
    end_point: 'Thankot',
    active_driver_name: 'Hari Prasad Koirala',
    active_driver_phone: '9803456789',
    seats_booked: 9,
    seats_total: 24,
    today_revenue: 2100,
    today_trips: 4,
    lat: 27.6671,
    lng: 85.3095,
    speed_kmh: 41,
    status: 'on_trip',
    color: '#f59e0b',
  },
  {
    id: 'v4',
    name: 'Green Ride 04',
    vehicle_no: 'BA 4 JHA 3344',
    route_name: 'Balaju - Naikap',
    start_point: 'Balaju',
    end_point: 'Naikap',
    active_driver_name: 'Bishnu Maya Gurung',
    active_driver_phone: '9860112233',
    seats_booked: 0,
    seats_total: 24,
    today_revenue: 3890,
    today_trips: 5,
    lat: 27.7368,
    lng: 85.2944,
    speed_kmh: 0,
    status: 'idle',
    color: '#6b7280',
  },
  {
    id: 'v5',
    name: 'EV Connect 05',
    vehicle_no: 'BA 5 TA 5566',
    route_name: 'Chabahil - Budhanilkantha',
    start_point: 'Chabahil',
    end_point: 'Budhanilkantha',
    active_driver_name: 'Gopal Khadka',
    active_driver_phone: '9845678901',
    seats_booked: 16,
    seats_total: 20,
    today_revenue: 5200,
    today_trips: 7,
    lat: 27.7196,
    lng: 85.3493,
    speed_kmh: 25,
    status: 'on_trip',
    color: '#a855f7',
  },
];

const MOCK_DRIVER_DUES: MockDriverDue[] = [
  {
    id: 'd1',
    name: 'Ram Bahadur Thapa',
    phone: '9841234567',
    avatar_initial: 'R',
    to_pay: 12400,
    last_trip_date: '2026-03-15',
    trips_this_month: 42,
  },
  {
    id: 'd2',
    name: 'Sita Kumari Sharma',
    phone: '9851098765',
    avatar_initial: 'S',
    to_pay: 8750,
    last_trip_date: '2026-03-16',
    trips_this_month: 38,
  },
  {
    id: 'd3',
    name: 'Deepak Rana',
    phone: '9812345678',
    avatar_initial: 'D',
    to_pay: 6200,
    last_trip_date: '2026-03-14',
    trips_this_month: 29,
  },
  {
    id: 'd4',
    name: 'Anjana Tamang',
    phone: '9867890123',
    avatar_initial: 'A',
    to_pay: 4900,
    last_trip_date: '2026-03-13',
    trips_this_month: 22,
  },
  {
    id: 'd5',
    name: 'Bikash Magar',
    phone: '9823456789',
    avatar_initial: 'B',
    to_pay: 3300,
    last_trip_date: '2026-03-16',
    trips_this_month: 18,
  },
];

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
  vehicle: MockVehicle;
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
        <span className="text-xs text-slate-400 truncate">{vehicle.active_driver_name}</span>
        <Phone className="w-3 h-3 text-slate-600 flex-shrink-0 ml-auto" />
        <span className="text-xs text-slate-500">{vehicle.active_driver_phone}</span>
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

  const [vehicles, setVehicles] = useState<MockVehicle[]>(BASE_VEHICLES);
  const [selectedVehicleId, setSelectedVehicleId] = useState<string | null>(null);
  const [infoWindowVehicleId, setInfoWindowVehicleId] = useState<string | null>(null);
  const mapRef = useRef<google.maps.Map | null>(null);

  // Simulate vehicle movement every 3 seconds
  useEffect(() => {
    const id = setInterval(() => {
      setVehicles(prev =>
        prev.map(v => {
          if (v.status !== 'on_trip') return v;
          const deltaLat = (Math.random() - 0.5) * 0.0008;
          const deltaLng = (Math.random() - 0.5) * 0.0008;
          return {
            ...v,
            lat: v.lat + deltaLat,
            lng: v.lng + deltaLng,
            speed_kmh: Math.floor(20 + Math.random() * 40),
          };
        })
      );
    }, 3000);
    return () => clearInterval(id);
  }, []);

  const onMapLoad = useCallback((map: google.maps.Map) => {
    mapRef.current = map;
  }, []);

  const focusVehicle = (vehicle: MockVehicle) => {
    setSelectedVehicleId(vehicle.id);
    setInfoWindowVehicleId(vehicle.id);
    if (mapRef.current) {
      mapRef.current.panTo({ lat: vehicle.lat, lng: vehicle.lng });
      mapRef.current.setZoom(15);
    }
  };

  const handleMarkerClick = (vehicle: MockVehicle) => {
    setSelectedVehicleId(vehicle.id);
    setInfoWindowVehicleId(vehicle.id);
  };

  const selectedVehicle = vehicles.find(v => v.id === selectedVehicleId);
  const infoWindowVehicle = vehicles.find(v => v.id === infoWindowVehicleId);

  const totalRevenue = vehicles.reduce((s, v) => s + v.today_revenue, 0);
  const onTripCount = vehicles.filter(v => v.status === 'on_trip').length;
  const totalSeatsBooked = vehicles.reduce((s, v) => s + v.seats_booked, 0);

  return (
    <div className="h-screen flex flex-col bg-slate-900 overflow-hidden text-white">
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
            <span className="text-xs text-slate-600">{vehicles.length} vehicles</span>
          </div>

          {/* Cards list */}
          <div className="flex-1 overflow-y-auto p-3 space-y-2 scrollbar-thin scrollbar-thumb-slate-700 scrollbar-track-transparent">
            {vehicles
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
              {vehicles.map(vehicle => (
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

              {infoWindowVehicle && (
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
                      Driver: {infoWindowVehicle.active_driver_name}
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
              <span className="text-xs text-slate-400">{selectedVehicle.active_driver_name}</span>
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
              <span className="text-xs text-slate-600">{MOCK_DRIVER_DUES.length} drivers</span>
            </div>

            <div className="flex-1 overflow-y-auto px-3 pb-3 space-y-2 scrollbar-thin scrollbar-thumb-slate-700 scrollbar-track-transparent min-h-0">
              {MOCK_DRIVER_DUES.sort((a, b) => b.to_pay - a.to_pay).map(driver => (
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
                    <div className="text-xs font-bold text-red-400">{formatRs(driver.to_pay)}</div>
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
