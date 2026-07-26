import { useState, useEffect, useCallback } from "react";
import { api, Property } from "@/services/api";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Loader2, Search, ExternalLink, Ban, Home, DollarSign, AlertTriangle } from "lucide-react";
import { toast } from "sonner";
import { useExchangeRate } from "../../../contexts/ExchangeRateContext";
import { formatDualPriceShort, usdToVes } from "../../../utils/formatPrice";

const PublishedPropertiesSection = () => {
  const [properties, setProperties] = useState<Property[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [processingId, setProcessingId] = useState<number | null>(null);
  const [confirmDialog, setConfirmDialog] = useState<{ open: boolean; property: Property | null; action: string; label: string }>({ open: false, property: null, action: "", label: "" });
  const { rate } = useExchangeRate();

  const fetchProperties = useCallback(async () => {
    setLoading(true);
    try {
      const res = await api.getProperties({ status: "approved", search: search || undefined, page, limit: 20 });
      if (res.success && res.data) {
        setProperties(res.data.properties || []);
        setTotalPages(res.data.pagination?.totalPages || 1);
      }
    } catch { toast.error("Error al cargar propiedades"); }
    setLoading(false);
  }, [search, page]);

  useEffect(() => { fetchProperties(); }, [fetchProperties]);

  const handleAction = async (id: number, status: string) => {
    setProcessingId(id);
    try {
      const res = await api.updatePropertyStatus(id, status);
      if (res.success) {
        toast.success(status === "rented" ? "Propiedad marcada como alquilada" : status === "sold" ? "Propiedad marcada como vendida" : "Propiedad despublicada");
        fetchProperties();
      } else toast.error(res.error?.message || "Error");
    } catch { toast.error("Error de conexion"); }
    setProcessingId(null);
  };

  const statusBadge = (status: string) => {
    const map: Record<string, string> = { approved: "bg-green-100 text-green-800", rented: "bg-blue-100 text-blue-800", sold: "bg-gray-100 text-gray-800" };
    const labels: Record<string, string> = { approved: "Publicada", rented: "Alquilada", sold: "Vendida" };
    return <Badge className={map[status] || "bg-green-100 text-green-800"}>{labels[status] || status}</Badge>;
  };

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader><CardTitle>Propiedades Publicadas</CardTitle></CardHeader>
        <CardContent>
          <div className="flex gap-2 mb-4">
            <Input placeholder="Buscar propiedad..." value={search} onChange={(e) => { setSearch(e.target.value); setPage(1); }} className="max-w-sm" icon={<Search className="h-4 w-4" />} />
          </div>

          {loading ? (
            <div className="flex justify-center py-12"><Loader2 className="h-6 w-6 animate-spin" /></div>
          ) : properties.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">No hay propiedades publicadas</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead><tr className="border-b text-left"><th className="p-2">Propiedad</th><th className="p-2">Propietario</th><th className="p-2">Tipo</th><th className="p-2">Precio</th><th className="p-2">Estado</th><th className="p-2">Acciones</th></tr></thead>
                <tbody>
                  {properties.map((p) => (
                    <tr key={p.id} className="border-b hover:bg-muted/50">
                      <td className="p-2 font-medium">{p.title || "Sin titulo"}</td>
                      <td className="p-2 text-muted-foreground">{p.ownerId}</td>
                      <td className="p-2">{p.type || "-"}</td>
                       <td className="p-2">{p.price != null ? (rate ? formatDualPriceShort(p.price, usdToVes(p.price, rate.usdToVes), 'mes') : `$${p.price.toLocaleString()}`) : "-"}</td>
                      <td className="p-2">{statusBadge(p.status || "approved")}</td>
                      <td className="p-2">
                        <div className="flex gap-1">
                          <Button size="sm" variant="outline" onClick={() => window.open(`/propiedades/${p.id}`, "_blank")}><ExternalLink className="h-3 w-3" /></Button>
                           <Button size="sm" variant="outline" onClick={() => setConfirmDialog({ open: true, property: p, action: "rejected", label: "despublicar" })} disabled={processingId === p.id} title="Despublicar"><Ban className="h-3 w-3" /></Button>
                           <Button size="sm" variant="outline" onClick={() => setConfirmDialog({ open: true, property: p, action: "rented", label: "marcar como alquilada" })} disabled={processingId === p.id} title="Alquilada"><Home className="h-3 w-3" /></Button>
                           <Button size="sm" variant="outline" onClick={() => setConfirmDialog({ open: true, property: p, action: "sold", label: "marcar como vendida" })} disabled={processingId === p.id} title="Vendida"><DollarSign className="h-3 w-3" /></Button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {totalPages > 1 && (
            <div className="flex items-center justify-center gap-2 mt-4">
              <Button variant="outline" size="sm" disabled={page <= 1} onClick={() => setPage(p => p - 1)}>Anterior</Button>
              <span className="text-sm text-muted-foreground">{page} de {totalPages}</span>
              <Button variant="outline" size="sm" disabled={page >= totalPages} onClick={() => setPage(p => p + 1)}>Siguiente</Button>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Confirmation Dialog */}
      <Dialog open={confirmDialog.open} onOpenChange={open => { if (!open) setConfirmDialog({ open: false, property: null, action: "", label: "" }); }}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Confirmar acción</DialogTitle>
            <DialogDescription>
              ¿Estás seguro de que deseas <span className="font-medium">{confirmDialog.label}</span> la propiedad <span className="font-medium">"{confirmDialog.property?.title}"</span>?
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setConfirmDialog({ open: false, property: null, action: "", label: "" })}>Cancelar</Button>
            <Button
              variant={confirmDialog.action === "rejected" ? "destructive" : "default"}
              onClick={() => confirmDialog.property && handleAction(confirmDialog.property.id, confirmDialog.action)}
              disabled={processingId !== null}
            >
              {processingId !== null ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
              Confirmar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default PublishedPropertiesSection;
