import { useState, useEffect, useCallback, memo } from "react";
import { toast } from "sonner";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import {
  Building, Plus, Search, Eye, MoreVertical, MapPin, Bed, Bath, Maximize,
  Loader2, AlertCircle, Pencil, Trash2, Video, ChevronLeft, ChevronRight, ArrowLeft,
  Send, Filter, CheckCircle, ChevronsLeft, ChevronsRight
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { CreatePropertyForm } from "./CreatePropertyForm";
import { EditPropertyDialog } from "./EditPropertyDialog";
import api, { Property } from "@/services/api";
import { cn } from "@/lib/utils";
import { useExchangeRate } from "../../../contexts/ExchangeRateContext";
import { usdToVes, formatDualPrice } from "../../../utils/formatPrice";
import { DualPrice } from "../../../components/common/DualPrice";
import { AmenityGrid } from "@/components/common/AmenityCard";

const getStatusBadge = (status: string) => {
  switch (status) {
    case "approved":
      return <Badge className="bg-green-100 text-green-800 hover:bg-green-100">Publicada</Badge>;
    case "pending":
      return <Badge className="bg-yellow-100 text-yellow-800 hover:bg-yellow-100">Pendiente</Badge>;
    case "rejected":
      return <Badge className="bg-red-100 text-red-800 hover:bg-red-100">Rechazada</Badge>;
    case "rented":
      return <Badge className="bg-blue-100 text-blue-800 hover:bg-blue-100">Alquilada</Badge>;
    case "sold":
      return <Badge className="bg-purple-100 text-purple-800 hover:bg-purple-100">Vendida</Badge>;
    default:
      return <Badge variant="outline">{status}</Badge>;
  }
};

interface OwnerPropertyCardProps {
  property: Property;
  publishingId: number | null;
  onViewDetails: (property: Property) => void;
  onEdit: (property: Property) => void;
  onPublish: (propertyId: number) => void;
  onDelete: (propertyId: number) => void;
}

const OwnerPropertyCard = memo(({ property, publishingId, onViewDetails, onEdit, onPublish, onDelete }: OwnerPropertyCardProps) => {
  const { rate, loading: rateLoading } = useExchangeRate();
  const getStatusBadgeInline = (status: string) => {
    switch (status) {
      case "approved":
        return <Badge className="bg-green-100 text-green-800 hover:bg-green-100 text-[10px] sm:text-xs px-1.5 py-0 h-5">Publicada</Badge>;
      case "pending":
        return <Badge className="bg-yellow-100 text-yellow-800 hover:bg-yellow-100 text-[10px] sm:text-xs px-1.5 py-0 h-5">Pendiente</Badge>;
      case "rejected":
        return <Badge className="bg-red-100 text-red-800 hover:bg-red-100 text-[10px] sm:text-xs px-1.5 py-0 h-5">Rechazada</Badge>;
      case "rented":
        return <Badge className="bg-blue-100 text-blue-800 hover:bg-blue-100 text-[10px] sm:text-xs px-1.5 py-0 h-5">Alquilada</Badge>;
      case "sold":
        return <Badge className="bg-purple-100 text-purple-800 hover:bg-purple-100 text-[10px] sm:text-xs px-1.5 py-0 h-5">Vendida</Badge>;
      default:
        return <Badge variant="outline" className="text-[10px] sm:text-xs px-1.5 py-0 h-5">{status}</Badge>;
    }
  };

  return (
    <div className="flex flex-col md:flex-row md:items-center justify-between p-3 sm:p-4 rounded-lg border gap-2 md:gap-4 hover:bg-gray-50 transition-colors">
      <div className="flex items-start gap-3 flex-1 min-w-0">
        <div className="h-12 sm:h-16 w-12 sm:w-16 rounded-lg bg-muted flex items-center justify-center shrink-0 overflow-hidden">
          {property.images?.[0] ? (
            <img
              src={property.images[0]}
              alt={property.title}
              className="w-full h-full object-cover"
            />
          ) : (
            <Building className="h-6 w-6 sm:h-8 sm:w-8 text-muted-foreground" />
          )}
        </div>
        <div className="flex-1 min-w-0 space-y-0.5">
          <div className="flex items-center gap-1.5 flex-wrap">
            <h4 className="font-medium text-sm sm:text-base truncate">{property.title}</h4>
            {getStatusBadgeInline(property.status)}
            {property.type === 'Residencia' && (property as any).availableRooms === 0 && (
              <Badge variant="destructive" className="text-[10px] sm:text-xs px-1.5 py-0 h-5">Ocupada</Badge>
            )}
          </div>
          <div className="flex items-center gap-1 text-xs text-muted-foreground">
            <MapPin className="h-3 w-3 shrink-0" />
            <span className="truncate">{property.location}</span>
          </div>
          <div className="flex flex-wrap items-center gap-x-3 gap-y-0.5 text-xs text-muted-foreground">
            <span className="text-[10px] sm:text-xs font-medium text-muted-foreground/70 uppercase tracking-wide">{property.type}</span>
            <span className="flex items-center gap-1"><Bed className="h-3 w-3 shrink-0" /> {property.bedrooms} {property.type === 'Residencia' ? 'cuartos' : 'hab.'}</span>
            <span className="flex items-center gap-1"><Eye className="h-3 w-3 shrink-0" /> {(property as any).views ?? 0} vistas</span>
          </div>
        </div>
      </div>
      <div className="flex items-center gap-4">
        {rate && !rateLoading
          ? <DualPrice usd={Number(property.price)} vesRate={rate.usdToVes} period={(property as any).priceType === 'daily' ? 'día' : 'mes'} variant="inline" />
          : <span className="text-lg font-bold text-primary">${Number(property.price).toLocaleString()}/{ (property as any).priceType === 'daily' ? 'día' : 'mes'}</span>}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon" className="h-7 w-7 md:h-9 md:w-9">
              <MoreVertical className="h-3.5 w-3.5 md:h-4 md:w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="text-sm">
            <DropdownMenuItem onClick={() => onViewDetails(property)}>
              <Eye className="h-4 w-4 mr-2" /> Ver detalles
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => onEdit(property)}>
              <Pencil className="h-4 w-4 mr-2" /> Editar
            </DropdownMenuItem>
            {property.status === 'pending' && (
              <DropdownMenuItem onClick={() => onPublish(property.id)} disabled={publishingId === property.id}>
                {publishingId === property.id ? (
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                ) : (
                  <Send className="h-4 w-4 mr-2" />
                )}
                Publicar propiedad
              </DropdownMenuItem>
            )}
            <DropdownMenuItem onClick={() => onDelete(property.id)} className="text-red-600 focus:text-red-600">
              <Trash2 className="h-4 w-4 mr-2" /> Eliminar
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </div>
  );
});

