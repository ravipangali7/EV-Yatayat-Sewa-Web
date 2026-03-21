import { useCallback, useEffect, useMemo, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ArrowLeft, Video } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { monitoringApi } from '@/modules/monitoring/services/monitoringApi';
import { superSettingApi } from '@/modules/settings/services/superSettingApi';
import { cn } from '@/lib/utils';
import type { MonitoringVehicle } from '@/types';

type Channel = 1 | 2;

interface CameraCell {
  key: string;
  vehicleId: string;
  vehicleName: string;
  vehicleNo: string;
  imei: string;
  channel: Channel;
  sideLabel: string;
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

function LunaCameraCell({ cell, src }: { cell: CameraCell; src: string }) {
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    setLoaded(false);
  }, [src]);

  return (
    <div className="relative flex flex-col min-h-0 rounded-lg border border-slate-700 bg-slate-900/80 overflow-hidden h-full">
      <div className="flex-shrink-0 px-3 py-2 border-b border-slate-700/80 bg-slate-950/50">
        <p className="text-xs font-semibold text-slate-200 truncate">{cell.vehicleName}</p>
        <p className="text-[11px] text-slate-500 truncate">
          {cell.vehicleNo} · {cell.sideLabel} · IMEI {cell.imei}
        </p>
      </div>
      <div className="relative flex-1 min-h-[140px] bg-black">
        {!loaded && (
          <div
            className="absolute inset-0 z-10 flex flex-col gap-2 p-3 bg-slate-950"
            aria-hidden
          >
            <div className="h-3 w-2/3 rounded bg-slate-800 animate-pulse" />
            <div className="flex-1 min-h-[100px] rounded-md bg-slate-800/80 animate-pulse" />
          </div>
        )}
        <iframe
          title={`${cell.vehicleName} ${cell.sideLabel}`}
          src={src}
          className={cn('absolute inset-0 w-full h-full border-0', !loaded && 'opacity-0')}
          referrerPolicy="strict-origin-when-cross-origin"
          allow="camera; microphone; fullscreen"
          onLoad={() => setLoaded(true)}
        />
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

  const cells: CameraCell[] = useMemo(() => {
    const list: CameraCell[] = [];
    for (const v of vehicles) {
      const imei = (v.imei ?? '').trim();
      if (!imei) continue;
      list.push(
        {
          key: `${v.id}-1`,
          vehicleId: v.id,
          vehicleName: v.name,
          vehicleNo: v.vehicle_no,
          imei,
          channel: 1,
          sideLabel: 'Front',
        },
        {
          key: `${v.id}-2`,
          vehicleId: v.id,
          vehicleName: v.name,
          vehicleNo: v.vehicle_no,
          imei,
          channel: 2,
          sideLabel: 'Rear',
        }
      );
    }
    return list;
  }, [vehicles]);

  const missingConfig = !normalizeLunaOrigin(lunaOrigin) || !lunaToken;
  const showGrid = !loading && !error && !missingConfig && cells.length > 0;

  return (
    <div className="h-dvh min-h-[100dvh] flex flex-col bg-slate-900 overflow-hidden text-white">
      <header className="h-14 flex-shrink-0 border-b border-slate-700/60 bg-slate-900/95 backdrop-blur flex items-center px-4 gap-4 z-10">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => navigate('/admin')}
          className="text-slate-400 hover:text-white hover:bg-slate-800 gap-1.5 flex-shrink-0"
        >
          <ArrowLeft className="w-4 h-4" />
          <span className="hidden sm:inline">Back</span>
        </Button>
        <div className="flex items-center gap-2 flex-1 min-w-0">
          <Video className="w-5 h-5 text-blue-400 flex-shrink-0" />
          <h1 className="text-sm font-bold tracking-widest uppercase text-slate-100 truncate">
            Camera monitoring
          </h1>
        </div>
      </header>

      <div className="flex-1 min-h-0 overflow-auto p-3">
        {loading && (
          <div className="grid grid-cols-2 gap-3 h-full min-h-[200px] auto-rows-fr">
            {[1, 2, 3, 4].map((i) => (
              <div
                key={i}
                className="min-h-[180px] rounded-lg border border-slate-700 bg-slate-900/60 animate-pulse"
              />
            ))}
          </div>
        )}

        {!loading && error && (
          <p className="text-sm text-red-300">{error}</p>
        )}

        {!loading && !error && missingConfig && (
          <div className="rounded-lg border border-amber-500/40 bg-amber-500/10 px-4 py-3 text-sm text-amber-100">
            <p className="font-medium">Luna embed is not configured</p>
            <p className="mt-1 text-amber-200/80">
              Set <strong>Luna web origin</strong> and <strong>Luna API token</strong> in{' '}
              <Link to="/admin/settings" className="underline font-medium">
                Settings
              </Link>
              .
            </p>
          </div>
        )}

        {!loading && !error && !missingConfig && cells.length === 0 && (
          <div className="rounded-lg border border-slate-700 bg-slate-800/40 px-4 py-3 text-sm text-slate-200">
            <p className="font-medium flex items-center gap-2">
              <Video className="w-4 h-4" />
              No vehicles with IMEI
            </p>
            <p className="mt-1 text-slate-400">
              Add an IMEI on each vehicle in{' '}
              <Link to="/admin/vehicles" className="underline text-blue-400">
                Vehicles
              </Link>{' '}
              to show cameras here.
            </p>
          </div>
        )}

        {showGrid && (
          <div
            className="grid grid-cols-2 gap-3 h-full min-h-0"
            style={{ gridAutoRows: 'minmax(0, 1fr)' }}
          >
            {cells.map((cell) => (
              <LunaCameraCell
                key={cell.key}
                cell={cell}
                src={buildEmbedSrc(lunaOrigin, cell.imei, cell.channel, lunaToken)}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
