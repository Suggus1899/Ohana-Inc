import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { 
  MessageSquare, 
  Search, 
  Clock, 
  CheckCircle, 
  User,
  Send,
  AlertCircle,
  Loader2,
  ArrowUpCircle,
  BookOpen,
  FileText,
  TrendingUp,
  ShieldAlert,
  Ban,
  XCircle,
  Eye,
  MoreVertical
} from "lucide-react";
import { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { toast } from "sonner";
import { api, SupportTicket, UserReport, ModerationStats } from "@/services/api";
import { exportToPDF } from "@/lib/pdf-export";

const SupportSection = () => {
  // Tickets state
  const [tickets, setTickets] = useState<SupportTicket[]>([]);
  const [ticketStatusFilter, setTicketStatusFilter] = useState("all");
  const [ticketPriorityFilter, setTicketPriorityFilter] = useState("all");
  const [replyDialogOpen, setReplyDialogOpen] = useState(false);
  const [escalateDialogOpen, setEscalateDialogOpen] = useState(false);
  const [selectedTicket, setSelectedTicket] = useState<SupportTicket | null>(null);
  const [replyMessage, setReplyMessage] = useState("");
  const [escalateReason, setEscalateReason] = useState("");
  
  // Reports state
  const [reports, setReports] = useState<UserReport[]>([]);
  const [selectedReport, setSelectedReport] = useState<UserReport | null>(null);
  const [reportDetailsDialogOpen, setReportDetailsDialogOpen] = useState(false);
  
  // Shared state
  const [stats, setStats] = useState<ModerationStats | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [mainTab, setMainTab] = useState("tickets");

  const fetchData = async () => {
    setIsLoading(true);
    try {
      const [ticketsRes, reportsRes, statsRes] = await Promise.all([
        api.getTickets(),
        api.getReports({ status: 'pending' }),
        api.getModerationStats()
      ]);

      if (ticketsRes.success && ticketsRes.data) {
        const ticketData = Array.isArray(ticketsRes.data) ? ticketsRes.data : (ticketsRes.data as any).tickets || [];
        setTickets(ticketData);
      }
      if (reportsRes.success && reportsRes.data) {
        const reportData = Array.isArray(reportsRes.data) ? reportsRes.data : (reportsRes.data as any).reports || [];
        setReports(reportData);
      }
      if (statsRes.success && statsRes.data) {
        setStats(statsRes.data);
      }
    } catch (error) {
      toast.error("Error al cargar los datos");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  // Ticket functions
  const getTicketStatusBadge = (status: string) => {
    switch (status) {
      case "open":
        return <Badge variant="outline" className="bg-yellow-50 text-yellow-700 hover:bg-yellow-50">Abierto</Badge>;
      case "in_progress":
        return <Badge variant="outline" className="bg-blue-50 text-blue-700 hover:bg-blue-50">En progreso</Badge>;
      case "resolved":
        return <Badge variant="outline" className="bg-green-50 text-green-700 hover:bg-green-50">Resuelto</Badge>;
      case "escalated":
        return <Badge variant="outline" className="bg-purple-50 text-purple-700 hover:bg-purple-50">Escalado</Badge>;
      default:
        return null;
    }
  };

  const getPriorityBadge = (priority: string) => {
    switch (priority) {
      case "high":
        return <Badge variant="destructive">Urgente</Badge>;
      case "medium":
        return <Badge className="bg-yellow-100 text-yellow-800 border-none hover:bg-yellow-100">Media</Badge>;
      default:
        return <Badge variant="secondary">Baja</Badge>;
    }
  };

  const handleReply = async () => {
    if (selectedTicket && replyMessage.trim()) {
      try {
        const response = await api.updateTicket(selectedTicket.id, {
          moderatorReply: replyMessage,
          status: 'in_progress'
        });

        if (response.success) {
          toast.success(`Respuesta enviada a ${selectedTicket.user?.name}`);
          setReplyDialogOpen(false);
          setReplyMessage("");
          setSelectedTicket(null);
          fetchData();
        }
      } catch (error) {
        toast.error("Error al enviar la respuesta");
      }
    }
  };

  const handleMarkResolved = async (ticket: SupportTicket) => {
    try {
      const response = await api.updateTicket(ticket.id, { status: 'resolved' });
      if (response.success) {
        toast.success(`Ticket "${ticket.subject}" marcado como resuelto`);
        fetchData();
      }
    } catch (error) {
      toast.error("Error al actualizar el ticket");
    }
  };

  const handleEscalate = async () => {
    if (selectedTicket && escalateReason.trim()) {
      try {
        const response = await api.updateTicket(selectedTicket.id, {
          status: 'escalated',
          escalationReason: escalateReason
        });

        if (response.success) {
          toast.success("Ticket escalado a administradores");
          setEscalateDialogOpen(false);
          setEscalateReason("");
          setSelectedTicket(null);
          fetchData();
        }
      } catch (error) {
        toast.error("Error al escalar el ticket");
      }
    }
  };

  // Report functions
  const getReportStatusBadge = (status: string) => {
    switch (status) {
      case "pending":
        return <Badge variant="outline" className="bg-amber-50 text-amber-700 hover:bg-amber-50">Pendiente</Badge>;
      case "dismissed":
        return <Badge variant="outline" className="bg-zinc-100 text-zinc-600 hover:bg-zinc-100">Desestimado</Badge>;
      case "resolved":
        return <Badge variant="outline" className="bg-emerald-50 text-emerald-700 hover:bg-emerald-50">Resuelto</Badge>;
      default:
        return null;
    }
  };

  const getReasonLabel = (reason: string) => {
    switch (reason) {
      case "scam": return "Posible Estafa";
      case "inappropriate_content": return "Contenido Inapropiado";
      case "harassment": return "Acoso";
      case "spam": return "Spam";
      default: return "Otro";
    }
  };

  const handleUpdateReportStatus = async (id: number, status: 'dismissed' | 'resolved') => {
    try {
      const response = await api.updateReportStatus(id, status);
      if (response.success) {
        toast.success(status === 'resolved' ? "Reporte resuelto" : "Reporte desestimado");
        setReportDetailsDialogOpen(false);
        fetchData();
      }
    } catch (error) {
      toast.error("Error al actualizar el reporte");
    }
  };

  // Filters
  const filteredTickets = tickets.filter(t => {
    const matchesSearch = t.subject.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         t.message.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         t.user?.name.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = ticketStatusFilter === 'all' || t.status === ticketStatusFilter;
    const matchesPriority = ticketPriorityFilter === 'all' || t.priority === ticketPriorityFilter;
    
    return matchesSearch && matchesStatus && matchesPriority;
  });

  const filteredReports = reports.filter(r => 
    r.reason.toLowerCase().includes(searchQuery.toLowerCase()) ||
    r.reportedUser?.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    r.reporter?.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const ticketStats = {
    pending: tickets.filter(t => t.status === 'open').length,
    inProgress: tickets.filter(t => t.status === 'in_progress').length,
    resolved: tickets.filter(t => t.status === 'resolved').length,
    escalated: tickets.filter(t => t.status === 'escalated').length
  };

  const reportStats = {
    pending: reports.filter(r => r.status === 'pending').length,
    scams: reports.filter(r => r.reason === 'scam').length
  };

  const handleExport = () => {
    const dataToExport = mainTab === 'tickets' ? filteredTickets : filteredReports;
    if (dataToExport.length === 0) return;
    
    if (mainTab === 'tickets') {
      exportToPDF({
        title: "Reporte de Tickets de Soporte",
        subtitle: "Listado de consultas y problemas técnicos",
        operatorName: "Operador de Soporte",
        stats: {
          total: filteredTickets.length,
          approved: filteredTickets.filter(t => t.status === 'resolved').length,
          rejected: 0
        },
        headers: ['ID', 'Usuario', 'Asunto', 'Estado', 'Prioridad', 'Fecha'],
        rows: filteredTickets.map(t => [
          `#${t.id}`,
          t.user?.name || 'N/A',
          t.subject,
          t.status,
          t.priority,
          new Date(t.createdAt).toLocaleDateString()
        ]),
        fileName: 'reporte_tickets'
      });
    } else {
      exportToPDF({
        title: "Reporte de Denuncias de Usuarios",
        subtitle: "Listado de reportes por comportamiento inapropiado",
        operatorName: "Operador de Seguridad",
        stats: {
          total: filteredReports.length,
          approved: 0,
          rejected: filteredReports.filter(r => r.status === 'dismissed').length
        },
        headers: ['ID', 'Reportado', 'Denunciante', 'Motivo', 'Estado', 'Fecha'],
        rows: filteredReports.map(r => [
          `#${r.id}`,
          r.reportedUser?.name || 'N/A',
          r.reporter?.name || 'N/A',
          getReasonLabel(r.reason),
          r.status,
          new Date(r.createdAt).toLocaleDateString()
        ]),
        fileName: 'reporte_denuncias'
      });
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold">Soporte al Cliente</h1>
          <p className="text-muted-foreground mt-1">
            Atiende consultas, problemas técnicos y reportes de usuarios
          </p>
        </div>
        <Button 
          className="flex items-center gap-2 bg-red-600 hover:bg-red-700 text-white"
          onClick={handleExport}
          disabled={isLoading || (mainTab === 'tickets' ? filteredTickets.length === 0 : filteredReports.length === 0)}
        >
          <div className="bg-white/20 p-1 rounded">
            <span className="text-[10px] font-bold">PDF</span>
          </div>
          <span className="hidden sm:inline font-semibold">Exportar Reporte</span>
        </Button>
      </div>

      {/* Main Tabs */}
      <Tabs value={mainTab} onValueChange={setMainTab}>
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="tickets">
            <MessageSquare className="h-4 w-4 mr-2" />
            Tickets de Soporte
            {ticketStats.pending > 0 && <Badge variant="secondary" className="ml-2">{ticketStats.pending}</Badge>}
          </TabsTrigger>
          <TabsTrigger value="reports">
            <ShieldAlert className="h-4 w-4 mr-2" />
            Reportes de Usuarios
            {reportStats.pending > 0 && <Badge variant="secondary" className="ml-2">{reportStats.pending}</Badge>}
          </TabsTrigger>
          <TabsTrigger value="knowledge">
            <BookOpen className="h-4 w-4 mr-2" />
            Base de Conocimiento
          </TabsTrigger>
        </TabsList>
      {/* Stats */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card className="border-none shadow-sm">
          <CardContent className="p-6 flex items-center gap-4">
            <div className="p-3 rounded-xl bg-amber-50">
              <AlertCircle className="h-6 w-6 text-amber-600" />
            </div>
            <div>
              <p className="text-2xl font-bold">{ticketStats.pending}</p>
              <p className="text-sm text-muted-foreground">Tickets Pendientes</p>
            </div>
          </CardContent>
        </Card>
        <Card className="border-none shadow-sm">
          <CardContent className="p-6 flex items-center gap-4">
            <div className="p-3 rounded-xl bg-blue-50">
              <Clock className="h-6 w-6 text-blue-600" />
            </div>
            <div>
              <p className="text-2xl font-bold">{ticketStats.inProgress}</p>
              <p className="text-sm text-muted-foreground">En Progreso</p>
            </div>
          </CardContent>
        </Card>
        <Card className="border-none shadow-sm">
          <CardContent className="p-6 flex items-center gap-4">
            <div className="p-3 rounded-xl bg-emerald-50">
              <CheckCircle className="h-6 w-6 text-emerald-600" />
            </div>
            <div>
              <p className="text-2xl font-bold">{ticketStats.resolved}</p>
              <p className="text-sm text-muted-foreground">Resueltos</p>
            </div>
          </CardContent>
        </Card>
      </div>

        {/* TICKETS TAB */}
        <TabsContent value="tickets" className="space-y-6">
          {/* Tickets Stats */}
          <div className="grid gap-4 md:grid-cols-4">
            <Card className="border-none shadow-sm">
              <CardContent className="p-6 flex items-center gap-4">
                <div className="p-3 rounded-xl bg-yellow-50">
                  <Clock className="h-6 w-6 text-yellow-600" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{ticketStats.pending}</p>
                  <p className="text-sm text-muted-foreground">Pendientes</p>
                </div>
              </CardContent>
            </Card>
            <Card className="border-none shadow-sm">
              <CardContent className="p-6 flex items-center gap-4">
                <div className="p-3 rounded-xl bg-blue-50">
                  <Loader2 className="h-6 w-6 text-blue-600" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{ticketStats.inProgress}</p>
                  <p className="text-sm text-muted-foreground">En Progreso</p>
                </div>
              </CardContent>
            </Card>
            <Card className="border-none shadow-sm">
              <CardContent className="p-6 flex items-center gap-4">
                <div className="p-3 rounded-xl bg-green-50">
                  <CheckCircle className="h-6 w-6 text-green-600" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{ticketStats.resolved}</p>
                  <p className="text-sm text-muted-foreground">Resueltos</p>
                </div>
              </CardContent>
            </Card>
            <Card className="border-none shadow-sm">
              <CardContent className="p-6 flex items-center gap-4">
                <div className="p-3 rounded-xl bg-purple-50">
                  <ArrowUpCircle className="h-6 w-6 text-purple-600" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{ticketStats.escalated}</p>
                  <p className="text-sm text-muted-foreground">Escalados</p>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Tickets Filters and List */}
          <Card className="border-none shadow-lg">
            <CardHeader>
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                  <CardTitle className="flex items-center gap-2">
                    <MessageSquare className="h-5 w-5 text-blue-500" />
                    Tickets de Soporte
                  </CardTitle>
                  <CardDescription>
                    Atiende consultas y resuelve problemas técnicos
                  </CardDescription>
                </div>
                <div className="flex flex-col sm:flex-row gap-2">
                  <Select value={ticketStatusFilter} onValueChange={setTicketStatusFilter}>
                    <SelectTrigger className="w-full sm:w-40">
                      <SelectValue placeholder="Estado" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Todos</SelectItem>
                      <SelectItem value="open">Abiertos</SelectItem>
                      <SelectItem value="in_progress">En Progreso</SelectItem>
                      <SelectItem value="resolved">Resueltos</SelectItem>
                      <SelectItem value="escalated">Escalados</SelectItem>
                    </SelectContent>
                  </Select>
                  <Select value={ticketPriorityFilter} onValueChange={setTicketPriorityFilter}>
                    <SelectTrigger className="w-full sm:w-40">
                      <SelectValue placeholder="Prioridad" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Todas</SelectItem>
                      <SelectItem value="high">Urgente</SelectItem>
                      <SelectItem value="medium">Media</SelectItem>
                      <SelectItem value="low">Baja</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="relative mt-4">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input 
                  placeholder="Buscar por asunto, mensaje o usuario..." 
                  className="pl-9 bg-zinc-50 border-none italic" 
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>
            </CardHeader>

            <CardContent>
              <div className="space-y-4">
                {isLoading ? (
                  <div className="flex items-center justify-center py-20">
                    <Loader2 className="h-8 w-8 animate-spin text-primary/40" />
                  </div>
                ) : filteredTickets.length === 0 ? (
                  <div className="text-center py-20 bg-zinc-50 rounded-2xl border-2 border-dashed">
                    <MessageSquare className="h-10 w-10 mx-auto mb-3 text-zinc-300" />
                    <p className="text-zinc-500 font-medium">No hay tickets que coincidan con los filtros</p>
                  </div>
                ) : (
                  filteredTickets.map((ticket) => (
                    <div
                      key={ticket.id}
                      className="p-5 rounded-2xl border hover:border-primary/30 hover:bg-primary/5 transition-all group"
                    >
                      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                        <div className="flex-1 space-y-2">
                          <div className="flex items-center gap-3">
                            <span className="p-1.5 rounded-lg bg-blue-100 text-blue-600">
                              <MessageSquare className="h-4 w-4" />
                            </span>
                            <h4 className="font-bold text-lg text-zinc-800">{ticket.subject}</h4>
                            {getTicketStatusBadge(ticket.status)}
                            {getPriorityBadge(ticket.priority)}
                          </div>
                          <p className="text-sm text-zinc-600 line-clamp-2">{ticket.message}</p>
                          <div className="flex items-center gap-4 text-sm">
                            <div className="flex items-center gap-2">
                              <User className="h-4 w-4 text-zinc-400" />
                              <span className="font-medium">{ticket.user?.name}</span>
                            </div>
                            <div className="flex items-center gap-2">
                              <Clock className="h-4 w-4 text-zinc-400" />
                              <span>{new Date(ticket.createdAt).toLocaleDateString()}</span>
                            </div>
                          </div>
                        </div>

                        <div className="flex items-center gap-2">
                          {ticket.status === 'open' || ticket.status === 'in_progress' ? (
                            <>
                              <Button 
                                size="sm" 
                                variant="outline"
                                className="rounded-xl"
                                onClick={() => {
                                  setSelectedTicket(ticket);
                                  setReplyDialogOpen(true);
                                }}
                              >
                                <Send className="h-4 w-4 mr-2" />
                                Responder
                              </Button>
                              <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                  <Button variant="ghost" size="icon" className="rounded-full">
                                    <MoreVertical className="h-4 w-4" />
                                  </Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent align="end" className="rounded-xl w-48">
                                  <DropdownMenuItem 
                                    className="text-green-600 focus:text-green-700 focus:bg-green-50"
                                    onClick={() => handleMarkResolved(ticket)}
                                  >
                                    <CheckCircle className="h-4 w-4 mr-2" />
                                    Marcar Resuelto
                                  </DropdownMenuItem>
                                  <DropdownMenuItem 
                                    className="text-purple-600 focus:text-purple-700 focus:bg-purple-50"
                                    onClick={() => {
                                      setSelectedTicket(ticket);
                                      setEscalateDialogOpen(true);
                                    }}
                                  >
                                    <ArrowUpCircle className="h-4 w-4 mr-2" />
                                    Escalar a Admin
                                  </DropdownMenuItem>
                                </DropdownMenuContent>
                              </DropdownMenu>
                            </>
                          ) : (
                            <Badge variant="secondary">
                              {ticket.status === 'resolved' ? 'Resuelto' : 'Escalado'}
                            </Badge>
                          )}
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* REPORTS TAB */}
        <TabsContent value="reports" className="space-y-6">
          {/* Reports Stats */}
          <div className="grid gap-4 md:grid-cols-3">
            <Card className="border-none shadow-sm">
              <CardContent className="p-6 flex items-center gap-4">
                <div className="p-3 rounded-xl bg-red-50">
                  <ShieldAlert className="h-6 w-6 text-red-600" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{reportStats.pending}</p>
                  <p className="text-sm text-muted-foreground">Reportes Pendientes</p>
                </div>
              </CardContent>
            </Card>
            <Card className="border-none shadow-sm">
              <CardContent className="p-6 flex items-center gap-4">
                <div className="p-3 rounded-xl bg-amber-50">
                  <AlertCircle className="h-6 w-6 text-amber-600" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{reportStats.scams}</p>
                  <p className="text-sm text-muted-foreground">Posibles Estafas</p>
                </div>
              </CardContent>
            </Card>
            <Card className="border-none shadow-sm">
              <CardContent className="p-6 flex items-center gap-4">
                <div className="p-3 rounded-xl bg-emerald-50">
                  <CheckCircle className="h-6 w-6 text-emerald-600" />
                </div>
                <div>
                  <p className="text-2xl font-bold">Activo</p>
                  <p className="text-sm text-muted-foreground">Monitoreo Continuo</p>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Reports List */}
          <Card className="border-none shadow-lg">
            <CardHeader>
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                  <CardTitle className="flex items-center gap-2">
                    <ShieldAlert className="h-5 w-5 text-red-500" />
                    Reportes de Usuarios
                  </CardTitle>
                  <CardDescription>
                    Revisa las denuncias y toma acciones disciplinarias
                  </CardDescription>
                </div>
                <div className="relative w-full md:w-80">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input 
                    placeholder="Buscar por usuario o motivo..." 
                    className="pl-9 bg-zinc-50 border-none italic" 
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                  />
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {isLoading ? (
                  <div className="flex items-center justify-center py-20">
                    <Loader2 className="h-8 w-8 animate-spin text-primary/40" />
                  </div>
                ) : filteredReports.length === 0 ? (
                  <div className="text-center py-20 bg-zinc-50 rounded-2xl border-2 border-dashed">
                    <ShieldAlert className="h-10 w-10 mx-auto mb-3 text-zinc-300" />
                    <p className="text-zinc-500 font-medium">No hay reportes pendientes</p>
                  </div>
                ) : (
                  filteredReports.map((report) => (
                    <div
                      key={report.id}
                      className="p-5 rounded-2xl border border-red-100 bg-red-50/10 hover:bg-red-50/20 transition-all group"
                    >
                      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                        <div className="flex-1 space-y-2">
                          <div className="flex items-center gap-3">
                            <span className="p-1.5 rounded-lg bg-red-100 text-red-600">
                              <AlertCircle className="h-4 w-4" />
                            </span>
                            <h4 className="font-bold text-lg text-zinc-800">{getReasonLabel(report.reason)}</h4>
                            {getReportStatusBadge(report.status)}
                          </div>
                          <div className="flex items-center gap-6 text-sm">
                            <div>
                              <p className="text-xs font-bold text-zinc-500 uppercase tracking-tighter">Reportado</p>
                              <p className="font-semibold text-red-700">{report.reportedUser?.name}</p>
                            </div>
                            <div className="h-8 w-px bg-zinc-200" />
                            <div>
                              <p className="text-xs font-bold text-zinc-500 uppercase tracking-tighter">Denunciante</p>
                              <p className="font-medium">{report.reporter?.name}</p>
                            </div>
                            <div className="h-8 w-px bg-zinc-200" />
                            <div>
                              <p className="text-xs font-bold text-zinc-500 uppercase tracking-tighter">Fecha</p>
                              <p className="font-medium">{new Date(report.createdAt).toLocaleDateString()}</p>
                            </div>
                          </div>
                        </div>

                        <div className="flex items-center gap-2">
                          <Button 
                            size="sm" 
                            variant="secondary"
                            className="rounded-xl"
                            onClick={() => {
                              setSelectedReport(report);
                              setReportDetailsDialogOpen(true);
                            }}
                          >
                            <Eye className="h-4 w-4 mr-2" />
                            Ver Detalles
                          </Button>
                          
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="icon" className="rounded-full">
                                <MoreVertical className="h-4 w-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end" className="rounded-xl w-48">
                              <DropdownMenuItem 
                                className="text-emerald-600 focus:text-emerald-700 focus:bg-emerald-50"
                                onClick={() => handleUpdateReportStatus(report.id, 'dismissed')}
                              >
                                <CheckCircle className="h-4 w-4 mr-2" />
                                Desestimar
                              </DropdownMenuItem>
                              <DropdownMenuItem 
                                className="text-red-600 focus:text-red-700 focus:bg-red-50 font-bold"
                                onClick={() => handleUpdateReportStatus(report.id, 'resolved')}
                              >
                                <Ban className="h-4 w-4 mr-2" />
                                Sancionar Usuario
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* KNOWLEDGE BASE TAB */}
        <TabsContent value="knowledge" className="space-y-6">
          <div className="grid gap-6 md:grid-cols-3">
            <Card className="border-none shadow-lg hover:shadow-xl transition-shadow">
              <CardHeader>
                <div className="p-3 rounded-xl bg-blue-50 w-fit">
                  <FileText className="h-6 w-6 text-blue-600" />
                </div>
                <CardTitle className="mt-4">Guías de Soporte</CardTitle>
                <CardDescription>
                  Procedimientos y mejores prácticas para atender usuarios
                </CardDescription>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2 text-sm">
                  <li className="flex items-center gap-2">
                    <div className="h-1.5 w-1.5 rounded-full bg-blue-500" />
                    <span>Cómo responder consultas frecuentes</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <div className="h-1.5 w-1.5 rounded-full bg-blue-500" />
                    <span>Protocolo de escalación de tickets</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <div className="h-1.5 w-1.5 rounded-full bg-blue-500" />
                    <span>Resolución de problemas técnicos</span>
                  </li>
                </ul>
              </CardContent>
            </Card>

            <Card className="border-none shadow-lg hover:shadow-xl transition-shadow">
              <CardHeader>
                <div className="p-3 rounded-xl bg-amber-50 w-fit">
                  <BookOpen className="h-6 w-6 text-amber-600" />
                </div>
                <CardTitle className="mt-4">Preguntas Frecuentes</CardTitle>
                <CardDescription>
                  Respuestas rápidas a las consultas más comunes
                </CardDescription>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2 text-sm">
                  <li className="flex items-center gap-2">
                    <div className="h-1.5 w-1.5 rounded-full bg-amber-500" />
                    <span>¿Cómo publicar una propiedad?</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <div className="h-1.5 w-1.5 rounded-full bg-amber-500" />
                    <span>Proceso de verificación KYC</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <div className="h-1.5 w-1.5 rounded-full bg-amber-500" />
                    <span>Problemas con pagos</span>
                  </li>
                </ul>
              </CardContent>
            </Card>

            <Card className="border-none shadow-lg hover:shadow-xl transition-shadow">
              <CardHeader>
                <div className="p-3 rounded-xl bg-green-50 w-fit">
                  <TrendingUp className="h-6 w-6 text-green-600" />
                </div>
                <CardTitle className="mt-4">Plantillas de Respuesta</CardTitle>
                <CardDescription>
                  Respuestas predefinidas para agilizar el soporte
                </CardDescription>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2 text-sm">
                  <li className="flex items-center gap-2">
                    <div className="h-1.5 w-1.5 rounded-full bg-green-500" />
                    <span>Bienvenida a nuevos usuarios</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <div className="h-1.5 w-1.5 rounded-full bg-green-500" />
                    <span>Confirmación de verificación</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <div className="h-1.5 w-1.5 rounded-full bg-green-500" />
                    <span>Rechazo de contenido</span>
                  </li>
                </ul>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>

      {/* Reply Dialog */}
      <Dialog open={replyDialogOpen} onOpenChange={setReplyDialogOpen}>
        <DialogContent className="max-w-2xl rounded-3xl">
          <DialogHeader>
            <DialogTitle className="text-2xl font-bold flex items-center gap-2">
              <Send className="h-6 w-6 text-blue-500" />
              Responder Ticket
            </DialogTitle>
            <DialogDescription>
              Envía una respuesta al usuario para resolver su consulta
            </DialogDescription>
          </DialogHeader>
          
          {selectedTicket && (
            <div className="space-y-4 my-4">
              <div className="bg-zinc-50 p-4 rounded-2xl border">
                <p className="text-xs font-bold text-zinc-500 uppercase tracking-widest mb-2">Ticket Original</p>
                <h4 className="font-bold text-lg mb-2">{selectedTicket.subject}</h4>
                <p className="text-sm text-zinc-600 italic">"{selectedTicket.message}"</p>
                <div className="flex items-center gap-4 mt-3 pt-3 border-t">
                  <div className="flex items-center gap-2">
                    <User className="h-4 w-4 text-zinc-400" />
                    <span className="text-sm font-medium">{selectedTicket.user?.name}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Clock className="h-4 w-4 text-zinc-400" />
                    <span className="text-sm">{new Date(selectedTicket.createdAt).toLocaleDateString()}</span>
                  </div>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="reply">Tu Respuesta</Label>
                <Textarea
                  id="reply"
                  placeholder="Escribe tu respuesta aquí..."
                  value={replyMessage}
                  onChange={(e) => setReplyMessage(e.target.value)}
                  rows={6}
                  className="resize-none"
                />
              </div>
            </div>
          )}

          <DialogFooter>
            <Button variant="outline" onClick={() => setReplyDialogOpen(false)}>
              Cancelar
            </Button>
            <Button 
              onClick={handleReply}
              disabled={!replyMessage.trim()}
              className="bg-blue-600 hover:bg-blue-700"
            >
              <Send className="h-4 w-4 mr-2" />
              Enviar Respuesta
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Escalate Dialog */}
      <Dialog open={escalateDialogOpen} onOpenChange={setEscalateDialogOpen}>
        <DialogContent className="max-w-2xl rounded-3xl">
          <DialogHeader>
            <DialogTitle className="text-2xl font-bold flex items-center gap-2">
              <ArrowUpCircle className="h-6 w-6 text-purple-500" />
              Escalar Ticket a Administradores
            </DialogTitle>
            <DialogDescription>
              Este ticket requiere atención de nivel superior
            </DialogDescription>
          </DialogHeader>
          
          {selectedTicket && (
            <div className="space-y-4 my-4">
              <div className="bg-purple-50 p-4 rounded-2xl border border-purple-200">
                <p className="text-xs font-bold text-purple-700 uppercase tracking-widest mb-2">Ticket a Escalar</p>
                <h4 className="font-bold text-lg mb-2">{selectedTicket.subject}</h4>
                <p className="text-sm text-zinc-600">"{selectedTicket.message}"</p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="escalate-reason">Motivo de Escalación</Label>
                <Textarea
                  id="escalate-reason"
                  placeholder="Explica por qué este ticket necesita atención administrativa..."
                  value={escalateReason}
                  onChange={(e) => setEscalateReason(e.target.value)}
                  rows={4}
                  className="resize-none"
                />
              </div>

              <div className="flex items-center gap-3 p-4 bg-amber-50 rounded-2xl border border-amber-200">
                <AlertCircle className="h-6 w-6 text-amber-500 shrink-0" />
                <p className="text-xs text-amber-800 font-medium">
                  Al escalar, el ticket será transferido al equipo administrativo y no podrás modificarlo.
                </p>
              </div>
            </div>
          )}

          <DialogFooter>
            <Button variant="outline" onClick={() => setEscalateDialogOpen(false)}>
              Cancelar
            </Button>
            <Button 
              onClick={handleEscalate}
              disabled={!escalateReason.trim()}
              className="bg-purple-600 hover:bg-purple-700"
            >
              <ArrowUpCircle className="h-4 w-4 mr-2" />
              Escalar a Admin
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Report Details Dialog */}
      <Dialog open={reportDetailsDialogOpen} onOpenChange={setReportDetailsDialogOpen}>
        <DialogContent className="max-w-xl rounded-3xl">
          <DialogHeader>
            <DialogTitle className="text-2xl font-bold flex items-center gap-2">
              <ShieldAlert className="h-6 w-6 text-red-500" />
              Detalles de la Denuncia
            </DialogTitle>
            <DialogDescription>
              Analiza la descripción del reporte antes de tomar una decisión
            </DialogDescription>
          </DialogHeader>
          
          {selectedReport && (
            <div className="space-y-6 my-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-zinc-50 p-4 rounded-2xl border">
                  <p className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest mb-1">Usuario Denunciado</p>
                  <div className="flex items-center gap-3">
                    <div className="h-10 w-10 rounded-full bg-red-100 flex items-center justify-center">
                      <User className="h-5 w-5 text-red-600" />
                    </div>
                    <div className="flex-1">
                      <p className="font-bold text-sm">{selectedReport.reportedUser?.name}</p>
                      <p className="text-xs text-zinc-500">{selectedReport.reportedUser?.email}</p>
                    </div>
                  </div>
                </div>
                <div className="bg-zinc-50 p-4 rounded-2xl border">
                  <p className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest mb-1">Denunciante</p>
                  <div className="flex items-center gap-3">
                    <div className="h-10 w-10 rounded-full bg-zinc-200 flex items-center justify-center">
                      <User className="h-5 w-5 text-zinc-600" />
                    </div>
                    <div className="flex-1">
                      <p className="font-bold text-sm">{selectedReport.reporter?.name}</p>
                      <p className="text-xs text-zinc-500">{selectedReport.reporter?.email}</p>
                    </div>
                  </div>
                </div>
              </div>

              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <p className="text-xs font-bold text-zinc-500 uppercase tracking-widest">Información del Reporte</p>
                  <Badge variant="destructive">{getReasonLabel(selectedReport.reason)}</Badge>
                </div>
                <div className="bg-zinc-50 p-5 rounded-2xl border border-dashed border-zinc-300">
                  <p className="text-zinc-700 italic leading-relaxed">
                    "{selectedReport.description}"
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-4 p-4 bg-amber-50 rounded-2xl border border-amber-200">
                <AlertCircle className="h-8 w-8 text-amber-500 shrink-0" />
                <p className="text-xs text-amber-800 font-medium leading-normal">
                  Recuerda: Si decides sancionar al usuario, su acceso puede ser limitado y sus publicaciones revisadas.
                </p>
              </div>
            </div>
          )}

          <DialogFooter className="gap-2 sm:justify-between">
            <Button 
              variant="ghost" 
              className="rounded-xl border border-zinc-200" 
              onClick={() => selectedReport && handleUpdateReportStatus(selectedReport.id, 'dismissed')}
            >
              <XCircle className="h-4 w-4 mr-2" />
              Desestimar
            </Button>
            <div className="flex gap-2">
              <Button variant="outline" className="rounded-xl" onClick={() => setReportDetailsDialogOpen(false)}>
                Cerrar
              </Button>
              <Button 
                variant="destructive"
                className="rounded-xl px-8 shadow-sm flex items-center gap-2"
                onClick={() => selectedReport && handleUpdateReportStatus(selectedReport.id, 'resolved')}
              >
                <Ban className="h-4 w-4" />
                Sancionar Usuario
              </Button>
            </div>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default SupportSection;
