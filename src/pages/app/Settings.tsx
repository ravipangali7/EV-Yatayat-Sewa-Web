import { useState, useEffect } from 'react';
import { Edit, Save } from 'lucide-react';
import { PageHeader } from '@/components/common/PageHeader';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { superSettingApi } from '@/modules/settings/services/superSettingApi';
import { SuperSetting } from '@/types';
import { toast } from 'sonner';
import { toNumber } from '@/lib/utils';

export default function Settings() {
  const readGpsThreshold = (setting: SuperSetting | null | undefined): number =>
    toNumber(setting?.gps_threshold_second ?? setting?.gps_threshold, 5);

  const [settings, setSettings] = useState<SuperSetting | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    per_km_charge: 0,
    initial_km: undefined as number | undefined,
    initial_km_charge: undefined as number | undefined,
    gps_threshold: 5,
    point_cover_radius: 0.5,
    minute_coverage_schedule: 60,
    seat_layout: [] as string[],
    stop_point_announcement_header: '',
    short_trip_min_distance_for_booking: 5,
    short_trip_max_distance_for_booking: 200,
    luna_web_origin: '',
  });
  const [lunaTokenInput, setLunaTokenInput] = useState('');
  const [seatLayoutRaw, setSeatLayoutRaw] = useState('[]');

  useEffect(() => {
    const fetchSettings = async () => {
      setLoading(true);
      try {
        const response = await superSettingApi.list({ per_page: 1 });
        if (response && response.results && response.results.length > 0) {
          const setting = response.results[0];
          setSettings(setting);
          const layout = Array.isArray(setting.seat_layout) ? setting.seat_layout : [];
          const gps = readGpsThreshold(setting);
          setFormData({
            per_km_charge: toNumber(setting.per_km_charge, 0),
            initial_km: setting.initial_km != null && setting.initial_km !== '' ? toNumber(setting.initial_km, 0) : undefined,
            initial_km_charge: setting.initial_km_charge != null && setting.initial_km_charge !== '' ? toNumber(setting.initial_km_charge, 0) : undefined,
            gps_threshold: gps,
            point_cover_radius:
              setting.point_cover_radius != null && setting.point_cover_radius !== ''
                ? toNumber(setting.point_cover_radius, 0.5)
                : 0.5,
            minute_coverage_schedule:
              setting.minute_coverage_schedule != null && setting.minute_coverage_schedule !== ''
                ? Number(setting.minute_coverage_schedule)
                : 60,
            seat_layout: layout,
            stop_point_announcement_header: setting.stop_point_announcement_header ?? '',
            short_trip_min_distance_for_booking: toNumber(setting.short_trip_min_distance_for_booking, 5),
            short_trip_max_distance_for_booking: toNumber(setting.short_trip_max_distance_for_booking, 200),
            luna_web_origin: (setting.luna_web_origin ?? '').trim(),
          });
          setLunaTokenInput('');
          setSeatLayoutRaw(JSON.stringify(layout));
        } else {
          setIsEditing(true);
        }
      } catch (error) {
        console.error('Failed to load settings:', error);
        setIsEditing(true);
      } finally {
        setLoading(false);
      }
    };
    fetchSettings();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    let seatLayout: string[] = formData.seat_layout;
    try {
      const parsed = JSON.parse(seatLayoutRaw.trim() || '[]');
      seatLayout = Array.isArray(parsed) ? parsed : [];
    } catch {
      seatLayout = formData.seat_layout;
    }
    try {
      const payload: Record<string, unknown> = {
        per_km_charge: formData.per_km_charge,
        initial_km: formData.initial_km ?? null,
        initial_km_charge: formData.initial_km_charge ?? null,
        // Keep both keys for backward compatibility across clients.
        gps_threshold: formData.gps_threshold,
        gps_threshold_second: formData.gps_threshold,
        seat_layout: seatLayout,
        stop_point_announcement_header: formData.stop_point_announcement_header ?? '',
        short_trip_min_distance_for_booking: formData.short_trip_min_distance_for_booking,
        short_trip_max_distance_for_booking: formData.short_trip_max_distance_for_booking,
        point_cover_radius: formData.point_cover_radius,
        minute_coverage_schedule: formData.minute_coverage_schedule,
        luna_web_origin: formData.luna_web_origin.trim(),
      };
      if (lunaTokenInput.trim() !== '') {
        payload.luna_api_token = lunaTokenInput.trim();
      }
      if (settings) {
        const updated = await superSettingApi.edit(settings.id, payload);
        setSettings(updated);
        setFormData((prev) => ({
          ...prev,
          stop_point_announcement_header: updated.stop_point_announcement_header ?? '',
          luna_web_origin: (updated.luna_web_origin ?? '').trim(),
          point_cover_radius:
            updated.point_cover_radius != null && updated.point_cover_radius !== ''
              ? toNumber(updated.point_cover_radius, 0.5)
              : 0.5,
          minute_coverage_schedule:
            updated.minute_coverage_schedule != null && updated.minute_coverage_schedule !== ''
              ? Number(updated.minute_coverage_schedule)
              : 60,
        }));
        setLunaTokenInput('');
        setSeatLayoutRaw(JSON.stringify(updated.seat_layout ?? []));
        toast.success('Settings updated successfully');
      } else {
        const created = await superSettingApi.create(payload);
        setSettings(created);
        setFormData((prev) => ({
          ...prev,
          stop_point_announcement_header: created.stop_point_announcement_header ?? '',
          luna_web_origin: (created.luna_web_origin ?? '').trim(),
          point_cover_radius:
            created.point_cover_radius != null && created.point_cover_radius !== ''
              ? toNumber(created.point_cover_radius, 0.5)
              : 0.5,
          minute_coverage_schedule:
            created.minute_coverage_schedule != null && created.minute_coverage_schedule !== ''
              ? Number(created.minute_coverage_schedule)
              : 60,
        }));
        setLunaTokenInput('');
        setSeatLayoutRaw(JSON.stringify(created.seat_layout ?? []));
        toast.success('Settings created successfully');
      }
      setIsEditing(false);
    } catch (error) {
      console.error('Failed to save settings:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading && !settings) {
    return (
      <div>
        <PageHeader
          title="Settings"
          subtitle="System configuration"
        />
        <div className="text-center py-12">
          <p className="text-muted-foreground">Loading settings...</p>
        </div>
      </div>
    );
  }

  if (isEditing) {
    return (
      <div>
        <PageHeader
          title="Settings"
          subtitle={settings ? 'Edit system settings' : 'Configure system settings'}
        />

        <form onSubmit={handleSubmit} className="form-section max-w-2xl">
          <div className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="per_km_charge">Per KM Charge (Rs.)</Label>
              <Input
                id="per_km_charge"
                type="number"
                step="0.01"
                value={formData.per_km_charge}
                onChange={(e) => setFormData({ ...formData, per_km_charge: parseFloat(e.target.value) || 0 })}
                required
                disabled={loading}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="initial_km">Initial KM (km)</Label>
              <Input
                id="initial_km"
                type="number"
                step="0.01"
                min="0"
                placeholder="Optional — flat charge applies up to this distance"
                value={formData.initial_km ?? ''}
                onChange={(e) => setFormData({ ...formData, initial_km: e.target.value === '' ? undefined : parseFloat(e.target.value) })}
                disabled={loading}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="initial_km_charge">Initial KM Charge (Rs.)</Label>
              <Input
                id="initial_km_charge"
                type="number"
                step="0.01"
                min="0"
                placeholder="Optional — flat charge for first N km"
                value={formData.initial_km_charge ?? ''}
                onChange={(e) => setFormData({ ...formData, initial_km_charge: e.target.value === '' ? undefined : parseFloat(e.target.value) })}
                disabled={loading}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="gps_threshold">GPS Threshold (seconds)</Label>
              <Input
                id="gps_threshold"
                type="number"
                step="0.01"
                value={formData.gps_threshold}
                onChange={(e) => setFormData({ ...formData, gps_threshold: parseFloat(e.target.value) || 5 })}
                disabled={loading}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="point_cover_radius">Point cover radius (km)</Label>
              <Input
                id="point_cover_radius"
                type="number"
                step="0.0001"
                min={0}
                value={formData.point_cover_radius}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    point_cover_radius: parseFloat(e.target.value) || 0,
                  })
                }
                disabled={loading}
              />
              <p className="text-xs text-muted-foreground">
                Radius in km for considering a vehicle at a stop/start point.
              </p>
            </div>
            <div className="space-y-2">
              <Label htmlFor="minute_coverage_schedule">Minute coverage schedule</Label>
              <Input
                id="minute_coverage_schedule"
                type="number"
                step={1}
                min={0}
                value={formData.minute_coverage_schedule}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    minute_coverage_schedule: parseInt(e.target.value, 10) || 0,
                  })
                }
                disabled={loading}
              />
              <p className="text-xs text-muted-foreground">
                Minutes before/after scheduled time for scheduled start coverage.
              </p>
            </div>
            <div className="space-y-2">
              <Label htmlFor="short_trip_min_distance_for_booking">Short trip min distance for booking (km)</Label>
              <Input
                id="short_trip_min_distance_for_booking"
                type="number"
                step="0.01"
                min={0}
                value={formData.short_trip_min_distance_for_booking}
                onChange={(e) => setFormData({ ...formData, short_trip_min_distance_for_booking: parseFloat(e.target.value) ?? 5 })}
                disabled={loading}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="short_trip_max_distance_for_booking">Short trip max distance for booking (km)</Label>
              <Input
                id="short_trip_max_distance_for_booking"
                type="number"
                step="0.01"
                min={0}
                value={formData.short_trip_max_distance_for_booking}
                onChange={(e) => setFormData({ ...formData, short_trip_max_distance_for_booking: parseFloat(e.target.value) ?? 200 })}
                disabled={loading}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="stop_point_announcement_header">Stop point announcement header</Label>
              <Input
                id="stop_point_announcement_header"
                type="text"
                value={formData.stop_point_announcement_header}
                onChange={(e) => setFormData({ ...formData, stop_point_announcement_header: e.target.value })}
                placeholder="e.g. अब हामी $x पुग्दैछौं। ($x = place name)"
                disabled={loading}
              />
            </div>
            <div className="space-y-2 md:col-span-2">
              <Label htmlFor="seat_layout">Seat Layout (JSON array: x=seat, y=driver, -=empty, :=new row)</Label>
              <textarea
                id="seat_layout"
                className="flex min-h-[120px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm font-mono"
                value={seatLayoutRaw}
                onChange={(e) => setSeatLayoutRaw(e.target.value)}
                placeholder='["x","-","-","y",":","x","-","x","x",":"]'
                disabled={loading}
              />
            </div>

            <div className="space-y-4 pt-4 border-t border-border">
              <p className="text-sm font-medium text-foreground">Luna camera embed</p>
              <p className="text-xs text-muted-foreground">
                Use the Luna web app base URL (not Django). Whitelist this admin site&apos;s hostname on the Luna API client and enable Camera live UI (embed). Channel 1 = front, 2 = rear.
              </p>
              <div className="space-y-2">
                <Label htmlFor="luna_web_origin">Luna web origin</Label>
                <Input
                  id="luna_web_origin"
                  type="url"
                  placeholder="https://dashboard.example.com"
                  value={formData.luna_web_origin}
                  onChange={(e) => setFormData({ ...formData, luna_web_origin: e.target.value })}
                  disabled={loading}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="luna_api_token">Luna API token</Label>
                <Input
                  id="luna_api_token"
                  type="password"
                  autoComplete="new-password"
                  placeholder={settings?.luna_api_token ? '(unchanged — enter new token to replace)' : 'Bearer token from Luna'}
                  value={lunaTokenInput}
                  onChange={(e) => setLunaTokenInput(e.target.value)}
                  disabled={loading}
                />
                <p className="text-xs text-muted-foreground">
                  Leave blank when editing to keep the current token. The token is only sent when you type a new value.
                </p>
              </div>
            </div>
          </div>

          <div className="flex gap-4 mt-8">
            <Button type="submit" disabled={loading}>
              <Save className="w-4 h-4 mr-2" />
              Save Settings
            </Button>
            {settings && (
              <Button type="button" variant="outline" onClick={() => setIsEditing(false)} disabled={loading}>
                Cancel
              </Button>
            )}
          </div>
        </form>
      </div>
    );
  }

  return (
    <div>
      <PageHeader
        title="Settings"
        subtitle="System configuration"
        actions={
          <Button onClick={() => setIsEditing(true)}>
            <Edit className="w-4 h-4 mr-2" />
            Edit
          </Button>
        }
      />

      <Card className="max-w-xl mb-6">
        <CardHeader>
          <CardTitle>Pricing Settings</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex justify-between items-center py-2 border-b border-border">
              <span className="text-muted-foreground">Per KM Charge</span>
              <span className="font-semibold">Rs. {toNumber(settings?.per_km_charge, 0).toFixed(2)}</span>
            </div>
            <div className="flex justify-between items-center py-2 border-b border-border">
              <span className="text-muted-foreground">Initial KM</span>
              <span className="font-semibold">{settings?.initial_km != null && settings?.initial_km !== '' ? toNumber(settings.initial_km, 0) : '—'}</span>
            </div>
            <div className="flex justify-between items-center py-2 border-b border-border">
              <span className="text-muted-foreground">Initial KM Charge</span>
              <span className="font-semibold">{settings?.initial_km_charge != null && settings?.initial_km_charge !== '' ? `Rs. ${toNumber(settings.initial_km_charge, 0).toFixed(2)}` : '—'}</span>
            </div>
            <div className="flex justify-between items-center py-2 border-b border-border">
              <span className="text-muted-foreground">GPS Threshold (seconds)</span>
              <span className="font-semibold">{readGpsThreshold(settings).toFixed(2)}</span>
            </div>
            <div className="flex justify-between items-center py-2 border-b border-border">
              <span className="text-muted-foreground">Stop point announcement header</span>
              <span className="font-semibold">{settings?.stop_point_announcement_header || '—'}</span>
            </div>
            <div className="flex justify-between items-center py-2 border-b border-border">
              <span className="text-muted-foreground">Short trip min distance for booking (km)</span>
              <span className="font-semibold">{toNumber(settings?.short_trip_min_distance_for_booking, 5)}</span>
            </div>
            <div className="flex justify-between items-center py-2 border-b border-border">
              <span className="text-muted-foreground">Short trip max distance for booking (km)</span>
              <span className="font-semibold">{toNumber(settings?.short_trip_max_distance_for_booking, 200)}</span>
            </div>
            <div className="flex justify-between items-center py-2 border-b border-border">
              <span className="text-muted-foreground">Seat Layout</span>
              <span className="font-semibold">{(settings?.seat_layout?.length ?? 0) > 0 ? 'Configured' : 'Not set'}</span>
            </div>
            {settings && (
              <>
                <div className="flex justify-between items-center py-2 border-b border-border">
                  <span className="text-muted-foreground">Created At</span>
                  <span className="font-medium">{new Date(settings.created_at).toLocaleString()}</span>
                </div>
                <div className="flex justify-between items-center py-2">
                  <span className="text-muted-foreground">Updated At</span>
                  <span className="font-medium">{new Date(settings.updated_at).toLocaleString()}</span>
                </div>
              </>
            )}
          </div>
        </CardContent>
      </Card>

      <Card className="max-w-xl mb-6">
        <CardHeader>
          <CardTitle>Coverage &amp; scheduling</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex justify-between items-center py-2 border-b border-border gap-4">
              <span className="text-muted-foreground">Point cover radius (km)</span>
              <span className="font-semibold">
                {settings?.point_cover_radius != null && settings?.point_cover_radius !== ''
                  ? toNumber(settings.point_cover_radius, 0.5).toFixed(4)
                  : '—'}
              </span>
            </div>
            <div className="flex justify-between items-center py-2 border-b border-border">
              <span className="text-muted-foreground">Minute coverage schedule</span>
              <span className="font-semibold">
                {settings?.minute_coverage_schedule != null && settings?.minute_coverage_schedule !== ''
                  ? Number(settings.minute_coverage_schedule)
                  : '—'}
              </span>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card className="max-w-xl">
        <CardHeader>
          <CardTitle>Luna camera embed</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex justify-between items-center py-2 border-b border-border gap-4">
              <span className="text-muted-foreground">Luna web origin</span>
              <span className="font-semibold text-right break-all">{settings?.luna_web_origin?.trim() || '—'}</span>
            </div>
            <div className="flex justify-between items-center py-2 border-b border-border">
              <span className="text-muted-foreground">API token</span>
              <span className="font-semibold">
                {settings?.luna_api_token && String(settings.luna_api_token).length > 0 ? 'Configured' : 'Not set'}
              </span>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