const LIMIT = 12;

const PropertiesSection = () => {
  const { rate, loading: rateLoading } = useExchangeRate();
  const [properties, setProperties] = useState<Property[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalCount, setTotalCount] = useState(0);
  const [deleteId, setDeleteId] = useState<number | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [detailProperty, setDetailProperty] = useState<Property | null>(null);
  const [detailImageIndex, setDetailImageIndex] = useState(0);
  const [editProperty, setEditProperty] = useState<Property | null>(null);
  const [showEditDialog, setShowEditDialog] = useState(false);
  const [publishingId, setPublishingId] = useState<number | null>(null);

  const fetchProperties = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await api.getMyProperties(page, LIMIT);
      setProperties(data.properties);
      setTotalPages(data.pages);
      setTotalCount(data.total);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Error cargando propiedades');
    } finally {
      setLoading(false);
    }
  }, [page]);

  useEffect(() => { fetchProperties(); }, [fetchProperties]);

  const handleDelete = async () => {
    if (!deleteId) return;
    setDeleting(true);
    try {
      await api.deleteProperty(deleteId);
      setDeleteId(null);
      fetchProperties();
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Error al eliminar';
      toast.error(message);
    } finally {
      setDeleting(false);
    }
  };

  const [activeFilter, setActiveFilter] = useState<string>('all');

  const handlePublish = async (propertyId: number) => {
    setPublishingId(propertyId);
    try {
      await api.publishProperty(propertyId);
      fetchProperties();
    } catch (err: unknown) {
      alert(err instanceof Error ? err.message : 'Error al publicar');
    } finally {
      setPublishingId(null);
    }
  };

  const filtered = properties.filter((p) => {
    const matchesSearch = p.title.toLowerCase().includes(search.toLowerCase()) ||
      p.location?.toLowerCase().includes(search.toLowerCase());
    
    if (!matchesSearch) return false;
    
    switch (activeFilter) {
      case 'approved':
        return p.status === 'approved';
      case 'pending':
        return p.status === 'pending';
      case 'rented':
        return p.status === 'rented' || p.status === 'sold';
      default:
        return true;
    }
  });

  const approved = properties.filter((p) => p.status === 'approved').length;
  const pending = properties.filter((p) => p.status === 'pending').length;
  const rented = properties.filter((p) => p.status === 'rented' || p.status === 'sold').length;

  const handleEditOpen = (property: Property) => {
    setDetailProperty(null);
    setShowCreateForm(false);
    setEditProperty(property);
    setShowEditDialog(true);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold">Mis Propiedades</h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            Gestiona todas tus propiedades
          </p>
        </div>
        {!detailProperty && !showEditDialog && !showCreateForm && (
          <Button size="sm" className="w-full sm:w-auto" onClick={() => { setShowCreateForm(true); setDetailProperty(null); setShowEditDialog(false); }}>
            <Plus className="h-4 w-4 mr-2" />
            Nueva Propiedad
          </Button>
        )}
      </div>

      {!detailProperty && !showCreateForm && !showEditDialog ? (
        <>
      {/* Stats */}
      <div className="grid grid-cols-3 gap-2 sm:gap-4">
        <div className="bg-white rounded-lg border p-3 sm:p-4 text-center">
          <p className="text-[10px] sm:text-sm font-medium text-muted-foreground mb-0.5 sm:mb-1">Publicadas</p>
          <p className="text-lg sm:text-2xl font-bold text-green-600">{approved}</p>
        </div>
        <div className="bg-white rounded-lg border p-3 sm:p-4 text-center">
          <p className="text-[10px] sm:text-sm font-medium text-muted-foreground mb-0.5 sm:mb-1">Pendientes</p>
          <p className="text-lg sm:text-2xl font-bold text-yellow-600">{pending}</p>
        </div>
        <div className="bg-white rounded-lg border p-3 sm:p-4 text-center">
          <p className="text-[10px] sm:text-sm font-medium text-muted-foreground mb-0.5 sm:mb-1">Alq./Vend.</p>
          <p className="text-lg sm:text-2xl font-bold text-blue-600">{rented}</p>
        </div>
      </div>

      {/* Properties List */}
      <Card>
        <CardHeader className="p-3 sm:p-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <CardTitle className="text-base sm:text-lg">Listado de Propiedades</CardTitle>
              <CardDescription className="text-xs sm:text-sm">{totalCount} {totalCount === 1 ? 'propiedad' : 'propiedades'} en total</CardDescription>
            </div>
            <div className="relative w-full sm:w-64">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Buscar propiedad..."
                className="pl-9 h-9 sm:h-10 text-sm"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-3 sm:p-6 pt-0 sm:pt-0">
          {loading ? (
            <div className="flex items-center justify-center py-8 sm:py-12">
              <Loader2 className="h-6 w-6 sm:h-8 sm:w-8 animate-spin text-muted-foreground" />
            </div>
          ) : error ? (
            <div className="flex items-center justify-center gap-2 py-8 sm:py-12 text-red-600">
              <AlertCircle className="h-5 w-5" />
              <span className="text-sm">{error}</span>
            </div>
          ) : filtered.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-8 sm:py-12">
              <Building className="h-10 w-10 sm:h-12 sm:w-12 text-muted-foreground/50 mb-3 sm:mb-4" />
              <h3 className="text-base sm:text-lg font-medium mb-1 sm:mb-2">
                {search ? 'Sin resultados' : 'No tienes propiedades'}
              </h3>
              <p className="text-sm text-muted-foreground text-center mb-3 sm:mb-4">
                {search ? 'Intenta con otra búsqueda' : 'Publica tu primera propiedad'}
              </p>
              {!search && !detailProperty && !showEditDialog && !showCreateForm && (
          <Button size="sm" onClick={() => { setShowCreateForm(true); setDetailProperty(null); setShowEditDialog(false); }}>
            <Plus className="h-4 w-4 mr-2" />
            Nueva Propiedad
          </Button>
)}
            </div>
          ) : (
            <div>
              <div className="space-y-2 sm:space-y-4">
                {filtered.map((property) => (
                  <OwnerPropertyCard
                    key={property.id}
                    property={property}
                    publishingId={publishingId}
                    onViewDetails={(p) => { setDetailProperty(p); setDetailImageIndex(0); }}
                    onEdit={handleEditOpen}
                    onPublish={handlePublish}
                    onDelete={(id) => setDeleteId(id)}
                  />
                ))}
              </div>

              {totalPages > 1 && (
                <div className="mt-4 sm:mt-6 flex items-center justify-center gap-1">
                  <Button type="button" variant="outline" size="icon" className="h-8 w-8 sm:h-9 sm:w-9" disabled={page === 1} onClick={() => setPage(1)}>
                    <ChevronsLeft className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                  </Button>
                  <Button type="button" variant="outline" size="icon" className="h-8 w-8 sm:h-9 sm:w-9" disabled={page === 1} onClick={() => setPage(p => p - 1)}>
                    <ChevronLeft className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                  </Button>
                  <div className="flex items-center px-2 sm:px-3 text-xs sm:text-sm text-muted-foreground">
                    {page} / {totalPages}
                  </div>
                  <Button type="button" variant="outline" size="icon" className="h-8 w-8 sm:h-9 sm:w-9" disabled={page === totalPages} onClick={() => setPage(p => p + 1)}>
                    <ChevronRight className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                  </Button>
                  <Button type="button" variant="outline" size="icon" className="h-8 w-8 sm:h-9 sm:w-9" disabled={page === totalPages} onClick={() => setPage(totalPages)}>
                    <ChevronsRight className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                  </Button>
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Delete Confirmation */}
      <AlertDialog open={!!deleteId} onOpenChange={(open) => !open && setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>¿Eliminar propiedad?</AlertDialogTitle>
            <AlertDialogDescription>
              Esta acción no se puede deshacer. La propiedad se eliminará permanentemente.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={deleting}>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              disabled={deleting}
              className="bg-red-600 hover:bg-red-700"
            >
              {deleting ? 'Eliminando...' : 'Eliminar'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
        </>
      ) : detailProperty ? (
        <div className="border rounded-lg border-primary/20">
          <div className="flex items-center gap-2 sm:gap-3 px-3 sm:px-6 py-3 sm:py-4 border-b">
            <Button variant="ghost" size="icon" className="h-8 w-8 shrink-0" onClick={() => setDetailProperty(null)}>
              <ArrowLeft className="h-4 w-4 sm:h-5 sm:w-5" />
            </Button>
            <div className="min-w-0">
              <h2 className="text-base sm:text-xl font-bold truncate">{detailProperty.title}</h2>
              <div className="mt-0.5">{getStatusBadge(detailProperty.status)}</div>
            </div>
          </div>
          <div className="p-3 sm:p-6 space-y-4 sm:space-y-6">
            {/* Image Gallery */}
            {detailProperty.images && detailProperty.images.length > 0 && (
              <div className="relative rounded-lg sm:rounded-xl overflow-hidden bg-black h-48 sm:h-auto sm:aspect-video">
                <img
                  src={detailProperty.images[detailImageIndex]}
                  alt={`${detailProperty.title} - ${detailImageIndex + 1}`}
                  className="w-full h-full object-contain"
                />
                {detailProperty.images.length > 1 && (
                  <>
                    <button
                      onClick={() => setDetailImageIndex((i) => (i === 0 ? detailProperty.images.length - 1 : i - 1))}
                      className="absolute left-2 top-1/2 -translate-y-1/2 bg-black/50 hover:bg-black/70 text-white rounded-full p-1 sm:p-1.5 transition-colors"
                    >
                      <ChevronLeft className="h-4 w-4 sm:h-5 sm:w-5" />
                    </button>
                    <button
                      onClick={() => setDetailImageIndex((i) => (i === detailProperty.images.length - 1 ? 0 : i + 1))}
                      className="absolute right-2 top-1/2 -translate-y-1/2 bg-black/50 hover:bg-black/70 text-white rounded-full p-1 sm:p-1.5 transition-colors"
                    >
                      <ChevronRight className="h-4 w-4 sm:h-5 sm:w-5" />
                    </button>
                    <div className="absolute bottom-2 sm:bottom-3 left-1/2 -translate-x-1/2 bg-black/60 text-white text-[10px] sm:text-xs px-2 sm:px-3 py-0.5 sm:py-1 rounded-full">
                      {detailImageIndex + 1} / {detailProperty.images.length}
                    </div>
                  </>
                )}
              </div>
            )}

            {/* Video */}
            {(detailProperty as any).videoUrl && (
              <div className="rounded-lg sm:rounded-xl overflow-hidden bg-black">
                <video src={(detailProperty as any).videoUrl} controls className="w-full max-h-48 sm:max-h-64 object-contain" />
              </div>
            )}

            {/* Info Grid */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="bg-gray-50 rounded-lg p-3 text-center">
                <p className="text-2xl font-bold text-primary">{rate && !rateLoading ? formatDualPrice(Number(detailProperty.price), usdToVes(Number(detailProperty.price), rate.usdToVes)) : `$${Number(detailProperty.price).toLocaleString()}`}</p>
                <p className="text-xs text-muted-foreground">{detailProperty.priceType === 'daily' ? '/día' : '/mes'}</p>
              </div>
              <div className="bg-gray-50 rounded-lg p-3 text-center">
                <Bed className="h-5 w-5 mx-auto mb-1 text-muted-foreground" />
                <p className="font-semibold">{detailProperty.bedrooms}</p>
                <p className="text-xs text-muted-foreground">Habitaciones</p>
              </div>
              <div className="bg-gray-50 rounded-lg p-3 text-center">
                <Bath className="h-5 w-5 mx-auto mb-1 text-muted-foreground" />
                <p className="font-semibold">{detailProperty.bathrooms}</p>
                <p className="text-xs text-muted-foreground">Baños</p>
              </div>
              <div className="bg-gray-50 rounded-lg p-3 text-center">
                <Maximize className="h-5 w-5 mx-auto mb-1 text-muted-foreground" />
                <p className="font-semibold">{detailProperty.area} m²</p>
                <p className="text-xs text-muted-foreground">Área</p>
              </div>
            </div>
              {detailProperty.type === 'Residencia' && (
                <div className="bg-amber-50 rounded-lg p-2 sm:p-3 text-center">
                  <Bed className="h-4 w-4 sm:h-5 sm:w-5 mx-auto mb-0.5 sm:mb-1 text-amber-500" />
                  <p className="text-sm sm:text-base font-semibold text-amber-600">{detailProperty.occupiedRooms ?? 0}</p>
                  <p className="text-[10px] sm:text-xs text-muted-foreground">Ocupados</p>
                </div>
              )}

            {/* Details */}
            <div className="space-y-3 sm:space-y-4">
              <div>
                <h3 className="text-sm sm:text-base font-semibold mb-1">Descripción</h3>
                <p className="text-xs sm:text-sm text-muted-foreground leading-relaxed">{detailProperty.description}</p>
              </div>

              <div className="grid grid-cols-2 gap-2 sm:gap-4 text-xs sm:text-sm">
                <div>
                  <span className="text-muted-foreground">Tipo:</span>{' '}
                  <span className="font-medium">{detailProperty.type}</span>
                </div>
                <div>
                  <span className="text-muted-foreground">Operación:</span>{' '}
                  <span className="font-medium">{detailProperty.listingType}</span>
                </div>
                <div>
                  <span className="text-muted-foreground">Amueblado:</span>{' '}
                  <span className="font-medium">{detailProperty.furnished ? 'Sí' : 'No'}</span>
                </div>
                {detailProperty.floor != null && (
                  <div>
                    <span className="text-muted-foreground">Piso:</span>{' '}
                    <span className="font-medium">{detailProperty.floor}</span>
                  </div>
                )}
                <div>
                  <Eye className="h-3 w-3 sm:h-3.5 sm:w-3.5 inline mr-0.5 sm:mr-1 text-muted-foreground" />
                  <span className="text-muted-foreground">Vistas:</span>{' '}
                  <span className="font-medium">{detailProperty.views ?? 0}</span>
                </div>
              </div>

              {/* Features */}
              {detailProperty.features && detailProperty.features.length > 0 && (
                <div>
                  <h3 className="text-sm sm:text-base font-semibold mb-1">Características</h3>
                  <p className="text-xs text-muted-foreground mb-2">Servicios y comodidades incluidas</p>
                  <AmenityGrid features={detailProperty.features} />
                </div>
              )}

              {/* Location */}
              <div>
                <h3 className="text-sm sm:text-base font-semibold mb-1">Ubicación</h3>
                <p className="text-xs sm:text-sm text-muted-foreground">
                  <MapPin className="h-3 w-3 sm:h-3.5 sm:w-3.5 inline mr-0.5 sm:mr-1" />
                  {detailProperty.address}
                </p>
                {detailProperty.location && (
                  <p className="text-xs sm:text-sm text-muted-foreground mt-0.5 sm:ml-5">{detailProperty.location}</p>
                )}
              </div>
            </div>
          </div>
        </div>
      ) : showEditDialog && editProperty ? (
        <div className="border rounded-lg border-primary/20 flex flex-col">
          <div className="flex items-center gap-2 sm:gap-3 px-3 sm:px-6 py-3 sm:py-4 border-b shrink-0">
            <Button variant="ghost" size="icon" className="h-8 w-8 shrink-0" onClick={() => { setShowEditDialog(false); setEditProperty(null); }}>
              <ArrowLeft className="h-4 w-4 sm:h-5 sm:w-5" />
            </Button>
            <h2 className="text-base sm:text-xl font-bold">Editar Propiedad</h2>
          </div>
          <div className="flex-1 overflow-auto">
            <EditPropertyDialog
              property={editProperty}
              open={true}
              onOpenChange={() => {}}
              onSuccess={() => { setShowEditDialog(false); setEditProperty(null); fetchProperties(); }}
              inline
            />
          </div>
        </div>
      ) : (
        <div className="border rounded-lg border-primary/20 flex flex-col">
          <div className="flex items-center gap-2 sm:gap-3 px-3 sm:px-6 py-3 sm:py-4 border-b shrink-0">
            <Button variant="ghost" size="icon" className="h-8 w-8 shrink-0" onClick={() => setShowCreateForm(false)}>
              <ArrowLeft className="h-4 w-4 sm:h-5 sm:w-5" />
            </Button>
            <h2 className="text-base sm:text-xl font-bold">Nueva Propiedad</h2>
          </div>
          <div className="flex-1 overflow-auto scrollbar-hide">
            <CreatePropertyForm
              onSuccess={() => {
                setShowCreateForm(false);
                fetchProperties();
              }}
              onCancel={() => setShowCreateForm(false)}
            />
          </div>
        </div>
      )}
    </div>
  );
};

export default memo(PropertiesSection);
