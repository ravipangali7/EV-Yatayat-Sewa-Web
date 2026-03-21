import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ArrowLeft, Video, Info } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { monitoringApi } from '@/modules/monitoring/services/monitoringApi';
import { superSettingApi } from '@/modules/settings/services/superSettingApi';
import { cn } from '@/lib/utils';
import type { MonitoringVehicle } from '@/types';

const COMFORT_STORAGE_KEY = 'cctv_customer_friendly_view';

type Channel = 1 | 2;

interface VehicleCam {
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

function LiveClock() {
  const [t, setT] = useState(() => new Date());
  useEffect(() => {
    const id = setInterval(() => setT(new Date()), 1000);
    return () => clearInterval(id);
  }, []);
  return (
    <span className="font-mono text-sm tabular-nums tracking-widest text-cyan-400/90">
      {t.toLocaleTimeString('en-GB', { hour12: false })}
    </span>
  );
}

/** Simple view: no iframe — partner UI never loads, so nothing can bleed through. */
function VehicleSimplePanel({ v }: { v: VehicleCam }) {
  return (
    <div className="flex h-full min-h-0 w-full flex-col bg-zinc-950 outline outline-1 outline-zinc-800">
      <div className="flex min-h-0 flex-1 flex-col justify-center p-2 sm:p-3">
        <div className="mx-auto w-full max-w-[280px] rounded-md border border-zinc-700 bg-zinc-900 px-3 py-3 shadow-md">
          <p className="text-sm font-semibold leading-tight text-zinc-100">{v.name}</p>
          <p className="mt-1 font-mono text-[11px] text-cyan-600/90">
            {v.vehicle_no} · IMEI {v.imei}
          </p>
          <p className="mt-3 text-xs leading-relaxed text-zinc-300">
            Live video for the front and rear cameras isn’t showing on this screen right now.
          </p>
          <p className="mt-2 text-[11px] leading-relaxed text-zinc-500">
            Usually the bus is parked, switched off, or out of network coverage. Both cameras typically come back
            when the vehicle is running and online.
          </p>
          <p className="mt-2 text-[10px] leading-relaxed text-zinc-600">
            If this continues for a long time, contact support and we’ll help check the camera link.
          </p>
        </div>
      </div>
    </div>
  );
}

function LiveStreamPane({
  src,
  cornerLabel,
}: {
  src: string;
  cornerLabel: string;
}) {
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    setLoaded(false);
  }, [src]);

  return (
    <div className="relative min-h-0 min-w-0 h-full w-full overflow-hidden bg-black">
      {!loaded && (
        <div
          className="absolute inset-0 z-10 flex flex-col items-center justify-center gap-2 bg-zinc-950"
          aria-hidden
        >
          <div className="h-5 w-5 rounded-full border-2 border-zinc-700 border-t-cyan-500/80 animate-spin" />
        </div>
      )}
      <iframe
        title={cornerLabel}
        src={src}
        className={cn(
          'absolute inset-0 z-0 box-border block h-full w-full max-h-full max-w-full border-0',
          !loaded && 'opacity-0'
        )}
        referrerPolicy="strict-origin-when-cross-origin"
        allow="camera; microphone; fullscreen"
        onLoad={() => setLoaded(true)}
      />
      <div className="pointer-events-none absolute bottom-1 left-1 z-20 rounded bg-black px-1.5 py-0.5 font-mono text-[10px] font-semibold uppercase tracking-wide text-cyan-400">
        {cornerLabel}
      </div>
    </div>
  );
}

