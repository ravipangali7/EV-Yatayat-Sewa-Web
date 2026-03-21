import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ArrowLeft, Video } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { monitoringApi } from '@/modules/monitoring/services/monitoringApi';
import { superSettingApi } from '@/modules/settings/services/superSettingApi';
import { cn } from '@/lib/utils';
import type { MonitoringVehicle } from '@/types';

type Channel = 1 | 2;

interface VehicleWithImei {
  id: string;
  name: string;
  vehicle_no: string;
  imei: string;
}

function normalizeLunaOrigin(origin: string): string {
  return origin.trim().replace(/\/+$/, '');
}

function buildEmbedSrc(origin: string, imei: string, channel: Channel, apiToken: string): string {
  const base = normalizeLunaOrigin(origin);
  const url = new URL(`${base}/embed/camera/${encodeURIComponent(imei)}`);
  url.searchParams.set('api_token', apiToken);
  url.searchParams.set('channel', String(channel));
  return url.toString();
}

/** Pick columns × rows so N vehicle cards fill the viewport; wider screens get more columns. */
function computeGridDims(count: number, width: number, height: number): { cols: number; rows: number } {
  if (count <= 0) return { cols: 1, rows: 1 };
  const w = Math.max(width, 1);
  const h = Math.max(height, 1);
  const viewportRatio = w / h;
  let cols = Math.round(Math.sqrt(count * viewportRatio));
  cols = Math.max(1, Math.min(count, cols));
  const rows = Math.ceil(count / cols);
  return { cols, rows };
}

function useGridContainerSize() {
  const ref = useRef<HTMLDivElement>(null);
  const [size, setSize] = useState({ w: 0, h: 0 });

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const ro = new ResizeObserver((entries) => {
      const cr = entries[0]?.contentRect;
      if (cr) setSize({ w: cr.width, h: cr.height });
    });
    ro.observe(el);
    setSize({ w: el.clientWidth, h: el.clientHeight });
    return () => ro.disconnect();
  }, []);

  return { ref, width: size.w, height: size.h };
}

function StreamPane({
  title,
  src,
}: {
  title: string;
  src: string;
}) {
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    setLoaded(false);
  }, [src]);

  return (
    <div className="relative min-h-0 min-w-0 h-full w-full overflow-hidden rounded-sm bg-black">
      <div
        className="absolute left-1 top-1 z-20 pointer-events-none rounded px-1 py-0.5 text-[10px] font-bold uppercase tracking-wide text-white/90 bg-black/60"
        aria-hidden
      >
        {title}
      </div>
      {!loaded && (
        <div className="absolute inset-0 z-10 flex items-center justify-center bg-slate-950" aria-hidden>
          <div className="h-8 w-8 rounded-full border-2 border-slate-600 border-t-blue-500 animate-spin" />
        </div>
      )}
      <iframe
        title={title}
        src={src}
        className={cn(
          'absolute inset-0 box-border block h-full w-full max-h-full max-w-full border-0',
          !loaded && 'opacity-0'
        )}
        referrerPolicy="strict-origin-when-cross-origin"
        allow="camera; microphone; fullscreen"
        onLoad={() => setLoaded(true)}
      />
    </div>
  );
}

function VehicleCameraCard({
  vehicle,
  lunaOrigin,
  lunaToken,
}: {
  vehicle: VehicleWithImei;
  lunaOrigin: string;
  lunaToken: string;
}) {
  const frontSrc = buildEmbedSrc(lunaOrigin, vehicle.imei, 1, lunaToken);
  const rearSrc = buildEmbedSrc(lunaOrigin, vehicle.imei, 2, lunaToken);

  return (
    <div className="flex min-h-0 min-w-0 h-full w-full flex-col overflow-hidden rounded-lg border border-slate-700 bg-slate-950 shadow-lg">
      <div className="flex-shrink-0 border-b border-slate-700/90 bg-slate-900/90 px-2 py-1.5">
        <p className="truncate text-xs font-semibold text-slate-100">{vehicle.name}</p>
        <p className="truncate text-[10px] text-slate-500">
          {vehicle.vehicle_no} · IMEI {vehicle.imei}
        </p>
      </div>
      <div className="grid min-h-0 flex-1 grid-cols-2 gap-px bg-slate-800 p-px">
        <StreamPane title="Front" src={frontSrc} />
        <StreamPane title="Rear" src={rearSrc} />
      </div>
    </div>
  );
}

