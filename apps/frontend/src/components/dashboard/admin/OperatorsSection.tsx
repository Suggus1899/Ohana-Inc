import { useState, useEffect, useCallback, useMemo } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  UserCog,
  Search,
  Plus,
  Trash2,
  CheckCircle,
  Loader2,
  RefreshCw,
  MoreVertical,
  Ban,
  ShieldCheck,
  Mail,
  Calendar,
} from "lucide-react";
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
import { Label } from "@/components/ui/label";
import { api, User } from "@/services/api";
import CreateUserDialog from "./createUserDialog";
import EditUserDialog from "./EditUserDialog";
import { toast } from "sonner";

const OperatorsSection = () => {
  const [operators, setOperators] = useState<User[]>([]);
  const [pagination, setPagination] = useState<{ total: number; page: number; limit: number; totalPages: number } | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isActioning, setIsActioning] = useState<number | null>(null);
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [editUser, setEditUser] = useState<User | null>(null);
  const [deleteDialog, setDeleteDialog] = useState<{ open: boolean; user: User | null }>({ open: false, user: null });
  const [suspendDialog, setSuspendDialog] = useState<{ open: boolean; user: User | null }>({ open: false, user: null });
  const [suspendReason, setSuspendReason] = useState("");

  const fetchOperators = useCallback(async () => {
    setIsLoading(true);
    try {
      const filters: Record<string, string | number> = { role: "operator", page, limit: 20 };
      if (search.trim()) filters.search = search.trim();
      const res = await api.getUsers(filters);
      if (res.success && res.data) {
        setOperators(res.data.users);
        setPagination(res.data.pagination);
      } else {
        toast.error("Error al cargar operadores");
      }
    } catch {
      toast.error("Error de conexión");
    } finally {
      setIsLoading(false);
    }
  }, [page, search]);

  useEffect(() => { fetchOperators(); }, [fetchOperators]);

  const filtered = useMemo(() => operators.filter(o =>
    o.name?.toLowerCase().includes(search.toLowerCase()) ||
    o.email?.toLowerCase().includes(search.toLowerCase())
  ), [operators, search]);

  const handleSuspend = async () => {
    if (!suspendDialog.user || !suspendReason.trim()) return;
    setIsActioning(suspendDialog.user.id);
    try {
      const isSuspended = suspendDialog.user.accountStatus === "suspended";
      const res = isSuspended
        ? await api.reactivateUser(suspendDialog.user.id, suspendReason)
        : await api.suspendUser(suspendDialog.user.id, suspendReason);
      if (res.success) {
        toast.success(isSuspended ? `${suspendDialog.user.name} reactivado` : `${suspendDialog.user.name} suspendido`);
        setSuspendDialog({ open: false, user: null });
        setSuspendReason("");
        fetchOperators();
      } else {
        toast.error((res as any).error?.message || "Error al actualizar estado");
      }
    } finally {
      setIsActioning(null);
    }
  };

  const handleDelete = async () => {
    if (!deleteDialog.user) return;
    setIsActioning(deleteDialog.user.id);
    try {
      const res = await api.updateUserRole(deleteDialog.user.id, "cliente");
      if (res.success) {
        toast.success(`${deleteDialog.user.name} removido como operador`);
        setDeleteDialog({ open: false, user: null });
        fetchOperators();
      } else {
        toast.error((res as any).error?.message || "Error al eliminar operador");
      }
    } finally {
      setIsActioning(null);
    }
  };

  const activeCount = operators.filter(o => o.accountStatus === "active").length;
  const suspendedCount = operators.filter(o => o.accountStatus === "suspended").length;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Gestión de Operadores</h1>
          <p className="text-muted-foreground mt-1">Administra los operadores de la plataforma</p>
        </div>
        <Button variant="outline" size="sm" onClick={fetchOperators} disabled={isLoading}>
          <RefreshCw className={`h-4 w-4 mr-2 ${isLoading ? "animate-spin" : ""}`} />
          Actualizar
        </Button>
      </div>

      {/* Stats */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardContent className="p-6 flex items-center gap-4">
            <div className="p-3 rounded-lg bg-blue-50"><UserCog className="h-6 w-6 text-blue-600" /></div>
            <div><p className="text-2xl font-bold">{operators.length}</p><p className="text-sm text-muted-foreground">Total Operadores</p></div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6 flex items-center gap-4">
            <div className="p-3 rounded-lg bg-green-50"><CheckCircle className="h-6 w-6 text-green-600" /></div>
            <div><p className="text-2xl font-bold">{activeCount}</p><p className="text-sm text-muted-foreground">Activos</p></div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6 flex items-center gap-4">
            <div className="p-3 rounded-lg bg-orange-50"><Ban className="h-6 w-6 text-orange-600" /></div>
            <div><p className="text-2xl font-bold">{suspendedCount}</p><p className="text-sm text-muted-foreground">Suspendidos</p></div>
          </CardContent>
        </Card>
      </div>

      {/* Table */}
      <Card>
        <CardHeader>
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <CardTitle>Listado de Operadores</CardTitle>
              <CardDescription>{filtered.length} operadores encontrados</CardDescription>
            </div>
            <div className="flex gap-2">
              <div className="relative w-full md:w-64">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input placeholder="Buscar operador..." className="pl-9" value={search} onChange={e => setSearch(e.target.value)} />
              </div>
              <Button onClick={() => setIsCreateOpen(true)}>
                <Plus className="h-4 w-4 mr-2" />Crear Operador
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex flex-col items-center justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-primary mb-3" />
              <p className="text-muted-foreground">Cargando operadores...</p>
            </div>
          ) : operators.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12">
              <UserCog className="h-12 w-12 text-muted-foreground/50 mb-4" />
              <h3 className="text-lg font-medium mb-2">No hay operadores</h3>
              <p className="text-muted-foreground text-center">
                {search ? "No se encontraron operadores con ese nombre" : "Crea el primer operador con el botón de arriba"}
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b">
                    <th className="text-left py-3 px-4 font-medium">Operador</th>
                    <th className="text-left py-3 px-4 font-medium">Estado</th>
                    <th className="text-left py-3 px-4 font-medium">Verificado</th>
                    <th className="text-left py-3 px-4 font-medium">Desde</th>
                    <th className="text-left py-3 px-4 font-medium">Acciones</th>
                  </tr>
                </thead>
                <tbody>
                  {operators.map((op) => (
                    <tr key={op.id} className="border-b hover:bg-muted/50">
                      <td className="py-3 px-4">
                        <div>
                          <p className="font-medium">{op.name}</p>
                          <p className="text-sm text-muted-foreground flex items-center gap-1"><Mail className="h-3 w-3" />{op.email}</p>
                        </div>
                      </td>
                      <td className="py-3 px-4">
                        {op.accountStatus === "active" ? (
                          <Badge className="bg-green-100 text-green-800 hover:bg-green-100"><CheckCircle className="h-3 w-3 mr-1" />Activo</Badge>
                        ) : op.accountStatus === "suspended" ? (
                          <Badge className="bg-orange-100 text-orange-800 hover:bg-orange-100"><Ban className="h-3 w-3 mr-1" />Suspendido</Badge>
                        ) : (
                          <Badge variant="secondary">{op.accountStatus}</Badge>
                        )}
                      </td>
                      <td className="py-3 px-4">
                        {op.isVerified ? (
                          <Badge className="bg-blue-100 text-blue-800 hover:bg-blue-100"><ShieldCheck className="h-3 w-3 mr-1" />Verificado</Badge>
                        ) : (
                          <span className="text-sm text-muted-foreground">No verificado</span>
                        )}
                      </td>
                      <td className="py-3 px-4">
                        <span className="text-sm text-muted-foreground flex items-center gap-1">
                          <Calendar className="h-3 w-3" />
                          {new Date(op.createdAt).toLocaleDateString("es-VE")}
                        </span>
                      </td>
                      <td className="py-3 px-4">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon" disabled={isActioning === op.id}>
                              {isActioning === op.id ? <Loader2 className="h-4 w-4 animate-spin" /> : <MoreVertical className="h-4 w-4" />}
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem onClick={() => setEditUser(op)}>
                              Editar operador
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem
                              className={op.accountStatus === "suspended" ? "text-green-600" : "text-orange-600"}
                              onClick={() => setSuspendDialog({ open: true, user: op })}
                            >
                              <Ban className="h-4 w-4 mr-2" />
                              {op.accountStatus === "suspended" ? "Reactivar" : "Suspender"}
                            </DropdownMenuItem>
                            <DropdownMenuItem className="text-destructive" onClick={() => setDeleteDialog({ open: true, user: op })}>
                              <Trash2 className="h-4 w-4 mr-2" />Remover como operador
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {pagination && pagination.totalPages > 1 && (
                <div className="flex items-center justify-between mt-6 pt-4 border-t">
                  <p className="text-sm text-muted-foreground">
                    Página {pagination.page} de {pagination.totalPages} — {pagination.total} operadores
                  </p>
                  <div className="flex gap-2">
                    <Button variant="outline" size="sm" disabled={page <= 1} onClick={() => setPage(p => p - 1)}>Anterior</Button>
                    <Button variant="outline" size="sm" disabled={page >= pagination.totalPages} onClick={() => setPage(p => p + 1)}>Siguiente</Button>
                  </div>
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      <CreateUserDialog
        open={isCreateOpen}
        onOpenChange={setIsCreateOpen}
        onUserCreated={fetchOperators}
        defaultRole="operator"
      />

      <EditUserDialog
        open={!!editUser}
        onOpenChange={open => { if (!open) setEditUser(null); }}
        user={editUser}
        onUserUpdated={fetchOperators}
      />

      {/* Suspend/Reactivate dialog */}
      <Dialog open={suspendDialog.open} onOpenChange={open => { if (!open) { setSuspendDialog({ open: false, user: null }); setSuspendReason(""); } }}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>{suspendDialog.user?.accountStatus === "suspended" ? "Reactivar operador" : "Suspender operador"}</DialogTitle>
            <DialogDescription>
              {suspendDialog.user?.accountStatus === "suspended" ? "Reactiva" : "Suspende"} la cuenta de <span className="font-medium">{suspendDialog.user?.name}</span>. Indica el motivo.
            </DialogDescription>
          </DialogHeader>
          <div className="py-4">
            <div className="space-y-2">
              <Label htmlFor="suspendReason">
                {suspendDialog.user?.accountStatus === "suspended" ? "Motivo de reactivación" : "Motivo de suspensión"}
              </Label>
              <Input
                id="suspendReason"
                placeholder="Explica el motivo..."
                value={suspendReason}
                onChange={e => setSuspendReason(e.target.value)}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => { setSuspendDialog({ open: false, user: null }); setSuspendReason(""); }}>Cancelar</Button>
            <Button
              variant={suspendDialog.user?.accountStatus === "suspended" ? "default" : "destructive"}
              onClick={handleSuspend}
              disabled={isActioning !== null || !suspendReason.trim()}
            >
              {isActioning !== null && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
              {suspendDialog.user?.accountStatus === "suspended" ? "Reactivar" : "Suspender"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Remove operator dialog */}
      <Dialog open={deleteDialog.open} onOpenChange={open => { if (!open) setDeleteDialog({ open: false, user: null }); }}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Remover operador</DialogTitle>
            <DialogDescription>
              ¿Remover a <span className="font-medium">{deleteDialog.user?.name}</span> como operador? Su rol cambiará a "cliente". Esta acción se puede revertir editando el usuario.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteDialog({ open: false, user: null })}>Cancelar</Button>
            <Button variant="destructive" onClick={handleDelete} disabled={isActioning !== null}>
              {isActioning !== null && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
              <Trash2 className="h-4 w-4 mr-2" />Remover
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default OperatorsSection;
