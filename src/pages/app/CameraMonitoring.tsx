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

interface CameraStream {
  key: string;
  label: string;
  src: string;
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

/** Covers partner iframe with plain-language copy (partner errors live inside iframe; we cannot edit them). */
function CustomerFriendlyCover({ cameraLabel }: { cameraLabel: string }) {
  return (
    <div className="absolute inset-0 z-40 flex flex-col items-center justify-center bg-zinc-950/96 p-3 text-center">
      <div className="max-w-[220px] rounded border border-zinc-700/80 bg-zinc-900/90 px-3 py-3 shadow-lg">
        <p className="font-mono text-[10px] uppercase tracking-widest text-cyan-500/90">{cameraLabel}</p>
        <p className="mt-2 text-xs font-medium leading-snug text-zinc-100">
          Live camera isn’t available right now
        </p>
        <p className="mt-2 text-[11px] leading-relaxed text-zinc-400">
          This usually means the bus is parked, switched off, or out of coverage. Video often appears once the
          vehicle is running and online again.
        </p>
        <p className="mt-2 text-[10px] leading-relaxed text-zinc-500">
          If it stays like this for a long time, check the device or contact support—we’ll help trace the camera
          link.
        </p>
      </div>
    </div>
  );
}

function CctvCell({
  label,
  src,
  customerFriendlyView,
}: {
  label: string;
  src: string;
  customerFriendlyView: boolean;
}) {
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    setLoaded(false);
  }, [src]);

  return (
    <div className="relative min-h-0 min-w-0 h-full w-full overflow-hidden bg-black outline outline-1 outline-zinc-800">
      {!loaded && (
        <div
          className="absolute inset-0 z-10 flex flex-col items-center justify-center gap-2 bg-zinc-950"
          aria-hidden
        >
          <div className="h-6 w-6 rounded-full border-2 border-zinc-700 border-t-cyan-500/80 animate-spin" />
          <span className="font-mono text-[10px] uppercase tracking-[0.2em] text-zinc-600">Signal</span>
        </div>
      )}
      <iframe
        title={label}
        src={src}
        className={cn(
          'absolute inset-0 box-border block h-full w-full max-h-full max-w-full border-0',
          !loaded && 'opacity-0',
          customerFriendlyView && 'pointer-events-none'
        )}
        referrerPolicy="strict-origin-when-cross-origin"
        allow="camera; microphone; fullscreen"
        onLoad={() => setLoaded(true)}
      />
      {customerFriendlyView && <CustomerFriendlyCover cameraLabel={label} />}
      <div
        className="pointer-events-none absolute bottom-1 left-1 z-50 max-w-[calc(100%-0.5rem)] truncate bg-black/75 px-1.5 py-0.5 font-mono text-[11px] leading-tight text-cyan-300 shadow-[0_0_8px_rgba(34,211,238,0.15)]"
        aria-hidden
      >
        {label}
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

  const [customerFriendlyView, setCustomerFriendlyView] = useState(() => {
    try {
      const v = sessionStorage.getItem(COMFORT_STORAGE_KEY);
      if (v === '0') return false;
      if (v === '1') return true;
      return true;
    } catch {
      return true;
    }
  });

  useEffect(() => {
    try {
      sessionStorage.setItem(COMFORT_STORAGE_KEY, customerFriendlyView ? '1' : '0');
    } catch {
      /* ignore */
    }
  }, [customerFriendlyView]);

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

  const activeStreams: CameraStream[] = useMemo(() => {
    const origin = normalizeLunaOrigin(lunaOrigin);
    if (!origin || !lunaToken) return [];
    const list: CameraStream[] = [];
    for (const v of vehicles) {
      const imei = (v.imei ?? '').trim();
      if (!imei) continue;
      const base = v.vehicle_no?.trim() || v.name?.slice(0, 12) || imei.slice(-8);
      list.push({
        key: `${v.id}:1`,
        label: `${base}.F`,
        src: buildEmbedSrc(origin, imei, 1, lunaToken),
      });
      list.push({
        key: `${v.id}:2`,
        label: `${base}.R`,
        src: buildEmbedSrc(origin, imei, 2, lunaToken),
      });
    }
    return list;
  }, [vehicles, lunaOrigin, lunaToken]);

  const missingConfig = !normalizeLunaOrigin(lunaOrigin) || !lunaToken;
  const showGrid = !loading && !error && !missingConfig && activeStreams.length > 0;

  const streamCount = activeStreams.length;
  const { cols, rows } = useMemo(
    () => computeGridDims(streamCount, gridW, gridH),
    [streamCount, gridW, gridH]
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
        <div className="flex min-w-0 flex-1 items-center justify-center">
          <LiveClock />
        </div>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => setCustomerFriendlyView((v) => !v)}
          className={cn(
            'h-8 flex-shrink-0 gap-1 px-2 font-mono text-[10px] uppercase tracking-wide sm:px-3',
            customerFriendlyView
              ? 'bg-cyan-950/50 text-cyan-300 hover:bg-cyan-950/70'
              : 'text-zinc-500 hover:bg-zinc-900 hover:text-zinc-300'
          )}
          title={
            customerFriendlyView
              ? 'Show live camera view (may include technical messages from the video provider)'
              : 'Show customer-friendly messages instead of raw provider screens'
          }
        >
          <Info className="h-3.5 w-3.5 sm:mr-1" />
          <span className="hidden sm:inline">{customerFriendlyView ? 'Live view' : 'Simple view'}</span>
        </Button>
        <div className="flex flex-shrink-0 items-center gap-1.5">
          <Video className="h-4 w-4 text-cyan-600" />
        </div>
      </header>

      <div ref={gridContainerRef} className="min-h-0 flex-1 overflow-hidden bg-zinc-950 p-px">
        {loading && (
          <div
            className="grid h-full w-full gap-px bg-zinc-800"
            style={{
              gridTemplateColumns: 'repeat(4, minmax(0, 1fr))',
              gridTemplateRows: 'repeat(4, minmax(0, 1fr))',
            }}
          >
            {Array.from({ length: 16 }, (_, i) => (
              <div key={i} className="min-h-0 animate-pulse bg-zinc-900" />
            ))}
          </div>
        )}

        {!loading && error && (
          <div className="m-4 max-w-md rounded border border-amber-900/50 bg-amber-950/50 p-4 text-sm text-amber-100/95">
            <p className="font-medium text-amber-200">Something went wrong</p>
            <p className="mt-2 leading-relaxed text-amber-100/80">{error}</p>
          </div>
        )}

        {!loading && !error && missingConfig && (
          <div className="m-4 max-w-md rounded border border-amber-900/50 bg-amber-950/40 p-4 text-sm text-amber-100/90">
            <p className="font-semibold text-amber-200">Camera setup needed</p>
            <p className="mt-2 leading-relaxed text-amber-100/75">
              Add your Luna web address and API token under{' '}
              <Link to="/admin/settings" className="font-medium text-cyan-400 underline">
                Settings
              </Link>{' '}
              so this wall can load.
            </p>
          </div>
        )}

        {!loading && !error && !missingConfig && streamCount === 0 && (
          <div className="m-4 max-w-md rounded border border-zinc-800 p-4 text-sm text-zinc-400">
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
            {activeStreams.map((s) => (
              <CctvCell
                key={s.key}
                label={s.label}
                src={s.src}
                customerFriendlyView={customerFriendlyView}
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
