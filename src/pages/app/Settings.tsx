import { useState, useEffect } from 'react';
import { Edit, Save } from 'lucide-react';
import { PageHeader } from '@/components/common/PageHeader';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { getSettings, createSettings, updateSettings } from '@/stores/mockData';
import { toast } from 'sonner';

export default function Settings() {
  const [settings, setSettings] = useState(getSettings());
  const [isEditing, setIsEditing] = useState(!settings);
  const [formData, setFormData] = useState({
    per_km_charge: settings?.per_km_charge || 0,
  });

  useEffect(() => {
    const currentSettings = getSettings();
    setSettings(currentSettings);
    if (!currentSettings) {
      setIsEditing(true);
    } else {
      setFormData({ per_km_charge: currentSettings.per_km_charge });
    }
  }, []);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (settings) {
      updateSettings(formData);
      toast.success('Settings updated successfully');
    } else {
      createSettings(formData);
      toast.success('Settings created successfully');
    }
    setSettings(getSettings());
    setIsEditing(false);
  };

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
              />
            </div>
          </div>

          <div className="flex gap-4 mt-8">
            <Button type="submit">
              <Save className="w-4 h-4 mr-2" />
              Save Settings
            </Button>
            {settings && (
              <Button type="button" variant="outline" onClick={() => setIsEditing(false)}>
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
              <span className="font-semibold">${settings?.per_km_charge.toFixed(2)}</span>
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