/** One grid cell: vehicle header + front | rear (live only). */
function VehicleCameraCard({
  v,
  lunaOrigin,
  lunaToken,
  simpleView,
}: {
  v: VehicleCam;
  lunaOrigin: string;
  lunaToken: string;
  simpleView: boolean;
}) {
  if (simpleView) {
    return <VehicleSimplePanel v={v} />;
  }

  const frontSrc = buildEmbedSrc(lunaOrigin, v.imei, 1, lunaToken);
  const rearSrc = buildEmbedSrc(lunaOrigin, v.imei, 2, lunaToken);

  return (
    <div className="flex min-h-0 min-w-0 h-full w-full flex-col overflow-hidden bg-black outline outline-1 outline-zinc-800">
      <div className="flex flex-shrink-0 items-center gap-2 border-b border-zinc-800 bg-zinc-950 px-2 py-1">
        <div className="min-w-0 flex-1">
          <p className="truncate text-xs font-semibold text-zinc-200">{v.name}</p>
          <p className="truncate font-mono text-[10px] text-zinc-500">
            {v.vehicle_no} · {v.imei}
          </p>
        </div>
      </div>
      <div className="grid min-h-0 flex-1 grid-cols-2 gap-px bg-zinc-800">
        <LiveStreamPane src={frontSrc} cornerLabel="Front" />
        <LiveStreamPane src={rearSrc} cornerLabel="Rear" />
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

  const [simpleView, setSimpleView] = useState(() => {
    try {
      const v = sessionStorage.getItem(COMFORT_STORAGE_KEY);
      if (v === '1') return true;
      return false;
    } catch {
      return false;
    }
  });

  useEffect(() => {
    try {
      sessionStorage.setItem(COMFORT_STORAGE_KEY, simpleView ? '1' : '0');
    } catch {
      /* ignore */
    }
  }, [simpleView]);

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
    } catch {
      setError(
        'We could not refresh this screen. Check your connection, sign in again, or try in a few minutes.'
      );
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const vehicleCams: VehicleCam[] = useMemo(() => {
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
      .filter((x): x is VehicleCam => x != null);
  }, [vehicles]);

  const missingConfig = !normalizeLunaOrigin(lunaOrigin) || !lunaToken;
  const showGrid = !loading && !error && !missingConfig && vehicleCams.length > 0;

  const { cols, rows } = useMemo(
    () => computeGridDims(vehicleCams.length, gridW, gridH),
    [vehicleCams.length, gridW, gridH]
  );

  return (
    <div className="flex h-dvh min-h-[100dvh] flex-col overflow-hidden bg-black text-zinc-100">
      <header className="z-10 flex h-11 flex-shrink-0 items-center gap-2 border-b border-zinc-800 bg-zinc-950 px-2 sm:gap-3 sm:px-3">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => navigate('/admin')}
          className="h-8 flex-shrink-0 gap-1 text-zinc-500 hover:bg-zinc-900 hover:text-cyan-400"
        >
          <ArrowLeft className="h-4 w-4" />
          <span className="hidden font-mono text-xs sm:inline">Back</span>
        </Button>
        <div className="flex min-w-0 flex-1 flex-col items-center justify-center gap-0.5 sm:flex-row sm:gap-3">
          <LiveClock />
          {!simpleView && (
            <span className="hidden max-w-[200px] truncate text-center font-mono text-[9px] text-zinc-600 sm:inline sm:max-w-none">
              Technical messages may appear inside each feed (video partner)
            </span>
          )}
        </div>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => setSimpleView((v) => !v)}
          className={cn(
            'h-8 flex-shrink-0 gap-1 px-2 font-mono text-[10px] uppercase tracking-wide sm:px-3',
            simpleView
              ? 'bg-cyan-950/50 text-cyan-300 hover:bg-cyan-950/70'
              : 'text-zinc-500 hover:bg-zinc-900 hover:text-zinc-300'
          )}
          title={
            simpleView
              ? 'Load live Luna cameras (may show token/stream messages from the provider)'
              : 'Customer-safe view: no partner iframe, no red technical text'
          }
        >
          <Info className="h-3.5 w-3.5 sm:mr-1" />
          <span className="hidden sm:inline">{simpleView ? 'Live view' : 'Simple view'}</span>
        </Button>
        <Video className="h-4 w-4 flex-shrink-0 text-cyan-600" />
      </header>

      <div ref={gridContainerRef} className="min-h-0 flex-1 overflow-hidden bg-zinc-950 p-px">
        {loading && (
          <div
            className="grid h-full w-full gap-px bg-zinc-800"
            style={{
              gridTemplateColumns: 'repeat(3, minmax(0, 1fr))',
              gridTemplateRows: 'repeat(2, minmax(0, 1fr))',
            }}
          >
            {Array.from({ length: 6 }, (_, i) => (
              <div key={i} className="min-h-0 animate-pulse bg-zinc-900" />
            ))}
          </div>
        )}

        {!loading && error && (
          <div className="m-4 max-w-md rounded border border-amber-900/50 bg-amber-950 p-4 text-sm text-amber-100">
            <p className="font-medium text-amber-200">Something went wrong</p>
            <p className="mt-2 leading-relaxed text-amber-100/90">{error}</p>
          </div>
        )}

        {!loading && !error && missingConfig && (
          <div className="m-4 max-w-md rounded border border-amber-900/50 bg-amber-950 p-4 text-sm text-amber-100">
            <p className="font-semibold text-amber-200">Camera setup needed</p>
            <p className="mt-2 leading-relaxed text-amber-100/85">
              Add your Luna web address and API token under{' '}
              <Link to="/admin/settings" className="font-medium text-cyan-400 underline">
                Settings
              </Link>{' '}
              so this wall can load.
            </p>
          </div>
        )}

        {!loading && !error && !missingConfig && vehicleCams.length === 0 && (
          <div className="m-4 max-w-md rounded border border-zinc-800 bg-zinc-900 p-4 text-sm text-zinc-400">
            <p className="font-medium text-zinc-300">No cameras to show yet</p>
            <p className="mt-2 leading-relaxed">
              Add an IMEI for each bus under{' '}
              <Link to="/admin/vehicles" className="text-cyan-500 underline">
                Vehicles
              </Link>
              .
            </p>
          </div>
        )}

        {showGrid && gridW > 0 && gridH > 0 && (
          <div
            className="grid h-full w-full gap-px bg-zinc-800"
            style={{
              gridTemplateColumns: `repeat(${cols}, minmax(0, 1fr))`,
              gridTemplateRows: `repeat(${rows}, minmax(0, 1fr))`,
            }}
          >
            {vehicleCams.map((v) => (
              <VehicleCameraCard
                key={v.id}
                v={v}
                lunaOrigin={normalizeLunaOrigin(lunaOrigin)}
                lunaToken={lunaToken}
                simpleView={simpleView}
              />
            ))}
          </div>
        )}

        {showGrid && (gridW === 0 || gridH === 0) && (
          <div className="flex h-full items-center justify-center font-mono text-sm text-zinc-600">…</div>
        )}
      </div>
    </div>
  );
}
