import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ArrowLeft, Video } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { monitoringApi } from '@/modules/monitoring/services/monitoringApi';
import { superSettingApi } from '@/modules/settings/services/superSettingApi';
import { cn } from '@/lib/utils';
import type { MonitoringVehicle } from '@/types';

type Channel = 1 | 2;

interface CameraStream {
  key: string;
  /** Short label like CCTV id (bottom-left overlay) */
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

/** Uniform N×M grid from stream count + viewport aspect (CCTV wall style). */
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

function CctvCell({ label, src }: { label: string; src: string }) {
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
          !loaded && 'opacity-0'
        )}
        referrerPolicy="strict-origin-when-cross-origin"
        allow="camera; microphone; fullscreen"
        onLoad={() => setLoaded(true)}
      />
      <div
        className="pointer-events-none absolute bottom-1 left-1 z-20 max-w-[calc(100%-0.5rem)] truncate bg-black/75 px-1.5 py-0.5 font-mono text-[11px] leading-tight text-cyan-300 shadow-[0_0_8px_rgba(34,211,238,0.15)]"
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
      {/* CCTV-style top bar */}
      <header className="z-10 flex h-11 flex-shrink-0 items-center gap-3 border-b border-zinc-800 bg-zinc-950 px-3">
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
        <div className="flex flex-shrink-0 items-center gap-1.5">
          <Video className="h-4 w-4 text-cyan-600" />
          <span className="hidden font-mono text-[10px] uppercase tracking-[0.25em] text-zinc-500 sm:inline">
            Cam
          </span>
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
          <p className="p-4 font-mono text-sm text-red-400">{error}</p>
        )}

        {!loading && !error && missingConfig && (
          <div className="m-4 border border-amber-900/60 bg-amber-950/40 p-4 font-mono text-sm text-amber-200/90">
            <p className="font-semibold text-amber-400">CONFIG</p>
            <p className="mt-2 text-amber-200/70">
              Set Luna web origin + API token in{' '}
              <Link to="/admin/settings" className="text-cyan-400 underline">
                Settings
              </Link>
              .
            </p>
          </div>
        )}

        {!loading && !error && !missingConfig && streamCount === 0 && (
          <div className="m-4 border border-zinc-800 p-4 font-mono text-sm text-zinc-500">
            <p>No IMEI — add in</p>
            <Link to="/admin/vehicles" className="mt-1 inline-block text-cyan-600 underline">
              Vehicles
            </Link>
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
              <CctvCell key={s.key} label={s.label} src={s.src} />
            ))}
          </div>
        )}

        {showGrid &&
          (gridW === 0 || gridH === 0) && (
            <div className="flex h-full items-center justify-center font-mono text-sm text-zinc-600">
              …
            </div>
          )}
      </div>
    </div>
  );
}
