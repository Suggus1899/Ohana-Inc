import { useState, useEffect, useCallback } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import {
  Dialog, DialogContent, DialogDescription,
  DialogFooter, DialogHeader, DialogTitle,
} from "@/components/ui/dialog";
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem,
  DropdownMenuSeparator, DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Megaphone, Search, Plus, Pencil, Trash2, MoreVertical,
  Calendar, Users, Loader2, RefreshCw,
} from "lucide-react";
import { api, Announcement } from "@/services/api";
import { toast } from "sonner";

const EMPTY_FORM = { title: "", content: "", targetAudience: "all", status: "draft", expiresAt: "" };

const getStatusBadge = (status: string) => {
  switch (status) {
    case "active": return <Badge className="bg-green-100 text-green-800 hover:bg-green-100">Activo</Badge>;
    case "draft": return <Badge variant="secondary">Borrador</Badge>;
    case "expired": return <Badge variant="outline" className="text-muted-foreground">Expirado</Badge>;
    default: return null;
  }
};

const getAudienceBadge = (audience: string) => {
  switch (audience) {
    case "all": return <Badge variant="outline">Todos</Badge>;
    case "clients": return <Badge variant="outline" className="border-blue-300 text-blue-700">Clientes</Badge>;
    case "operators": return <Badge variant="outline" className="border-orange-300 text-orange-700">Operadores</Badge>;
    case "owners": return <Badge variant="outline" className="border-purple-300 text-purple-700">Propietarios</Badge>;
    default: return null;
  }
};

