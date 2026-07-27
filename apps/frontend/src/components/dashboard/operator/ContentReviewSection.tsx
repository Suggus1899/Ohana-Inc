import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Carousel, CarouselContent, CarouselItem, CarouselNext, CarouselPrevious } from "@/components/ui/carousel";
import { 
  Building, 
  Clock, 
  CheckCircle, 
  XCircle, 
  MapPin,
  DollarSign,
  Calendar,
  Loader2,
  History,
  Info,
  Eye,
  Bed,
  Bath,
  Square,
  Phone,
  Mail,
  Home,
  BadgeCheck,
} from "lucide-react";
import { useState, useEffect, useRef, useCallback } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { api, Property, ModerationStats, User as ApiUser } from "@/services/api";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";
import { exportToPDF } from "@/lib/pdf-export";
import { useExchangeRate } from "../../../contexts/ExchangeRateContext";
import { formatDualPrice, usdToCop } from "../../../utils/formatPrice";
import { AmenityGrid } from "@/components/common/AmenityCard";

interface PendingProperty {
  id: number;
  title: string;
  owner: string;
  location: string;
  price: number;
  submittedDate: string;
  type: string;
  description: string;
  status: 'pending' | 'approved' | 'rejected' | 'rented' | 'sold';
}

const ContentReviewSection = () => {
  const [isLoading, setIsLoading] = useState(true);
  const [properties, setProperties] = useState<PendingProperty[]>([]);
  const [historyProperties, setHistoryProperties] = useState<PendingProperty[]>([]);
  const [stats, setStats] = useState<ModerationStats | null>(null);
  const [currentUser, setCurrentUser] = useState<ApiUser | null>(null);
  const [rejectDialogOpen, setRejectDialogOpen] = useState(false);
  const [detailsDialogOpen, setDetailsDialogOpen] = useState(false);
  const [selectedProperty, setSelectedProperty] = useState<PendingProperty | null>(null);
  const [selectedPropertyDetails, setSelectedPropertyDetails] = useState<Property | null>(null);
  const [rejectReason, setRejectReason] = useState("");
  const [activeTab, setActiveTab] = useState("pending");
  const [isProcessing, setIsProcessing] = useState(false);
  const { toast } = useToast();
  const { rate } = useExchangeRate();
  const refreshRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const fetchData = useCallback(async () => {
    setIsLoading(true);
    try {
      const [userRes, statsRes, pendingRes] = await Promise.all([
        api.getCurrentUser(),
        api.getModerationStats(),
        api.getProperties({ status: 'pending' })
      ]);

      if (userRes.success && userRes.data) {
        setCurrentUser(userRes.data.user);
        // Fetch historical actions by this moderator
        const historyRes = await api.getProperties({ moderatorId: userRes.data.user.id });
        if (historyRes.success && historyRes.data) {
          setHistoryProperties(historyRes.data.properties.map((p: Property) => ({
            id: p.id,
            title: p.title,
            owner: p.author?.name || 'Propietario',
            location: p.location,
            price: p.price,
            submittedDate: new Date(p.updatedAt).toLocaleDateString(),
            type: p.type,
            description: p.description,
            status: p.status
          })));
        }
      }

      if (pendingRes.success && pendingRes.data) {
        setProperties(pendingRes.data.properties.map((p: Property) => ({
          id: p.id,
          title: p.title,
          owner: p.author?.name || 'Propietario',
          location: p.location,
          price: p.price,
          submittedDate: new Date(p.createdAt).toLocaleDateString(),
          type: p.type,
          description: p.description,
          status: p.status
        })));
      }

      if (statsRes.success && statsRes.data) {
        setStats(statsRes.data);
      }
    } catch (error) {
      console.error("Error fetching data:", error);
      toast({ title: "Error", description: "No se pudieron cargar los datos", variant: "destructive" });
    } finally {
      setIsLoading(false);
    }
  }, [toast]);

  useEffect(() => {
    fetchData();
    refreshRef.current = setInterval(fetchData, 30000);
    return () => { if (refreshRef.current) clearInterval(refreshRef.current); };
  }, [fetchData]);

  const handleApprove = async (property: PendingProperty) => {
    setIsProcessing(true);
    try {
      const response = await api.updatePropertyStatus(property.id, 'approved');
      if (response.success) {
        toast({ title: "Aprobada", description: `Propiedad "${property.title}" aprobada` });
        setProperties(prev => prev.filter(p => p.id !== property.id));
        fetchData();
      } else {
        const msg = ((response as Record<string, unknown>)?.error as { message?: string } | undefined)?.message || 'No se pudo aprobar la propiedad';
        toast({ title: "Error", description: msg, variant: "destructive" });
      }
    } catch (error: unknown) {
      console.error('[ContentReview] handleApprove error:', error);
      toast({ title: "Error", description: error instanceof Error ? error.message : "Error de servidor", variant: "destructive" });
    } finally {
      setIsProcessing(false);
    }
  };

  const handleReject = async () => {
    if (!selectedProperty) return;
    if (!rejectReason.trim()) {
      toast({ title: "Requerido", description: "Ingresa el motivo de rechazo", variant: "destructive" });
      return;
    }
    setIsProcessing(true);
    try {
      const response = await api.updatePropertyStatus(selectedProperty.id, 'rejected', rejectReason);
      if (response.success) {
        toast({ title: "Rechazada", description: `Propiedad "${selectedProperty.title}" rechazada`, variant: "destructive" });
        setProperties(prev => prev.filter(p => p.id !== selectedProperty.id));
        setRejectDialogOpen(false);
        setRejectReason("");
        setSelectedProperty(null);
        fetchData();
      } else {
        const msg = ((response as Record<string, unknown>)?.error as { message?: string } | undefined)?.message || 'No se pudo rechazar la propiedad';
        toast({ title: "Error", description: msg, variant: "destructive" });
      }
    } catch (error: unknown) {
      console.error('[ContentReview] handleReject error:', error);
      toast({ title: "Error", description: error instanceof Error ? error.message : "Error de servidor", variant: "destructive" });
    } finally {
      setIsProcessing(false);
    }
  };

  const handleExport = () => {
    const dataToExport = activeTab === 'pending' ? properties : historyProperties;
    const exportTitle = activeTab === 'pending' ? 'Propiedades Pendientes de Revisión' : 'Historial de Moderación de Contenido';
    const exportSubtitle = activeTab === 'pending' ? 'Listado de inmuebles esperando validación para publicación' : 'Registro de inmuebles aprobados y rechazados recientemente';
    
    exportToPDF({
      title: exportTitle,
      subtitle: exportSubtitle,
      operatorName: currentUser?.name || "Operador Habitas",
      stats: {
        total: dataToExport.length,
        approved: dataToExport.filter(p => p.status === 'approved').length,
        rejected: dataToExport.filter(p => p.status === 'rejected').length
      },
      headers: ["ID", "Título", "Propietario", "Ubicación", "Precio USD", "Precio COP", "Estado", "Fecha"],
      rows: dataToExport.map(p => {
        const copPrice = rate ? usdToCop(p.price, rate.usdToCop) : 0;
        return [
          p.id,
          p.title,
          p.owner,
          p.location,
          `$${p.price}`,
          `$ ${Math.round(copPrice).toLocaleString('es-CO')}`,
          p.status.toUpperCase(),
          p.submittedDate
        ];
      }),
      fileName: `moderacion_contenido_${activeTab}`
    });
  };

  const openRejectDialog = (property: PendingProperty) => {
    setSelectedProperty(property);
    setRejectDialogOpen(true);
  };

  const openDetailsDialog = async (property: PendingProperty) => {
    setSelectedProperty(property);
    setDetailsDialogOpen(true);
    
    // Fetch full property details
    const response = await api.getProperty(property.id);
    if (response.success && response.data) {
      setSelectedPropertyDetails(response.data.property);
    }
  };

  const renderPropertyItem = (property: PendingProperty, showActions: boolean = true) => (
    <div
      key={property.id}
      className={cn(
        "p-4 rounded-lg border hover:shadow-sm transition-all mb-4 last:mb-0",
        property.status === 'approved' ? "border-l-4 border-l-green-500 bg-green-50/20" : 
        property.status === 'rejected' ? "border-l-4 border-l-red-500 bg-red-50/20" : ""
      )}
    >
      <div className="flex flex-col lg:flex-row lg:items-start justify-between gap-4">
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-2">
            <h4 className="font-semibold text-lg">{property.title}</h4>
            <Badge variant="outline">{property.type}</Badge>
            {property.status !== 'pending' && (
              <Badge className={cn(
                property.status === 'approved' ? "bg-green-100 text-green-700 hover:bg-green-100" : "bg-red-100 text-red-700 hover:bg-red-100"
              )}>
                {property.status === 'approved' ? "Aprobada" : "Rechazada"}
              </Badge>
            )}
          </div>
          <p className="text-sm text-muted-foreground mb-3 line-clamp-2">
            {property.description}
          </p>
          <div className="flex flex-wrap items-center gap-4 text-sm text-muted-foreground">
            <span className="flex items-center gap-1">
              <MapPin className="h-4 w-4" />
              {property.location}
            </span>
            <span className="flex items-center gap-1">
              <DollarSign className="h-4 w-4" />
              {rate ? formatDualPrice(property.price, usdToCop(property.price, rate.usdToCop), 'mes') : `$${property.price}/mes`}
            </span>
            <span className="flex items-center gap-1">
              <Calendar className="h-4 w-4" />
              {property.status === 'pending' ? 'Recibida: ' : 'Moderada: '} {property.submittedDate}
            </span>
          </div>
          <p className="text-xs text-muted-foreground mt-2">
            Publicado por: <span className="font-medium">{property.owner}</span>
          </p>
        </div>
        
        {showActions && property.status === 'pending' && (
          <div className="flex items-center gap-2">
            <Button 
              size="sm" 
              variant="outline"
              onClick={() => openDetailsDialog(property)}
            >
              <Eye className="h-4 w-4 mr-1" />
              Ver Detalles
            </Button>
            <Button 
              size="sm" 
              variant="outline" 
              className="text-red-600 hover:text-red-700 hover:bg-red-50"
              onClick={() => openRejectDialog(property)}
              disabled={isProcessing}
            >
              <XCircle className="h-4 w-4 mr-1" />
              Rechazar
            </Button>
            <Button 
              size="sm" 
              className="bg-green-600 hover:bg-green-700"
              onClick={() => handleApprove(property)}
              disabled={isProcessing}
            >
              <CheckCircle className="h-4 w-4 mr-1" />
              {isProcessing ? 'Procesando...' : 'Aprobar'}
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
          <h1 className="text-3xl font-bold font-heading">Revisión de Contenido</h1>
          <p className="text-muted-foreground mt-1">
            Gestiona las publicaciones de propiedades y su estado de aprobación
          </p>
        </div>
        
        <Button 
          className="flex items-center gap-2 bg-red-600 hover:bg-red-700 text-white border-none shadow-sm"
          onClick={handleExport}
          disabled={isLoading || (activeTab === 'pending' ? properties.length === 0 : historyProperties.length === 0)}
        >
          <div className="bg-white/20 p-1 rounded text-white mr-1">
            <span className="text-[10px] font-bold leading-none">PDF</span>
          </div>
          <span className="hidden sm:inline font-semibold">Exportar Reporte</span>
        </Button>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <Card className="border-none shadow-md bg-zinc-50/50">
          <CardContent className="p-6 flex items-center gap-4">
            <div className="p-3 rounded-lg bg-yellow-50">
              <Clock className="h-6 w-6 text-yellow-600" />
            </div>
            <div>
              <p className="text-2xl font-bold">{stats?.pending.properties || 0}</p>
              <p className="text-sm text-muted-foreground">Pendientes Globales</p>
            </div>
          </CardContent>
        </Card>
        <Card className="border-none shadow-md bg-zinc-50/50">
          <CardContent className="p-6 flex items-center gap-4">
            <div className="p-3 rounded-lg bg-green-50">
              <CheckCircle className="h-6 w-6 text-green-600" />
            </div>
            <div>
              <p className="text-2xl font-bold">{stats?.today.propertiesApproved || 0}</p>
              <p className="text-sm text-muted-foreground">Tus Aprobadas Hoy</p>
            </div>
          </CardContent>
        </Card>
        <Card className="border-none shadow-md bg-zinc-50/50">
          <CardContent className="p-6 flex items-center gap-4">
            <div className="p-3 rounded-lg bg-red-50">
              <XCircle className="h-6 w-6 text-red-600" />
            </div>
            <div>
              <p className="text-2xl font-bold">{stats?.today.propertiesRejected || 0}</p>
              <p className="text-sm text-muted-foreground">Tus Rechazadas Hoy</p>
            </div>
          </CardContent>
        </Card>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <div className="flex items-center justify-between mb-4">
          <TabsList className="bg-zinc-100 p-1">
            <TabsTrigger value="pending" className="flex items-center gap-2">
              <Clock className="h-4 w-4" />
              Cola de Pendientes
              {properties.length > 0 && (
                <Badge variant="secondary" className="ml-1 h-5 min-w-5 flex items-center justify-center p-0 text-[10px]">
                  {properties.length}
                </Badge>
              )}
            </TabsTrigger>
            <TabsTrigger value="history" className="flex items-center gap-2">
              <History className="h-4 w-4" />
              Historial Reciente
            </TabsTrigger>
          </TabsList>
          
          <div className="hidden md:flex items-center gap-2 text-xs text-muted-foreground">
            <Info className="h-3 w-3" />
            Historial muestra las últimas acciones realizadas por vos
          </div>
        </div>

        <TabsContent value="pending">
          <Card className="border-none shadow-lg overflow-hidden">
            <CardHeader className="bg-white border-b">
              <CardTitle className="text-lg flex items-center gap-2">
                <Building className="h-5 w-5 text-primary" />
                Propiedades por Revisar
              </CardTitle>
              <CardDescription>
                Verificá los detalles antes de dar el visto bueno para publicación
              </CardDescription>
            </CardHeader>
            <CardContent className="p-6">
              {isLoading ? (
                <div className="flex justify-center py-20"><Loader2 className="h-10 w-10 animate-spin text-primary opacity-50" /></div>
              ) : properties.length === 0 ? (
                <div className="text-center py-20 bg-zinc-50 rounded-xl border-2 border-dashed">
                  <div className="inline-flex p-4 rounded-full bg-green-50 text-green-600 mb-4">
                    <CheckCircle className="h-8 w-8" />
                  </div>
                  <h3 className="text-lg font-semibold text-zinc-900">¡Todo al día!</h3>
                  <p className="text-muted-foreground max-w-xs mx-auto">
                    No hay propiedades esperando revisión en este momento. Buen trabajo.
                  </p>
                </div>
              ) : (
                <div className="space-y-0">
                  {properties.map(p => renderPropertyItem(p))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="history">
          <Card className="border-none shadow-lg overflow-hidden">
            <CardHeader className="bg-white border-b">
              <CardTitle className="text-lg flex items-center gap-2">
                <History className="h-5 w-5 text-primary" />
                Acciones Realizadas
              </CardTitle>
              <CardDescription>
                Registro de propiedades que has moderado recientemente
              </CardDescription>
            </CardHeader>
            <CardContent className="p-6">
              {isLoading ? (
                <div className="flex justify-center py-20"><Loader2 className="h-10 w-10 animate-spin text-primary opacity-50" /></div>
              ) : historyProperties.length === 0 ? (
                <div className="text-center py-20 bg-zinc-50 rounded-xl border-2 border-dashed">
                  <p className="text-muted-foreground">Aún no has moderado ninguna propiedad</p>
                </div>
              ) : (
                <div className="space-y-0">
                  {historyProperties.map(p => renderPropertyItem(p, false))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Modal de Detalles de Propiedad */}
      <Dialog open={detailsDialogOpen} onOpenChange={setDetailsDialogOpen}>
        <DialogContent className="max-w-5xl max-h-[90vh] overflow-y-auto p-0">
          <div className="sticky top-0 z-10 bg-background border-b p-6">
            <DialogHeader>
              <DialogTitle className="text-2xl font-bold">
                {selectedPropertyDetails?.title || selectedProperty?.title}
              </DialogTitle>
              <DialogDescription className="flex items-center gap-2 mt-2">
                <MapPin className="h-4 w-4" />
                {selectedPropertyDetails?.location || selectedProperty?.location}
              </DialogDescription>
            </DialogHeader>
          </div>

          {selectedPropertyDetails ? (
            <div className="p-6 space-y-6">
              {/* Carrusel de Imágenes */}
              <div>
                <h3 className="text-lg font-semibold mb-3">Imágenes de la Propiedad</h3>
                <Carousel className="w-full">
                  <CarouselContent>
                    {selectedPropertyDetails.images && selectedPropertyDetails.images.length > 0 ? (
                      selectedPropertyDetails.images.map((img, index) => (
                        <CarouselItem key={index}>
                          <div className="relative h-[400px] rounded-xl overflow-hidden">
                            <img 
                              src={img} 
                              alt={`${selectedPropertyDetails.title} - ${index + 1}`} 
                              className="w-full h-full object-cover" 
                            />
                          </div>
                        </CarouselItem>
                      ))
                    ) : (
                      <CarouselItem>
                        <div className="relative h-[400px] rounded-xl overflow-hidden bg-muted flex items-center justify-center">
                          <Building className="h-16 w-16 text-muted-foreground" />
                        </div>
                      </CarouselItem>
                    )}
                  </CarouselContent>
                  {selectedPropertyDetails.images && selectedPropertyDetails.images.length > 1 && (
                    <>
                      <CarouselPrevious className="left-4" />
                      <CarouselNext className="right-4" />
                    </>
                  )}
                </Carousel>
              </div>

              {/* Video si existe */}
              {selectedPropertyDetails.videoUrl && (
                <div>
                  <h3 className="text-lg font-semibold mb-3">Video de la Propiedad</h3>
                  <div className="relative rounded-xl overflow-hidden">
                    <video 
                      controls 
                      className="w-full max-h-[400px]"
                      src={selectedPropertyDetails.videoUrl}
                    >
                      Tu navegador no soporta el elemento de video.
                    </video>
                  </div>
                </div>
              )}

              {/* Información Principal */}
              <div className="grid md:grid-cols-2 gap-6">
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">Detalles de la Propiedad</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="flex items-center justify-between">
                      <span className="text-muted-foreground">Precio</span>
                      <span className="text-2xl font-bold text-primary">
                        {rate ? formatDualPrice(selectedPropertyDetails.price, usdToCop(selectedPropertyDetails.price, rate.usdToCop), 'mes') : `$${selectedPropertyDetails.price}/mes`}
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-muted-foreground">Tipo</span>
                      <Badge variant="outline">{selectedPropertyDetails.type}</Badge>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-muted-foreground">Modalidad</span>
                      <Badge>{selectedPropertyDetails.listingType}</Badge>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-muted-foreground">Amueblado</span>
                      <span>{selectedPropertyDetails.furnished ? "Sí" : "No"}</span>
                    </div>
                    <div className="grid grid-cols-3 gap-4 pt-4 border-t">
                      <div className="flex flex-col items-center">
                        <Bed className="h-5 w-5 text-primary mb-1" />
                        <span className="text-sm font-semibold">{selectedPropertyDetails.bedrooms}</span>
                        <span className="text-xs text-muted-foreground">Habitaciones</span>
                      </div>
                      <div className="flex flex-col items-center">
                        <Bath className="h-5 w-5 text-primary mb-1" />
                        <span className="text-sm font-semibold">{selectedPropertyDetails.bathrooms}</span>
                        <span className="text-xs text-muted-foreground">Baños</span>
                      </div>
                      <div className="flex flex-col items-center">
                        <Square className="h-5 w-5 text-primary mb-1" />
                        <span className="text-sm font-semibold">{selectedPropertyDetails.area}</span>
                        <span className="text-xs text-muted-foreground">m²</span>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">Información del Propietario</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 rounded-full bg-primary flex items-center justify-center text-primary-foreground font-bold">
                        {selectedPropertyDetails.author?.name?.charAt(0) || "P"}
                      </div>
                      <div>
                        <p className="font-semibold">{selectedPropertyDetails.author?.name || "Propietario"}{selectedPropertyDetails.author?.isVerified && <BadgeCheck className="h-4 w-4 text-blue-500 inline ml-1" />}</p>
                        <p className="text-sm text-muted-foreground">Propietario</p>
                      </div>
                    </div>
                    {selectedPropertyDetails.author?.email && (
                      <div className="flex items-center gap-2 text-sm">
                        <Mail className="h-4 w-4 text-muted-foreground" />
                        <span>{selectedPropertyDetails.author.email}</span>
                      </div>
                    )}
                    {selectedPropertyDetails.author?.phone && (
                      <div className="flex items-center gap-2 text-sm">
                        <Phone className="h-4 w-4 text-muted-foreground" />
                        <span>
                          {selectedPropertyDetails.author.phonePrefix} {selectedPropertyDetails.author.phone}
                        </span>
                      </div>
                    )}
                    <div className="flex items-center gap-2 text-sm">
                      <Calendar className="h-4 w-4 text-muted-foreground" />
                      <span>Publicado: {new Date(selectedPropertyDetails.createdAt).toLocaleDateString("es-CO")}</span>
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Descripción */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Descripción</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-muted-foreground whitespace-pre-wrap">
                    {selectedPropertyDetails.description}
                  </p>
                </CardContent>
              </Card>

              {/* Características */}
              {selectedPropertyDetails.features && selectedPropertyDetails.features.length > 0 && (
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">Características y Servicios</CardTitle>
                    <CardDescription>Servicios y comodidades incluidas en esta propiedad</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <AmenityGrid features={selectedPropertyDetails.features} />
                  </CardContent>
                </Card>
              )}

              {/* Ubicación */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Ubicación</CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                  <div className="flex items-center gap-2">
                    <MapPin className="h-4 w-4 text-primary" />
                    <span className="font-medium">{selectedPropertyDetails.address}</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Home className="h-4 w-4" />
                    <span>{selectedPropertyDetails.location}</span>
                  </div>
                  <div className="text-xs text-muted-foreground mt-2">
                    Coordenadas: {selectedPropertyDetails.lat}, {selectedPropertyDetails.lng}
                  </div>
                </CardContent>
              </Card>

              {/* Botones de Acción */}
              {selectedProperty?.status === 'pending' && (
                <div className="flex justify-end gap-3 pt-4 border-t">
                  <Button 
                    variant="outline" 
                    className="text-red-600 hover:text-red-700 hover:bg-red-50"
                    onClick={() => {
                      setDetailsDialogOpen(false);
                      openRejectDialog(selectedProperty);
                    }}
                  >
                    <XCircle className="h-4 w-4 mr-2" />
                    Rechazar Propiedad
                  </Button>
                  <Button 
                    className="bg-green-600 hover:bg-green-700"
                    onClick={() => {
                      handleApprove(selectedProperty);
                      setDetailsDialogOpen(false);
                    }}
                  >
                    <CheckCircle className="h-4 w-4 mr-2" />
                    Aprobar Propiedad
                  </Button>
                </div>
              )}
            </div>
          ) : (
            <div className="flex justify-center py-20">
              <Loader2 className="h-10 w-10 animate-spin text-primary" />
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Modal de Rechazo */}
      <Dialog open={rejectDialogOpen} onOpenChange={setRejectDialogOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle className="text-2xl font-bold flex items-center gap-2 text-red-600">
              <XCircle className="h-6 w-6" />
              Rechazar Publicación
            </DialogTitle>
            <DialogDescription className="text-base pt-2">
              Indica el motivo claro del rechazo. El propietario recibirá una notificación para corregir estos puntos.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-6 py-4">
            <div className="p-3 bg-zinc-50 rounded-lg border">
              <p className="text-sm font-semibold mb-1">Propiedad bajo revisión:</p>
              <p className="text-sm text-zinc-600">{selectedProperty?.title}</p>
            </div>
            <div className="space-y-3">
              <label className="text-sm font-bold flex items-center gap-2">
                Detalle del motivo <span className="text-red-500">*</span>
              </label>
              <Textarea
                placeholder="Ej: Las fotos no tienen buena calidad o la dirección es insuficiente..."
                value={rejectReason}
                onChange={(e) => setRejectReason(e.target.value)}
                className="min-h-[120px] focus-visible:ring-red-500"
              />
            </div>
          </div>
          <DialogFooter className="gap-2 sm:gap-0">
            <Button variant="ghost" onClick={() => setRejectDialogOpen(false)} className="hover:bg-zinc-100">
              Cerrar
            </Button>
            <Button 
              variant="destructive" 
              onClick={handleReject}
              disabled={!rejectReason.trim()}
              className="bg-red-600 hover:bg-red-700"
            >
              Confirmar Rechazo Definitivo
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default ContentReviewSection;
