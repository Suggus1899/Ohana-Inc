import { useState, useEffect, useRef, useCallback } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Dialog, DialogContent, DialogDescription, DialogFooter,
  DialogHeader, DialogTitle,
} from "@/components/ui/dialog";
import {
  AlertTriangle, MessageSquare, Search, CheckCircle,
  Clock, Loader2, History, Send, ArrowUpCircle,
} from "lucide-react";
import { api, SupportTicket } from "@/services/api";
import { useToast } from "@/hooks/use-toast";

const statusBadge = (status: string) => {
  const map: Record<string, string> = {
    escalated: "bg-red-100 text-red-800",
    open: "bg-yellow-100 text-yellow-800",
    in_progress: "bg-blue-100 text-blue-800",
    resolved: "bg-green-100 text-green-800",
    closed: "bg-gray-100 text-gray-800",
  };
  const labels: Record<string, string> = {
    escalated: "Escalado", open: "Abierto", in_progress: "En Progreso",
    resolved: "Resuelto", closed: "Cerrado",
  };
  return <Badge className={`${map[status] ?? "bg-gray-100 text-gray-700"} border-none`}>{labels[status] ?? status}</Badge>;
};

const priorityBadge = (priority: string) => {
  if (priority === "high") return <Badge variant="destructive">Urgente</Badge>;
  if (priority === "medium") return <Badge className="bg-yellow-100 text-yellow-800 border-none">Media</Badge>;
  return <Badge variant="secondary">Baja</Badge>;
};

