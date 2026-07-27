import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Separator } from "@/components/ui/separator";
import { Settings, Save, Loader2, Globe, Percent, Mail, Hash, DollarSign } from "lucide-react";
import { api } from "@/services/api";
import { toast } from "sonner";

interface PlatformSettings {
  site_name: string;
  commission_percentage: number;
  maintenance_mode: boolean;
  contact_email: string;
  max_properties_per_user: number;
  currency: string;
}

const defaultSettings: PlatformSettings = {
  site_name: 'Habitas',
  commission_percentage: 5,
  maintenance_mode: false,
  contact_email: 'contacto@habitas.com',
  max_properties_per_user: 10,
  currency: 'USD',
};

const AdminSettingsSection = () => {
  const [settings, setSettings] = useState<PlatformSettings>(defaultSettings);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    const load = async () => {
      setIsLoading(true);
      try {
        const res = await api.getSettings();
        if (res.success && res.data?.settings) {
          setSettings({ ...defaultSettings, ...res.data.settings });
        } else {
          toast.error("Error al cargar configuración");
        }
      } catch {
        toast.error("Error de conexión al cargar configuración");
      } finally {
        setIsLoading(false);
      }
    };
    load();
  }, []);

  const handleChange = (key: keyof PlatformSettings, value: unknown) => {
    setSettings((prev) => ({ ...prev, [key]: value }));
  };

  const handleSave = async () => {
    setIsSaving(true);
    try {
      const res = await api.updateSettings(settings);
      if (res.success) {
        toast.success("Configuración guardada correctamente");
        if (res.data?.settings) {
          setSettings({ ...defaultSettings, ...res.data.settings });
        }
      } else {
        toast.error("Error al guardar configuración");
      }
    } catch {
      toast.error("Error de conexión al guardar");
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-3xl">
      <div>
        <h1 className="text-3xl font-bold flex items-center gap-2">
          <Settings className="h-7 w-7" />
          Configuración de Plataforma
        </h1>
        <p className="text-muted-foreground mt-1">
          Administra los parámetros globales del sistema
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Globe className="h-5 w-5" />
            General
          </CardTitle>
          <CardDescription>Configuración básica de la plataforma</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="site_name">Nombre del sitio</Label>
              <Input
                id="site_name"
                value={settings.site_name}
                onChange={(e) => handleChange("site_name", e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="contact_email">Email de contacto</Label>
              <div className="flex items-center gap-2">
                <Mail className="h-4 w-4 text-muted-foreground" />
                <Input
                  id="contact_email"
                  type="email"
                  value={settings.contact_email}
                  onChange={(e) => handleChange("contact_email", e.target.value)}
                />
              </div>
            </div>
          </div>

          <Separator />

          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label htmlFor="maintenance_mode">Modo mantenimiento</Label>
              <p className="text-sm text-muted-foreground">
                Activa el modo mantenimiento para mostrar una página de mantenimiento a los usuarios
              </p>
            </div>
            <Switch
              id="maintenance_mode"
              checked={settings.maintenance_mode}
              onCheckedChange={(v) => handleChange("maintenance_mode", v)}
            />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <DollarSign className="h-5 w-5" />
            Financiero
          </CardTitle>
          <CardDescription>Parámetros de transacciones y comisiones</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="commission_percentage">
                <Percent className="h-3 w-3 inline mr-1" />
                Comisión (%)
              </Label>
              <Input
                id="commission_percentage"
                type="number"
                min={0}
                max={100}
                value={settings.commission_percentage}
                onChange={(e) => handleChange("commission_percentage", Number(e.target.value))}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="currency">Moneda por defecto</Label>
              <Input
                id="currency"
                value={settings.currency}
                onChange={(e) => handleChange("currency", e.target.value)}
              />
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Hash className="h-5 w-5" />
            Límites
          </CardTitle>
          <CardDescription>Restricciones de uso de la plataforma</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="space-y-2 max-w-xs">
            <Label htmlFor="max_properties_per_user">Máximo de propiedades por usuario</Label>
            <Input
              id="max_properties_per_user"
              type="number"
              min={1}
              max={100}
              value={settings.max_properties_per_user}
              onChange={(e) => handleChange("max_properties_per_user", Number(e.target.value))}
            />
          </div>
        </CardContent>
      </Card>

      <div className="flex justify-end">
        <Button onClick={handleSave} disabled={isSaving} size="lg">
          {isSaving ? (
            <Loader2 className="h-4 w-4 animate-spin mr-2" />
          ) : (
            <Save className="h-4 w-4 mr-2" />
          )}
          Guardar Configuración
        </Button>
      </div>
    </div>
  );
};

export default AdminSettingsSection;
