import { useCallback, useEffect, useMemo, useState } from 'react';
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
    <div className="flex min-h-[160px] flex-col justify-center py-1">
      <div className="mx-auto w-full max-w-md rounded-md border border-zinc-700 bg-zinc-900/90 px-3 py-3 shadow-md">
        <p className="text-sm font-semibold leading-tight text-zinc-100">{v.name}</p>
        <p className="mt-1 font-mono text-[11px] text-cyan-600/90">
          {v.vehicle_no} · IMEI {v.imei}
        </p>
        <p className="mt-3 text-xs font-medium leading-relaxed text-zinc-200">
          This wall is in <span className="text-zinc-100">Simple view</span> — live camera video is not loaded
          here on purpose (no partner player, no technical error text).
        </p>
        <p className="mt-2 text-[11px] leading-relaxed text-zinc-500">
          Tap <span className="font-medium text-zinc-400">Live view</span> in the top bar to watch front and
          rear feeds when your Luna token and network allow it.
        </p>
        <p className="mt-2 text-[10px] leading-relaxed text-zinc-600">
          If feeds still fail in Live view, check Luna API client permissions and allowed origins for dashcam.
        </p>
      </div>
    </div>
  );
}

/**
 * Luna embeds often paint red status banners at the top; we cannot remove them from JS (cross-origin).
 * Slightly oversized iframe + upward shift clips typical banner rows; a thin top bar covers residual bleed.
 * Real fixes: Luna domain whitelist, camera/dashcam service on the API client, device + HLS infra.
 */
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
    <div className="relative w-full aspect-[6/4] overflow-hidden rounded-md border border-zinc-800 bg-black">
      <div className="absolute inset-0 overflow-hidden">
        <iframe
          title={cornerLabel}
          src={src}
          className={cn(
            'absolute left-1/2 top-[52%] box-border block h-[124%] w-[103%] max-w-none -translate-x-1/2 -translate-y-1/2 border-0',
            !loaded && 'opacity-0'
          )}
          referrerPolicy="strict-origin-when-cross-origin"
          allow="camera; microphone; fullscreen"
          onLoad={() => setLoaded(true)}
        />
      </div>
      <div
        className="pointer-events-none absolute inset-x-0 top-0 z-[11] h-10 bg-gradient-to-b from-zinc-950 from-40% to-transparent"
        aria-hidden
      />
      {!loaded && (
        <div
          className="absolute inset-0 z-[20] flex flex-col items-center justify-center gap-2 bg-zinc-950"
          aria-hidden
        >
          <div className="h-5 w-5 rounded-full border-2 border-zinc-700 border-t-cyan-500/80 animate-spin" />
        </div>
      )}
      <div className="pointer-events-none absolute bottom-1.5 left-1.5 z-[21] rounded bg-black/85 px-1.5 py-0.5 font-mono text-[10px] font-semibold uppercase tracking-wide text-cyan-400 shadow-sm">
        {cornerLabel}
      </div>
    </div>
  );
}

function CameraWallSkeleton() {
  return (
    <div className="space-y-4 p-3">
      {[0, 1].map((i) => (
        <div
          key={i}
          className="rounded-xl border border-zinc-800 bg-zinc-950/80 p-3 shadow-sm"
        >
          <div className="mb-3 space-y-2 border-b border-zinc-800/80 pb-2">
            <div className="h-3.5 w-40 animate-pulse rounded bg-zinc-800" />
            <div className="h-2.5 w-56 animate-pulse rounded bg-zinc-800/80" />
          </div>
          <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
            <div className="aspect-[6/4] w-full animate-pulse rounded-md bg-zinc-900" />
            <div className="aspect-[6/4] w-full animate-pulse rounded-md bg-zinc-900" />
          </div>
        </div>
      ))}
    </div>
  );
}

/** One vehicle: header + front / rear tiles (6:4), stacked section in scroll list. */
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
    return (
      <section className="rounded-xl border border-zinc-800 bg-zinc-950/90 p-3 shadow-sm">
        <VehicleSimplePanel v={v} />
      </section>
    );
  }

  const frontSrc = buildEmbedSrc(lunaOrigin, v.imei, 1, lunaToken);
  const rearSrc = buildEmbedSrc(lunaOrigin, v.imei, 2, lunaToken);

  return (
    <section className="rounded-xl border border-zinc-800 bg-zinc-950/90 p-3 shadow-sm">
      <div className="mb-3 flex flex-shrink-0 items-center gap-2 border-b border-zinc-800/80 pb-2">
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-semibold text-zinc-100">{v.name}</p>
          <p className="truncate font-mono text-[11px] text-zinc-500">
            {v.vehicle_no} · IMEI {v.imei}
          </p>
        </div>
      </div>
      <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
        <LiveStreamPane src={frontSrc} cornerLabel="Front" />
        <LiveStreamPane src={rearSrc} cornerLabel="Rear" />
      </div>
    </section>
  );
}

export default function CameraMonitoring() {
  const navigate = useNavigate();
  const [vehicles, setVehicles] = useState<MonitoringVehicle[]>([]);
  const [lunaOrigin, setLunaOrigin] = useState('');
  const [lunaToken, setLunaToken] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

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
        <div className="flex min-w-0 flex-1 flex-col items-center justify-center sm:flex-row sm:gap-3">
          <LiveClock />
        </div>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => setSimpleView((v) => !v)}
          className={cn(
            'h-8 flex-shrink-0 gap-1 px-2 font-mono text-[10px] uppercase tracking-wide sm:px-3',
            simpleView
              ? 'text-zinc-500 hover:bg-zinc-900 hover:text-zinc-200'
              : 'bg-cyan-950/50 text-cyan-300 hover:bg-cyan-950/70'
          )}
          title={
            simpleView
              ? 'You are in Simple view (no embedded video). Click to switch to Live view and load Luna feeds.'
              : 'You are in Live view (embedded cameras). Click for Simple view: placeholders only, no partner iframe.'
          }
        >
          <Info className="h-3.5 w-3.5 sm:mr-1" />
          <span className="font-mono uppercase tracking-wide">
            <span className="sm:hidden">{simpleView ? 'Simple' : 'Live'}</span>
            <span className="hidden sm:inline">{simpleView ? 'Simple view' : 'Live view'}</span>
          </span>
        </Button>
        <Video
          className="h-4 w-4 flex-shrink-0 text-cyan-600"
          title="Video feeds are provided by Luna. If a tile stays blank, confirm Luna web origin and API token under Settings, API client domain whitelist, and that the device is online."
        />
      </header>

      <div className="min-h-0 flex-1 overflow-y-auto overflow-x-hidden bg-zinc-950">
        {loading && <CameraWallSkeleton />}

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

        {showGrid && (
          <div className="space-y-4 p-3 pb-6">
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
      </div>
    </div>
  );
}
