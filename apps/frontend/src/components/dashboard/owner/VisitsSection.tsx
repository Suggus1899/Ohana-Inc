import { useState, useEffect, useCallback, memo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Calendar, Clock, CheckCircle, XCircle, Loader2, MapPin, User, ChevronDown, MessageSquare } from "lucide-react";
import api from "@/services/api";
import { toast } from "sonner";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import { cn } from "@/lib/utils";

interface Visit {
  id: number;
  propertyId: number;
  userId: number | null;
  name: string;
  email: string;
  phone: string;
  visitDate: string;
  message: string | null;
  status: 'pending' | 'confirmed' | 'cancelled' | 'completed';
  createdAt: string;
  updatedAt: string;
  property?: {
    id: number;
    title: string;
    address: string;
    mainImage?: string;
  };
}

const getStatusBadge = (status: Visit['status']) => {
  switch (status) {
    case 'pending':
      return (
        <Badge variant="outline" className="bg-yellow-50 text-yellow-700 border-yellow-200">
          <Clock className="h-3 w-3 mr-1" />
          Pendiente
        </Badge>
      );
    case 'confirmed':
      return (
        <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
          <CheckCircle className="h-3 w-3 mr-1" />
          Confirmada
        </Badge>
      );
    case 'cancelled':
      return (
        <Badge variant="outline" className="bg-red-50 text-red-700 border-red-200">
          <XCircle className="h-3 w-3 mr-1" />
          Cancelada
        </Badge>
      );
    case 'completed':
      return (
        <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200">
          <CheckCircle className="h-3 w-3 mr-1" />
          Completada
        </Badge>
      );
  }
};

