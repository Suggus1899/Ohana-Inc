import { useState, useEffect, useCallback } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  Dialog, DialogContent, DialogDescription, DialogFooter,
  DialogHeader, DialogTitle,
} from "@/components/ui/dialog";
import { Loader2, Building2, Layers, Tag, CheckCircle, XCircle, Plus, Home } from "lucide-react";
import { api } from "@/services/api";
import { useToast } from "@/hooks/use-toast";

const PROPERTY_TYPES = [
  { key: "residencia", label: "Residencia" },
  { key: "apartamento", label: "Apartamento" },
  { key: "casa", label: "Casa" },

  { key: "finca", label: "Finca" },
  { key: "local", label: "Local" },
  { key: "terreno", label: "Terreno" },
];

const LISTING_TYPES = [
  { key: "alquiler", label: "Alquiler" },
  { key: "venta", label: "Venta" },
];

interface ServiceItem {
  id: number;
  name: string;
  icon: string;
  category: string;
  isActive: boolean;
}

const CategoriesSection = () => {
  const [services, setServices] = useState<ServiceItem[]>([]);
  const [typeCounts, setTypeCounts] = useState<Record<string, number>>({});
  const [serviceCounts, setServiceCounts] = useState<Record<number, number>>({});
  const [listingCounts, setListingCounts] = useState<Record<string, number>>({});
  const [isLoading, setIsLoading] = useState(true);
  const [togglingId, setTogglingId] = useState<number | null>(null);
  const [addDialog, setAddDialog] = useState(false);
  const [newService, setNewService] = useState({ name: "", icon: "🔧", category: "basic" });
  const [isSaving, setIsSaving] = useState(false);
  const { toast } = useToast();

  const fetchData = useCallback(async () => {
    setIsLoading(true);
    try {
      const [servicesRes, typeCountsRes, serviceCountsRes] = await Promise.all([
        api.getServices(),
        api.getPropertyTypeCounts(),
        api.getServicePropertyCounts(),
      ]);

      if (servicesRes.success && servicesRes.data) {
        setServices(servicesRes.data as unknown as ServiceItem[]);
      }
      if (typeCountsRes.success && typeCountsRes.data) {
        const map: Record<string, number> = {};
        (typeCountsRes.data as Record<string, unknown>[]).forEach(r => { map[String(r.type)?.toLowerCase()] = r.count as number; });
        setTypeCounts(map);
      }
      if (serviceCountsRes.success && serviceCountsRes.data) {
        const map: Record<number, number> = {};
        (serviceCountsRes.data as Record<string, unknown>[]).forEach(r => { map[r.serviceId as number] = r.count as number; });
        setServiceCounts(map);
      }

      // Listing type counts via property type counts endpoint (listing type is separate)
      try {
        const listRes = await api.getProperties({ limit: 1 });
        if (listRes.success) {
          const [alqRes, ventaRes] = await Promise.all([
            api.getProperties({ listingType: "alquiler", limit: 1 }),
            api.getProperties({ listingType: "venta", limit: 1 }),
          ]);
          setListingCounts({
            alquiler: (alqRes.data as Record<string, unknown>)?.pagination ? ((alqRes.data as Record<string, unknown>).pagination as Record<string, number>).total : 0,
            venta: (ventaRes.data as Record<string, unknown>)?.pagination ? ((ventaRes.data as Record<string, unknown>).pagination as Record<string, number>).total : 0,
          });
        }
      } catch { /* silent */ }
    } catch {
      toast({ title: "Error", description: "No se pudo cargar la información", variant: "destructive" });
    } finally {
      setIsLoading(false);
    }
  }, [toast]);

  useEffect(() => { fetchData(); }, [fetchData]);

  const handleToggleService = async (service: ServiceItem) => {
    setTogglingId(service.id);
    try {
      const res = await api.updateService(service.id, { isActive: !service.isActive } as Record<string, unknown>);
      if (res.success) {
        setServices(prev => prev.map(s => s.id === service.id ? { ...s, isActive: !s.isActive } : s));
        toast({ title: service.isActive ? "Servicio desactivado" : "Servicio activado", description: `${service.name} — las propiedades existentes siguen siendo visibles` });
      }
    } catch {
      toast({ title: "Error", description: "No se pudo actualizar el servicio", variant: "destructive" });
    } finally {
      setTogglingId(null);
    }
  };

  const handleAddService = async () => {
    if (!newService.name.trim()) return;
    setIsSaving(true);
    try {
      const res = await api.createService(newService as unknown as Record<string, unknown>);
      if (res.success) {
        toast({ title: "Servicio creado", description: newService.name });
        setAddDialog(false);
        setNewService({ name: "", icon: "🔧", category: "basic" });
        fetchData();
      } else {
        toast({ title: "Error", description: "No se pudo crear el servicio", variant: "destructive" });
      }
    } catch {
      toast({ title: "Error", variant: "destructive" });
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Categorías y Tipos</h1>
        <p className="text-muted-foreground mt-1">
          Gestiona los tipos de propiedad, servicios y tipos de listado del sistema
        </p>
      </div>

      <Tabs defaultValue="types">
        <TabsList>
          <TabsTrigger value="types" className="gap-2">
            <Building2 className="h-4 w-4" />Tipos de Propiedad
          </TabsTrigger>
          <TabsTrigger value="services" className="gap-2">
            <Layers className="h-4 w-4" />Servicios
          </TabsTrigger>
          <TabsTrigger value="listing" className="gap-2">
            <Tag className="h-4 w-4" />Tipos de Listado
          </TabsTrigger>
        </TabsList>

        {/* Tipos de Propiedad */}
        <TabsContent value="types">
          <Card>
            <CardHeader>
              <CardTitle>Tipos de Propiedad</CardTitle>
              <CardDescription>
                {PROPERTY_TYPES.length} tipos activos — el contador muestra propiedades por tipo
              </CardDescription>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <div className="flex justify-center py-10"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>
              ) : (
                <div className="grid gap-3 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
                  {PROPERTY_TYPES.map(({ key, label }) => {
                    const count = typeCounts[key] ?? 0;
                    return (
                      <div key={key} className="flex items-center justify-between p-4 rounded-lg border bg-muted/20 hover:bg-muted/40 transition-colors">
                        <div className="flex items-center gap-3">
                          <Building2 className="h-5 w-5 text-primary shrink-0" />
                          <span className="font-medium">{label}</span>
                        </div>
                        <Badge variant="secondary" className="ml-2 shrink-0">
                          <Home className="h-3 w-3 mr-1" />{count}
                        </Badge>
                      </div>
                    );
                  })}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Servicios */}
        <TabsContent value="services">
          <Card>
            <CardHeader>
              <div className="flex items-start justify-between gap-4">
                <div>
                  <CardTitle>Servicios</CardTitle>
                  <CardDescription>
                    Activa o desactiva servicios. Al desactivar, las propiedades siguen visibles pero sin mostrar ese servicio.
                  </CardDescription>
                </div>
                <Button size="sm" onClick={() => setAddDialog(true)}>
                  <Plus className="h-4 w-4 mr-2" />Agregar
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <div className="flex justify-center py-10"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>
              ) : services.length === 0 ? (
                <div className="text-center py-10 text-muted-foreground">
                  <Layers className="h-10 w-10 mx-auto mb-3 opacity-40" />
                  <p>No hay servicios registrados</p>
                </div>
              ) : (
                <div className="space-y-6">
                  {["basic", "premium", "amenity"].map((cat) => {
                    const catServices = services.filter(s => s.category === cat);
                    if (catServices.length === 0) return null;
                    return (
                      <div key={cat}>
                        <p className="text-sm font-semibold text-muted-foreground uppercase tracking-wide mb-3">
                          {cat === "basic" ? "Básicos" : cat === "premium" ? "Premium" : "Amenidades"}
                        </p>
                        <div className="grid gap-2 sm:grid-cols-2 md:grid-cols-3">
                          {catServices.map((service) => {
                            const count = serviceCounts[service.id] ?? 0;
                            return (
                              <div key={service.id} className={`flex items-center justify-between p-3 rounded-lg border transition-colors ${service.isActive ? "" : "opacity-60 bg-muted/20"}`}>
                                <div className="flex items-center gap-2 min-w-0">
                                  <span className="text-lg shrink-0">{service.icon}</span>
                                  <span className="text-sm font-medium truncate">{service.name}</span>
                                  <Badge variant="outline" className="text-xs shrink-0">
                                    <Home className="h-2.5 w-2.5 mr-1" />{count}
                                  </Badge>
                                </div>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  className="h-7 w-7 p-0 shrink-0"
                                  disabled={togglingId === service.id}
                                  onClick={() => handleToggleService(service)}
                                  title={service.isActive ? "Desactivar" : "Activar"}
                                >
                                  {togglingId === service.id ? (
                                    <Loader2 className="h-4 w-4 animate-spin" />
                                  ) : service.isActive ? (
                                    <CheckCircle className="h-4 w-4 text-green-600" />
                                  ) : (
                                    <XCircle className="h-4 w-4 text-muted-foreground" />
                                  )}
                                </Button>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Tipos de Listado */}
        <TabsContent value="listing">
          <Card>
            <CardHeader>
              <CardTitle>Tipos de Listado</CardTitle>
              <CardDescription>Modalidades de publicación — el contador muestra propiedades de cada tipo</CardDescription>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <div className="flex justify-center py-10"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>
              ) : (
                <div className="grid gap-3 sm:grid-cols-2 md:grid-cols-3">
                  {LISTING_TYPES.map(({ key, label }) => (
                    <div key={key} className="flex items-center justify-between p-4 rounded-lg border bg-muted/20 hover:bg-muted/40 transition-colors">
                      <div className="flex items-center gap-3">
                        <Tag className="h-5 w-5 text-primary shrink-0" />
                        <span className="font-medium">{label}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge variant="secondary">
                          <Home className="h-3 w-3 mr-1" />{listingCounts[key] ?? 0}
                        </Badge>
                        <Badge variant="outline" className="text-xs">Activo</Badge>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Add Service Dialog */}
      <Dialog open={addDialog} onOpenChange={setAddDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Agregar Servicio</DialogTitle>
            <DialogDescription>Crea un nuevo servicio disponible para las propiedades</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-1.5">
              <Label>Nombre del servicio</Label>
              <Input
                placeholder="Ej: Piscina, Gimnasio..."
                value={newService.name}
                onChange={e => setNewService(p => ({ ...p, name: e.target.value }))}
              />
            </div>
            <div className="space-y-1.5">
              <Label>Ícono (emoji)</Label>
              <Input
                placeholder="🔧"
                value={newService.icon}
                onChange={e => setNewService(p => ({ ...p, icon: e.target.value }))}
              />
            </div>
            <div className="space-y-1.5">
              <Label>Categoría</Label>
              <Select value={newService.category} onValueChange={v => setNewService(p => ({ ...p, category: v }))}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="basic">Básico</SelectItem>
                  <SelectItem value="premium">Premium</SelectItem>
                  <SelectItem value="amenity">Amenidad</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setAddDialog(false)}>Cancelar</Button>
            <Button onClick={handleAddService} disabled={isSaving || !newService.name.trim()}>
              {isSaving ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Plus className="h-4 w-4 mr-2" />}
              Crear Servicio
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default CategoriesSection;
