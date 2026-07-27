import { useState, useEffect, useCallback } from "react";
import CreateUserDialog from "./CreateUserDialog";
import EditUserDialog from "./EditUserDialog.tsx";
import { useToastNotification } from "@/contexts/ToastNotificationContext";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Users, Search, MoreVertical, Mail, Calendar, Plus, Pencil, Loader2, Ban, AlertCircle, UserCheck, UserX, RefreshCw, Settings, ShieldCheck } from "lucide-react";
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
import { api, User, Pagination } from "@/services/api";
import { cn } from "@/lib/utils";

const UsersSection = () => {
  const { showError, showSuccess } = useToastNotification();
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [users, setUsers] = useState<User[]>([]);
  const [pagination, setPagination] = useState<Pagination | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [search, setSearch] = useState("");
  const [roleFilter, setRoleFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");
  const [page, setPage] = useState(1);

  const [statusActionModal, setStatusActionModal] = useState<{ isOpen: boolean; user: User | null; action: 'suspend' | 'block' | 'reactivate' | 'unblock' | null }>({ isOpen: false, user: null, action: null });
  const [actionReason, setActionReason] = useState("");
  const [actionSuspendedUntil, setActionSuspendedUntil] = useState("");

  const [pendingActionModal, setPendingActionModal] = useState<{ isOpen: boolean; user: User | null }>({
    isOpen: false,
    user: null,
  });

  const [reactivateModal, setReactivateModal] = useState<{ isOpen: boolean; user: User | null }>({
    isOpen: false,
    user: null,
  });

  const fetchUsers = useCallback(async () => {
    setIsLoading(true);
    try {
      const filters: Record<string, string | number> = { page, limit: 20, excludeRole: 'admin' };
      if (roleFilter !== "all") filters.role = roleFilter;
      if (statusFilter !== "all") filters.accountStatus = statusFilter;
      if (search.trim()) filters.search = search.trim();
      const res = await api.getUsers(filters);
      if (res.success && res.data) {
        setUsers(res.data.users);
        setPagination(res.data.pagination);
      } else {
        showError("Error al cargar usuarios", res.error?.message || "Error desconocido");
      }
    } catch {
      showError("Error de conexión", "No se pudo cargar la lista de usuarios.");
    } finally {
      setIsLoading(false);
    }
  }, [page, roleFilter, search, statusFilter, showError]);

  const handleApproveUser = async (userId: number, userName: string) => {
    try {
      const res = await api.request(`/users/${userId}/approve`, { method: "PATCH" });
      if (res.success) {
        showSuccess("Usuario aprobado", `${userName} ha sido aprobado exitosamente.`);
        fetchUsers();
        setPendingActionModal({ isOpen: false, user: null });
      } else {
        showError("Error al aprobar", ((res as Record<string, unknown>).error as { message?: string } | undefined)?.message || "Error desconocido");
      }
    } catch {
      showError("Error de conexión", "No se pudo aprobar el usuario.");
    }
  };

  const handleRejectUser = async (userId: number, userName: string) => {
    try {
      const res = await api.request(`/users/${userId}/reject`, {
        method: "PATCH",
        body: JSON.stringify({ reason: "No cumple con los requisitos" }),
      });
      if (res.success) {
        showSuccess("Usuario rechazado", `${userName} ha sido rechazado.`);
        fetchUsers();
        setPendingActionModal({ isOpen: false, user: null });
      } else {
        showError("Error al rechazar", ((res as Record<string, unknown>).error as { message?: string } | undefined)?.message || "Error desconocido");
      }
    } catch {
      showError("Error de conexión", "No se pudo rechazar el usuario.");
    }
  };

  const handleConfirmStatusAction = async () => {
    const { user: u, action } = statusActionModal;
    if (!u || !action || !actionReason.trim()) return;
    try {
      let res;
      if (action === 'suspend') res = await api.suspendUser(u.id, actionReason, actionSuspendedUntil || undefined);
      else if (action === 'block') res = await api.rejectUser(u.id, actionReason);
      else res = await api.reactivateUser(u.id, actionReason);
      if (res.success) {
        const labels: Record<string, string> = { suspend: 'suspendido', block: 'bloqueado', reactivate: 'reactivado', unblock: 'desbloqueado' };
        showSuccess("Estado actualizado", `${u.name} ha sido ${labels[action]}.`);
        fetchUsers();
      } else {
        showError("Error", ((res as Record<string, unknown>).error as { message?: string } | undefined)?.message || "Error desconocido");
      }
    } catch {
      showError("Error de conexión", "No se pudo actualizar el estado.");
    } finally {
      setStatusActionModal({ isOpen: false, user: null, action: null });
      setActionReason("");
      setActionSuspendedUntil("");
      setReactivateModal({ isOpen: false, user: null });
    }
  };

  const handleSuspendUser = (userId: number, userName: string) => {
    const user = users.find(u => u.id === userId) || ({ id: userId, name: userName } as User);
    setActionReason("");
    setActionSuspendedUntil("");
    setStatusActionModal({ isOpen: true, user, action: 'suspend' });
  };

  const handleReactivateUser = (userId: number, userName: string) => {
    const user = users.find(u => u.id === userId) || ({ id: userId, name: userName } as User);
    setActionReason("");
    setStatusActionModal({ isOpen: true, user, action: user?.accountStatus === 'rejected' ? 'unblock' : 'reactivate' });
  };

  const handleVerifyUser = async (userId: number, userName: string) => {
    try {
      const res = await api.verifyUser(userId, true);
      if (res.success) {
        showSuccess("Usuario verificado", `${userName} ha sido verificado exitosamente.`);
        fetchUsers();
      } else {
        showError("Error al verificar", ((res as Record<string, unknown>).error as { message?: string } | undefined)?.message || "Error desconocido");
      }
    } catch {
      showError("Error de conexión", "No se pudo verificar el usuario.");
    }
  };

  const handleBlockUser = (userId: number, userName: string) => {
    const user = users.find(u => u.id === userId) || ({ id: userId, name: userName } as User);
    setActionReason("");
    setStatusActionModal({ isOpen: true, user, action: 'block' });
  };

  useEffect(() => { fetchUsers(); }, [fetchUsers]);

  const handleUserCreated = () => { fetchUsers(); };
  const handleUserUpdated = () => { fetchUsers(); };
  const handleEditUser = (user: User) => { setSelectedUser(user); setIsEditDialogOpen(true); };

  const totalUsers = pagination?.total ?? users.length;
  const verifiedUsers = users.filter((u) => u.isVerified).length;
  const ownerCount = users.filter((u) => u.role === "propietario").length;
  const tenantCount = users.filter((u) => u.role === "cliente").length;
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Gestión de Usuarios</h1>
        <p className="text-muted-foreground mt-1">
          Administra todos los usuarios de la plataforma
        </p>
      </div>

      {/* Stats */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Total Usuarios
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalUsers}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Verificados
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{verifiedUsers}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Propietarios
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">{ownerCount}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Inquilinos
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-gray-600">{tenantCount}</div>
          </CardContent>
        </Card>
      </div>

      {/* Users Table */}
      <Card>
        <CardHeader>
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <CardTitle>Listado de Usuarios</CardTitle>
              <CardDescription>
                {totalUsers} usuarios registrados
              </CardDescription>
            </div>
            <div className="flex gap-2 flex-wrap">
              <div className="relative w-full md:w-64">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Buscar usuario..."
                  className="pl-9"
                  value={search}
                  onChange={e => { setSearch(e.target.value); setPage(1); }}
                />
              </div>
              <Select value={roleFilter} onValueChange={v => { setRoleFilter(v); setPage(1); }}>
                <SelectTrigger className="w-36">
                  <SelectValue placeholder="Rol" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos los roles</SelectItem>
                  <SelectItem value="propietario">Propietarios</SelectItem>
                  <SelectItem value="cliente">Clientes</SelectItem>
                  <SelectItem value="estudiante">Estudiantes</SelectItem>
                  <SelectItem value="operator">Operadores</SelectItem>
                </SelectContent>
              </Select>
              <Select value={statusFilter} onValueChange={v => { setStatusFilter(v); setPage(1); }}>
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
              {/* Admin: Botón de crear usuario */}
              <Button onClick={() => setIsCreateDialogOpen(true)}>
                <Plus className="h-4 w-4 mr-2" />
                Crear Usuario
              </Button>
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
                            <Mail className="h-3 w-3" />
                            {u.email}
                          </p>
                        </div>
                      </td>
                      <td className="py-3 px-4">
                        <Badge className={cn(
                          u.role === "admin" ? "bg-red-100 text-red-800 hover:bg-red-100" :
                          u.role === "propietario" ? "bg-blue-100 text-blue-800 hover:bg-blue-100" :
                          u.role === "operator" ? "bg-purple-100 text-purple-800 hover:bg-purple-100" :
                          "bg-gray-100 text-gray-800 hover:bg-gray-100"
                        )}>
                          {u.role === "admin" ? "Admin" :
                           u.role === "propietario" ? "Propietario" :
                           u.role === "operator" ? "Operador" :
                           "Cliente"}
                        </Badge>
                      </td>
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-2">
                          {u.accountStatus === "active" && <Badge className="bg-green-100 text-green-800 hover:bg-green-100">Activo</Badge>}
                          {u.accountStatus === "pending" && <Badge className="bg-yellow-100 text-yellow-800 hover:bg-yellow-100">Pendiente</Badge>}
                          {u.accountStatus === "suspended" && <Badge className="bg-orange-100 text-orange-800 hover:bg-orange-100">Suspendido</Badge>}
                          {u.accountStatus === "rejected" && <Badge className="bg-red-100 text-red-800 hover:bg-red-100">Bloqueado</Badge>}
                          {u.isVerified && <ShieldCheck className="h-4 w-4 text-blue-500" aria-label="Verificado" />}
                        </div>
                      </td>
                      <td className="py-3 px-4">
                        <span className="flex items-center gap-1 text-sm text-muted-foreground">
                          <Calendar className="h-3 w-3" />
                          {new Date(u.createdAt).toLocaleDateString("es-CO")}
                        </span>
                      </td>
                      <td className="py-3 px-4">
                        {/* Admin: CRUD completo de usuarios */}
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon">
                              <MoreVertical className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem onClick={() => handleEditUser(u)}>
                              <Pencil className="h-4 w-4 mr-2" />
                              Editar usuario
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            {!u.isVerified && (
                              <DropdownMenuItem onClick={() => handleVerifyUser(u.id, u.name)}>
                                <ShieldCheck className="h-4 w-4 mr-2" />
                                Verificar cuenta
                              </DropdownMenuItem>
                            )}
                            {u.accountStatus !== "suspended" && u.accountStatus !== "rejected" && (
                              <DropdownMenuItem
                                className="text-orange-600"
                                onClick={() => handleSuspendUser(u.id, u.name)}
                              >
                                <Ban className="h-4 w-4 mr-2" />
                                Suspender
                              </DropdownMenuItem>
                            )}
                            {u.accountStatus === "suspended" && (
                              <DropdownMenuItem
                                className="text-green-600"
                                onClick={() => handleReactivateUser(u.id, u.name)}
                              >
                                <RefreshCw className="h-4 w-4 mr-2" />
                                Reactivar
                              </DropdownMenuItem>
                            )}
                            {u.accountStatus !== "rejected" && (
                              <DropdownMenuItem
                                className="text-red-600"
                                onClick={() => handleBlockUser(u.id, u.name)}
                              >
                                <AlertCircle className="h-4 w-4 mr-2" />
                                Bloquear permanente
                              </DropdownMenuItem>
                            )}
                            {u.accountStatus === "rejected" && (
                              <DropdownMenuItem
                                className="text-green-600"
                                onClick={() => handleReactivateUser(u.id, u.name)}
                              >
                                <RefreshCw className="h-4 w-4 mr-2" />
                                Desbloquear
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

          {/* Pagination */}
          {pagination && pagination.totalPages > 1 && (
            <div className="flex items-center justify-between mt-6 pt-4 border-t">
              <p className="text-sm text-muted-foreground">
                Página {pagination.page} de {pagination.totalPages} — {pagination.total} usuarios
              </p>
              <div className="flex gap-2">
                <Button variant="outline" size="sm" disabled={page <= 1} onClick={() => setPage(p => p - 1)}>Anterior</Button>
                <Button variant="outline" size="sm" disabled={page >= pagination.totalPages} onClick={() => setPage(p => p + 1)}>Siguiente</Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
      <CreateUserDialog
        open={isCreateDialogOpen}
        onOpenChange={setIsCreateDialogOpen}
        onUserCreated={handleUserCreated}
      />

      <EditUserDialog
        open={isEditDialogOpen}
        onOpenChange={setIsEditDialogOpen}
        user={selectedUser}
        onUserUpdated={handleUserUpdated}
      />

      {/* Modal para acciones de usuario pendiente */}
      <Dialog open={pendingActionModal.isOpen} onOpenChange={(open) => setPendingActionModal({ isOpen: open, user: null })}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Settings className="h-5 w-5 text-blue-600" />
              Gestionar Solicitud
            </DialogTitle>
            <DialogDescription>
              ¿Qué acción deseas realizar con la solicitud de <span className="font-medium">{pendingActionModal.user?.name}</span>?
            </DialogDescription>
          </DialogHeader>
          
          <div className="flex flex-col gap-3 py-4">
            <div className="flex items-center gap-3 p-3 rounded-lg border bg-green-50">
              <UserCheck className="h-5 w-5 text-green-600" />
              <div className="flex-1">
                <p className="font-medium text-green-800">Aprobar Usuario</p>
                <p className="text-sm text-green-600">El usuario tendrá acceso completo a la plataforma</p>
              </div>
            </div>
            
            <div className="flex items-center gap-3 p-3 rounded-lg border bg-red-50">
              <UserX className="h-5 w-5 text-red-600" />
              <div className="flex-1">
                <p className="font-medium text-red-800">Rechazar Usuario</p>
                <p className="text-sm text-red-600">El usuario no podrá acceder a la plataforma</p>
              </div>
            </div>
          </div>

          <DialogFooter className="flex gap-2">
            <Button
              variant="outline"
              onClick={() => setPendingActionModal({ isOpen: false, user: null })}
            >
              Cancelar
            </Button>
            <Button
              variant="outline"
              className="bg-red-50 hover:bg-red-100 text-red-700 border-red-200"
              onClick={() => handleRejectUser(pendingActionModal.user?.id, pendingActionModal.user?.name)}
            >
              <UserX className="h-4 w-4 mr-2" />
              Rechazar
            </Button>
            <Button
              className="bg-green-600 hover:bg-green-700"
              onClick={() => handleApproveUser(pendingActionModal.user?.id, pendingActionModal.user?.name)}
            >
              <UserCheck className="h-4 w-4 mr-2" />
              Aprobar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Modal de motivo para suspender/bloquear/reactivar */}
      <Dialog open={statusActionModal.isOpen} onOpenChange={(open) => { if (!open) { setStatusActionModal({ isOpen: false, user: null, action: null }); setActionReason(""); } }}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>
              {statusActionModal.action === 'suspend' ? 'Suspender Usuario' :
               statusActionModal.action === 'block' ? 'Bloquear Usuario' :
               statusActionModal.action === 'unblock' ? 'Desbloquear Usuario' : 'Reactivar Usuario'}
            </DialogTitle>
            <DialogDescription>
              {statusActionModal.action === 'suspend' ? 'Suspende temporalmente a' :
               statusActionModal.action === 'block' ? 'Bloquea permanentemente a' :
               'Reactiva la cuenta de'}{' '}
              <span className="font-medium">{statusActionModal.user?.name}</span>.
              Indica el motivo (se guardará en el sistema).
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="actionReason">
                {statusActionModal.action === 'suspend' ? 'Motivo de suspensión' :
                 statusActionModal.action === 'block' ? 'Motivo del bloqueo' : 'Motivo de reactivación'}
              </Label>
              <Input
                id="actionReason"
                placeholder="Explica el motivo de la acción..."
                value={actionReason}
                onChange={e => setActionReason(e.target.value)}
              />
            </div>
            {statusActionModal.action === 'suspend' && (
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
            <Button variant="outline" onClick={() => { setStatusActionModal({ isOpen: false, user: null, action: null }); setActionReason(""); }}>Cancelar</Button>
            <Button
              variant={statusActionModal.action === 'suspend' || statusActionModal.action === 'block' ? 'destructive' : 'default'}
              onClick={handleConfirmStatusAction}
              disabled={!actionReason.trim()}
            >
              Confirmar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Modal para reactivar usuario suspendido */}
      <Dialog open={reactivateModal.isOpen} onOpenChange={(open) => setReactivateModal({ isOpen: open, user: null })}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <RefreshCw className="h-5 w-5 text-green-600" />
              Reactivar Usuario
            </DialogTitle>
            <DialogDescription>
              ¿Estás seguro de que deseas reactivar la cuenta de <span className="font-medium">{reactivateModal.user?.name}</span>?
            </DialogDescription>
          </DialogHeader>
          
          <div className="py-4">
            <div className="flex items-center gap-3 p-3 rounded-lg border bg-blue-50">
              <RefreshCw className="h-5 w-5 text-blue-600" />
              <div className="flex-1">
                <p className="font-medium text-blue-800">Reactivar Cuenta</p>
                <p className="text-sm text-blue-600">El usuario recuperará el acceso completo a la plataforma</p>
              </div>
            </div>
          </div>

          <DialogFooter className="flex gap-2">
            <Button
              variant="outline"
              onClick={() => setReactivateModal({ isOpen: false, user: null })}
            >
              Cancelar
            </Button>
            <Button
              className="bg-blue-600 hover:bg-blue-700"
              onClick={() => handleReactivateUser(reactivateModal.user?.id, reactivateModal.user?.name)}
            >
              <RefreshCw className="h-4 w-4 mr-2" />
              Reactivar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default UsersSection;