const VisitsSection = memo(() => {
  const [visits, setVisits] = useState<Visit[]>([]);
  const [loading, setLoading] = useState(true);
  const [expandedId, setExpandedId] = useState<number | null>(null);
  const [actionLoading, setActionLoading] = useState<number | null>(null);
  const [rejectReasons, setRejectReasons] = useState<Record<number, string>>({});
  const [showRejectInput, setShowRejectInput] = useState<number | null>(null);
  const [showTimeInput, setShowTimeInput] = useState<number | null>(null);
  const [scheduledTimes, setScheduledTimes] = useState<Record<number, string>>({});

  const fetchVisits = useCallback(async () => {
    setLoading(true);
    try {
      const res = await api.getOwnerVisits();
      if (res.success && res.data) {
        setVisits(res.data.visits);
      }
    } catch (err) {
      console.error('Error fetching visits:', err);
      toast.error('Error al cargar las visitas');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchVisits();
  }, [fetchVisits]);

  const toggleExpand = (visitId: number) => {
    setExpandedId(prev => prev === visitId ? null : visitId);
    setShowRejectInput(null);
    setShowTimeInput(null);
  };

  const handleConfirm = async (visitId: number) => {
    const time = scheduledTimes[visitId];
    if (!time) {
      toast.error('Selecciona una hora para la visita');
      return;
    }
    setActionLoading(visitId);
    try {
      const res = await api.updateVisitStatus(visitId, 'confirmed', time);
      if (res.success) {
        toast.success('Visita confirmada — se notificará al solicitante');
        fetchVisits();
        setShowTimeInput(null);
        setScheduledTimes(prev => { const copy = { ...prev }; delete copy[visitId]; return copy; });
      } else {
        toast.error(res.error?.message || 'Error al confirmar');
      }
    } catch {
      toast.error('Error al confirmar la visita');
    } finally {
      setActionLoading(null);
    }
  };

  const handleReject = async (visitId: number) => {
    const reason = rejectReasons[visitId]?.trim();
    setActionLoading(visitId);
    try {
      const res = await api.updateVisitStatus(visitId, 'cancelled');
      if (res.success) {
        toast.success(reason ? 'Visita cancelada — se envió el motivo al solicitante' : 'Visita cancelada');
        fetchVisits();
        setShowRejectInput(null);
        setRejectReasons(prev => { const copy = { ...prev }; delete copy[visitId]; return copy; });
      } else {
        toast.error(res.error?.message || 'Error al cancelar');
      }
    } catch {
      toast.error('Error al cancelar la visita');
    } finally {
      setActionLoading(null);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[300px]">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  const pendingCount = visits.filter(v => v.status === 'pending').length;

  return (
    <div className="space-y-6 px-4 sm:px-0">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
        <div>
          <h2 className="text-xl sm:text-2xl font-bold">Visitas Agendadas</h2>
          <p className="text-sm text-muted-foreground">
            {visits.length} visita{visits.length !== 1 ? 's' : ''} • {pendingCount} pendiente{pendingCount !== 1 ? 's' : ''}
          </p>
        </div>
      </div>

      <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 sm:p-4 text-sm text-blue-800">
        <p className="font-medium mb-1">Notificaciones automáticas</p>
        <p>
          Al aceptar o rechazar una solicitud de visita, se enviará una notificación por correo electrónico y WhatsApp a la persona solicitante informando sobre la acción realizada.
        </p>
      </div>

      {visits.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <Calendar className="h-12 w-12 text-muted-foreground mb-4" />
            <p className="text-muted-foreground">No hay visitas agendadas todavía</p>
            <p className="text-sm text-muted-foreground">Cuando alguien solicite una visita, aparecerá aquí</p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {visits.map((visit) => {
            const isExpanded = expandedId === visit.id;
            const visitDate = new Date(visit.visitDate);
            return (
              <Card
                key={visit.id}
                className={cn(
                  "transition-shadow",
                  isExpanded && "ring-1 ring-primary/20"
                )}
              >
                <div
                  className="p-3 sm:p-4 cursor-pointer select-none"
                  onClick={() => toggleExpand(visit.id)}
                >
                  <div className="flex items-center justify-between gap-3">
                    <div className="flex-1 min-w-0">
                      <div className="flex flex-wrap items-center gap-2 mb-1">
                        <span className="font-semibold truncate">{visit.name}</span>
                        {getStatusBadge(visit.status)}
                      </div>
                      <div className="flex flex-wrap gap-x-4 gap-y-1 text-sm text-muted-foreground">
                        <span className="flex items-center gap-1">
                          <Calendar className="h-3.5 w-3.5 shrink-0" />
                          {format(visitDate, "d MMM yyyy", { locale: es })}
                        </span>
                        <span className="flex items-center gap-1">
                          <Clock className="h-3.5 w-3.5 shrink-0" />
                          {format(visitDate, "h:mm a")}
                        </span>
                        {visit.property && (
                          <span className="flex items-center gap-1 min-w-0">
                            <MapPin className="h-3.5 w-3.5 shrink-0" />
                            <span className="truncate">{visit.property.title}</span>
                          </span>
                        )}
                      </div>
                    </div>
                    <ChevronDown
                      className={cn(
                        "h-5 w-5 shrink-0 text-muted-foreground transition-transform duration-200",
                        isExpanded && "rotate-180"
                      )}
                    />
                  </div>
                </div>

                {isExpanded && (
                  <div className="px-3 sm:px-4 pb-3 sm:pb-4 border-t pt-3 sm:pt-4">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
                      <div className="space-y-2">
                        <h4 className="font-semibold text-xs text-muted-foreground uppercase tracking-wide">Solicitante</h4>
                        <div className="flex items-center gap-2 text-sm">
                          <User className="h-4 w-4 text-muted-foreground shrink-0" />
                          <span>{visit.name}</span>
                        </div>
                      </div>
                      <div className="space-y-2">
                        <h4 className="font-semibold text-xs text-muted-foreground uppercase tracking-wide">Detalles de la visita</h4>
                        <div className="flex items-center gap-2 text-sm">
                          <Calendar className="h-4 w-4 text-muted-foreground shrink-0" />
                          <span>{format(visitDate, "EEEE, d 'de' MMMM 'de' yyyy", { locale: es })}</span>
                        </div>
                        <div className="flex items-center gap-2 text-sm">
                          <Clock className="h-4 w-4 text-muted-foreground shrink-0" />
                          <span>{format(visitDate, "h:mm a")}</span>
                        </div>
                        {visit.property && (
                          <div className="flex items-center gap-2 text-sm">
                            <MapPin className="h-4 w-4 text-muted-foreground shrink-0" />
                            <span>{visit.property.address}</span>
                          </div>
                        )}
                      </div>
                    </div>

                    {visit.message && (
                      <div className="mb-4">
                        <h4 className="font-semibold text-xs text-muted-foreground uppercase tracking-wide mb-1.5">Mensaje</h4>
                        <p className="text-sm bg-muted rounded-lg p-3">{visit.message}</p>
                      </div>
                    )}

                    {visit.status === 'pending' && (
                      <div className="space-y-3 pt-3 border-t">
                        {showTimeInput === visit.id ? (
                          <div className="space-y-3">
                            <div>
                              <label className="text-sm font-medium text-muted-foreground">Selecciona la hora de la visita</label>
                              <Input
                                type="time"
                                className="mt-1"
                                value={scheduledTimes[visit.id] || ''}
                                onChange={(e) => setScheduledTimes(prev => ({ ...prev, [visit.id]: e.target.value }))}
                              />
                            </div>
                            <div className="flex flex-col sm:flex-row gap-2">
                              <Button
                                className="bg-green-600 hover:bg-green-700 text-white w-full sm:w-auto"
                                onClick={() => handleConfirm(visit.id)}
                                disabled={actionLoading === visit.id || !scheduledTimes[visit.id]}
                              >
                                {actionLoading === visit.id ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <CheckCircle className="h-4 w-4 mr-2" />}
                                Confirmar con horario
                              </Button>
                              <Button
                                variant="ghost"
                                size="sm"
                                className="text-muted-foreground w-full sm:w-auto"
                                onClick={() => { setShowTimeInput(null); setScheduledTimes(prev => { const copy = { ...prev }; delete copy[visit.id]; return copy; }); }}
                              >
                                Cancelar
                              </Button>
                            </div>
                          </div>
                        ) : showRejectInput === visit.id ? (
                          <div className="space-y-3">
                            <div>
                              <label className="text-sm font-medium text-muted-foreground">Motivo del rechazo (opcional)</label>
                              <Textarea
                                placeholder="Ej: La fecha solicitada no está disponible..."
                                value={rejectReasons[visit.id] || ''}
                                onChange={(e) => setRejectReasons(prev => ({ ...prev, [visit.id]: e.target.value }))}
                                rows={2}
                                className="mt-1"
                              />
                            </div>
                            <div className="flex flex-col sm:flex-row gap-2">
                              <Button
                                className="bg-red-600 hover:bg-red-700 text-white w-full sm:w-auto"
                                onClick={() => handleReject(visit.id)}
                                disabled={actionLoading === visit.id}
                              >
                                {actionLoading === visit.id ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <XCircle className="h-4 w-4 mr-2" />}
                                Confirmar Rechazo
                              </Button>
                              <Button
                                variant="ghost"
                                size="sm"
                                className="text-muted-foreground w-full sm:w-auto"
                                onClick={() => { setShowRejectInput(null); setRejectReasons(prev => { const copy = { ...prev }; delete copy[visit.id]; return copy; }); }}
                              >
                                Cancelar
                              </Button>
                            </div>
                          </div>
                        ) : (
                          <div className="flex flex-col sm:flex-row gap-2">
                            <Button
                              className="bg-green-600 hover:bg-green-700 text-white w-full sm:w-auto"
                              onClick={(e) => { e.stopPropagation(); setShowTimeInput(visit.id); }}
                              disabled={actionLoading === visit.id}
                            >
                              <CheckCircle className="h-4 w-4 mr-2" />
                              Confirmar Visita
                            </Button>
                            <Button
                              variant="outline"
                              className="text-red-600 border-red-200 hover:bg-red-50 w-full sm:w-auto"
                              onClick={(e) => { e.stopPropagation(); setShowRejectInput(visit.id); }}
                              disabled={actionLoading === visit.id}
                            >
                              <XCircle className="h-4 w-4 mr-2" />
                              Rechazar
                            </Button>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                )}
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
});

VisitsSection.displayName = 'VisitsSection';
export default VisitsSection;