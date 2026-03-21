import { useCallback, useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { Video } from 'lucide-react';
import { PageHeader } from '@/components/common/PageHeader';
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
    <div className="relative flex flex-col min-h-[220px] rounded-lg border border-slate-700 bg-slate-900/80 overflow-hidden">
      <div className="flex-shrink-0 px-3 py-2 border-b border-slate-700/80 bg-slate-950/50">
        <p className="text-xs font-semibold text-slate-200 truncate">{cell.vehicleName}</p>
        <p className="text-[11px] text-slate-500 truncate">
          {cell.vehicleNo} · {cell.sideLabel} · IMEI {cell.imei}
        </p>
      </div>
      <div className="relative flex-1 min-h-[200px] bg-black">
        {!loaded && (
          <div
            className="absolute inset-0 z-10 flex flex-col gap-2 p-3 bg-slate-950"
            aria-hidden
          >
            <div className="h-3 w-2/3 rounded bg-slate-800 animate-pulse" />
            <div className="flex-1 min-h-[160px] rounded-md bg-slate-800/80 animate-pulse" />
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
    <div className="space-y-4">
      <PageHeader
        title="Camera monitoring"
        subtitle="Live dashcam embeds per vehicle (Luna). Front and rear load in separate iframes."
      />

      {loading && (
        <div className="grid grid-cols-2 gap-3">
          {[1, 2, 3, 4].map((i) => (
            <div
              key={i}
              className="min-h-[220px] rounded-lg border border-slate-700 bg-slate-900/60 animate-pulse"
            />
          ))}
        </div>
      )}

      {!loading && error && (
        <p className="text-sm text-destructive">{error}</p>
      )}

      {!loading && !error && missingConfig && (
        <div className="rounded-lg border border-amber-500/40 bg-amber-500/10 px-4 py-3 text-sm text-amber-900 dark:text-amber-100">
          <p className="font-medium">Luna embed is not configured</p>
          <p className="mt-1 text-muted-foreground dark:text-amber-200/80">
            Set <strong>Luna web origin</strong> and <strong>Luna API token</strong> in{' '}
            <Link to="/admin/settings" className="underline font-medium">
              Settings
            </Link>
            .
          </p>
        </div>
      )}

      {!loading && !error && !missingConfig && cells.length === 0 && (
        <div className="rounded-lg border border-border bg-muted/30 px-4 py-3 text-sm">
          <p className="font-medium flex items-center gap-2">
            <Video className="w-4 h-4" />
            No vehicles with IMEI
          </p>
          <p className="mt-1 text-muted-foreground">
            Add an IMEI on each vehicle in{' '}
            <Link to="/admin/vehicles" className="underline">
              Vehicles
            </Link>{' '}
            to show cameras here.
          </p>
        </div>
      )}

      {showGrid && (
        <div
          className="grid grid-cols-2 gap-3"
          style={{ gridAutoRows: 'minmax(240px, 1fr)' }}
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
  );
}
