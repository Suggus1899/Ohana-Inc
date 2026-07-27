import { useState, useEffect, useCallback } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Building, Search, Eye, MoreVertical, MapPin, Bed, CheckCircle, XCircle, Clock, Loader2, Trash2, EyeOff, RotateCcw, UserCog } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
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
import { api, Property, Pagination, User } from "@/services/api";
import { toast } from "sonner";
import { useExchangeRate } from "../../../contexts/ExchangeRateContext";
import { formatDualPriceShort, usdToCop } from "../../../utils/formatPrice";

const getStatusBadge = (status: string) => {
  switch (status) {
    case "approved":
      return <Badge className="bg-green-100 text-green-800 hover:bg-green-100"><CheckCircle className="h-3 w-3 mr-1" />Aprobada</Badge>;
    case "pending":
      return <Badge className="bg-yellow-100 text-yellow-800 hover:bg-yellow-100"><Clock className="h-3 w-3 mr-1" />Pendiente</Badge>;
    case "rejected":
      return <Badge className="bg-red-100 text-red-800 hover:bg-red-100"><XCircle className="h-3 w-3 mr-1" />Rechazada</Badge>;
    case "rented":
      return <Badge className="bg-blue-100 text-blue-800 hover:bg-blue-100">Alquilada</Badge>;
    case "sold":
      return <Badge className="bg-purple-100 text-purple-800 hover:bg-purple-100">Vendida</Badge>;
    default:
      return <Badge variant="secondary">{status}</Badge>;
  }
};

