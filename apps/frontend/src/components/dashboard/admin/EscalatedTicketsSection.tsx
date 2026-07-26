import { useState, useEffect, useRef } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog, DialogContent, DialogDescription, DialogFooter,
  DialogHeader, DialogTitle,
} from "@/components/ui/dialog";
import { Loader2, Search, AlertTriangle, CheckCircle, Clock, MessageSquare } from "lucide-react";
import { api, SupportTicket } from "@/services/api";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";

const statusBadge = (status: string) => {
  switch (status) {
    case "escalated":
      return <Badge className="bg-red-100 text-red-800">Escalado</Badge>;
    case "open":
      return <Badge className="bg-yellow-100 text-yellow-800">Abierto</Badge>;
    case "in_progress":
      return <Badge className="bg-blue-100 text-blue-800">En Progreso</Badge>;
    case "resolved":
      return <Badge className="bg-green-100 text-green-800">Resuelto</Badge>;
    case "closed":
      return <Badge className="bg-gray-100 text-gray-800">Cerrado</Badge>;
    default:
      return <Badge variant="outline">{status}</Badge>;
  }
};

const EscalatedTicketsSection = () => {
  const [tickets, setTickets] = useState<SupportTicket[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [resolveModal, setResolveModal] = useState<{ open: boolean; ticket: SupportTicket | null }>({ open: false, ticket: null });
  const [resolution, setResolution] = useState("");
  const [isResolving, setIsResolving] = useState(false);
  const refreshRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const { toast } = useToast();

  const fetchTickets = async () => {
    setIsLoading(true);
    try {
      const res = await api.getTickets({ status: "escalated", limit: 50 });
      if (res.success && res.data) {
        setTickets((res.data as any).tickets ?? []);
      }
    } catch {
      toast({ title: "Error", description: "No se pudieron cargar los tickets escalados", variant: "destructive" });
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchTickets();
    refreshRef.current = setInterval(fetchTickets, 30000);
    return () => { if (refreshRef.current) clearInterval(refreshRef.current); };
  }, []);

  const handleResolve = async () => {
    if (!resolveModal.ticket) return;
    setIsResolving(true);
    try {
      const res = await api.updateTicket(resolveModal.ticket.id, { status: "resolved", resolution });
      if (res.success) {
        toast({ title: "Ticket resuelto", description: `Ticket #${resolveModal.ticket.id} marcado como resuelto` });
        setResolveModal({ open: false, ticket: null });
        setResolution("");
        fetchTickets();
      } else {
        toast({ title: "Error", description: "No se pudo resolver el ticket", variant: "destructive" });
      }
    } catch {
      toast({ title: "Error", description: "Error de servidor", variant: "destructive" });
    } finally {
      setIsResolving(false);
    }
  };

  const filtered = tickets.filter(t =>
    !search || t.subject?.toLowerCase().includes(search.toLowerCase()) ||
    String(t.id).includes(search)
  );

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Tickets Escalados</h1>
        <p className="text-muted-foreground mt-1">
          Tickets que requieren atención prioritaria del administrador
        </p>
      </div>

      <Card>
        <CardHeader>
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <CardTitle className="flex items-center gap-2">
                <AlertTriangle className="h-5 w-5 text-red-500" />
                Tickets Escalados
              </CardTitle>
              <CardDescription>{filtered.length} ticket{filtered.length !== 1 ? "s" : ""} escalado{filtered.length !== 1 ? "s" : ""}</CardDescription>
            </div>
            <div className="relative w-full sm:w-64">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Buscar ticket..."
                className="pl-9"
                value={search}
                onChange={e => setSearch(e.target.value)}
              />
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
          ) : filtered.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              <CheckCircle className="h-12 w-12 mx-auto mb-3 opacity-40 text-green-500" />
              <p className="font-medium">Sin tickets escalados</p>
              <p className="text-sm">No hay tickets que requieran atención prioritaria</p>
            </div>
          ) : (
            <div className="space-y-3">
              {filtered.map(ticket => (
                <div key={ticket.id} className="p-4 rounded-lg border border-red-100 bg-red-50/30 hover:bg-red-50/50 transition-colors">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-xs text-muted-foreground font-mono">#{ticket.id}</span>
                        {statusBadge(ticket.status)}
                      </div>
                      <h4 className="font-medium">{ticket.subject}</h4>
                      {(ticket as any).escalationReason && (
                        <p className="text-sm text-red-700 mt-1 flex items-start gap-1">
                          <AlertTriangle className="h-3 w-3 mt-0.5 shrink-0" />
                          {(ticket as any).escalationReason}
                        </p>
                      )}
                      <div className="flex items-center gap-3 mt-2 text-xs text-muted-foreground">
                        <span className="flex items-center gap-1">
                          <Clock className="h-3 w-3" />
                          {new Date(ticket.createdAt).toLocaleDateString("es-VE")}
                        </span>
                        {ticket.user && (
                          <span className="flex items-center gap-1">
                            <MessageSquare className="h-3 w-3" />
                            {ticket.user.name}
                          </span>
                        )}
                      </div>
                    </div>
                    <Button
                      size="sm"
                      className="bg-green-600 hover:bg-green-700 shrink-0"
                      onClick={() => setResolveModal({ open: true, ticket })}
                    >
                      Resolver
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      <Dialog open={resolveModal.open} onOpenChange={open => { setResolveModal({ open, ticket: null }); setResolution(""); }}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Resolver Ticket #{resolveModal.ticket?.id}</DialogTitle>
            <DialogDescription>
              Proporciona una resolución para cerrar este ticket escalado.
            </DialogDescription>
          </DialogHeader>
          <div className="py-2 space-y-2">
            <p className="text-sm font-medium">{resolveModal.ticket?.subject}</p>
            <Textarea
              placeholder="Escribe la resolución o acción tomada..."
              value={resolution}
              onChange={e => setResolution(e.target.value)}
              rows={4}
            />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => { setResolveModal({ open: false, ticket: null }); setResolution(""); }}>
              Cancelar
            </Button>
            <Button
              className="bg-green-600 hover:bg-green-700"
              onClick={handleResolve}
              disabled={isResolving || !resolution.trim()}
            >
              {isResolving ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <CheckCircle className="h-4 w-4 mr-2" />}
              Marcar como Resuelto
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default EscalatedTicketsSection;
