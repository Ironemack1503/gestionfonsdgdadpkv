import { useState } from 'react';
import { Save, AlertTriangle } from 'lucide-react';
import { PageHeader } from '@/components/shared/PageHeader';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Button } from '@/components/ui/button';
import { useAlertSettings } from '@/hooks/useAlerts';
import { Skeleton } from '@/components/ui/skeleton';

const settingLabels: Record<string, { label: string; description: string; unit: string }> = {
  seuil_solde_bas: {
    label: 'Seuil de solde bas',
    description: 'Alerte quand le solde de caisse descend sous ce montant',
    unit: 'FC',
  },
  seuil_depense_importante: {
    label: 'Seuil de dépense importante',
    description: 'Alerte quand une dépense individuelle dépasse ce montant',
    unit: 'FC',
  },
  pourcentage_depassement_budget: {
    label: 'Alerte dépassement budget',
    description: 'Alerte quand les dépenses atteignent ce pourcentage de la programmation',
    unit: '%',
  },
};

export default function AlertSettingsPage() {
  const { settings, isLoading, updateSetting } = useAlertSettings();
  const [editedValues, setEditedValues] = useState<Record<string, number>>({});

  const handleValueChange = (settingKey: string, value: string) => {
    const numValue = parseFloat(value);
    if (!isNaN(numValue) && numValue >= 0) {
      setEditedValues(prev => ({ ...prev, [settingKey]: numValue }));
    }
  };

  const handleSave = (settingId: string, settingKey: string) => {
    const newValue = editedValues[settingKey];
    if (newValue !== undefined) {
      updateSetting.mutate({ id: settingId, value: newValue });
      setEditedValues(prev => {
        const updated = { ...prev };
        delete updated[settingKey];
        return updated;
      });
    }
  };

  const handleToggle = (settingId: string, currentActive: boolean) => {
    updateSetting.mutate({ id: settingId, isActive: !currentActive });
  };

  const getValue = (settingKey: string, currentValue: number) => {
    return editedValues[settingKey] !== undefined ? editedValues[settingKey] : currentValue;
  };

  const hasChanges = (settingKey: string, currentValue: number) => {
    return editedValues[settingKey] !== undefined && editedValues[settingKey] !== currentValue;
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        <PageHeader
          title="Paramètres des alertes"
          description="Configurez les seuils d'alerte pour la caisse"
        />
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {[1, 2, 3].map((i) => (
            <Card key={i}>
              <CardHeader>
                <Skeleton className="h-5 w-3/4" />
                <Skeleton className="h-4 w-full" />
              </CardHeader>
              <CardContent>
                <Skeleton className="h-10 w-full" />
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Paramètres des alertes"
        description="Configurez les seuils d'alerte pour la caisse"
      />

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {settings.map((setting) => {
          const config = settingLabels[setting.setting_key];
          if (!config) return null;

          return (
            <Card key={setting.id} className={!setting.is_active ? 'opacity-60' : ''}>
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-base flex items-center gap-2">
                    <AlertTriangle className="h-4 w-4 text-yellow-500" />
                    {config.label}
                  </CardTitle>
                  <Switch
                    checked={setting.is_active}
                    onCheckedChange={() => handleToggle(setting.id, setting.is_active)}
                  />
                </div>
                <CardDescription className="text-xs">
                  {config.description}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="flex gap-2">
                    <div className="flex-1">
                      <Label htmlFor={setting.setting_key} className="sr-only">
                        {config.label}
                      </Label>
                      <div className="relative">
                        <Input
                          id={setting.setting_key}
                          type="number"
                          min="0"
                          step={config.unit === '%' ? '1' : '1000'}
                          value={getValue(setting.setting_key, setting.setting_value)}
                          onChange={(e) => handleValueChange(setting.setting_key, e.target.value)}
                          disabled={!setting.is_active}
                          className="pr-12"
                        />
                        <span className="absolute right-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground">
                          {config.unit}
                        </span>
                      </div>
                    </div>
                    {hasChanges(setting.setting_key, setting.setting_value) && (
                      <Button 
                        size="icon"
                        onClick={() => handleSave(setting.id, setting.setting_key)}
                        disabled={updateSetting.isPending}
                      >
                        <Save className="h-4 w-4" />
                      </Button>
                    )}
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Valeur actuelle: {setting.setting_value.toLocaleString('fr-FR')} {config.unit}
                  </p>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