export default function CameraMonitoring() {
  const navigate = useNavigate();
  const [vehicles, setVehicles] = useState<MonitoringVehicle[]>([]);
  const [lunaOrigin, setLunaOrigin] = useState('');
  const [lunaToken, setLunaToken] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { ref: gridContainerRef, width: gridW, height: gridH } = useGridContainerSize();

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [settingsRes, snapshot] = await Promise.all([
        superSettingApi.list({ per_page: 1 }),
        monitoringApi.getSnapshot(),
      ]);
      const row = settingsRes.results?.[0];
      setLunaOrigin((row?.luna_web_origin ?? '').trim());
      setLunaToken((row?.luna_api_token ?? '').trim());
      setVehicles(snapshot.vehicles ?? []);
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Failed to load');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const vehiclesWithImei: VehicleWithImei[] = useMemo(() => {
    return vehicles
      .map((v) => {
        const imei = (v.imei ?? '').trim();
        if (!imei) return null;
        return {
          id: v.id,
          name: v.name,
          vehicle_no: v.vehicle_no,
          imei,
        };
      })
      .filter((x): x is VehicleWithImei => x != null);
  }, [vehicles]);

  const missingConfig = !normalizeLunaOrigin(lunaOrigin) || !lunaToken;
  const showGrid = !loading && !error && !missingConfig && vehiclesWithImei.length > 0;

  const { cols, rows } = useMemo(
    () => computeGridDims(vehiclesWithImei.length, gridW, gridH),
    [vehiclesWithImei.length, gridW, gridH]
  );

  return (
    <div className="flex h-dvh min-h-[100dvh] flex-col overflow-hidden bg-slate-900 text-white">
      <header className="z-10 flex h-14 flex-shrink-0 items-center gap-4 border-b border-slate-700/60 bg-slate-900/95 px-4 backdrop-blur">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => navigate('/admin')}
          className="flex-shrink-0 gap-1.5 text-slate-400 hover:bg-slate-800 hover:text-white"
        >
          <ArrowLeft className="h-4 w-4" />
          <span className="hidden sm:inline">Back</span>
        </Button>
        <div className="flex min-w-0 flex-1 items-center gap-2">
          <Video className="h-5 w-5 flex-shrink-0 text-blue-400" />
          <h1 className="truncate text-sm font-bold uppercase tracking-widest text-slate-100">
            Camera monitoring
          </h1>
        </div>
      </header>

      <div ref={gridContainerRef} className="min-h-0 flex-1 overflow-hidden p-2">
        {loading && (
          <div className="grid h-full w-full grid-cols-2 gap-2">
            {[1, 2, 3, 4].map((i) => (
              <div
                key={i}
                className="min-h-0 animate-pulse rounded-lg border border-slate-700 bg-slate-900/60"
              />
            ))}
          </div>
        )}

        {!loading && error && <p className="text-sm text-red-300">{error}</p>}

        {!loading && !error && missingConfig && (
          <div className="rounded-lg border border-amber-500/40 bg-amber-500/10 px-4 py-3 text-sm text-amber-100">
            <p className="font-medium">Luna embed is not configured</p>
            <p className="mt-1 text-amber-200/80">
              Set <strong>Luna web origin</strong> and <strong>Luna API token</strong> in{' '}
              <Link to="/admin/settings" className="font-medium underline">
                Settings
              </Link>
              .
            </p>
          </div>
        )}

        {!loading && !error && !missingConfig && vehiclesWithImei.length === 0 && (
          <div className="rounded-lg border border-slate-700 bg-slate-800/40 px-4 py-3 text-sm text-slate-200">
            <p className="flex items-center gap-2 font-medium">
              <Video className="h-4 w-4" />
              No vehicles with IMEI
            </p>
            <p className="mt-1 text-slate-400">
              Add an IMEI on each vehicle in{' '}
              <Link to="/admin/vehicles" className="text-blue-400 underline">
                Vehicles
              </Link>{' '}
              to show cameras here.
            </p>
          </div>
        )}

        {showGrid && gridW > 0 && gridH > 0 && (
          <div
            className="grid h-full w-full gap-2"
            style={{
              gridTemplateColumns: `repeat(${cols}, minmax(0, 1fr))`,
              gridTemplateRows: `repeat(${rows}, minmax(0, 1fr))`,
            }}
          >
            {vehiclesWithImei.map((v) => (
              <VehicleCameraCard
                key={v.id}
                vehicle={v}
                lunaOrigin={lunaOrigin}
                lunaToken={lunaToken}
              />
            ))}
          </div>
        )}

        {showGrid && (gridW === 0 || gridH === 0) && (
          <div className="flex h-full items-center justify-center text-slate-500 text-sm">Loading layout…</div>
        )}
      </div>
    </div>
  );
}