const PropertiesSection = () => {
  const [properties, setProperties] = useState<Property[]>([]);
  const [pagination, setPagination] = useState<Pagination | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isActioning, setIsActioning] = useState<number | null>(null);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [page, setPage] = useState(1);
  const [rejectDialog, setRejectDialog] = useState<{ open: boolean; property: Property | null }>({ open: false, property: null });
  const [rejectReason, setRejectReason] = useState("");
  const [deleteDialog, setDeleteDialog] = useState<{ open: boolean; property: Property | null }>({ open: false, property: null });
  const [unpublishedProperties, setUnpublishedProperties] = useState<Property[]>([]);
  const [isLoadingUnpublished, setIsLoadingUnpublished] = useState(false);
  const [operators, setOperators] = useState<User[]>([]);
  const [assignDialog, setAssignDialog] = useState<{ open: boolean; property: Property | null }>({ open: false, property: null });
  const [selectedOperator, setSelectedOperator] = useState<string>("");
  const { rate } = useExchangeRate();

  const fetchProperties = useCallback(async () => {
    setIsLoading(true);
    try {
      const filters: Record<string, string | number> = { page, limit: 20 };
      if (statusFilter !== "all") filters.status = statusFilter;
      if (search.trim()) filters.search = search.trim();
      const res = await api.getProperties(filters);
      if (res.success && res.data) {
        setProperties(res.data.properties);
        setPagination(res.data.pagination);
      } else {
        toast.error("Error al cargar propiedades");
      }
    } catch {
      toast.error("Error de conexión");
    } finally {
      setIsLoading(false);
    }
  }, [page, statusFilter, search]);

  const fetchUnpublished = useCallback(async () => {
    setIsLoadingUnpublished(true);
    try {
      const res = await api.getProperties({ status: 'rejected', limit: 50 });
      if (res.success && res.data) {
        setUnpublishedProperties(res.data.properties.filter(p => p.rejectionReason === '__unpublished__'));
      }
    } catch { /* silent */ } finally {
      setIsLoadingUnpublished(false);
    }
  }, []);

  useEffect(() => { fetchProperties(); }, [fetchProperties]);
  useEffect(() => { fetchUnpublished(); }, [fetchUnpublished]);

  useEffect(() => {
    const loadOperators = async () => {
      try {
        const res = await api.getUsers({ role: 'operator', limit: 100 });
        if (res.success && res.data) setOperators(res.data.users);
      } catch { /* silent */ }
    };
    loadOperators();
  }, []);

  const handleAssign = async () => {
    if (!assignDialog.property || !selectedOperator) return;
    setIsActioning(assignDialog.property.id);
    try {
      const res = await api.assignModerator(assignDialog.property.id, Number(selectedOperator));
      if (res.success) {
        toast.success(`Moderador asignado a "${assignDialog.property.title}"`);
        setAssignDialog({ open: false, property: null });
        setSelectedOperator("");
        fetchProperties();
      } else {
        toast.error(res.error?.message || "Error al asignar moderador");
      }
    } catch {
      toast.error("Error de conexión");
    } finally {
      setIsActioning(null);
    }
  };

  const handleApprove = async (property: Property) => {
    setIsActioning(property.id);
    try {
      const res = await api.updatePropertyStatus(property.id, "approved");
      if (res.success) {
        toast.success(`"${property.title}" aprobada`);
        fetchProperties();
      } else {
        toast.error(res.error?.message || "Error al aprobar");
      }
    } finally {
      setIsActioning(null);
    }
  };

  const handleReject = async () => {
    if (!rejectDialog.property || !rejectReason.trim()) return;
    setIsActioning(rejectDialog.property.id);
    try {
      const res = await api.updatePropertyStatus(rejectDialog.property.id, "rejected", rejectReason);
      if (res.success) {
        toast.success(`"${rejectDialog.property.title}" rechazada`);
        setRejectDialog({ open: false, property: null });
        setRejectReason("");
        fetchProperties();
      } else {
        toast.error(res.error?.message || "Error al rechazar");
      }
    } finally {
      setIsActioning(null);
    }
  };

  const handleUnpublish = async (property: Property) => {
    setIsActioning(property.id);
    try {
      const res = await api.updatePropertyStatus(property.id, "rejected", "__unpublished__");
      if (res.success) {
        toast.success(`"${property.title}" despublicada`);
        fetchProperties();
        fetchUnpublished();
      } else { toast.error(res.error?.message || "Error al despublicar"); }
    } finally { setIsActioning(null); }
  };

  const handleRepublish = async (property: Property) => {
    setIsActioning(property.id);
    try {
      const res = await api.updatePropertyStatus(property.id, "approved");
      if (res.success) {
        toast.success(`"${property.title}" republicada exitosamente`);
        fetchProperties();
        fetchUnpublished();
      } else { toast.error(res.error?.message || "Error al republicar"); }
    } finally { setIsActioning(null); }
  };

  const handleDelete = async () => {
    if (!deleteDialog.property) return;
    setIsActioning(deleteDialog.property.id);
    try {
      await api.deleteProperty(deleteDialog.property.id);
      toast.success(`"${deleteDialog.property.title}" eliminada`);
      setDeleteDialog({ open: false, property: null });
      fetchProperties();
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : "Error al eliminar");
    } finally {
      setIsActioning(null);
    }
  };

  const totalProperties = pagination?.total ?? properties.length;
  const approvedCount = properties.filter(p => p.status === "approved").length;
  const pendingCount = properties.filter(p => p.status === "pending").length;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Gestión de Propiedades</h1>
        <p className="text-muted-foreground mt-1">Administra todas las propiedades de la plataforma</p>
      </div>

      {/* Stats */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card><CardHeader className="pb-2"><CardTitle className="text-sm font-medium text-muted-foreground">Total</CardTitle></CardHeader><CardContent><div className="text-2xl font-bold">{totalProperties}</div></CardContent></Card>
        <Card><CardHeader className="pb-2"><CardTitle className="text-sm font-medium text-muted-foreground">Aprobadas</CardTitle></CardHeader><CardContent><div className="text-2xl font-bold text-green-600">{approvedCount}</div></CardContent></Card>
        <Card><CardHeader className="pb-2"><CardTitle className="text-sm font-medium text-muted-foreground">Pendientes</CardTitle></CardHeader><CardContent><div className="text-2xl font-bold text-yellow-600">{pendingCount}</div></CardContent></Card>
        <Card><CardHeader className="pb-2"><CardTitle className="text-sm font-medium text-muted-foreground">Despublicadas</CardTitle></CardHeader><CardContent><div className="text-2xl font-bold text-orange-600">{unpublishedProperties.length}</div></CardContent></Card>
      </div>

      <Tabs defaultValue="all">
        <TabsList>
          <TabsTrigger value="all">Todas las propiedades</TabsTrigger>
          <TabsTrigger value="unpublished">
            Despublicadas
            {unpublishedProperties.length > 0 && <span className="ml-2 bg-orange-500 text-white text-xs rounded-full px-1.5">{unpublishedProperties.length}</span>}
          </TabsTrigger>
        </TabsList>

        <TabsContent value="all">
      {/* Table */}
      <Card>
        <CardHeader>
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <CardTitle>Listado de Propiedades</CardTitle>
              <CardDescription>{totalProperties} propiedades en total</CardDescription>
            </div>
            <div className="flex gap-2 flex-wrap">
              <div className="relative w-full md:w-64">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Buscar propiedad..."
                  className="pl-9"
                  value={search}
                  onChange={e => { setSearch(e.target.value); setPage(1); }}
                />
              </div>
              <Select value={statusFilter} onValueChange={v => { setStatusFilter(v); setPage(1); }}>
                <SelectTrigger className="w-36">
                  <SelectValue placeholder="Estado" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos</SelectItem>
                  <SelectItem value="approved">Aprobadas</SelectItem>
                  <SelectItem value="pending">Pendientes</SelectItem>
                  <SelectItem value="rejected">Rechazadas</SelectItem>
                  <SelectItem value="rented">Alquiladas</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex flex-col items-center justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-primary mb-3" />
              <p className="text-muted-foreground">Cargando propiedades...</p>
            </div>
          ) : properties.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12">
              <Building className="h-12 w-12 text-muted-foreground/50 mb-4" />
              <h3 className="text-lg font-medium mb-2">No hay propiedades</h3>
              <p className="text-muted-foreground text-center">No se encontraron propiedades con los filtros aplicados</p>
            </div>
          ) : (
            <div className="space-y-4">
              {properties.map((property) => (
                <div key={property.id} className="flex flex-col lg:flex-row lg:items-center justify-between p-4 rounded-lg border gap-4 hover:bg-muted/30 transition-colors">
                  <div className="flex items-start gap-4">
                    <div className="h-16 w-16 rounded-lg bg-muted flex items-center justify-center shrink-0 overflow-hidden">
                      {property.mainImage || property.images?.[0] ? (
                        <img src={property.mainImage || property.images[0]} alt={property.title} className="h-full w-full object-cover" />
                      ) : (
                        <Building className="h-8 w-8 text-muted-foreground" />
                      )}
                    </div>
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <h4 className="font-medium">{property.title}</h4>
                        {getStatusBadge(property.status)}
                      </div>
                      <div className="flex flex-wrap items-center gap-4 text-sm text-muted-foreground">
                        <span className="flex items-center gap-1"><MapPin className="h-3 w-3" />{property.location}</span>
                        {property.bedrooms > 0 && <span className="flex items-center gap-1"><Bed className="h-3 w-3" />{property.bedrooms} hab.</span>}
                        <span className="flex items-center gap-1"><Eye className="h-3 w-3" />{property.views} vistas</span>
                      </div>
                      <p className="text-xs text-muted-foreground mt-1">
                        Propietario: <span className="font-medium">{property.author?.name || `#${property.authorId}`}</span>
                        {property.rejectionReason && <span className="text-red-600 ml-2">Motivo rechazo: {property.rejectionReason}</span>}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-4 ml-20 lg:ml-0">
                    <span className="text-lg font-bold text-primary">{rate ? formatDualPriceShort(property.price, usdToCop(property.price, rate.usdToCop), 'mes') : `$${property.price}/mes`}</span>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon" disabled={isActioning === property.id}>
                          {isActioning === property.id ? <Loader2 className="h-4 w-4 animate-spin" /> : <MoreVertical className="h-4 w-4" />}
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={() => window.open(`/propiedades/${property.id}`, "_blank")}>
                          <Eye className="h-4 w-4 mr-2" />Ver propiedad
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => { setAssignDialog({ open: true, property }); setSelectedOperator(property.moderatorId ? String(property.moderatorId) : ""); }}>
                          <UserCog className="h-4 w-4 mr-2" />Asignar moderador
                        </DropdownMenuItem>
                        {property.status === "pending" && (
                          <>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem className="text-green-600" onClick={() => handleApprove(property)}>
                              <CheckCircle className="h-4 w-4 mr-2" />Aprobar
                            </DropdownMenuItem>
                            <DropdownMenuItem className="text-orange-600" onClick={() => setRejectDialog({ open: true, property })}>
                              <XCircle className="h-4 w-4 mr-2" />Rechazar
                            </DropdownMenuItem>
                          </>
                        )}
                        {property.status === "approved" && (
                          <>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem className="text-orange-600" onClick={() => handleUnpublish(property)}>
                              <EyeOff className="h-4 w-4 mr-2" />Despublicar
                            </DropdownMenuItem>
                          </>
                        )}
                        <DropdownMenuSeparator />
                        <DropdownMenuItem className="text-destructive" onClick={() => setDeleteDialog({ open: true, property })}>
                          <Trash2 className="h-4 w-4 mr-2" />Eliminar
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Pagination */}
          {pagination && pagination.totalPages > 1 && (
            <div className="flex items-center justify-between mt-6 pt-4 border-t">
              <p className="text-sm text-muted-foreground">
                Página {pagination.page} de {pagination.totalPages} — {pagination.total} propiedades
              </p>
              <div className="flex gap-2">
                <Button variant="outline" size="sm" disabled={page <= 1} onClick={() => setPage(p => p - 1)}>Anterior</Button>
                <Button variant="outline" size="sm" disabled={page >= pagination.totalPages} onClick={() => setPage(p => p + 1)}>Siguiente</Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
        </TabsContent>

        {/* DESPUBLICADAS */}
        <TabsContent value="unpublished">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <EyeOff className="h-5 w-5 text-orange-500" />Propiedades Despublicadas
              </CardTitle>
              <CardDescription>Estas propiedades no son visibles para los usuarios pero sus datos se conservan</CardDescription>
            </CardHeader>
            <CardContent>
              {isLoadingUnpublished ? (
                <div className="flex justify-center py-10"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>
              ) : unpublishedProperties.length === 0 ? (
                <div className="text-center py-10 text-muted-foreground">
                  <EyeOff className="h-10 w-10 mx-auto mb-2 opacity-40" />
                  <p>No hay propiedades despublicadas</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {unpublishedProperties.map(property => (
                    <div key={property.id} className="flex flex-col lg:flex-row lg:items-center justify-between p-4 rounded-lg border border-orange-100 bg-orange-50/30 gap-4">
                      <div className="flex items-start gap-4">
                        <div className="h-14 w-14 rounded-lg bg-muted flex items-center justify-center shrink-0 overflow-hidden">
                          {property.mainImage || property.images?.[0] ? (
                            <img src={property.mainImage || property.images[0]} alt={property.title} className="h-full w-full object-cover" />
                          ) : (
                            <Building className="h-6 w-6 text-muted-foreground" />
                          )}
                        </div>
                        <div>
                          <h4 className="font-medium">{property.title}</h4>
                          <div className="flex items-center gap-3 text-sm text-muted-foreground mt-1">
                            <span className="flex items-center gap-1"><MapPin className="h-3 w-3" />{property.location}</span>
                          </div>
                          <p className="text-xs text-muted-foreground mt-1">
                            Propietario: <span className="font-medium">{property.author?.name || `#${property.authorId}`}</span>
                          </p>
                        </div>
                      </div>
                      <Button
                        size="sm"
                        className="bg-green-600 hover:bg-green-700 shrink-0"
                        disabled={isActioning === property.id}
                        onClick={() => handleRepublish(property)}
                      >
                        {isActioning === property.id
                          ? <Loader2 className="h-4 w-4 animate-spin mr-2" />
                          : <RotateCcw className="h-4 w-4 mr-2" />}
                        Republicar
                      </Button>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Reject dialog */}
      <Dialog open={rejectDialog.open} onOpenChange={open => { if (!open) { setRejectDialog({ open: false, property: null }); setRejectReason(""); } }}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Rechazar propiedad</DialogTitle>
            <DialogDescription>
              Indica el motivo de rechazo para <span className="font-medium">"{rejectDialog.property?.title}"</span>. El propietario recibirá esta información.
            </DialogDescription>
          </DialogHeader>
          <Textarea
            placeholder="Motivo del rechazo..."
            value={rejectReason}
            onChange={e => setRejectReason(e.target.value)}
            className="min-h-[100px]"
          />
          <DialogFooter>
            <Button variant="outline" onClick={() => { setRejectDialog({ open: false, property: null }); setRejectReason(""); }}>Cancelar</Button>
            <Button variant="destructive" onClick={handleReject} disabled={!rejectReason.trim() || isActioning !== null}>
              {isActioning !== null ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <XCircle className="h-4 w-4 mr-2" />}
              Rechazar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Assign moderator dialog */}
      <Dialog open={assignDialog.open} onOpenChange={open => { if (!open) { setAssignDialog({ open: false, property: null }); setSelectedOperator(""); } }}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Asignar moderador</DialogTitle>
            <DialogDescription>
              Selecciona un operador para moderar <span className="font-medium">"{assignDialog.property?.title}"</span>.
            </DialogDescription>
          </DialogHeader>
          <Select value={selectedOperator} onValueChange={setSelectedOperator}>
            <SelectTrigger>
              <SelectValue placeholder="Seleccionar operador..." />
            </SelectTrigger>
            <SelectContent>
              {operators.map(op => (
                <SelectItem key={op.id} value={String(op.id)}>{op.name} ({op.email})</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <DialogFooter>
            <Button variant="outline" onClick={() => { setAssignDialog({ open: false, property: null }); setSelectedOperator(""); }}>Cancelar</Button>
            <Button onClick={handleAssign} disabled={!selectedOperator || isActioning !== null}>
              {isActioning !== null ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <UserCog className="h-4 w-4 mr-2" />}
              Asignar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete dialog */}
      <Dialog open={deleteDialog.open} onOpenChange={open => { if (!open) setDeleteDialog({ open: false, property: null }); }}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Eliminar propiedad</DialogTitle>
            <DialogDescription>
              ¿Eliminar permanentemente <span className="font-medium">"{deleteDialog.property?.title}"</span>? Esta acción no se puede deshacer.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteDialog({ open: false, property: null })}>Cancelar</Button>
            <Button variant="destructive" onClick={handleDelete} disabled={isActioning !== null}>
              {isActioning !== null ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Trash2 className="h-4 w-4 mr-2" />}
              Eliminar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default PropertiesSection;
