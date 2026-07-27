import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  ShieldAlert, 
  Search, 
  Clock, 
  CheckCircle, 
  User as UserIcon,
  AlertTriangle,
  Loader2,
  Ban,
  XCircle,
  Eye,
  MoreVertical,
  Mail,
  Phone,
  Calendar,
  FileText,
  Shield,
  Home,
  CreditCard
} from "lucide-react";
import { useState, useEffect } from "react";
import { toast } from "sonner";
import { api, UserReport, ModerationStats } from "@/services/api";
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
import { exportToPDF } from "@/lib/pdf-export";

const UserReportsSection = () => {
  const [reports, setReports] = useState<UserReport[]>([]);
  const [stats, setStats] = useState<ModerationStats | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedReport, setSelectedReport] = useState<UserReport | null>(null);
  const [detailsDialogOpen, setDetailsDialogOpen] = useState(false);
  const [userDetailsDialogOpen, setUserDetailsDialogOpen] = useState(false);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
const [selectedUser, setSelectedUser] = useState<any>(null);
  const [loadingUserDetails, setLoadingUserDetails] = useState(false);

  const fetchReports = async () => {
    setIsLoading(true);
    try {
      const [reportsRes, statsRes] = await Promise.all([
        api.getReports({ status: 'pending' }),
        api.getModerationStats()
      ]);

      if (reportsRes.success && reportsRes.data) {
        setReports(reportsRes.data);
      }
      if (statsRes.success && statsRes.data) {
        setStats(statsRes.data);
      }
    } catch (_error) {
      toast.error("Error al cargar los reportes");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchReports();
  }, []);

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "pending":
        return <Badge variant="outline" className="bg-amber-50 text-amber-700">Pendiente</Badge>;
      case "dismissed":
        return <Badge variant="outline" className="bg-zinc-100 text-zinc-600">Desestimado</Badge>;
      case "resolved":
        return <Badge variant="outline" className="bg-emerald-50 text-emerald-700">Resuelto</Badge>;
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

  const handleUpdateStatus = async (id: number, status: 'dismissed' | 'resolved' | 'investigating') => {
    try {
      const response = await api.updateReportStatus(id, status);
      if (response.success) {
        toast.success(status === 'resolved' ? "Reporte resuelto" : "Reporte desestimado");
        setDetailsDialogOpen(false);
        fetchReports();
      }
    } catch (_error) {
      toast.error("Error al actualizar el reporte");
    }
  };

  const handleViewUserDetails = async (userId: number) => {
    setLoadingUserDetails(true);
    setUserDetailsDialogOpen(true);
    
    try {
      const response = await api.getUserById(userId);
      if (response.success && response.data) {
        setSelectedUser(response.data.user);
      }
    } catch (_error) {
      toast.error("Error al cargar los detalles del usuario");
    } finally {
      setLoadingUserDetails(false);
    }
  };

  const filteredReports = reports.filter(r => 
    r.reason.toLowerCase().includes(searchQuery.toLowerCase()) ||
    r.reportedUser?.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    r.reporter?.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleExport = () => {
    if (filteredReports.length === 0) return;
    
    exportToPDF({
      title: "Reporte de Denuncias de Usuarios",
      subtitle: "Listado de reportes por comportamiento inapropiado o fraudulento",
      operatorName: "Operador de Seguridad",
      stats: {
        total: filteredReports.length,
        approved: 0, // No aplica
        rejected: filteredReports.filter(r => r.status === 'dismissed').length
      },
      headers: ['ID', 'Reportado', 'Denunciante', 'Motivo', 'Estado', 'Fecha'],
      rows: filteredReports.map(r => [
        `#${r.id}`,
        r.reportedUser?.name || 'N/A',
        r.reporter?.name || 'N/A',
        getReasonLabel(r.reason),
        r.status === 'pending' ? 'Pendiente' : r.status === 'dismissed' ? 'Desestimado' : r.status === 'investigating' ? 'En Investigación' : 'Resuelto',
        new Date(r.createdAt).toLocaleDateString()
      ]),
      fileName: 'reporte_denuncias'
    });
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold">Reportes de Usuarios</h1>
          <p className="text-muted-foreground mt-1">
            Gestiona las denuncias por comportamiento inadecuado
          </p>
        </div>
        <Button 
          className="flex items-center gap-2 bg-red-600 hover:bg-red-700 text-white border-none shadow-sm"
          onClick={handleExport}
          disabled={isLoading || filteredReports.length === 0}
        >
          <div className="bg-white/20 p-1 rounded text-white mr-1">
            <span className="text-[10px] font-bold leading-none">PDF</span>
          </div>
          <span className="hidden sm:inline font-semibold">Exportar Reporte</span>
        </Button>
      </div>

      {/* Stats */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card className="border-none shadow-sm">
          <CardContent className="p-6 flex items-center gap-4">
            <div className="p-3 rounded-xl bg-red-50">
              <ShieldAlert className="h-6 w-6 text-red-600" />
            </div>
            <div>
              <p className="text-2xl font-bold">{stats?.pending.reports || 0}</p>
              <p className="text-sm text-muted-foreground">Reportes Pendientes</p>
            </div>
          </CardContent>
        </Card>
        <Card className="border-none shadow-sm">
          <CardContent className="p-6 flex items-center gap-4">
            <div className="p-3 rounded-xl bg-amber-50">
              <AlertTriangle className="h-6 w-6 text-amber-600" />
            </div>
            <div>
              <p className="text-2xl font-bold">{reports.filter(r => r.reason === 'scam').length}</p>
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
              <p className="text-2xl font-bold">Resuelto</p>
              <p className="text-sm text-muted-foreground">Monitoreo Activo</p>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card className="border-none shadow-lg">
        <CardHeader>
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <CardTitle className="flex items-center gap-2">
                <ShieldAlert className="h-5 w-5 text-red-500" />
                Alertas Activas
              </CardTitle>
              <CardDescription>
                Revisa las evidencias antes de tomar acciones disciplinarias
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
                          <AlertTriangle className="h-4 w-4" />
                        </span>
                        <h4 className="font-bold text-lg text-zinc-800">{getReasonLabel(report.reason)}</h4>
                        {getStatusBadge(report.status)}
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
                          setDetailsDialogOpen(true);
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
                            onClick={() => handleUpdateStatus(report.id, 'dismissed')}
                          >
                            <CheckCircle className="h-4 w-4 mr-2" />
                            Desestimar
                          </DropdownMenuItem>
                          <DropdownMenuItem 
                            className="text-amber-600 focus:text-amber-700 focus:bg-amber-50"
                            onClick={() => handleUpdateStatus(report.id, 'investigating')}
                          >
                            <AlertTriangle className="h-4 w-4 mr-2" />
                            Advertir Usuario
                          </DropdownMenuItem>
                          <DropdownMenuItem 
                            className="text-red-600 focus:text-red-700 focus:bg-red-50 font-bold"
                            onClick={() => handleUpdateStatus(report.id, 'resolved')}
                          >
                            <Ban className="h-4 w-4 mr-2" />
                            Banear Usuario
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

      {/* Details Dialog */}
      <Dialog open={detailsDialogOpen} onOpenChange={setDetailsDialogOpen}>
        <DialogContent className="max-w-xl rounded-3xl">
          <DialogHeader>
            <DialogTitle className="text-2xl font-bold flex items-center gap-2">
              <ShieldAlert className="h-6 w-6 text-red-500" />
              Detalles de la Denuncia
            </DialogTitle>
            <DialogDescription>
              Analiza la descripción del reporte antes de tomar una decisión.
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-6 my-4">
             <div className="grid grid-cols-2 gap-4">
               <div className="bg-zinc-50 p-4 rounded-2xl border">
                 <p className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest mb-1">Usuario Denunciado</p>
                 <div className="flex items-center gap-3">
                    <div className="h-10 w-10 rounded-full bg-red-100 flex items-center justify-center">
                      <UserIcon className="h-5 w-5 text-red-600" />
                    </div>
                    <div className="flex-1">
                      <p className="font-bold text-sm">{selectedReport?.reportedUser?.name}</p>
                      <p className="text-xs text-zinc-500">{selectedReport?.reportedUser?.email}</p>
                    </div>
                 </div>
                 <Button 
                   size="sm" 
                   variant="outline" 
                   className="w-full mt-3"
                   onClick={() => selectedReport?.reportedUserId && handleViewUserDetails(selectedReport.reportedUserId)}
                 >
                   <Eye className="h-3 w-3 mr-2" />
                   Ver Perfil Completo
                 </Button>
               </div>
               <div className="bg-zinc-50 p-4 rounded-2xl border">
                 <p className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest mb-1">Denunciante</p>
                 <div className="flex items-center gap-3">
                    <div className="h-10 w-10 rounded-full bg-zinc-200 flex items-center justify-center">
                      <UserIcon className="h-5 w-5 text-zinc-600" />
                    </div>
                    <div className="flex-1">
                      <p className="font-bold text-sm">{selectedReport?.reporter?.name}</p>
                      <p className="text-xs text-zinc-500">{selectedReport?.reporter?.email}</p>
                    </div>
                 </div>
                 <Button 
                   size="sm" 
                   variant="outline" 
                   className="w-full mt-3"
                   onClick={() => selectedReport?.reporterId && handleViewUserDetails(selectedReport.reporterId)}
                 >
                   <Eye className="h-3 w-3 mr-2" />
                   Ver Perfil Completo
                 </Button>
               </div>
             </div>

             <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <p className="text-xs font-bold text-zinc-500 uppercase tracking-widest">Información del Reporte</p>
                  <Badge variant="destructive">{selectedReport ? getReasonLabel(selectedReport.reason) : ''}</Badge>
                </div>
                <div className="bg-zinc-50 p-5 rounded-2xl border border-dashed border-zinc-300">
                  <p className="text-zinc-700 italic leading-relaxed">
                    "{selectedReport?.description}"
                  </p>
                </div>
             </div>

             <div className="flex items-center gap-4 p-4 bg-amber-50 rounded-2xl border border-amber-200">
                <AlertTriangle className="h-8 w-8 text-amber-500 shrink-0" />
                <p className="text-xs text-amber-800 font-medium leading-normal">
                  Recuerda: Si decides banear al usuario, su acceso al sistema será revocado permanentemente y sus publicaciones serán ocultadas.
                </p>
             </div>
          </div>

          <DialogFooter className="gap-2 sm:justify-between">
            <Button variant="ghost" className="rounded-xl border border-zinc-200" onClick={() => handleUpdateStatus(selectedReport!.id, 'dismissed')}>
              <XCircle className="h-4 w-4 mr-2" />
              Desestimar
            </Button>
            <div className="flex gap-2">
              <Button variant="outline" className="rounded-xl" onClick={() => setDetailsDialogOpen(false)}>
                Cerrar
              </Button>
              <Button 
                variant="destructive"
                className="rounded-xl px-8 shadow-sm flex items-center gap-2"
                onClick={() => handleUpdateStatus(selectedReport!.id, 'resolved')}
              >
                <Ban className="h-4 w-4" />
                Sancionar Usuario
              </Button>
            </div>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* User Details Dialog */}
      <Dialog open={userDetailsDialogOpen} onOpenChange={setUserDetailsDialogOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto p-0">
          <div className="sticky top-0 z-10 bg-background border-b p-6">
            <DialogHeader>
              <DialogTitle className="text-2xl font-bold flex items-center gap-2">
                <UserIcon className="h-6 w-6" />
                Información Completa del Usuario
              </DialogTitle>
              <DialogDescription>
                Datos personales, verificación KYC y documentación
              </DialogDescription>
            </DialogHeader>
          </div>

          {loadingUserDetails ? (
            <div className="flex justify-center py-20">
              <Loader2 className="h-10 w-10 animate-spin text-primary" />
            </div>
          ) : selectedUser ? (
            <div className="p-6 space-y-6">
              <Tabs defaultValue="personal" className="w-full">
                <TabsList className="grid w-full grid-cols-3">
                  <TabsTrigger value="personal">Datos Personales</TabsTrigger>
                  <TabsTrigger value="kyc">Verificación KYC</TabsTrigger>
                  <TabsTrigger value="activity">Actividad</TabsTrigger>
                </TabsList>

                <TabsContent value="personal" className="space-y-6 mt-6">
                  {/* Información Básica */}
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-lg">Información Básica</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="flex items-center gap-4">
                        <div className="w-20 h-20 rounded-full bg-primary flex items-center justify-center text-primary-foreground text-2xl font-bold">
                          {selectedUser.name?.charAt(0) || "U"}
                        </div>
                        <div className="flex-1">
                          <h3 className="text-xl font-bold">{selectedUser.name}</h3>
                          <div className="flex items-center gap-2 mt-1">
                            <Badge variant={selectedUser.role === 'admin' ? 'default' : 'secondary'}>
                              {selectedUser.role}
                            </Badge>
                            <Badge variant={
                              selectedUser.accountStatus === 'active' ? 'default' :
                              selectedUser.accountStatus === 'pending' ? 'secondary' :
                              selectedUser.accountStatus === 'suspended' ? 'destructive' : 'outline'
                            }>
                              {selectedUser.accountStatus}
                            </Badge>
                          </div>
                        </div>
                      </div>

                      <div className="grid md:grid-cols-2 gap-4 pt-4 border-t">
                        <div className="flex items-center gap-3">
                          <Mail className="h-5 w-5 text-muted-foreground" />
                          <div>
                            <p className="text-xs text-muted-foreground">Email</p>
                            <p className="font-medium">{selectedUser.email}</p>
                          </div>
                        </div>
                        {selectedUser.phone && (
                          <div className="flex items-center gap-3">
                            <Phone className="h-5 w-5 text-muted-foreground" />
                            <div>
                              <p className="text-xs text-muted-foreground">Teléfono</p>
                              <p className="font-medium">
                                {selectedUser.phonePrefix} {selectedUser.phone}
                              </p>
                            </div>
                          </div>
                        )}
                        <div className="flex items-center gap-3">
                          <Calendar className="h-5 w-5 text-muted-foreground" />
                          <div>
                            <p className="text-xs text-muted-foreground">Registro</p>
                            <p className="font-medium">
                              {new Date(selectedUser.createdAt).toLocaleDateString("es-CO")}
                            </p>
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>

                  {/* Estado de Cuenta */}
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-lg flex items-center gap-2">
                        <Shield className="h-5 w-5" />
                        Estado de la Cuenta
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-3">
                      <div className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                        <span className="text-sm">Estado de Verificación</span>
                        <Badge variant={selectedUser.isVerified ? 'default' : 'secondary'}>
                          {selectedUser.isVerified ? 'Verificado' : 'No Verificado'}
                        </Badge>
                      </div>
                      {selectedUser.verifiedById && (
                        <div className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                          <span className="text-sm">Verificado por</span>
                          <span className="font-medium">Admin #{selectedUser.verifiedById}</span>
                        </div>
                      )}
                      <div className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                        <span className="text-sm">Última Actividad</span>
                        <span className="font-medium">
                          {new Date(selectedUser.updatedAt).toLocaleDateString("es-CO")}
                        </span>
                      </div>
                    </CardContent>
                  </Card>
                </TabsContent>

                <TabsContent value="kyc" className="space-y-6 mt-6">
                  {/* Documentos KYC */}
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-lg flex items-center gap-2">
                        <FileText className="h-5 w-5" />
                        Documentos de Identidad
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      {selectedUser.idDocumentUrl ? (
                        <div className="space-y-3">
                          <div className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                            <div className="flex items-center gap-3">
                              <CreditCard className="h-5 w-5 text-primary" />
                              <div>
                                <p className="font-medium">Documento de Identidad</p>
                                <p className="text-xs text-muted-foreground">Cédula o Pasaporte</p>
                              </div>
                            </div>
                            <Button 
                              size="sm" 
                              variant="outline"
                              onClick={() => window.open(selectedUser.idDocumentUrl, '_blank')}
                            >
                              <Eye className="h-4 w-4 mr-2" />
                              Ver Documento
                            </Button>
                          </div>
                          <div className="relative rounded-lg overflow-hidden border">
                            <img 
                              src={selectedUser.idDocumentUrl} 
                              alt="Documento de Identidad" 
                              className="w-full h-auto max-h-[400px] object-contain bg-muted"
                            />
                          </div>
                        </div>
                      ) : (
                        <div className="text-center py-12 bg-muted/30 rounded-lg">
                          <FileText className="h-12 w-12 mx-auto text-muted-foreground mb-3" />
                          <p className="text-muted-foreground">No hay documentos cargados</p>
                        </div>
                      )}

                      {selectedUser.proofOfAddressUrl && (
                        <div className="space-y-3 pt-4 border-t">
                          <div className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                            <div className="flex items-center gap-3">
                              <Home className="h-5 w-5 text-primary" />
                              <div>
                                <p className="font-medium">Comprobante de Domicilio</p>
                                <p className="text-xs text-muted-foreground">Recibo de servicios</p>
                              </div>
                            </div>
                            <Button 
                              size="sm" 
                              variant="outline"
                              onClick={() => window.open(selectedUser.proofOfAddressUrl, '_blank')}
                            >
                              <Eye className="h-4 w-4 mr-2" />
                              Ver Documento
                            </Button>
                          </div>
                          <div className="relative rounded-lg overflow-hidden border">
                            <img 
                              src={selectedUser.proofOfAddressUrl} 
                              alt="Comprobante de Domicilio" 
                              className="w-full h-auto max-h-[400px] object-contain bg-muted"
                            />
                          </div>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                </TabsContent>

                <TabsContent value="activity" className="space-y-6 mt-6">
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-lg">Historial de Actividad</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-3">
                        <div className="flex items-center gap-3 p-3 bg-muted/50 rounded-lg">
                          <Calendar className="h-5 w-5 text-primary" />
                          <div className="flex-1">
                            <p className="font-medium">Cuenta Creada</p>
                            <p className="text-sm text-muted-foreground">
                              {new Date(selectedUser.createdAt).toLocaleString("es-CO")}
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center gap-3 p-3 bg-muted/50 rounded-lg">
                          <Clock className="h-5 w-5 text-primary" />
                          <div className="flex-1">
                            <p className="font-medium">Última Actualización</p>
                            <p className="text-sm text-muted-foreground">
                              {new Date(selectedUser.updatedAt).toLocaleString("es-CO")}
                            </p>
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </TabsContent>
              </Tabs>
            </div>
          ) : (
            <div className="text-center py-20">
              <p className="text-muted-foreground">No se pudo cargar la información del usuario</p>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default UserReportsSection;
