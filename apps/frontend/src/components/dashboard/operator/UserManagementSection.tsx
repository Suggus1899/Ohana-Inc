import { useState, useEffect, useCallback } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Users, Search, MoreVertical, Mail, Calendar, Loader2, Ban, AlertCircle, RefreshCw, ShieldCheck } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { api, User } from "@/services/api";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";

const UserManagementSection = () => {
  const { toast } = useToast();
  const [users, setUsers] = useState<User[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [roleFilter, setRoleFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");

  const [statusModal, setStatusModal] = useState<{ isOpen: boolean; user: User | null; action: 'suspend' | 'block' | 'reactivate' | 'unblock' | null }>({ isOpen: false, user: null, action: null });
  const [actionReason, setActionReason] = useState("");
  const [actionSuspendedUntil, setActionSuspendedUntil] = useState("");
  const [isActioning, setIsActioning] = useState(false);
  const [isVerifying, setIsVerifying] = useState<number | null>(null);

  const fetchUsers = useCallback(async () => {
    setIsLoading(true);
    try {
      const filters: Record<string, string | number> = { limit: 100, excludeRole: 'admin' };
      if (roleFilter !== "all") filters.role = roleFilter;
      if (statusFilter !== "all") filters.accountStatus = statusFilter;
      if (search.trim()) filters.search = search.trim();
      const res = await api.getUsers(filters);
      if (res.success && res.data) {
        setUsers(res.data.users.filter(u => u.role !== 'operator' && u.role !== 'admin'));
      }
    } catch {
      toast({ title: "Error", description: "No se pudieron cargar los usuarios", variant: "destructive" });
    } finally {
      setIsLoading(false);
    }
  }, [search, roleFilter, statusFilter, toast]);

  useEffect(() => { fetchUsers(); }, [fetchUsers]);

  const openModal = (user: User, action: typeof statusModal['action']) => {
    setStatusModal({ isOpen: true, user, action });
    setActionReason("");
    setActionSuspendedUntil("");
  };

  const handleConfirm = async () => {
    const { user: u, action } = statusModal;
    if (!u || !action || !actionReason.trim()) return;
    setIsActioning(true);
    try {
      let res;
      if (action === 'suspend') res = await api.suspendUser(u.id, actionReason, actionSuspendedUntil || undefined);
      else if (action === 'block') res = await api.rejectUser(u.id, actionReason);
      else res = await api.reactivateUser(u.id, actionReason);
      if (res.success) {
        const labels: Record<string, string> = { suspend: 'suspendido', block: 'bloqueado', reactivate: 'reactivado', unblock: 'desbloqueado' };
        toast({ title: "Estado actualizado", description: `${u.name} ha sido ${labels[action]}.` });
        setStatusModal({ isOpen: false, user: null, action: null });
        setActionReason("");
        fetchUsers();
      } else {
        toast({ title: "Error", description: ((res as Record<string, unknown>).error as { message?: string } | undefined)?.message || "Error desconocido", variant: "destructive" });
      }
    } catch {
      toast({ title: "Error de conexión", description: "No se pudo actualizar el estado.", variant: "destructive" });
    } finally {
      setIsActioning(false);
    }
  };

  const handleVerify = async (userId: number, userName: string) => {
    setIsVerifying(userId);
    try {
      const res = await api.verifyUser(userId, true);
      if (res.success) {
        toast({ title: "Usuario verificado", description: `${userName} ha sido verificado` });
        fetchUsers();
      } else {
        toast({ title: "Error", description: "No se pudo verificar", variant: "destructive" });
      }
    } finally {
      setIsVerifying(null);
    }
  };

  const totalUsers = users.length;
  const verifiedUsers = users.filter(u => u.isVerified).length;
  const ownerCount = users.filter(u => u.role === "propietario").length;
  const tenantCount = users.filter(u => u.role === "cliente").length;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Gestión de Usuarios</h1>
        <p className="text-muted-foreground mt-1">Administra cuentas y estados de los usuarios de la plataforma</p>
      </div>

      {/* Stats */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Total Usuarios</CardTitle>
          </CardHeader>
          <CardContent><div className="text-2xl font-bold">{totalUsers}</div></CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Verificados</CardTitle>
          </CardHeader>
          <CardContent><div className="text-2xl font-bold text-green-600">{verifiedUsers}</div></CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Propietarios</CardTitle>
          </CardHeader>
          <CardContent><div className="text-2xl font-bold text-blue-600">{ownerCount}</div></CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Inquilinos</CardTitle>
          </CardHeader>
          <CardContent><div className="text-2xl font-bold text-gray-600">{tenantCount}</div></CardContent>
        </Card>
      </div>

      {/* Table */}
      <Card>
        <CardHeader>
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <CardTitle>Listado de Usuarios</CardTitle>
              <CardDescription>{totalUsers} usuarios registrados</CardDescription>
            </div>
            <div className="flex gap-2 flex-wrap">
              <div className="relative w-full md:w-64">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Buscar usuario..."
                  className="pl-9"
                  value={search}
                  onChange={e => setSearch(e.target.value)}
                />
              </div>
              <Select value={roleFilter} onValueChange={setRoleFilter}>
                <SelectTrigger className="w-36">
                  <SelectValue placeholder="Rol" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos los roles</SelectItem>
                  <SelectItem value="propietario">Propietarios</SelectItem>
                  <SelectItem value="cliente">Clientes</SelectItem>
                  <SelectItem value="estudiante">Estudiantes</SelectItem>
                </SelectContent>
              </Select>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-36">
                  <SelectValue placeholder="Estado" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos los estados</SelectItem>
                  <SelectItem value="active">Activo</SelectItem>
                  <SelectItem value="pending">Pendiente</SelectItem>
                  <SelectItem value="suspended">Suspendido</SelectItem>
                  <SelectItem value="rejected">Bloqueado</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex flex-col items-center justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-primary mb-3" />
              <p className="text-muted-foreground">Cargando usuarios...</p>
            </div>
          ) : users.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12">
              <Users className="h-12 w-12 text-muted-foreground/50 mb-4" />
              <h3 className="text-lg font-medium mb-2">No hay registros</h3>
              <p className="text-muted-foreground text-center">
                {search || roleFilter !== "all" ? "No se encontraron usuarios con los filtros aplicados" : "Los usuarios registrados aparecerán aquí"}
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b">
                    <th className="text-left py-3 px-4 font-medium">Usuario</th>
                    <th className="text-left py-3 px-4 font-medium">Rol</th>
                    <th className="text-left py-3 px-4 font-medium">Estado</th>
                    <th className="text-left py-3 px-4 font-medium">Registro</th>
                    <th className="text-left py-3 px-4 font-medium">Acciones</th>
                  </tr>
                </thead>
                <tbody>
                  {users.map((u) => (
                    <tr key={u.id} className="border-b hover:bg-muted/50">
                      <td className="py-3 px-4">
                        <div>
                          <p className="font-medium">{u.name}</p>
                          <p className="text-sm text-muted-foreground flex items-center gap-1">
                            <Mail className="h-3 w-3" />{u.email}
                          </p>
                        </div>
                      </td>
                      <td className="py-3 px-4">
                        <Badge className={cn(
                          u.role === "propietario" ? "bg-blue-100 text-blue-800 hover:bg-blue-100" :
                          "bg-gray-100 text-gray-800 hover:bg-gray-100"
                        )}>
                          {u.role === "propietario" ? "Propietario" : u.role === "estudiante" ? "Estudiante" : "Cliente"}
                        </Badge>
                      </td>
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-2">
                          {u.accountStatus === "active" && <Badge className="bg-green-100 text-green-800 hover:bg-green-100">Activo</Badge>}
                          {u.accountStatus === "pending" && <Badge className="bg-yellow-100 text-yellow-800 hover:bg-yellow-100">Pendiente</Badge>}
                          {u.accountStatus === "suspended" && <Badge className="bg-orange-100 text-orange-800 hover:bg-orange-100">Suspendido</Badge>}
                          {u.accountStatus === "rejected" && <Badge className="bg-red-100 text-red-800 hover:bg-red-100">Bloqueado</Badge>}
                          {u.isVerified && <ShieldCheck className="h-4 w-4 text-blue-500" />}
                        </div>
                      </td>
                      <td className="py-3 px-4">
                        <span className="flex items-center gap-1 text-sm text-muted-foreground">
                          <Calendar className="h-3 w-3" />
                          {new Date(u.createdAt).toLocaleDateString("es-CO")}
                        </span>
                      </td>
                      <td className="py-3 px-4">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon">
                              <MoreVertical className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            {!u.isVerified && (
                              <DropdownMenuItem
                                onClick={() => handleVerify(u.id, u.name)}
                                disabled={isVerifying === u.id}
                              >
                                {isVerifying === u.id
                                  ? <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                                  : <ShieldCheck className="h-4 w-4 mr-2 text-blue-600" />}
                                Verificar cuenta
                              </DropdownMenuItem>
                            )}
                            <DropdownMenuSeparator />
                            {u.accountStatus !== "suspended" && u.accountStatus !== "rejected" && (
                              <DropdownMenuItem
                                className="text-orange-600"
                                onClick={() => openModal(u, 'suspend')}
                              >
                                <Ban className="h-4 w-4 mr-2" />Suspender
                              </DropdownMenuItem>
                            )}
                            {u.accountStatus === "suspended" && (
                              <DropdownMenuItem
                                className="text-green-600"
                                onClick={() => openModal(u, 'reactivate')}
                              >
                                <RefreshCw className="h-4 w-4 mr-2" />Reactivar
                              </DropdownMenuItem>
                            )}
                            {u.accountStatus !== "rejected" && (
                              <DropdownMenuItem
                                className="text-red-600"
                                onClick={() => openModal(u, 'block')}
                              >
                                <AlertCircle className="h-4 w-4 mr-2" />Bloquear permanente
                              </DropdownMenuItem>
                            )}
                            {u.accountStatus === "rejected" && (
                              <DropdownMenuItem
                                className="text-green-600"
                                onClick={() => openModal(u, 'unblock')}
                              >
                                <RefreshCw className="h-4 w-4 mr-2" />Desbloquear
                              </DropdownMenuItem>
                            )}
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Status Action Dialog */}
      <Dialog open={statusModal.isOpen} onOpenChange={open => { if (!open) { setStatusModal({ isOpen: false, user: null, action: null }); setActionReason(""); setActionSuspendedUntil(""); } }}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>
              {statusModal.action === 'suspend' ? 'Suspender Usuario' :
               statusModal.action === 'block' ? 'Bloquear Usuario' :
               statusModal.action === 'unblock' ? 'Desbloquear Usuario' : 'Reactivar Usuario'}
            </DialogTitle>
            <DialogDescription>
              {statusModal.action === 'suspend' ? 'Suspende temporalmente a' :
               statusModal.action === 'block' ? 'Bloquea permanentemente a' :
               'Reactiva la cuenta de'}{' '}
              <span className="font-medium">{statusModal.user?.name}</span>. Indica el motivo.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="actionReason">
                {statusModal.action === 'suspend' ? 'Motivo de suspensión' :
                 statusModal.action === 'block' ? 'Motivo del bloqueo' : 'Motivo de reactivación'}
              </Label>
              <Input
                id="actionReason"
                placeholder="Explica el motivo de la acción..."
                value={actionReason}
                onChange={e => setActionReason(e.target.value)}
              />
            </div>
            {statusModal.action === 'suspend' && (
              <div className="space-y-2">
                <Label htmlFor="actionSuspendedUntil">Suspendido hasta (opcional)</Label>
                <Input
                  id="actionSuspendedUntil"
                  type="date"
                  value={actionSuspendedUntil}
                  onChange={e => setActionSuspendedUntil(e.target.value)}
                  min={new Date().toISOString().split('T')[0]}
                />
              </div>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => { setStatusModal({ isOpen: false, user: null, action: null }); setActionReason(""); }}>Cancelar</Button>
            <Button
              variant={statusModal.action === 'suspend' || statusModal.action === 'block' ? 'destructive' : 'default'}
              onClick={handleConfirm}
              disabled={!actionReason.trim() || isActioning}
            >
              {isActioning ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
              Confirmar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default UserManagementSection;
