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
  const [settings, setSettings] = useState<SuperSetting | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    per_km_charge: 0,
  });

  useEffect(() => {
    const fetchSettings = async () => {
      setLoading(true);
      try {
        const response = await superSettingApi.list({ per_page: 1 });
        if (response && response.results && response.results.length > 0) {
          const setting = response.results[0];
          setSettings(setting);
          setFormData({ per_km_charge: toNumber(setting.per_km_charge, 0) });
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

    try {
      if (settings) {
        const updated = await superSettingApi.edit(settings.id, formData);
        setSettings(updated);
        toast.success('Settings updated successfully');
      } else {
        const created = await superSettingApi.create(formData);
        setSettings(created);
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

        <form onSubmit={handleSubmit} className="form-section max-w-xl">
          <div className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="per_km_charge">Per KM Charge ($)</Label>
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

      <Card className="max-w-xl">
        <CardHeader>
          <CardTitle>Pricing Settings</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex justify-between items-center py-2 border-b border-border">
              <span className="text-muted-foreground">Per KM Charge</span>
              <span className="font-semibold">${toNumber(settings?.per_km_charge, 0).toFixed(2)}</span>
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
    </div>
  );
}