const AnnouncementsSection = () => {
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [isActioning, setIsActioning] = useState(false);

  const [formOpen, setFormOpen] = useState(false);
  const [editTarget, setEditTarget] = useState<Announcement | null>(null);
  const [form, setForm] = useState({ ...EMPTY_FORM });

  const [deleteTarget, setDeleteTarget] = useState<Announcement | null>(null);

  const fetchAnnouncements = useCallback(async () => {
    setIsLoading(true);
    try {
      const res = await api.getAnnouncements({ search: search || undefined });
      if (res.success && res.data) setAnnouncements(res.data.announcements);
    } catch {
      toast.error("No se pudieron cargar los anuncios");
    } finally {
      setIsLoading(false);
    }
  }, [search]);

  useEffect(() => { fetchAnnouncements(); }, [fetchAnnouncements]);

  const openCreate = () => {
    setEditTarget(null);
    setForm({ ...EMPTY_FORM });
    setFormOpen(true);
  };

  const openEdit = (a: Announcement) => {
    setEditTarget(a);
    setForm({
      title: a.title,
      content: a.content,
      targetAudience: a.targetAudience,
      status: a.status,
      expiresAt: a.expiresAt ? a.expiresAt.split("T")[0] : "",
    });
    setFormOpen(true);
  };

  const handleSave = async () => {
    if (!form.title.trim() || !form.content.trim()) {
      toast.error("Título y contenido son requeridos");
      return;
    }
    setIsActioning(true);
    try {
      const payload = {
        title: form.title.trim(),
        content: form.content.trim(),
        targetAudience: form.targetAudience,
        status: form.status,
        expiresAt: form.expiresAt || undefined,
      };
      let res;
      if (editTarget) {
        res = await api.updateAnnouncement(editTarget.id, payload);
        if (res.success) toast.success("Anuncio actualizado");
      } else {
        res = await api.createAnnouncement(payload);
        if (res.success) toast.success("Anuncio creado");
      }
      if (res?.success) {
        setFormOpen(false);
        fetchAnnouncements();
      }
    } catch {
      toast.error("Error al guardar el anuncio");
    } finally {
      setIsActioning(false);
    }
  };

  const handlePublish = async (a: Announcement) => {
    setIsActioning(true);
    try {
      const res = await api.publishAnnouncement(a.id);
      if (res.success) {
        toast.success(`"${a.title}" publicado`);
        fetchAnnouncements();
      }
    } catch {
      toast.error("Error al publicar el anuncio");
    } finally {
      setIsActioning(false);
    }
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    setIsActioning(true);
    try {
      const res = await api.deleteAnnouncement(deleteTarget.id);
      if (res.success) {
        toast.success(`"${deleteTarget.title}" eliminado`);
        setDeleteTarget(null);
        fetchAnnouncements();
      }
    } catch {
      toast.error("Error al eliminar el anuncio");
    } finally {
      setIsActioning(false);
    }
  };

  const activeCount = announcements.filter(a => a.status === "active").length;
  const draftCount = announcements.filter(a => a.status === "draft").length;

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold">Anuncios del Sistema</h1>
          <p className="text-muted-foreground mt-1">
            Crea y gestiona anuncios para los usuarios de la plataforma
          </p>
        </div>
        <Button variant="outline" size="sm" onClick={fetchAnnouncements} disabled={isLoading}>
          <RefreshCw className={`h-4 w-4 mr-2 ${isLoading ? "animate-spin" : ""}`} />
          Actualizar
        </Button>
      </div>

      {/* Stats */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardContent className="p-6 flex items-center gap-4">
            <div className="p-3 rounded-lg bg-green-50">
              <Megaphone className="h-6 w-6 text-green-600" />
            </div>
            <div>
              <p className="text-2xl font-bold">{activeCount}</p>
              <p className="text-sm text-muted-foreground">Anuncios Activos</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6 flex items-center gap-4">
            <div className="p-3 rounded-lg bg-gray-50">
              <Pencil className="h-6 w-6 text-gray-600" />
            </div>
            <div>
              <p className="text-2xl font-bold">{draftCount}</p>
              <p className="text-sm text-muted-foreground">Borradores</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6 flex items-center gap-4">
            <div className="p-3 rounded-lg bg-blue-50">
              <Users className="h-6 w-6 text-blue-600" />
            </div>
            <div>
              <p className="text-2xl font-bold">{announcements.length}</p>
              <p className="text-sm text-muted-foreground">Total Anuncios</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Announcements List */}
      <Card>
        <CardHeader>
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <CardTitle>Listado de Anuncios</CardTitle>
              <CardDescription>Gestiona los anuncios del sistema</CardDescription>
            </div>
            <div className="flex gap-2">
              <div className="relative w-full md:w-64">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Buscar anuncio..."
                  className="pl-9"
                  value={search}
                  onChange={e => setSearch(e.target.value)}
                />
              </div>
              <Button onClick={openCreate}>
                <Plus className="h-4 w-4 mr-2" />
                Crear Anuncio
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
          ) : announcements.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
              <Megaphone className="h-12 w-12 opacity-30 mb-4" />
              <p className="text-lg font-medium">No hay anuncios</p>
              <p className="text-sm">{search ? "No hay resultados para tu búsqueda" : "Crea el primer anuncio con el botón de arriba"}</p>
            </div>
          ) : (
            <div className="space-y-4">
              {announcements.map((a) => (
                <div key={a.id} className="p-4 rounded-lg border hover:shadow-sm transition-all">
                  <div className="flex flex-col lg:flex-row lg:items-start justify-between gap-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2 flex-wrap">
                        <h4 className="font-semibold">{a.title}</h4>
                        {getStatusBadge(a.status)}
                        {getAudienceBadge(a.targetAudience)}
                      </div>
                      <p className="text-sm text-muted-foreground mb-3 line-clamp-2">{a.content}</p>
                      <div className="flex items-center gap-4 text-sm text-muted-foreground flex-wrap">
                        <span className="flex items-center gap-1">
                          <Calendar className="h-4 w-4" />
                          Creado: {new Date(a.createdAt).toLocaleDateString("es-VE")}
                        </span>
                        {a.expiresAt && (
                          <span className="flex items-center gap-1">
                            Expira: {new Date(a.expiresAt).toLocaleDateString("es-VE")}
                          </span>
                        )}
                        {a.createdBy && (
                          <span className="text-xs">por {a.createdBy.name}</span>
                        )}
                      </div>
                    </div>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon" disabled={isActioning}>
                          <MoreVertical className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={() => openEdit(a)}>
                          <Pencil className="h-4 w-4 mr-2" />
                          Editar
                        </DropdownMenuItem>
                        {a.status === "draft" && (
                          <DropdownMenuItem className="text-green-600" onClick={() => handlePublish(a)}>
                            <Megaphone className="h-4 w-4 mr-2" />
                            Publicar
                          </DropdownMenuItem>
                        )}
                        <DropdownMenuSeparator />
                        <DropdownMenuItem className="text-destructive" onClick={() => setDeleteTarget(a)}>
                          <Trash2 className="h-4 w-4 mr-2" />
                          Eliminar
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Dialog Crear / Editar */}
      <Dialog open={formOpen} onOpenChange={setFormOpen}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>{editTarget ? "Editar Anuncio" : "Crear Anuncio"}</DialogTitle>
            <DialogDescription>
              {editTarget ? "Modifica los datos del anuncio" : "Completa los campos para publicar o guardar como borrador"}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-1">
              <Label>Título</Label>
              <Input
                placeholder="Título del anuncio"
                value={form.title}
                onChange={e => setForm(f => ({ ...f, title: e.target.value }))}
              />
            </div>
            <div className="space-y-1">
              <Label>Contenido</Label>
              <Textarea
                placeholder="Escribe el mensaje del anuncio..."
                value={form.content}
                onChange={e => setForm(f => ({ ...f, content: e.target.value }))}
                rows={4}
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1">
                <Label>Audiencia</Label>
                <Select value={form.targetAudience} onValueChange={v => setForm(f => ({ ...f, targetAudience: v }))}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todos</SelectItem>
                    <SelectItem value="clients">Clientes</SelectItem>
                    <SelectItem value="operators">Operadores</SelectItem>
                    <SelectItem value="owners">Propietarios</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1">
                <Label>Estado</Label>
                <Select value={form.status} onValueChange={v => setForm(f => ({ ...f, status: v }))}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="draft">Borrador</SelectItem>
                    <SelectItem value="active">Activo</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="space-y-1">
              <Label>Fecha de expiración (opcional)</Label>
              <Input
                type="date"
                value={form.expiresAt}
                onChange={e => setForm(f => ({ ...f, expiresAt: e.target.value }))}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setFormOpen(false)}>Cancelar</Button>
            <Button onClick={handleSave} disabled={isActioning}>
              {isActioning && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
              {editTarget ? "Guardar cambios" : "Crear"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Dialog Confirmar eliminación */}
      <Dialog open={!!deleteTarget} onOpenChange={open => { if (!open) setDeleteTarget(null); }}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Eliminar Anuncio</DialogTitle>
            <DialogDescription>
              ¿Estás seguro de eliminar <span className="font-semibold">"{deleteTarget?.title}"</span>? Esta acción no se puede deshacer.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteTarget(null)}>Cancelar</Button>
            <Button variant="destructive" onClick={handleDelete} disabled={isActioning}>
              {isActioning && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
              Eliminar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default AnnouncementsSection;