const AdminSupportSection = () => {
  const [escalated, setEscalated] = useState<SupportTicket[]>([]);
  const [normal, setNormal] = useState<SupportTicket[]>([]);
  const [history, setHistory] = useState<SupportTicket[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [resolveModal, setResolveModal] = useState<{ open: boolean; ticket: SupportTicket | null }>({ open: false, ticket: null });
  const [replyModal, setReplyModal] = useState<{ open: boolean; ticket: SupportTicket | null }>({ open: false, ticket: null });
  const [resolution, setResolution] = useState("");
  const [reply, setReply] = useState("");
  const [isActioning, setIsActioning] = useState(false);
  const refreshRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const { toast } = useToast();

  const fetchAll = useCallback(async () => {
    try {
      const [escalatedRes, normalRes, historyRes] = await Promise.all([
        api.getTickets({ status: "escalated", limit: 100 }),
        api.getTickets({ limit: 100 }),
        api.getTickets({ status: "resolved", limit: 100 }),
      ]);

      if (escalatedRes.success && escalatedRes.data) {
        setEscalated((escalatedRes.data as any).tickets ?? escalatedRes.data as unknown as SupportTicket[]);
      }
      if (normalRes.success && normalRes.data) {
        const all = (normalRes.data as any).tickets ?? normalRes.data as unknown as SupportTicket[];
        setNormal(all.filter((t: SupportTicket) => t.status !== "escalated" && t.status !== "resolved"));
      }
      if (historyRes.success && historyRes.data) {
        setHistory((historyRes.data as any).tickets ?? historyRes.data as unknown as SupportTicket[]);
      }
    } catch {
      toast({ title: "Error", description: "No se pudieron cargar los tickets", variant: "destructive" });
    } finally {
      setIsLoading(false);
    }
  }, [toast]);

  useEffect(() => {
    fetchAll();
    refreshRef.current = setInterval(fetchAll, 30000);
    return () => { if (refreshRef.current) clearInterval(refreshRef.current); };
  }, [fetchAll]);

  const handleResolve = async () => {
    if (!resolveModal.ticket) return;
    setIsActioning(true);
    try {
      const res = await api.updateTicket(resolveModal.ticket.id, { status: "resolved", resolution });
      if (res.success) {
        toast({ title: "Ticket resuelto", description: `#${resolveModal.ticket.id} marcado como resuelto` });
        setResolveModal({ open: false, ticket: null });
        setResolution("");
        fetchAll();
      }
    } catch {
      toast({ title: "Error", description: "No se pudo resolver", variant: "destructive" });
    } finally { setIsActioning(false); }
  };

  const handleReply = async () => {
    if (!replyModal.ticket || !reply.trim()) return;
    setIsActioning(true);
    try {
      const res = await api.updateTicket(replyModal.ticket.id, { moderatorReply: reply, status: "in_progress" });
      if (res.success) {
        toast({ title: "Respuesta enviada" });
        setReplyModal({ open: false, ticket: null });
        setReply("");
        fetchAll();
      }
    } catch {
      toast({ title: "Error", variant: "destructive" });
    } finally { setIsActioning(false); }
  };

  const filterTickets = (list: SupportTicket[]) =>
    list.filter(t =>
      !search ||
      t.subject?.toLowerCase().includes(search.toLowerCase()) ||
      String(t.id).includes(search) ||
      t.user?.name?.toLowerCase().includes(search.toLowerCase())
    );

  const TicketCard = ({ ticket, showActions = true }: { ticket: SupportTicket; showActions?: boolean }) => (
    <div className="p-4 rounded-lg border hover:bg-muted/20 transition-colors">
      <div className="flex items-start justify-between gap-4">
        <div className="flex-1 min-w-0">
          <div className="flex flex-wrap items-center gap-2 mb-1">
            <span className="text-xs font-mono text-muted-foreground">#{ticket.id}</span>
            {statusBadge(ticket.status)}
            {priorityBadge(ticket.priority)}
          </div>
          <h4 className="font-medium truncate">{ticket.subject}</h4>
          {ticket.status === "escalated" && (ticket as any).escalationReason && (
            <p className="text-sm text-red-700 mt-1 flex items-start gap-1">
              <AlertTriangle className="h-3 w-3 mt-0.5 shrink-0" />
              {(ticket as any).escalationReason}
            </p>
          )}
          <div className="flex items-center gap-3 mt-1 text-xs text-muted-foreground">
            {ticket.user && <span>{ticket.user.name}</span>}
            <span>{new Date(ticket.createdAt).toLocaleDateString("es-VE")}</span>
          </div>
        </div>
        {showActions && (
          <div className="flex gap-2 shrink-0">
            <Button size="sm" variant="outline" onClick={() => setReplyModal({ open: true, ticket })}>
              <Send className="h-3.5 w-3.5 mr-1" />Responder
            </Button>
            <Button size="sm" className="bg-green-600 hover:bg-green-700" onClick={() => setResolveModal({ open: true, ticket })}>
              <CheckCircle className="h-3.5 w-3.5 mr-1" />Resolver
            </Button>
          </div>
        )}
      </div>
    </div>
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold">Soporte al Cliente</h1>
          <p className="text-muted-foreground mt-1">Gestión centralizada de tickets de soporte</p>
        </div>
        <div className="relative w-full md:w-72">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input placeholder="Buscar ticket..." className="pl-9" value={search} onChange={e => setSearch(e.target.value)} />
        </div>
      </div>

      {/* Stats */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardContent className="p-5 flex items-center gap-4">
            <div className="p-3 rounded-xl bg-red-50"><AlertTriangle className="h-6 w-6 text-red-600" /></div>
            <div>
              <p className="text-2xl font-bold">{escalated.length}</p>
              <p className="text-sm text-muted-foreground">Escalados</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-5 flex items-center gap-4">
            <div className="p-3 rounded-xl bg-yellow-50"><Clock className="h-6 w-6 text-yellow-600" /></div>
            <div>
              <p className="text-2xl font-bold">{normal.filter(t => t.status === "open").length}</p>
              <p className="text-sm text-muted-foreground">Pendientes</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-5 flex items-center gap-4">
            <div className="p-3 rounded-xl bg-green-50"><CheckCircle className="h-6 w-6 text-green-600" /></div>
            <div>
              <p className="text-2xl font-bold">{history.length}</p>
              <p className="text-sm text-muted-foreground">Resueltos</p>
            </div>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="escalated">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="escalated" className="gap-2">
            <AlertTriangle className="h-4 w-4" />
            Escalados
            {escalated.length > 0 && <Badge variant="destructive" className="ml-1">{escalated.length}</Badge>}
          </TabsTrigger>
          <TabsTrigger value="normal" className="gap-2">
            <MessageSquare className="h-4 w-4" />
            Tickets
            {normal.filter(t => t.status === "open").length > 0 && (
              <Badge className="ml-1 bg-yellow-500">{normal.filter(t => t.status === "open").length}</Badge>
            )}
          </TabsTrigger>
          <TabsTrigger value="history" className="gap-2">
            <History className="h-4 w-4" />
            Historial
          </TabsTrigger>
        </TabsList>

        {/* ESCALADOS */}
        <TabsContent value="escalated">
          <Card className="border-red-100">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-red-700">
                <AlertTriangle className="h-5 w-5" />Tickets Escalados
              </CardTitle>
              <CardDescription>Requieren atención prioritaria del administrador</CardDescription>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <div className="flex justify-center py-10"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>
              ) : filterTickets(escalated).length === 0 ? (
                <div className="text-center py-10 text-muted-foreground">
                  <CheckCircle className="h-10 w-10 mx-auto mb-2 text-green-400 opacity-60" />
                  <p>Sin tickets escalados</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {filterTickets(escalated).map(t => <TicketCard key={t.id} ticket={t} />)}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* TICKETS NORMALES */}
        <TabsContent value="normal">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <MessageSquare className="h-5 w-5" />Tickets de Soporte
              </CardTitle>
              <CardDescription>{normal.length} tickets activos</CardDescription>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <div className="flex justify-center py-10"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>
              ) : filterTickets(normal).length === 0 ? (
                <div className="text-center py-10 text-muted-foreground">
                  <MessageSquare className="h-10 w-10 mx-auto mb-2 opacity-40" />
                  <p>No hay tickets activos</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {filterTickets(normal).map(t => <TicketCard key={t.id} ticket={t} />)}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* HISTORIAL */}
        <TabsContent value="history">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <History className="h-5 w-5" />Historial de Tickets Resueltos
              </CardTitle>
              <CardDescription>Todos los tickets resueltos por admin u operadores</CardDescription>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <div className="flex justify-center py-10"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>
              ) : filterTickets(history).length === 0 ? (
                <div className="text-center py-10 text-muted-foreground">
                  <History className="h-10 w-10 mx-auto mb-2 opacity-40" />
                  <p>Sin historial aún</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {filterTickets(history).map(t => <TicketCard key={t.id} ticket={t} showActions={false} />)}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Resolve Dialog */}
      <Dialog open={resolveModal.open} onOpenChange={open => { setResolveModal({ open, ticket: null }); setResolution(""); }}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Resolver Ticket #{resolveModal.ticket?.id}</DialogTitle>
            <DialogDescription>{resolveModal.ticket?.subject}</DialogDescription>
          </DialogHeader>
          <Textarea placeholder="Resolución o acción tomada..." value={resolution} onChange={e => setResolution(e.target.value)} rows={4} />
          <DialogFooter>
            <Button variant="outline" onClick={() => { setResolveModal({ open: false, ticket: null }); setResolution(""); }}>Cancelar</Button>
            <Button className="bg-green-600 hover:bg-green-700" onClick={handleResolve} disabled={isActioning || !resolution.trim()}>
              {isActioning ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <CheckCircle className="h-4 w-4 mr-2" />}
              Marcar como Resuelto
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Reply Dialog */}
      <Dialog open={replyModal.open} onOpenChange={open => { setReplyModal({ open, ticket: null }); setReply(""); }}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Responder Ticket #{replyModal.ticket?.id}</DialogTitle>
            <DialogDescription>{replyModal.ticket?.subject}</DialogDescription>
          </DialogHeader>
          <Textarea placeholder="Escribe tu respuesta..." value={reply} onChange={e => setReply(e.target.value)} rows={4} />
          <DialogFooter>
            <Button variant="outline" onClick={() => { setReplyModal({ open: false, ticket: null }); setReply(""); }}>Cancelar</Button>
            <Button onClick={handleReply} disabled={isActioning || !reply.trim()}>
              {isActioning ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Send className="h-4 w-4 mr-2" />}
              Enviar Respuesta
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default AdminSupportSection;
