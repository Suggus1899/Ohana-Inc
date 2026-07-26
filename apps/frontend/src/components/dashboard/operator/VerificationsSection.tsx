import { useState, useEffect, useCallback, useRef, useMemo } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  Dialog, DialogContent, DialogDescription,
  DialogFooter, DialogHeader, DialogTitle,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Users, Search, CheckCircle, ShieldCheck, Loader2, Info, Ban, Unlock,
  AlertTriangle, Eye, MoreVertical, UserCog, Clock, Mail, FileText, XCircle,
} from "lucide-react";
import { api, User as ApiUser, ApiResponse, Property } from "@/services/api";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";
import { useQuery, useQueryClient } from '@tanstack/react-query';

interface KYCVerification {
  id: number;
  userId: number;
  userName: string;
  userEmail: string;
  fullName: string;
  documentNumber: string;
  documentType: string;
  status: string;
  verificationLevel: number;
  faceMatchScore: number;
  livenessScore: number;
  documentValidityScore: number;
  fraudScore: number;
  submittedAt: string;
  createdAt: string;
}

interface KYCDocument {
  id: number;
  verificationId: number;
  documentType: string;
  url: string;
  uploadedAt: string;
}

const VerificationsSection = () => {
  const [search, setSearch] = useState("");
  const [rejectModal, setRejectModal] = useState<{ open: boolean; kyc: KYCVerification | null }>({ open: false, kyc: null });
  const [rejectReason, setRejectReason] = useState("");
  const [docModal, setDocModal] = useState<{ open: boolean; kyc: KYCVerification | null; documents: KYCDocument[]; loading: boolean }>({ open: false, kyc: null, documents: [], loading: false });
  const [searchTerm, setSearchTerm] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [users, setUsers] = useState<ApiUser[]>([]);
  const [activeTab, setActiveTab] = useState("all");
  const [roleFilter, setRoleFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");
  const [selectedUser, setSelectedUser] = useState<ApiUser | null>(null);
  const [actionDialogOpen, setActionDialogOpen] = useState(false);
  const [actionType, setActionType] = useState<'suspend' | 'activate' | 'block' | 'unblock' | 'changeRole' | null>(null);
  const [newRole, setNewRole] = useState("");
  const [actionReason, setActionReason] = useState("");
  const [actionSuspendedUntil, setActionSuspendedUntil] = useState("");
  const [isProcessingAction, setIsProcessingAction] = useState(false);
  const [detailsDialogOpen, setDetailsDialogOpen] = useState(false);
  const [detailsUser, setDetailsUser] = useState<ApiUser | null>(null);
  const [detailsProperties, setDetailsProperties] = useState<Property[]>([]);
  const [loadingDetails, setLoadingDetails] = useState(false);
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const refreshRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const { data: pendingData, isLoading: isLoadingPending } = useQuery({
    queryKey: ['kyc-pending-operator'],
    queryFn: async () => {
      const response = await api.getPendingKYCVerifications({ limit: 100 });
      return response.data?.verifications as KYCVerification[] || [];
    },
    refetchInterval: 15000,
  });

  const verifications = pendingData || [];

  const pendingCount = verifications.filter(v => v.status === 'pending_review' || v.status === 'documents_uploaded' || v.status === 'under_review').length;
  const approvedCount = verifications.filter(v => v.status === 'approved').length;
  const rejectedCount = verifications.filter(v => v.status === 'rejected' || v.status === 'resubmission_required').length;

  const filtered = verifications.filter(k =>
    !search ||
    (k.fullName && k.fullName.toLowerCase().includes(search.toLowerCase())) ||
    (k.userName && k.userName.toLowerCase().includes(search.toLowerCase())) ||
    (k.userEmail && k.userEmail.toLowerCase().includes(search.toLowerCase())) ||
    (k.documentNumber && k.documentNumber.includes(search))
  );

  const fetchUsers = useCallback(async () => {
    setIsLoading(true);
    try {
      const res = await api.getUsers({ limit: 200 });
      if (res.success && res.data) {
        setUsers((res.data as any).users ?? []);
      }
    } catch {
      toast({ title: "Error", description: "No se pudieron cargar los usuarios", variant: "destructive" });
    } finally {
      setIsLoading(false);
    }
  }, [toast]);

  useEffect(() => {
    fetchUsers();
    refreshRef.current = setInterval(fetchUsers, 30000);
    return () => { if (refreshRef.current) clearInterval(refreshRef.current); };
  }, [fetchUsers]);

  const kycStatusByUserId = useMemo(() => {
    const map: Record<number, string> = {};
    for (const v of verifications) {
      map[v.userId] = v.status;
    }
    return map;
  }, [verifications]);

  const getKycLabel = (status?: string) => {
    switch (status) {
      case 'approved': return 'Verificado';
      case 'pending_review': return 'Pendiente Revisión';
      case 'rejected': return 'Rechazado';
      case 'documents_uploaded': return 'Documentos Subidos';
      case 'under_review': return 'En Revisión';
      case 'resubmission_required': return 'Re-subir';
      default: return 'Sin verificar';
    }
  };

  const filteredUsers = users.filter(u => {
    const q = searchTerm.toLowerCase();
    const kycStatus = kycStatusByUserId[u.id];
    const matchesSearch = !searchTerm ||
      u.name.toLowerCase().includes(q) ||
      u.email.toLowerCase().includes(q);
    const matchesRole = roleFilter === 'all' || u.role === roleFilter;
    const matchesStatus = statusFilter === 'all' || kycStatus === statusFilter;
    const matchesTab = activeTab === 'all' ? true :
      activeTab === 'pending' ? (kycStatus === 'documents_uploaded' || kycStatus === 'pending_review' || kycStatus === 'under_review') :
      activeTab === 'verified' ? kycStatus === 'approved' :
      activeTab === 'rejected' ? (kycStatus === 'rejected' || kycStatus === 'resubmission_required') : true;
    return matchesSearch && matchesRole && matchesStatus && matchesTab;
  });

  const stats = {
    total: users.length,
    pending: users.filter(u => { const s = kycStatusByUserId[u.id]; return s === 'documents_uploaded' || s === 'pending_review' || s === 'under_review'; }).length,
    verified: users.filter(u => kycStatusByUserId[u.id] === 'approved').length,
    rejected: users.filter(u => { const s = kycStatusByUserId[u.id]; return s === 'rejected' || s === 'resubmission_required'; }).length,
  };

  const handleVerifyUser = async (user: ApiUser) => {
    setIsProcessingAction(true);
    try {
      const res = await api.verifyUser(user.id, true);
      if (res.success) {
        toast({ title: "Cuenta verificada", description: `${user.name} ha sido verificado` });
        fetchUsers();
      } else {
        toast({ title: "Error", description: (res as any)?.error?.message || "No se pudo verificar", variant: "destructive" });
      }
    } catch (error: any) {
      toast({ title: "Error", description: error?.message || "Error de servidor", variant: "destructive" });
    } finally {
      setIsProcessingAction(false);
    }
  };

  const openDetailsDialog = async (user: ApiUser) => {
    setDetailsUser(user);
    setDetailsDialogOpen(true);
    setLoadingDetails(true);
    try {
      const res = await api.getProperties({ authorId: user.id, limit: 10 });
      if (res.success && res.data) setDetailsProperties(res.data.properties);
    } catch { /* silent */ } finally {
      setLoadingDetails(false);
    }
  };

  const handleAction = async () => {
    if (!selectedUser || !actionType) return;
    setIsProcessingAction(true);
    try {
      let response: ApiResponse<{ user: ApiUser }> | undefined;
      switch (actionType) {
        case 'suspend':
          response = await api.suspendUser(selectedUser.id, actionReason, actionSuspendedUntil || undefined);
          break;
        case 'activate':
          if (selectedUser.accountStatus === 'suspended') {
            response = await api.reactivateUser(selectedUser.id, actionReason);
          } else {
            response = await api.approveUser(selectedUser.id, actionReason);
          }
          break;
        case 'block':
          response = await api.rejectUser(selectedUser.id, actionReason);
          break;
        case 'unblock':
          response = await api.reactivateUser(selectedUser.id, actionReason);
          break;
        case 'changeRole':
          if (!newRole) return;
          response = await api.updateUserRole(selectedUser.id, newRole);
          break;
      }
      if (response?.success) {
        toast({ title: "Acción completada", description: getSuccessMessage(actionType) });
        setActionDialogOpen(false);
        setSelectedUser(null);
        setActionType(null);
        setNewRole("");
        setActionReason("");
        setActionSuspendedUntil("");
        fetchUsers();
      } else {
        const msg = (response as any)?.error?.message || 'No se pudo completar la acción';
        toast({ title: "Error", description: msg, variant: "destructive" });
      }
    } catch (error: any) {
      toast({ title: "Error", description: error?.message || "Error de servidor", variant: "destructive" });
    } finally {
      setIsProcessingAction(false);
    }
  };

  const getSuccessMessage = (action: string) => {
    switch (action) {
      case 'suspend': return 'Usuario suspendido temporalmente';
      case 'activate': return 'Cuenta activada exitosamente';
      case 'block': return 'Usuario bloqueado permanentemente';
      case 'unblock': return 'Usuario desbloqueado';
      default: return 'Acción completada';
    }
  };

  const openActionDialog = (user: ApiUser, action: typeof actionType) => {
    setSelectedUser(user);
    setActionType(action);
    setActionReason("");
    setActionSuspendedUntil("");
    setActionDialogOpen(true);
  };

  const getRoleBadge = (role: string) => {
    const colors: Record<string, string> = {
      admin: 'bg-red-100 text-red-700',
      operator: 'bg-blue-100 text-blue-700',
      propietario: 'bg-green-100 text-green-700',
      cliente: 'bg-purple-100 text-purple-700',
      estudiante: 'bg-orange-100 text-orange-700',
    };
    return <Badge className={colors[role] || 'bg-gray-100 text-gray-700'}>{role}</Badge>;
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'pending_review': return <Badge className="bg-yellow-100 text-yellow-700 hover:bg-yellow-100">Pendiente Revisión</Badge>;
      case 'approved': return <Badge className="bg-green-100 text-green-700 hover:bg-green-100">Aprobado</Badge>;
      case 'rejected': return <Badge className="bg-red-100 text-red-700 hover:bg-red-100">Rechazado</Badge>;
      case 'documents_uploaded': return <Badge className="bg-blue-100 text-blue-700 hover:bg-blue-100">Documentos Subidos</Badge>;
      case 'under_review': return <Badge className="bg-purple-100 text-purple-700 hover:bg-purple-100">En Revisión</Badge>;
      case 'resubmission_required': return <Badge className="bg-orange-100 text-orange-700 hover:bg-orange-100">Re-subir</Badge>;
      default: return <Badge variant="outline">{status}</Badge>;
    }
  };

  const getKycBadge = (status?: string) => {
    switch (status) {
      case 'approved': return <Badge className="bg-green-100 text-green-700 hover:bg-green-100"><ShieldCheck className="h-3 w-3 mr-1" />Verificado</Badge>;
      case 'pending_review':
      case 'documents_uploaded':
      case 'under_review': return <Badge className="bg-yellow-100 text-yellow-700 hover:bg-yellow-100">En verificación</Badge>;
      case 'rejected': return <Badge className="bg-red-100 text-red-700 hover:bg-red-100">Rechazado</Badge>;
      case 'resubmission_required': return <Badge className="bg-orange-100 text-orange-700 hover:bg-orange-100">Re-subir</Badge>;
      default: return <Badge variant="outline" className="text-muted-foreground">Sin verificar</Badge>;
    }
  };

  const handleApprove = useCallback(async (kyc: KYCVerification) => {
    try {
      const response = await api.approveKYCVerification(kyc.id);
      if (response.success) {
        toast({ title: 'Aprobado', description: `Verificación de ${kyc.userName} aprobada` });
        queryClient.invalidateQueries({ queryKey: ['kyc-pending-operator'] });
        fetchUsers();
      }
    } catch {
      toast({ title: 'Error', description: 'No se pudo aprobar', variant: 'destructive' });
    }
  }, [queryClient, toast, fetchUsers]);

  const handleRejectConfirm = useCallback(async () => {
    if (!rejectModal.kyc || !rejectReason.trim()) return;
    try {
      const response = await api.rejectKYCVerification(rejectModal.kyc.id, rejectReason);
      if (response.success) {
        toast({ title: 'Rechazado', description: `Verificación de ${rejectModal.kyc.userName} rechazada` });
        setRejectModal({ open: false, kyc: null });
        setRejectReason("");
        queryClient.invalidateQueries({ queryKey: ['kyc-pending-operator'] });
      }
    } catch {
      toast({ title: 'Error', description: 'No se pudo rechazar', variant: 'destructive' });
    }
  }, [rejectModal, rejectReason, queryClient, toast]);

  const handleViewDocuments = useCallback(async (kyc: KYCVerification) => {
    setDocModal({ open: true, kyc, documents: [], loading: true });
    try {
      const response = await api.getKYCVerificationDetails(kyc.id);
      if (response.success && response.data) {
        setDocModal(prev => ({ ...prev, documents: (response.data.documents || []) as KYCDocument[], loading: false }));
      }
    } catch {
      toast({ title: 'Error', description: 'No se pudieron cargar los documentos', variant: 'destructive' });
      setDocModal(prev => ({ ...prev, loading: false }));
    }
  }, [toast]);

  const docTypeLabel = (t: string) => {
    const labels: Record<string, string> = {
      'id_front': 'Cédula - Frontal',
      'id_back': 'Cédula - Reverso',
      'selfie': 'Selfie',
      'selfie_with_doc': 'Selfie con Cédula',
      'liveness_video': 'Video de Detección de Vida',
    };
    return labels[t] || t;
  };

  const isVideo = (doc: KYCDocument) => doc.documentType === 'liveness_video';

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Verificaciones KYC</h1>
        <p className="text-muted-foreground mt-1">
          Revisa y gestiona las verificaciones de identidad de los usuarios
        </p>
      </div>

      {/* Stats */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Pendientes</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-yellow-600">{pendingCount}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Aprobados</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{approvedCount}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Rechazados</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">{rejectedCount}</div>
          </CardContent>
        </Card>
      </div>

      {isLoadingPending && (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      )}

      {/* KYC List */}
      <Card>
        <CardHeader>
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <CardTitle>Solicitudes de Verificación</CardTitle>
              <CardDescription>{verifications.length} solicitudes en total</CardDescription>
            </div>
            <div className="relative w-full md:w-64">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Buscar usuario..."
                className="pl-9"
                value={search}
                onChange={e => setSearch(e.target.value)}
              />
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {filtered.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12">
              <ShieldCheck className="h-12 w-12 text-muted-foreground/50 mb-4" />
              <h3 className="text-lg font-medium mb-2">No hay verificaciones</h3>
              <p className="text-muted-foreground text-center">
                {search ? "No se encontraron resultados para tu búsqueda" : "Las solicitudes de verificación aparecerán aquí"}
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {filtered.map((kyc) => {
                const displayName = kyc.fullName || kyc.userName || "Usuario";
                const initials = displayName
                  .split(" ")
                  .map((n) => n[0])
                  .join("")
                  .toUpperCase()
                  .slice(0, 2);
                const email = kyc.userEmail || "";

                return (
                  <div
                    key={kyc.id}
                    className="flex flex-col lg:flex-row lg:items-center justify-between p-4 rounded-lg border gap-4"
                  >
                    <div className="flex items-start gap-4">
                      <Avatar className="h-12 w-12">
                        <AvatarFallback>{initials}</AvatarFallback>
                      </Avatar>
                      <div>
                        <div className="flex items-center gap-2 mb-1">
                          <h4 className="font-medium">{displayName}</h4>
                          {getStatusBadge(kyc.status)}
                        </div>
                        <div className="flex flex-wrap items-center gap-4 text-sm text-muted-foreground">
                          <span className="flex items-center gap-1">
                            <Mail className="h-3 w-3" />
                            {email}
                          </span>
                          <span className="flex items-center gap-1">
                            <FileText className="h-3 w-3" />
                            {kyc.documentNumber ? `C.I. ${kyc.documentNumber}` : 'Sin cédula'}
                          </span>
                          {kyc.faceMatchScore > 0 && (
                            <span className="text-xs text-muted-foreground">
                              Rostro: {kyc.faceMatchScore}%
                            </span>
                          )}
                          {kyc.fraudScore > 0 && (
                            <span className="text-xs text-muted-foreground">
                              Fraude: {kyc.fraudScore}%
                            </span>
                          )}
                        </div>
                        <p className="text-xs text-muted-foreground mt-1">
                          Enviado el {kyc.createdAt ? new Date(kyc.createdAt).toLocaleDateString("es-CO", { year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit' }) : '—'}
                        </p>
                      </div>
                    </div>
                    <div className="flex gap-2 ml-16 lg:ml-0">
                      <Button variant="outline" size="sm" onClick={() => handleViewDocuments(kyc)}>
                        <Eye className="h-4 w-4 mr-1" />
                        Ver Documentos
                      </Button>
                      {kyc.status === "pending_review" && (
                        <>
                          <Button
                            variant="outline"
                            size="sm"
                            className="text-red-600 hover:text-red-700"
                            onClick={() => setRejectModal({ open: true, kyc })}
                          >
                            Rechazar
                          </Button>
                          <Button
                            size="sm"
                            className="bg-green-600 hover:bg-green-700"
                            onClick={() => handleApprove(kyc)}
                          >
                            Aprobar
                          </Button>
                        </>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>

      {/* User Management */}
      <div className="mt-8">
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="all">
              Todos
              <Badge variant="secondary" className="ml-2">{stats.total}</Badge>
            </TabsTrigger>
            <TabsTrigger value="pending">
              Pendientes
              {stats.pending > 0 && <Badge variant="secondary" className="ml-2">{stats.pending}</Badge>}
            </TabsTrigger>
            <TabsTrigger value="verified">
              Verificados
              {stats.verified > 0 && <Badge variant="secondary" className="ml-2">{stats.verified}</Badge>}
            </TabsTrigger>
            <TabsTrigger value="rejected">
              Rechazados
              {stats.rejected > 0 && <Badge variant="secondary" className="ml-2">{stats.rejected}</Badge>}
            </TabsTrigger>
          </TabsList>

          <TabsContent value={activeTab} className="mt-6">
            <Card>
              <CardHeader>
                <CardTitle>Listado de Usuarios</CardTitle>
                <CardDescription>
                  {filteredUsers.length} usuario{filteredUsers.length !== 1 ? 's' : ''} (propietarios, clientes y estudiantes)
                </CardDescription>
              </CardHeader>
              <CardContent>
                {isLoading ? (
                  <div className="flex justify-center py-20">
                    <Loader2 className="h-10 w-10 animate-spin text-primary" />
                  </div>
                ) : filteredUsers.length === 0 ? (
                  <div className="text-center py-20 bg-muted/30 rounded-lg">
                    <Users className="h-12 w-12 mx-auto text-muted-foreground mb-3" />
                    <p className="text-muted-foreground">No se encontraron usuarios</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {filteredUsers.map((user) => (
                      <div key={user.id} className="flex items-center justify-between p-4 border rounded-lg hover:bg-muted/50 transition-colors">
                        <div className="flex items-center gap-4 flex-1">
                          <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold text-lg">
                            {user.name.charAt(0)}
                          </div>
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-1">
                              <h4 className="font-semibold">{user.name}</h4>
                              {getRoleBadge(user.role)}
                              {getKycBadge(kycStatusByUserId[user.id])}
                            </div>
                            <p className="text-sm text-muted-foreground">{user.email}</p>
                          </div>
                        </div>

                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon"><MoreVertical className="h-4 w-4" /></Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end" className="w-56">
                            <DropdownMenuItem onClick={() => openDetailsDialog(user)}>
                              <Eye className="h-4 w-4 mr-2" />Ver Detalles
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            {user.accountStatus === 'active' && (
                              <DropdownMenuItem className="text-orange-600" onClick={() => openActionDialog(user, 'suspend')}>
                                <AlertTriangle className="h-4 w-4 mr-2" />Suspender Temporalmente
                              </DropdownMenuItem>
                            )}
                            {user.accountStatus === 'suspended' && (
                              <DropdownMenuItem className="text-green-600" onClick={() => openActionDialog(user, 'activate')}>
                                <Unlock className="h-4 w-4 mr-2" />Reactivar Cuenta
                              </DropdownMenuItem>
                            )}
                            {user.accountStatus !== 'rejected' && (
                              <DropdownMenuItem className="text-red-600" onClick={() => openActionDialog(user, 'block')}>
                                <Ban className="h-4 w-4 mr-2" />Bloquear Permanentemente
                              </DropdownMenuItem>
                            )}
                            {user.accountStatus === 'rejected' && (
                              <DropdownMenuItem className="text-green-600" onClick={() => openActionDialog(user, 'unblock')}>
                                <Unlock className="h-4 w-4 mr-2" />Desbloquear Usuario
                              </DropdownMenuItem>
                            )}
                            {!user.isVerified && (
                              <>
                                <DropdownMenuSeparator />
                                <DropdownMenuItem onClick={() => handleVerifyUser(user)}>
                                  <UserCog className="h-4 w-4 mr-2" />Verificar Cuenta
                                </DropdownMenuItem>
                              </>
                            )}
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>

      {/* Modal de rechazo KYC */}
      <Dialog open={rejectModal.open} onOpenChange={open => { setRejectModal({ open, kyc: null }); setRejectReason(""); }}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <XCircle className="h-5 w-5 text-red-600" />
              Rechazar Verificación
            </DialogTitle>
            <DialogDescription>
              Indica el motivo del rechazo. El usuario será notificado.
            </DialogDescription>
          </DialogHeader>
          <Textarea
            placeholder="Motivo del rechazo..."
            value={rejectReason}
            onChange={e => setRejectReason(e.target.value)}
            rows={3}
          />
          <DialogFooter>
            <Button variant="outline" onClick={() => setRejectModal({ open: false, kyc: null })}>
              Cancelar
            </Button>
            <Button
              variant="destructive"
              disabled={!rejectReason.trim()}
              onClick={handleRejectConfirm}
            >
              Rechazar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Modal de documentos KYC */}
      <Dialog open={docModal.open} onOpenChange={open => { if (!open) setDocModal({ open: false, kyc: null, documents: [], loading: false }); }}>
        <DialogContent className="sm:max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5" />
              Documentos de {docModal.kyc?.fullName || docModal.kyc?.userName || 'Usuario'}
            </DialogTitle>
            <DialogDescription>
              Documentos e información del usuario para verificación KYC
            </DialogDescription>
          </DialogHeader>

          {docModal.loading ? (
            <div className="flex justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin" />
            </div>
          ) : docModal.documents.length === 0 ? (
            <p className="text-center py-8 text-muted-foreground">No hay documentos disponibles</p>
          ) : (
            <div className="space-y-6">
              {docModal.kyc && (
                <div className="grid grid-cols-2 gap-3 text-sm bg-muted/30 p-4 rounded-lg">
                  <div>
                    <span className="text-muted-foreground">Nombre:</span>
                    <p className="font-medium">{docModal.kyc.fullName || docModal.kyc.userName || '—'}</p>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Cédula:</span>
                    <p className="font-medium">{docModal.kyc.documentNumber || '—'}</p>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Email:</span>
                    <p className="font-medium">{docModal.kyc.userEmail || '—'}</p>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Estado:</span>
                    <div className="font-medium">{getStatusBadge(docModal.kyc.status)}</div>
                  </div>
                  {docModal.kyc.faceMatchScore > 0 && (
                    <div>
                      <span className="text-muted-foreground">Coincidencia Rostro:</span>
                      <p className="font-medium">{docModal.kyc.faceMatchScore}%</p>
                    </div>
                  )}
                  {docModal.kyc.fraudScore > 0 && (
                    <div>
                      <span className="text-muted-foreground">Fraude:</span>
                      <p className="font-medium">{docModal.kyc.fraudScore}%</p>
                    </div>
                  )}
                </div>
              )}

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {docModal.documents.map(doc => (
                  <Card key={doc.id}>
                    <CardHeader className="pb-2">
                      <CardTitle className="text-sm font-medium">{docTypeLabel(doc.documentType)}</CardTitle>
                      <CardDescription className="text-xs">
                        {doc.uploadedAt ? new Date(doc.uploadedAt).toLocaleString('es-CO') : ''}
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      {isVideo(doc) ? (
                        doc.url ? (
                          <video controls className="w-full rounded-md" src={doc.url}>
                            Tu navegador no soporta video
                          </video>
                        ) : (
                          <p className="text-sm text-muted-foreground">Video no disponible</p>
                        )
                      ) : doc.url ? (
                        <a href={doc.url} target="_blank" rel="noopener noreferrer">
                          <img src={doc.url} alt={doc.documentType} className="w-full rounded-md border cursor-pointer hover:opacity-90 transition-opacity" />
                        </a>
                      ) : (
                        <div className="flex items-center justify-center py-8 bg-muted/30 rounded-md">
                          <FileText className="h-8 w-8 text-muted-foreground" />
                          <p className="text-sm text-muted-foreground ml-2">No disponible</p>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          )}

          <DialogFooter>
            <Button variant="outline" onClick={() => setDocModal({ open: false, kyc: null, documents: [], loading: false })}>
              Cerrar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Action Dialog (suspend/activate/block/unblock/changeRole) */}
      <Dialog open={actionDialogOpen} onOpenChange={setActionDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>
              {actionType === 'suspend' && 'Suspender Usuario'}
              {actionType === 'activate' && 'Activar Usuario'}
              {actionType === 'block' && 'Bloquear Usuario'}
              {actionType === 'unblock' && 'Desbloquear Usuario'}
              {actionType === 'changeRole' && 'Cambiar Rol'}
            </DialogTitle>
            <DialogDescription>
              {selectedUser?.email}
            </DialogDescription>
          </DialogHeader>
          {actionType === 'changeRole' ? (
            <div className="space-y-4 py-2">
              <Label>Nuevo Rol</Label>
              <Select value={newRole} onValueChange={setNewRole}>
                <SelectTrigger>
                  <SelectValue placeholder="Selecciona un rol" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="admin">Admin</SelectItem>
                  <SelectItem value="operator">Operator</SelectItem>
                  <SelectItem value="propietario">Propietario</SelectItem>
                  <SelectItem value="cliente">Cliente</SelectItem>
                  <SelectItem value="estudiante">Estudiante</SelectItem>
                </SelectContent>
              </Select>
            </div>
          ) : (
            <div className="space-y-4 py-2">
              <Label>Motivo</Label>
              <Textarea
                placeholder="Describe el motivo..."
                value={actionReason}
                onChange={e => setActionReason(e.target.value)}
                rows={3}
              />
              {actionType === 'suspend' && (
                <>
                  <Label>Suspender hasta (opcional)</Label>
                  <Input
                    type="date"
                    value={actionSuspendedUntil}
                    onChange={e => setActionSuspendedUntil(e.target.value)}
                  />
                </>
              )}
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setActionDialogOpen(false)}>
              Cancelar
            </Button>
            <Button
              onClick={handleAction}
              disabled={(actionType === 'changeRole' && !newRole) || (actionType !== 'changeRole' && !actionReason.trim()) || isProcessingAction}
              variant={actionType === 'block' ? 'destructive' : 'default'}
            >
              {isProcessingAction ? 'Procesando...' : actionType === 'changeRole' ? 'Enviar Solicitud' : 'Confirmar'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* User Details Dialog */}
      <Dialog open={detailsDialogOpen} onOpenChange={setDetailsDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Detalles del Usuario</DialogTitle>
            <DialogDescription>
              {detailsUser?.email}
            </DialogDescription>
          </DialogHeader>
          {detailsUser && (
            <div className="space-y-4 py-2">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-xs text-muted-foreground">Nombre</p>
                  <p className="font-medium">{detailsUser.name}</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Rol</p>
                  <p className="font-medium capitalize">{detailsUser.role}</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Estado</p>
                  <Badge variant="outline">{detailsUser.accountStatus}</Badge>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Verificado</p>
                  <p className="font-medium">{detailsUser.isVerified ? 'Sí' : 'No'}</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Registro</p>
                  <p className="font-medium">{new Date(detailsUser.createdAt).toLocaleDateString()}</p>
                </div>
                {detailsUser.phone && (
                  <div>
                    <p className="text-xs text-muted-foreground">Teléfono</p>
                    <p className="font-medium">{detailsUser.phonePrefix} {detailsUser.phone}</p>
                  </div>
                )}
              </div>
              <div>
                <p className="text-sm font-semibold mb-2">Propiedades ({detailsProperties.length})</p>
                {loadingDetails ? (
                  <div className="flex justify-center py-4"><Loader2 className="h-5 w-5 animate-spin" /></div>
                ) : detailsProperties.length === 0 ? (
                  <p className="text-sm text-muted-foreground">Sin propiedades registradas</p>
                ) : (
                  <div className="space-y-2 max-h-40 overflow-y-auto">
                    {detailsProperties.map(p => (
                      <div key={p.id} className="flex items-center justify-between p-2 bg-muted/30 rounded text-sm">
                        <span>{p.title}</span>
                        <Badge variant="outline">{p.status}</Badge>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setDetailsDialogOpen(false)}>Cerrar</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default VerificationsSection;
