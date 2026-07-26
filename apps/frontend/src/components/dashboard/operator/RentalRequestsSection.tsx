import { useState, useEffect, useCallback } from "react";
import { api } from "@/services/api";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Loader2, Check, X, Eye } from "lucide-react";
import { toast } from "sonner";

interface RentalRequest {
  id: number; tenantId: number; propertyId: number; ownerId: number;
  status: string; message?: string; phoneNumber?: string; moveInDate?: string;
  leaseDuration?: number; tenantName?: string; propertyTitle?: string;
}

const RentalRequestsSection = () => {
  const [requests, setRequests] = useState<RentalRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [processingId, setProcessingId] = useState<number | null>(null);
  const [selected, setSelected] = useState<RentalRequest | null>(null);

  const fetchRequests = useCallback(async () => {
    setLoading(true);
    try {
      const res = await api.request<any>("/rent-requests", { method: "GET" });
      if (res.success && res.data) setRequests(res.data.requests || res.data || []);
    } catch { toast.error("Error al cargar solicitudes"); }
    setLoading(false);
  }, []);

  useEffect(() => { fetchRequests(); }, [fetchRequests]);

  const handleStatus = async (id: number, status: string) => {
    setProcessingId(id);
    try {
      const res = await api.request(`/rent-requests/${id}/status`, { method: "PATCH", body: JSON.stringify({ status }) });
      if (res.success) { toast.success(status === "accepted" ? "Solicitud aceptada" : "Solicitud rechazada"); fetchRequests(); }
      else toast.error(res.error?.message || "Error");
    } catch { toast.error("Error de conexion"); }
    setProcessingId(null);
  };

  const statusBadge = (s: string) => {
    const map: Record<string, string> = { pending: "bg-yellow-100 text-yellow-800", accepted: "bg-green-100 text-green-800", rejected: "bg-red-100 text-red-800", cancelled: "bg-gray-100 text-gray-800" };
    return <Badge className={map[s] || "bg-gray-100"}>{s}</Badge>;
  };

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader><CardTitle>Solicitudes de Alquiler</CardTitle></CardHeader>
        <CardContent>
          {loading ? <div className="flex justify-center py-12"><Loader2 className="h-6 w-6 animate-spin" /></div>
          : requests.length === 0 ? <div className="text-center py-12 text-muted-foreground">No hay solicitudes</div>
          : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead><tr className="border-b text-left"><th className="p-2">ID</th><th className="p-2">Propiedad</th><th className="p-2">Inquilino</th><th className="p-2">Fecha</th><th className="p-2">Estado</th><th className="p-2">Acciones</th></tr></thead>
                <tbody>
                  {requests.map((r) => (
                    <tr key={r.id} className="border-b hover:bg-muted/50">
                      <td className="p-2">#{r.id}</td>
                      <td className="p-2">{r.propertyTitle || `Propiedad #${r.propertyId}`}</td>
                      <td className="p-2">{r.tenantName || `Usuario #${r.tenantId}`}</td>
                      <td className="p-2">{r.moveInDate || "-"}</td>
                      <td className="p-2">{statusBadge(r.status)}</td>
                      <td className="p-2">
                        <div className="flex gap-1">
                          <Button size="sm" variant="outline" onClick={() => setSelected(r)}><Eye className="h-3 w-3" /></Button>
                          {r.status === "pending" && (<>
                            <Button size="sm" variant="outline" className="text-green-600" onClick={() => handleStatus(r.id, "accepted")} disabled={processingId === r.id}><Check className="h-3 w-3" /></Button>
                            <Button size="sm" variant="outline" className="text-red-600" onClick={() => handleStatus(r.id, "rejected")} disabled={processingId === r.id}><X className="h-3 w-3" /></Button>
                          </>)}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>

      <Dialog open={!!selected} onOpenChange={() => setSelected(null)}>
        <DialogContent>
          <DialogHeader><DialogTitle>Detalle Solicitud #{selected?.id}</DialogTitle></DialogHeader>
          {selected && (
            <div className="space-y-2 text-sm">
              <p><strong>Propiedad:</strong> {selected.propertyTitle || `#${selected.propertyId}`}</p>
              <p><strong>Inquilino:</strong> {selected.tenantName || `Usuario #${selected.tenantId}`}</p>
              <p><strong>Estado:</strong> {statusBadge(selected.status)}</p>
              <p><strong>Mensaje:</strong> {selected.message || "Sin mensaje"}</p>
              <p><strong>Telefono:</strong> {selected.phoneNumber || "-"}</p>
              <p><strong>Fecha mudanza:</strong> {selected.moveInDate || "-"}</p>
              <p><strong>Duracion:</strong> {selected.leaseDuration ? `${selected.leaseDuration} meses` : "-"}</p>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default RentalRequestsSection;
