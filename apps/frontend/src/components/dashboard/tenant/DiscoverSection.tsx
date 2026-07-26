import { useState, useEffect, useRef, useCallback, memo } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Slider } from "@/components/ui/slider";
import { Badge } from "@/components/ui/badge";
import { Carousel, CarouselContent, CarouselItem, CarouselNext, CarouselPrevious } from "@/components/ui/carousel";
import { Loader2, Search, MapPin, Bed, Bath, Square, Heart, SlidersHorizontal, Grid3X3, List, Star, Building, Home, MessageCircle, CheckCircle, Send, Navigation, MessageSquare, ChevronDown, ArrowLeft, AlertTriangle, Video, X, BadgeCheck } from "lucide-react";
import { cn } from "@/lib/utils";
import { AmenityGrid } from "@/components/common/AmenityCard";
import "leaflet/dist/leaflet.css";
import L from "leaflet";
import markerIcon2x from "leaflet/dist/images/marker-icon-2x.png";
import markerIcon from "leaflet/dist/images/marker-icon.png";
import markerShadow from "leaflet/dist/images/marker-shadow.png";
import { api, Property, Service, PropertyReview } from "@/services/api";
import { useToast } from "@/hooks/use-toast";
import { useBehaviorTracker } from "@/contexts/BehaviorTrackerContext";
import { RatingStars, ReviewCard, ReviewForm } from "@/components/reviews";
import { getMyTransactions } from "@/services/transaction.service";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/components/ui/dialog";
import { KYCRequiredModal } from "@/components/auth/KYCRequiredModal";
import { useChat } from "@/hooks/useChat";
import { useAuth } from "@/contexts/AuthContext";
import { useNavigate } from "react-router-dom";
import { GeocodeResult, geocodingService } from "@/services/geocoding.service";
import LocationSearchBar from "@/components/search/LocationSearchBar";
import { useExchangeRate } from "../../../contexts/ExchangeRateContext";
import { usdToCop } from "../../../utils/formatPrice";
import { DualPrice } from "../../../components/common/DualPrice";

// Leaflet fix
delete (L.Icon.Default.prototype as typeof L.Icon.Default.prototype & { _getIconUrl?: unknown })._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: markerIcon2x,
  iconUrl: markerIcon,
  shadowUrl: markerShadow,
});

interface PropertyUI extends Property {
  isNew?: boolean;
}

interface DiscoverPropertyCardProps {
  property: PropertyUI;
  viewMode: "grid" | "list";
  isFavorite: boolean;
  onToggleFavorite: (id: number) => void;
  onViewDetail: (property: PropertyUI) => void;
}

const DiscoverPropertyCard = memo(({ property, viewMode, isFavorite, onToggleFavorite, onViewDetail }: DiscoverPropertyCardProps) => {
  const { rate } = useExchangeRate();
  const TypeIcon = (() => {
    switch (property.type) { case "Residencia": return Building; case "Casa": return Home; case "Apartamento": return Building; default: return Building; }
  })();

  return (
    <Card key={property.id} className={cn("overflow-hidden hover:shadow-lg transition-shadow", viewMode === "list" && "flex flex-col sm:flex-row")}>
      <div className={cn("relative", viewMode === "list" && "w-full sm:w-64 shrink-0")}>
        <img src={property.images[0] || "https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?w=800"} alt={property.title} className="w-full h-48 object-cover" />
        <Button variant="ghost" size="icon" className="absolute top-2 right-2 bg-white/80 hover:bg-white" onClick={(e) => { e.stopPropagation(); onToggleFavorite(property.id); }}><Heart className={cn("h-5 w-5", isFavorite ? "fill-red-500 text-red-500" : "text-gray-600")} /></Button>
        <Badge variant="secondary" className="absolute bottom-2 left-2"><TypeIcon className="h-3 w-3 mr-1" />{property.type}</Badge>
        {(property as any).type === 'Residencia' && ((property as any).availableRooms ?? 0) === 0 && (
          <Badge variant="destructive" className="absolute top-2 left-2">Ocupada</Badge>
        )}
      </div>
      <CardContent className="p-4 flex-1">
        <div className="flex items-start justify-between mb-2"><h3 className="font-semibold line-clamp-1">{property.title}</h3><div className="flex items-center gap-1 text-sm"><Star className="h-4 w-4 fill-yellow-400 text-yellow-400" /><span>{typeof property.avgRating === 'number' ? property.avgRating.toFixed(1) : '0.0'}</span></div></div>
        <p className="text-sm text-muted-foreground flex items-center gap-1 mb-2"><MapPin className="h-3 w-3" />{property.location}</p>
        <p className="text-sm text-muted-foreground line-clamp-2 mb-3">{property.description}</p>
        <div className="flex items-center gap-3 text-sm text-muted-foreground mb-3"><span className="flex items-center gap-1"><Bed className="h-4 w-4" />{property.bedrooms}</span><span className="flex items-center gap-1"><Bath className="h-4 w-4" />{property.bathrooms}</span><span className="flex items-center gap-1"><Square className="h-4 w-4" />{property.area}m²</span></div>
        <div className="flex items-center justify-between">
          <div>
            {rate?.usdToCop ? (
              <DualPrice usd={property.price} copRate={rate.usdToCop} period="mes" variant="inline" />
            ) : (
              <span className="text-xl font-bold text-primary">${property.price}/mes</span>
            )}
          </div>
          <Button size="sm" onClick={() => onViewDetail(property)}>Ver más</Button>
        </div>
      </CardContent>
    </Card>
  );
});

const PropertyDetailInline = ({ property, onBack, onRentRequest, onChatWithOwner, hasDispute }: { property: PropertyUI | null; onBack: () => void; onRentRequest?: (p: PropertyUI) => void; onChatWithOwner?: (ownerId: number) => void; hasDispute?: boolean }) => {
  const mapRef = useRef<HTMLDivElement | null>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);
  const { user } = useAuth();
  const { toast } = useToast();
  const { rate } = useExchangeRate();
  
  // Estados para reviews
  const [reviews, setReviews] = useState<PropertyReview[]>([]);
  const [reviewsPagination, setReviewsPagination] = useState({ page: 1, limit: 5, total: 0, totalPages: 1 });
  const [myReview, setMyReview] = useState<PropertyReview | null>(null);
  const [showReviewForm, setShowReviewForm] = useState(false);
  const [showVideoModal, setShowVideoModal] = useState(false);
  const [isLoadingReviews, setIsLoadingReviews] = useState(false);
  const [isSubmittingReview, setIsSubmittingReview] = useState(false);
  const [hasRented, setHasRented] = useState(false);
  const [showKYCModal, setShowKYCModal] = useState(false);
  const [showDisputeModal, setShowDisputeModal] = useState(false);

  // Cargar reviews cuando se selecciona una propiedad
  useEffect(() => {
    if (!property) return;
    
    const loadPropertyData = async () => {
      setIsLoadingReviews(true);
      setHasRented(false);
      try {
        // Cargar reviews de la propiedad
        const reviewsResponse = await api.getPropertyReviews(property.id, 1, 5);
        if (reviewsResponse.success && reviewsResponse.data) {
          setReviews(reviewsResponse.data.reviews);
          setReviewsPagination(reviewsResponse.data.pagination);
        }
        
        if (user) {
          // Cargar mi review si existe
          const myReviewResponse = await api.getMyPropertyReview(property.id);
          if (myReviewResponse.success && myReviewResponse.data) {
            setMyReview(myReviewResponse.data.review);
          }

          // Verificar si el usuario alquiló esta propiedad
          const rentRequestsRes = await api.getUserRentRequests();
          if (rentRequestsRes.success && rentRequestsRes.data) {
            const hasAcceptedRequest = rentRequestsRes.data.requests.some(
              r => r.propertyId === property.id && (r.status === 'accepted' || r.status === 'completed')
            );
            setHasRented(hasAcceptedRequest);
          }
        }
      } catch (error) {
        console.error('Error cargando datos:', error);
      } finally {
        setIsLoadingReviews(false);
      }
    };
    
    loadPropertyData();
  }, [property, user]);

  // Leaflet map effect
  useEffect(() => {
    if (!mapRef.current || !property) return;
    if (mapInstanceRef.current) { mapInstanceRef.current.remove(); mapInstanceRef.current = null; }
    const timer = setTimeout(() => {
      if (!mapRef.current) return;
      const map = L.map(mapRef.current).setView([property.lat, property.lng], 15);
      L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", { attribution: '&copy; OpenStreetMap' }).addTo(map);
      L.marker([property.lat, property.lng]).addTo(map).bindPopup(`<b>${property.title}</b><br>${property.address}`).openPopup();
      mapInstanceRef.current = map;
    }, 100);
    return () => { clearTimeout(timer); if (mapInstanceRef.current) { mapInstanceRef.current.remove(); mapInstanceRef.current = null; } };
  }, [property]);

  const handleSubmitReview = async (data: { rating: number; comment?: string }) => {
    if (!property || !user) return;
    
    setIsSubmittingReview(true);
    try {
      let response;
      
      if (myReview) {
        // Actualizar review existente
        response = await api.updatePropertyReview(myReview.id, data);
      } else {
        // Crear nuevo review
        response = await api.createPropertyReview({
          propertyId: property.id,
          rating: data.rating,
          comment: data.comment,
        });
      }
      
      if (response.success && response.data) {
        toast({
          title: myReview ? "Reseña actualizada" : "Reseña enviada",
          description: "Tu calificación ha sido registrada exitosamente",
        });
        
        // Actualizar estado
        setMyReview(response.data.review);
        setShowReviewForm(false);
        
        // Recargar lista de reviews
        const reviewsResponse = await api.getPropertyReviews(property.id, 1, 5);
        if (reviewsResponse.success && reviewsResponse.data) {
          setReviews(reviewsResponse.data.reviews);
          setReviewsPagination(reviewsResponse.data.pagination);
        }
      } else {
        toast({
          title: "Error",
          description: response.error?.message || "No se pudo enviar la reseña",
          variant: "destructive"
        });
      }
    } catch (error) {
      console.error('Error enviando review:', error);
      toast({
        title: "Error",
        description: "No se pudo enviar la reseña",
        variant: "destructive"
      });
    } finally {
      setIsSubmittingReview(false);
    }
  };

  const handleDeleteReview = async () => {
    if (!myReview) return;
    
    try {
      const response = await api.deletePropertyReview(myReview.id);
      if (response.success) {
        toast({
          title: "Reseña eliminada",
          description: "Tu reseña ha sido eliminada exitosamente",
        });
        
        setMyReview(null);
        
        // Recargar lista de reviews
        const reviewsResponse = await api.getPropertyReviews(property.id, 1, 5);
        if (reviewsResponse.success && reviewsResponse.data) {
          setReviews(reviewsResponse.data.reviews);
          setReviewsPagination(reviewsResponse.data.pagination);
        }
      } else {
        toast({
          title: "Error",
          description: response.error?.message || "No se pudo eliminar la reseña",
          variant: "destructive"
        });
      }
    } catch (error) {
      console.error('Error eliminando review:', error);
      toast({
        title: "Error",
        description: "No se pudo eliminar la reseña",
        variant: "destructive"
      });
    }
  };

  const handleLoadMoreReviews = async () => {
    if (!property || reviewsPagination.page >= reviewsPagination.totalPages) return;
    
    const nextPage = reviewsPagination.page + 1;
    try {
      const response = await api.getPropertyReviews(property.id, nextPage, 5);
      if (response.success && response.data) {
        setReviews(prev => [...prev, ...response.data!.reviews]);
        setReviewsPagination(response.data.pagination);
      }
    } catch (error) {
      console.error('Error cargando más reviews:', error);
    }
  };

  const navigate = useNavigate();

  const handleGoToVerification = () => {
    if (!user) return;
    const basePath = user.role === 'admin' ? '/admin' :
      user.role === 'propietario' ? '/propietario' :
      user.role === 'operator' ? '/operator' : '/estudiante';
    navigate(basePath, { state: { activeSection: 'verificacion' } });
  };

  if (!property) return null;

  return (
    <div className="space-y-6">
      {/* Back button */}
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="sm" onClick={onBack}>
          <ArrowLeft className="h-4 w-4 mr-1" />
          Volver a resultados
        </Button>
      </div>

      <div className="flex items-start justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold">{property.title}</h2>
          <p className="text-muted-foreground flex items-center gap-1 mt-1"><MapPin className="h-4 w-4" />{property.location}</p>
        </div>
        </div>
        <div className="p-6 space-y-6">
          <Carousel className="w-full">
            <CarouselContent>
              {property.images.length > 0 ? (
                property.images.map((img, index) => (
                  <CarouselItem key={index}>
                    <div className="relative h-[300px] md:h-[400px] rounded-xl overflow-hidden">
                      <img src={img} alt={`${property.title} - ${index + 1}`} className="w-full h-full object-cover" />
                    </div>
                  </CarouselItem>
                ))
              ) : (
                <CarouselItem>
                   <div className="relative h-[300px] md:h-[400px] rounded-xl overflow-hidden bg-muted flex items-center justify-center">
                    <Building className="h-12 w-12 text-muted-foreground" />
                  </div>
                </CarouselItem>
              )}
            </CarouselContent>
            {property.images.length > 1 && (
              <>
                <CarouselPrevious className="left-4" />
                <CarouselNext className="right-4" />
              </>
            )}
          </Carousel>
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div>
              {rate?.usdToCop ? (
                <DualPrice usd={property.price} copRate={rate.usdToCop} period="mes" variant="detail" />
              ) : (
                <span className="text-3xl font-bold text-primary">${property.price}</span>
              )}
            </div>
            <div className="flex gap-2">
              <Badge>{property.listingType}</Badge>
              <Badge variant="outline">{property.type}</Badge>
              {property.furnished && <Badge variant="secondary">Amueblado</Badge>}
            </div>
          </div>
          <Card>
            <CardContent className="p-4">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="flex items-center gap-3"><div className="p-2 bg-primary/10 rounded-lg"><Bed className="h-5 w-5 text-primary" /></div><div><p className="text-sm text-muted-foreground">Habitaciones</p><p className="font-semibold">{property.bedrooms}</p></div></div>
                <div className="flex items-center gap-3"><div className="p-2 bg-primary/10 rounded-lg"><Bath className="h-5 w-5 text-primary" /></div><div><p className="text-sm text-muted-foreground">Baños</p><p className="font-semibold">{property.bathrooms}</p></div></div>
                <div className="flex items-center gap-3"><div className="p-2 bg-primary/10 rounded-lg"><Square className="h-5 w-5 text-primary" /></div><div><p className="text-sm text-muted-foreground">Área</p><p className="font-semibold">{property.area} m²</p></div></div>
                <div className="flex items-center gap-3"><div className="p-2 bg-primary/10 rounded-lg"><Star className="h-5 w-5 text-primary" /></div><div><p className="text-sm text-muted-foreground">Valoración</p><div><div className="font-semibold">{(typeof property.avgRating === 'number' ? property.avgRating.toFixed(1) : '0.0')} ({property.reviewCount || 0} reseñas)</div><div className="flex items-center gap-1 mt-1"><RatingStars value={typeof property.avgRating === 'number' ? property.avgRating : 0} size="sm" showValue={false} /></div></div></div></div>
              </div>
            </CardContent>
          </Card>
        </div>
          <Card>
        <CardContent className="p-4">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="flex items-center gap-3"><div className="p-2 bg-primary/10 rounded-lg"><Bed className="h-5 w-5 text-primary" /></div><div><p className="text-sm text-muted-foreground">{property.type === 'Residencia' ? 'Total cuartos' : 'Habitaciones'}</p><p className="font-semibold">{property.bedrooms}</p></div></div>
            {property.type === 'Residencia' && (
              <div className="flex items-center gap-3"><div className="p-2 bg-green-100 rounded-lg"><Bed className="h-5 w-5 text-green-600" /></div><div><p className="text-sm text-muted-foreground">Disponibles</p><p className="font-semibold text-green-600">{property.availableRooms ?? 0}</p></div></div>
            )}
            {property.type === 'Residencia' && (
              <div className="flex items-center gap-3"><div className="p-2 bg-amber-100 rounded-lg"><Bed className="h-5 w-5 text-amber-600" /></div><div><p className="text-sm text-muted-foreground">Ocupados</p><p className="font-semibold text-amber-600">{property.occupiedRooms ?? 0}</p></div></div>
            )}
            <div className="flex items-center gap-3"><div className="p-2 bg-primary/10 rounded-lg"><Bath className="h-5 w-5 text-primary" /></div><div><p className="text-sm text-muted-foreground">Baños</p><p className="font-semibold">{property.bathrooms}</p></div></div>
            <div className="flex items-center gap-3"><div className="p-2 bg-primary/10 rounded-lg"><Square className="h-5 w-5 text-primary" /></div><div><p className="text-sm text-muted-foreground">Área</p><p className="font-semibold">{property.area} m²</p></div></div>
            <div className="flex items-center gap-3"><div className="p-2 bg-primary/10 rounded-lg"><Star className="h-5 w-5 text-primary" /></div><div><p className="text-sm text-muted-foreground">Valoración</p><div><div className="font-semibold">{(typeof property.avgRating === 'number' ? property.avgRating.toFixed(1) : '0.0')} ({property.reviewCount || 0} reseñas)</div><div className="flex items-center gap-1 mt-1"><RatingStars value={typeof property.avgRating === 'number' ? property.avgRating : 0} size="sm" showValue={false} /></div></div></div></div>
          </div>
        </CardContent>
      </Card>
      <div><h3 className="text-lg font-semibold mb-2">Descripción</h3><p className="text-muted-foreground">{property.description}</p></div>
      {property.features.length > 0 && (
        <div>
          <h3 className="text-lg font-semibold mb-1">Características</h3>
          <p className="text-sm text-muted-foreground mb-3">Servicios y comodidades incluidas</p>
          <AmenityGrid features={property.features} />
        </div>
      )}
      <div><h3 className="text-lg font-semibold mb-3">Ubicación</h3><div ref={mapRef} className="h-[300px] rounded-xl overflow-hidden border" /><p className="text-sm text-muted-foreground mt-2 flex items-center gap-1"><MapPin className="h-4 w-4" />{property.address}</p></div>
      <Card><CardContent className="p-4"><div className="flex items-center gap-3">
        <div className="w-12 h-12 rounded-full bg-primary flex items-center justify-center text-primary-foreground font-bold">
          {property.author?.name.charAt(0) || "U"}
        </div>
        <div>
          <p className="font-semibold">{property.author?.name || "Propietario"}{property.author?.isVerified && <BadgeCheck className="h-4 w-4 text-blue-500 inline ml-1" />}</p>
          <p className="text-sm text-muted-foreground">Publicado el {new Date(property.createdAt).toLocaleDateString("es-CO")}</p>
        </div>
      </div></CardContent></Card>

      {/* Sección de Reseñas */}
      <div className="border-t pt-6 mt-4">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h3 className="text-xl font-semibold flex items-center gap-2">
              <MessageSquare className="h-5 w-5" />
              Reseñas de la propiedad
            </h3>
            <p className="text-sm text-muted-foreground mt-1">
              {property.reviewCount || 0} reseñas • Promedio: {typeof property.avgRating === 'number' ? property.avgRating.toFixed(1) : '0.0'} estrellas
            </p>
          </div>
          
          {/* Botón para calificar - solo si ha alquilado */}
          {user && !myReview && user.role !== 'propietario' && (
            <Button 
              onClick={() => setShowReviewForm(true)}
              disabled={isLoadingReviews || !hasRented}
              title={!hasRented ? "Debes alquilar esta propiedad para calificarla" : ""}
            >
              <Star className="h-4 w-4 mr-2" />
              {hasRented ? "Calificar propiedad" : "Alquila para calificar"}
            </Button>
          )}
        </div>

        {showReviewForm && (
          <Card className="mb-6">
            <CardContent className="p-6">
              <ReviewForm
                targetName={property.title}
                initialRating={myReview?.rating || 0}
                initialComment={myReview?.comment || ''}
                onSubmit={handleSubmitReview}
                onCancel={() => setShowReviewForm(false)}
                isEditing={!!myReview}
                isLoading={isSubmittingReview}
              />
            </CardContent>
          </Card>
        )}

        <div className="space-y-4">
          {isLoadingReviews ? (
            <div className="flex justify-center py-8"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>
          ) : reviews.length === 0 ? (
            <div className="text-center py-8 border rounded-lg">
              <MessageSquare className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
              <h4 className="font-medium mb-2">Aún no hay reseñas</h4>
              <p className="text-sm text-muted-foreground">Sé el primero en calificar esta propiedad</p>
            </div>
          ) : (
            <>
              {reviews.map((review) => (
                <ReviewCard key={review.id} review={review} type="property" isOwner={user?.id === review.userId} onEdit={user?.id === review.userId ? () => { setMyReview(review); setShowReviewForm(true); } : undefined} onDelete={user?.id === review.userId ? handleDeleteReview : undefined} />
              ))}
              {reviewsPagination.total > reviews.length && (
                <div className="flex justify-center pt-4">
                  <Button variant="outline" onClick={handleLoadMoreReviews} disabled={isLoadingReviews}>
                    {isLoadingReviews ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <ChevronDown className="h-4 w-4 mr-2" />}
                    Cargar más reseñas ({reviews.length} de {reviewsPagination.total})
                  </Button>
                </div>
              )}
            </>
          )}
        </div>
      </div>

      <div className="flex gap-3">
        <Button className="flex-1" size="lg" disabled={property.type === 'Residencia' && ((property as any).availableRooms ?? 0) === 0} onClick={() => {
          if (hasDispute) {
            setShowDisputeModal(true);
            return;
          }
          if (user && !user.isVerified) {
            setShowKYCModal(true);
          } else {
            onRentRequest?.(property);
          }
        }}>
          <Send className="h-4 w-4 mr-2" />
          {property.type === 'Residencia' && ((property as any).availableRooms ?? 0) === 0 ? 'Sin habitaciones disponibles' : 'Solicitar Alquiler'}
        </Button>
        {user && user.id !== property.authorId && (
          <Button className="flex-1" size="lg" onClick={() => {
            if (!user.isVerified) {
              setShowKYCModal(true);
            } else {
              onChatWithOwner?.(property.authorId || 3);
            }
          }}>
            <MessageCircle className="h-4 w-4 mr-2" />
            Comunicarse con Propietario
          </Button>
        )}
        {!user && (
          <Button variant="outline" className="flex-1" size="lg" disabled>
            <MessageCircle className="h-4 w-4 mr-2" />
            Inicia sesión para contactar
          </Button>
        )}
      </div>
      <KYCRequiredModal
        open={showKYCModal}
        onOpenChange={setShowKYCModal}
        onGoToVerification={handleGoToVerification}
      />
      <Dialog open={showDisputeModal} onOpenChange={setShowDisputeModal}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-red-600">
              <AlertTriangle className="h-5 w-5" />
              Transacción en disputa
            </DialogTitle>
            <DialogDescription className="text-base pt-2">
              No puedes solicitar propiedades mientras tengas una transacción en disputa.
              Resuelve la disputa primero para poder continuar.
            </DialogDescription>
          </DialogHeader>
          <div className="flex justify-end">
            <Button onClick={() => setShowDisputeModal(false)}>Entendido</Button>
          </div>
        </DialogContent>
      </Dialog>
      <Dialog open={showVideoModal} onOpenChange={setShowVideoModal}>
        <DialogContent className="sm:max-w-3xl p-0 bg-black text-white border border-white/10 overflow-hidden rounded-2xl shadow-2xl [&>button.absolute]:hidden">
          <div className="relative">
            <DialogTitle className="sr-only">Video de {property.title}</DialogTitle>
            <button
              onClick={() => setShowVideoModal(false)}
              className="absolute top-3 right-3 z-20 flex items-center justify-center w-8 h-8 rounded-full bg-green-500 hover:bg-green-600 text-white shadow-lg transition-all"
            >
              <X className="h-4 w-4" />
            </button>
            <video
              src={property.videoUrl}
              controls
              autoPlay
              className="w-full max-h-[80vh] object-contain rounded-2xl"
            >
              Tu navegador no soporta la reproducción de video.
            </video>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};


const RadiusMiniMap = ({ lat, lng, radiusKm, showCircle }: { lat: number; lng: number; radiusKm: number; showCircle: boolean }) => {
  const mapRef = useRef<HTMLDivElement | null>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);
  const circleRef = useRef<L.Circle | null>(null);
  const [mapError, setMapError] = useState(false);

  // Initialize map once
  useEffect(() => {
    if (!mapRef.current || mapError) return;
    try {
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
      }
      const map = L.map(mapRef.current, { zoomControl: false, attributionControl: false }).setView([lat, lng], 12);
      L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {}).addTo(map);
      L.marker([lat, lng]).addTo(map);
      map.invalidateSize();
      mapInstanceRef.current = map;
    } catch {
      setMapError(true);
    }
    return () => { if (mapInstanceRef.current) { mapInstanceRef.current.remove(); mapInstanceRef.current = null; circleRef.current = null; } };
  }, [lat, lng]);

  // Update circle and zoom without recreating the map
  useEffect(() => {
    const map = mapInstanceRef.current;
    if (!map) return;
    try {
      if (circleRef.current) {
        map.removeLayer(circleRef.current);
        circleRef.current = null;
      }
      if (showCircle) {
        const circle = L.circle([lat, lng], {
          radius: radiusKm * 1000,
          color: '#3b82f6',
          fillColor: '#3b82f6',
          fillOpacity: 0.1,
          weight: 2,
        }).addTo(map);
        circleRef.current = circle;
        map.fitBounds(circle.getBounds(), { padding: [30, 30] });
      } else {
        map.setView([lat, lng], 12);
      }
    } catch {
      setMapError(true);
    }
  }, [radiusKm, showCircle, lat, lng]);

  if (mapError) return null;

  return <div ref={mapRef} className="w-full h-[180px] rounded-lg border mt-2 bg-gray-50" style={{ isolation: 'isolate', zIndex: 0 }} />;
};

const DiscoverSection = () => {
  const [viewMode, setViewMode] = useState<"grid" | "list">("list");
  const [showFilters, setShowFilters] = useState(() => window.innerWidth >= 1024);
  const [isLoading, setIsLoading] = useState(true);
  const [properties, setProperties] = useState<PropertyUI[]>([]);
  const [pagination, setPagination] = useState({ total: 0, page: 1, limit: 12, totalPages: 1 });
  const { toast } = useToast();
  const { trackEvent } = useBehaviorTracker();
  const { startDirectConversation } = useChat();
  const { user } = useAuth();
  const navigate = useNavigate();

  const [searchQuery, setSearchQuery] = useState("");
  const [priceRange, setPriceRange] = useState([0, 1000]);
  const [propertyType, setPropertyType] = useState("all");
  const [bedrooms, setBedrooms] = useState("all");
  const [furnished, setFurnished] = useState("all");
  const [listingType, setListingType] = useState("all");
  const [location, setLocation] = useState("");
  const [zones, setZones] = useState<string[]>([]);
  const [loadingZones, setLoadingZones] = useState(false);
  const [radiusKm, setRadiusKm] = useState([10]); // Radio máximo 10km
  const [userLocation, setUserLocation] = useState<{ lat: number; lng: number } | null>(null);
  const [selectedFeatures, setSelectedFeatures] = useState<string[]>([]);
  const [services, setServices] = useState<Service[]>([]);
  const [favorites, setFavorites] = useState<number[]>([]);
  const [selectedProperty, setSelectedProperty] = useState<PropertyUI | null>(null);
  const [rentRequestTarget, setRentRequestTarget] = useState<PropertyUI | null>(null);
  const [rentMoveInDate, setRentMoveInDate] = useState("");
  const [rentLeaseDuration, setRentLeaseDuration] = useState("12");
  const [rentIndefinite, setRentIndefinite] = useState(false);
  const [isSubmittingRent, setIsSubmittingRent] = useState(false);
  const [hasDispute, setHasDispute] = useState(false);
  // Autocomplete de direcciones
  const [suggestions, setSuggestions] = useState<GeocodeResult[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [searchingAddress, setSearchingAddress] = useState(false);

  // Filtro geoespacial: se activa SOLO cuando el usuario lo habilita explícitamente
  const [useLocationFilter, setUseLocationFilter] = useState(false);
  const [showLocationDialog, setShowLocationDialog] = useState(false);

  // Mostrar diálogo de ubicación una sola vez al montar el componente
  useEffect(() => {
    if (localStorage.getItem('habitas_location_prompt_shown') !== 'true') {
      setShowLocationDialog(true);
    }
  }, []);

  // Reset propertyType based on role
  useEffect(() => {
    if (user?.role === 'estudiante') {
      setPropertyType('Residencia');
    } else if (user?.role === 'cliente' && propertyType === 'Residencia') {
      setPropertyType('all');
    }
  }, [user?.role]);

  useEffect(() => {
    const fetchServices = async () => {
      try {
        const res = await api.getServices();
        if (res.success) setServices(res.data);
      } catch (e) {
        console.error("Error loading services", e);
      }
    };
    fetchServices();
  }, []);

  useEffect(() => {
    getMyTransactions({ status: 'disputed' }).then((res) => {
      if (res.transactions && res.transactions.length > 0) {
        setHasDispute(true);
      }
    }).catch(() => {});
  }, []);

  // Cargar zonas dinámicamente según ubicación
  useEffect(() => {
    const loadZones = async () => {
      setLoadingZones(true);
      try {
        const params: { lat?: number; lng?: number; radius?: number } = {};
        if (userLocation) {
          params.lat = userLocation.lat;
          params.lng = userLocation.lng;
          params.radius = 50;
        }
        const res = await api.getZones(params);
        if (res.success && res.data) {
          setZones(res.data.zones);
        }
      } catch {
        console.error('Error loading zones');
      } finally {
        setLoadingZones(false);
      }
    };
    loadZones();
  }, [userLocation]);

  // Autocomplete de ubicaciones desde la base de datos
  useEffect(() => {
    if (!searchQuery || searchQuery.trim().length < 2) {
      setSuggestions([]);
      setShowSuggestions(false);
      return;
    }
    const timer = setTimeout(async () => {
      setSearchingAddress(true);
      try {
        const res = await api.getLocationSuggestions(searchQuery);
        if (res.success && res.data) {
          const items = res.data.suggestions.map(s => ({
            lat: 0,
            lng: 0,
            displayName: s.label ? `${s.label}, ${s.sublabel}` : s.sublabel,
            city: s.city,
          }));
          setSuggestions(items);
          setShowSuggestions(items.length > 0);
        }
      } catch {
        setSuggestions([]);
        setShowSuggestions(false);
      } finally {
        setSearchingAddress(false);
      }
    }, 300);
    return () => clearTimeout(timer);
  }, [searchQuery]);

  const fetchProperties = useCallback(async (query = searchQuery) => {
    setIsLoading(true);
    // Rastrear búsqueda si hay término
    if (query && query.trim().length > 0) {
      trackEvent({
        eventType: 'SEARCH',
        targetElement: 'DiscoverSearch',
        metadata: { query: query.trim() },
      });
    }

    let response;
    
    // Si hay ubicación textual, usar el endpoint de búsqueda por ubicación
    if (location && location.trim().length > 0) {
      try {
        // Usar el nuevo servicio de geocoding para buscar por ubicación textual
        const searchData = await geocodingService.searchPropertiesByLocation(
          location,
          radiusKm[0],
          pagination.page,
          pagination.limit
        );
        
        // Formatear respuesta para mantener compatibilidad
        response = {
          success: true,
          data: {
            properties: searchData.properties || [],
            pagination: searchData.pagination || pagination,
            geocoding: searchData.geocoding
          }
        };
        
        // Mostrar notificación con información de geocoding
        if (searchData.geocoding) {
          toast({
            title: "Búsqueda por ubicación",
            description: `Propiedades cerca de "${searchData.geocoding.searchLocation}" (${searchData.geocoding.radiusKm}km)`,
          });
        }
      } catch (error: any) {
        console.error('Error searching by location:', error);
        response = {
          success: false,
          error: { 
            code: 'GEOLOCATION_ERROR', 
            message: error.message || 'Error buscando por ubicación' 
          }
        };
      }
    } else {
      // Si no hay ubicación específica, usar filtros normales
      const filters = {
        page: pagination.page,
        limit: pagination.limit,
        search: query,
        minPrice: priceRange[0],
        maxPrice: priceRange[1],
        type: propertyType,
        bedrooms: bedrooms,
        listingType: listingType === "all" ? undefined : listingType,
        services: selectedFeatures.length > 0 ? selectedFeatures.join(',') : undefined,
        furnished: furnished === "true" ? true : furnished === "false" ? false : undefined,
        status: 'approved', // Solo mostrar aprobadas al cliente
        userRole: user?.role, // Enviar rol para priorización de estudiantes
        // Filtro por radio de distancia: SOLO si el usuario lo activó explícitamente
        ...(useLocationFilter && userLocation && {
          lat: userLocation.lat,
          lng: userLocation.lng,
          radius: radiusKm[0]
        })
      };

      response = await api.getProperties(filters);
    }
    if (response.success && response.data) {
      const sorted = [...response.data.properties].sort((a, b) => {
        const aAvail = a.type === 'Residencia' ? (a as any).availableRooms ?? 0 : -1;
        const bAvail = b.type === 'Residencia' ? (b as any).availableRooms ?? 0 : -1;
        if (aAvail > 0 && bAvail <= 0) return -1;
        if (aAvail <= 0 && bAvail > 0) return 1;
        return 0;
      });
      setProperties(sorted.map((p: Property) => ({
        ...p,
        isNew: p.id % 3 === 0
      })));
      setPagination(prev => ({ ...prev, ...response.data?.pagination }));
    } else {
      // Solo mostrar error si es un error real del servidor, no cuando simplemente no hay resultados
      if (response.error?.code !== 'NO_RESULTS') {
        toast({
          title: "Error",
          description: "Hubo un problema al cargar las propiedades. Intenta de nuevo.",
          variant: "destructive"
        });
      }
      // Asegurar que se muestren arrays vacíos si hay error
      setProperties([]);
      setPagination(prev => ({ ...prev, total: 0, totalPages: 0 }));
    }

    const favResponse = await api.getFavorites();
    if (favResponse.success && favResponse.data) {
      const favData = favResponse.data as any;
      const favArray = Array.isArray(favData) ? favData : (favData?.favorites || []);
      setFavorites(favArray.map((f: any) => typeof f === 'object' ? f.propertyId : f));
    }

    setIsLoading(false);
  }, [searchQuery, pagination.page, pagination.limit, priceRange, propertyType, bedrooms, listingType, location, selectedFeatures, furnished, userLocation, radiusKm, useLocationFilter, trackEvent, toast]);

  useEffect(() => {
    fetchProperties();
  }, [pagination.page, propertyType, bedrooms, furnished, listingType, selectedFeatures, fetchProperties]);

  const requestLocation = useCallback(() => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setUserLocation({
            lat: position.coords.latitude,
            lng: position.coords.longitude,
          });
          setUseLocationFilter(true);
          dismissLocationDialog();
        },
        () => {
          dismissLocationDialog();
        }
      );
    }
  }, []);

  const dismissLocationDialog = useCallback(() => {
    setShowLocationDialog(false);
    localStorage.setItem('habitas_location_prompt_shown', 'true');
  }, []);

  const toggleFeature = (feature: string) => {
    setSelectedFeatures(prev =>
      prev.includes(feature) ? prev.filter(f => f !== feature) : [...prev, feature]
    );
  };

  const toggleFavorite = async (id: number) => {
    const isFav = favorites.includes(id);
    const response = await api.toggleFavorite(id);
    if (response.success) {
      setFavorites(prev => isFav ? prev.filter(f => f !== id) : [...prev, id]);
      trackEvent({
        eventType: 'CLICK',
        targetElement: 'BotonFavorito',
        metadata: { propertyId: id, action: isFav ? 'remove' : 'add' },
      });
      toast({
        title: isFav ? "Quitada de favoritos" : "Agregada a favoritos",
        description: isFav ? "Propiedad removida de tu lista" : "Propiedad guardada con éxito"
      });
    }
  };

  const openPropertyDetail = (property: PropertyUI) => {
    trackEvent({
      eventType: 'VIEW',
      targetElement: 'DetallePropiedad',
      metadata: { propertyId: property.id, title: property.title, type: property.type },
    });
    api.getProperty(property.id);
    setSelectedProperty(property);
  };
  const closePropertyDetail = () => { setSelectedProperty(null); };

  const handleChatWithOwner = async (ownerId: number) => {
    try {
      const result = await startDirectConversation(ownerId);
      if (result) {
        toast({
          title: "Conversación iniciada",
          description: "Chat abierto con el propietario",
        });
        closePropertyDetail();
        navigate('/estudiante', { state: { activeSection: 'messages', conversationId: result.id } });
      } else {
        toast({
          title: "Error",
          description: "No se pudo iniciar la conversación. Intenta más tarde.",
          variant: "destructive",
        });
      }
    } catch (error: any) {
      console.error("Error al iniciar chat:", error);
      toast({
        title: "Error",
        description: error?.message || "Error al iniciar la conversación",
        variant: "destructive",
      });
    }
  };

  const handleQuickRequest = (property: PropertyUI) => {
    setRentRequestTarget(property);
    setRentMoveInDate("");
    setRentLeaseDuration("12");
    setRentIndefinite(false);
  };

  const submitRentRequest = async () => {
    if (!rentRequestTarget) return;
    if (!rentMoveInDate) {
      toast({ title: "Campo requerido", description: "Selecciona una fecha de mudanza", variant: "destructive" });
      return;
    }
    setIsSubmittingRent(true);
    try {
      const response = await api.createRentRequest({
        propertyId: rentRequestTarget.id,
        message: `Estoy interesado en ${rentRequestTarget.title}`,
        moveInDate: new Date(rentMoveInDate).toISOString(),
        leaseDuration: rentIndefinite ? 0 : parseInt(rentLeaseDuration),
      });

      if (response.success) {
        toast({
          title: "¡Solicitud enviada!",
          description: "El propietario revisará tu solicitud pronto",
        });
        setRentRequestTarget(null);
        closePropertyDetail();
      } else {
        const errCode = response.error?.code;
        const isDuplicate = errCode === 'DUPLICATE_REQUEST';
        const isDispute = errCode === 'USER_HAS_DISPUTE';
        toast({
          title: isDuplicate ? "Solicitud ya enviada" : isDispute ? "Disputa activa" : "Error",
          description: response.error?.message || "No se pudo enviar la solicitud",
          variant: isDuplicate ? "default" : "destructive",
        });
        if (isDispute) setHasDispute(true);
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "No se pudo enviar la solicitud",
        variant: "destructive"
      });
    } finally {
      setIsSubmittingRent(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div><h1 className="text-3xl font-bold">Inicio</h1><p className="text-muted-foreground mt-1">Encuentra tu próximo hogar ideal cerca de tu universidad</p></div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={() => setShowFilters(!showFilters)}><SlidersHorizontal className="h-4 w-4 mr-2" />Filtros</Button>
          <div className="flex border rounded-lg">
            <Button variant={viewMode === "grid" ? "secondary" : "ghost"} size="sm" onClick={() => setViewMode("grid")} className="rounded-r-none"><Grid3X3 className="h-4 w-4" /></Button>
            <Button variant={viewMode === "list" ? "secondary" : "ghost"} size="sm" onClick={() => setViewMode("list")} className="rounded-l-none"><List className="h-4 w-4" /></Button>
          </div>
        </div>
      </div>
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground z-10" />
        <Input 
          placeholder="Buscar por nombre, ubicación o dirección..." 
          value={searchQuery} 
          onChange={(e) => { setSearchQuery(e.target.value); if (!e.target.value) setShowSuggestions(false); }}
          onFocus={() => { if (suggestions.length > 0) setShowSuggestions(true); }}
          onBlur={() => setTimeout(() => setShowSuggestions(false), 200)}
          onKeyDown={(e) => { if (e.key === 'Enter') { setShowSuggestions(false); fetchProperties(); } }}
          className="pl-10 pr-24 h-12" 
        />
        <Button 
          className="absolute right-1 top-1/2 -translate-y-1/2" 
          size="sm"
          onClick={() => { setShowSuggestions(false); fetchProperties(); }}
        >
          {searchingAddress ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Buscar'}
        </Button>
        {showSuggestions && suggestions.length > 0 && (
          <div className="absolute top-full left-0 right-0 mt-1 bg-white border rounded-xl shadow-xl z-50 max-h-60 overflow-y-auto">
            {suggestions.map((s, i) => (
              <button
                key={i}
                type="button"
                className="w-full flex items-start gap-3 px-4 py-3 text-left hover:bg-blue-50 transition-colors border-b last:border-b-0"
                onMouseDown={(e) => { e.preventDefault(); setSearchQuery(s.displayName.split(',')[0]); setShowSuggestions(false); fetchProperties(s.displayName); }}
              >
                <Navigation className="h-4 w-4 mt-0.5 text-blue-500 shrink-0" />
                <div className="min-w-0">
                  <p className="text-sm font-medium truncate">{s.displayName.split(',')[0]}</p>
                  <p className="text-xs text-muted-foreground truncate">{s.displayName.split(',').slice(1).join(',').trim()}</p>
                </div>
              </button>
            ))}
          </div>
        )}
      </div>
      <div className="flex flex-col lg:flex-row gap-6">
        {showFilters && !selectedProperty && (
          <Card className="lg:w-80 shrink-0">
            <CardHeader className="pb-4"><CardTitle className="text-lg">Filtros de búsqueda</CardTitle><CardDescription>Refina tu búsqueda</CardDescription></CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-3 pt-2">
                <Label className="text-sm font-medium">Rango de precio ($/mes)</Label>
                <Slider value={priceRange} onValueChange={setPriceRange} onValueCommit={() => fetchProperties()} max={1000} step={10} className="w-full" />
                <div className="flex justify-between text-sm text-muted-foreground"><span>${priceRange[0]}</span><span>${priceRange[priceRange.length - 1]}</span></div>
              </div>

              <div className="space-y-3 pt-2"><Label className="text-sm font-medium">Tipo de propiedad</Label>
                {user?.role === 'estudiante' ? (
                  <div className="h-10 px-3 rounded-md border border-input bg-muted flex items-center text-sm text-muted-foreground">Residencia</div>
                ) : user?.role === 'cliente' ? (
                  <Select value={propertyType} onValueChange={setPropertyType}><SelectTrigger><SelectValue placeholder="Seleccionar" /></SelectTrigger><SelectContent><SelectItem value="all">Todos</SelectItem><SelectItem value="Apartamento">Apartamento</SelectItem><SelectItem value="Casa">Casa</SelectItem></SelectContent></Select>
                ) : (
                  <Select value={propertyType} onValueChange={setPropertyType}><SelectTrigger><SelectValue placeholder="Seleccionar" /></SelectTrigger><SelectContent><SelectItem value="all">Todos</SelectItem><SelectItem value="Residencia">Residencia</SelectItem><SelectItem value="Apartamento">Apartamento</SelectItem><SelectItem value="Casa">Casa</SelectItem></SelectContent></Select>
                )}
              </div>
              
              <div className="space-y-3"><Label className="text-sm font-medium">Habitaciones</Label>
                {user?.role === 'estudiante' ? (
                  <div className="h-10 px-3 rounded-md border border-input bg-muted flex items-center text-sm text-muted-foreground">Todas</div>
                ) : (
                  <Select value={bedrooms} onValueChange={setBedrooms}><SelectTrigger><SelectValue placeholder="Seleccionar" /></SelectTrigger><SelectContent><SelectItem value="all">Todas</SelectItem><SelectItem value="1">1 habitacion</SelectItem><SelectItem value="2">2 habitaciones</SelectItem><SelectItem value="3">3 habitaciones</SelectItem><SelectItem value="4">4+ habitaciones</SelectItem></SelectContent></Select>
                )}
              </div>
              
              <div className="space-y-3">
                <Label className="text-sm font-medium">Amueblado</Label>
                <Select value={furnished} onValueChange={setFurnished}>
                  <SelectTrigger><SelectValue placeholder="Seleccionar" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Cualquiera</SelectItem>
                    <SelectItem value="true">Solo amueblados</SelectItem>
                    <SelectItem value="false">Solo sin amueblar</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-3">
                <Label className="text-sm font-medium">Tipo de anuncio</Label>
                <Select value={listingType} onValueChange={setListingType}>
                  <SelectTrigger><SelectValue placeholder="Seleccionar" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todos</SelectItem>
                    <SelectItem value="Alquiler">Alquiler</SelectItem>
                    <SelectItem value="Venta">Venta</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-3">
                <Label className="text-sm font-medium">Radio de búsqueda</Label>
                <div className="space-y-2">
                  {/* Toggle para activar/desactivar el filtro geoespacial */}
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">
                      {useLocationFilter
                        ? `${radiusKm[0]} km desde tu ubicación`
                        : "Mostrando todas las zonas"}
                    </span>
                    <Button
                      variant={useLocationFilter ? "default" : "outline"}
                      size="sm"
                      className="h-7 px-2 text-xs"
                      onClick={() => {
                        if (!useLocationFilter) {
                          // Activar: pedir ubicación si no la tenemos
                          if (!userLocation) {
                            if (navigator.geolocation) {
                              navigator.geolocation.getCurrentPosition(
                                (position) => {
                                  setUserLocation({
                                    lat: position.coords.latitude,
                                    lng: position.coords.longitude,
                                  });
                                  setUseLocationFilter(true);
                                  toast({
                                    title: "Filtro por ubicación activado",
                                    description: `Mostrando propiedades en ${radiusKm[0]} km`,
                                  });
                                },
                                () => {
                                  toast({
                                    title: "No se pudo obtener la ubicación",
                                    description: "Verifica los permisos del navegador.",
                                    variant: "destructive",
                                  });
                                }
                              );
                            }
                          } else {
                            setUseLocationFilter(true);
                            toast({
                              title: "Filtro por ubicación activado",
                              description: `Mostrando propiedades en ${radiusKm[0]} km`,
                            });
                          }
                        } else {
                          // Desactivar
                          setUseLocationFilter(false);
                          toast({
                            title: "Filtro por ubicación desactivado",
                            description: "Mostrando propiedades de todas las zonas",
                          });
                        }
                      }}
                    >
                      <MapPin className="h-3 w-3 mr-1" />
                      {useLocationFilter ? "Activo" : "Activar"}
                    </Button>
                  </div>
                  <Slider
                    value={radiusKm}
                    onValueChange={setRadiusKm}
                    onValueCommit={() => useLocationFilter && fetchProperties()}
                    max={50}
                    min={1}
                    step={1}
                    className="w-full"
                    disabled={!useLocationFilter}
                  />
                  <div className="flex justify-between text-xs text-muted-foreground">
                    <span>1 km</span>
                    <span>50 km</span>
                  </div>
                  {userLocation && (
                    <RadiusMiniMap
                      lat={userLocation.lat}
                      lng={userLocation.lng}
                      radiusKm={radiusKm[0]}
                      showCircle={useLocationFilter}
                    />
                  )}
                </div>
              </div>

              <div className="space-y-3">
                <Label className="text-sm font-medium">Buscar por ubicación</Label>
                <div className="space-y-2">
                  <LocationSearchBar
                    onLocationSelected={(location) => {
                      setLocation(location);
                      setTimeout(() => fetchProperties(), 100);
                    }}
                    placeholder="Ej: la morera, las palmas, santa rosa, unerg..."
                  />
                  {location && (
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-muted-foreground">
                        Búsqueda activa: <span className="font-medium text-primary">{location}</span>
                      </span>
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => {
                          setLocation('');
                          fetchProperties();
                        }}
                        className="h-6 px-2 text-xs"
                      >
                        Limpiar
                      </Button>
                    </div>
                  )}
                </div>
              </div>

              <div className="space-y-3">
                <Label className="text-sm font-medium">Servicios y Características</Label>
                <Select 
                  value={selectedFeatures.length > 0 ? "selected" : "none"}
                  onValueChange={(value) => {
                    if (value !== "selected" && value !== "none") {
                      toggleFeature(value);
                    }
                  }}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Seleccionar servicios" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="WiFi">WiFi</SelectItem>
                    <SelectItem value="Aire acondicionado">Aire acondicionado</SelectItem>
                    <SelectItem value="Cocina integral">Cocina integral</SelectItem>
                    <SelectItem value="Seguridad 24h">Seguridad 24h</SelectItem>
                    <SelectItem value="Estacionamiento">Estacionamiento</SelectItem>
                    <SelectItem value="Lavandería">Lavandería</SelectItem>
                    <SelectItem value="Gimnasio">Gimnasio</SelectItem>
                    <SelectItem value="Piscina">Piscina</SelectItem>
                    <SelectItem value="Agua caliente">Agua caliente</SelectItem>
                    <SelectItem value="Gas directo">Gas directo</SelectItem>
                  </SelectContent>
                </Select>
                
                {selectedFeatures.length > 0 && (
                  <div className="flex flex-wrap gap-2 mt-2">
                    {selectedFeatures.map((feature) => (
                      <Badge 
                        key={feature} 
                        variant="secondary" 
                        className="cursor-pointer hover:bg-destructive hover:text-destructive-foreground transition-colors"
                        onClick={() => toggleFeature(feature)}
                      >
                        {feature}
                        <X className="h-3 w-3 ml-1" />
                      </Badge>
                    ))}
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        )}
        <div className="flex-1 min-w-0">
          {selectedProperty ? (
            <PropertyDetailInline
              property={selectedProperty}
              onBack={closePropertyDetail}
              onRentRequest={handleQuickRequest}
              onChatWithOwner={handleChatWithOwner}
              hasDispute={hasDispute}
            />
          ) : (
            <>
              <div className="mb-4 flex items-center justify-between"><p className="text-sm text-muted-foreground">{pagination.total} propiedades encontradas</p></div>
              
              {isLoading ? (
                <div className="flex flex-col items-center justify-center py-20 gap-4">
                   <Loader2 className="h-8 w-8 animate-spin text-primary" />
                   <p className="text-muted-foreground">Cargando propiedades...</p>
                </div>
              ) : properties.length === 0 ? (
                <div className="text-center py-12"><Search className="h-12 w-12 mx-auto text-muted-foreground mb-4" /><h3 className="text-lg font-semibold mb-2">No se encontraron propiedades</h3><p className="text-muted-foreground">Intenta ajustar los filtros para ver más resultados</p></div>
              ) : (
                <div className={viewMode === "grid" ? "grid md:grid-cols-2 xl:grid-cols-3 gap-4" : "space-y-4"}>
                  {properties.map((property) => (
                    <DiscoverPropertyCard
                      key={property.id}
                      property={property}
                      viewMode={viewMode}
                      isFavorite={favorites.includes(property.id)}
                      onToggleFavorite={toggleFavorite}
                      onViewDetail={openPropertyDetail}
                    />
                  ))}
                </div>
              )}

              {pagination.totalPages > 1 && (
                <div className="flex justify-center mt-8 gap-2">
                  <Button variant="outline" size="sm" disabled={pagination.page === 1} onClick={() => setPagination(prev => ({ ...prev, page: prev.page - 1 }))}>Anterior</Button>
                  <div className="flex items-center px-4 text-sm">Página {pagination.page} de {pagination.totalPages}</div>
                  <Button variant="outline" size="sm" disabled={pagination.page === pagination.totalPages} onClick={() => setPagination(prev => ({ ...prev, page: prev.page + 1 }))}>Siguiente</Button>
                </div>
              )}
            </>
          )}
        </div>
      </div>
      <Dialog open={!!rentRequestTarget} onOpenChange={(open) => { if (!open) setRentRequestTarget(null); }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Solicitar Alquiler</DialogTitle>
            <DialogDescription>
              {rentRequestTarget ? `Completa los datos para solicitar "${rentRequestTarget.title}"` : ""}
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="moveInDate">Fecha de mudanza</Label>
              <Input
                id="moveInDate"
                type="date"
                value={rentMoveInDate}
                onChange={(e) => setRentMoveInDate(e.target.value)}
                min={new Date().toISOString().split("T")[0]}
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="leaseDuration">Duración del contrato</Label>
              <Select value={rentLeaseDuration} onValueChange={setRentLeaseDuration} disabled={rentIndefinite}>
                <SelectTrigger id="leaseDuration">
                  <SelectValue placeholder="Selecciona duración" />
                </SelectTrigger>
                <SelectContent position="popper">
                  {Array.from({ length: 12 }, (_, i) => i + 1).map((m) => (
                    <SelectItem key={m} value={String(m)}>{m} {m === 1 ? "mes" : "meses"}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <div className="flex items-center gap-2 mt-1">
                <input
                  type="checkbox"
                  id="rentIndefinite"
                  checked={rentIndefinite}
                  onChange={(e) => setRentIndefinite(e.target.checked)}
                  className="h-4 w-4 rounded border-gray-300"
                />
                <Label htmlFor="rentIndefinite" className="text-sm text-muted-foreground cursor-pointer">
                  No sé aún (indefinido)
                </Label>
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setRentRequestTarget(null)}>Cancelar</Button>
            <Button onClick={submitRentRequest} disabled={isSubmittingRent || !rentMoveInDate}>
              {isSubmittingRent ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Send className="h-4 w-4 mr-2" />}
              Enviar Solicitud
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={showLocationDialog} onOpenChange={dismissLocationDialog}>
        <DialogContent className="sm:max-w-md rounded-2xl shadow-2xl border-0 p-0 overflow-hidden">
          <div className="bg-gradient-to-br from-primary/10 via-primary/5 to-background p-6 pb-4">
            <div className="mx-auto w-14 h-14 rounded-2xl bg-primary/15 flex items-center justify-center mb-4">
              <MapPin className="h-7 w-7 text-primary" />
            </div>
            <DialogHeader className="text-center">
              <DialogTitle className="text-xl font-bold">Activar ubicación</DialogTitle>
              <DialogDescription className="text-sm text-muted-foreground mt-1.5 leading-relaxed">
                Para mostrarte propiedades cercanas y activar el filtro de zona con el mapa interactivo, necesitamos acceder a tu ubicación.
              </DialogDescription>
            </DialogHeader>
          </div>
          <div className="px-6 pb-2">
            <div className="bg-muted/50 border border-border rounded-xl p-4 text-sm">
              <p className="font-semibold text-foreground mb-2 flex items-center gap-1.5">
                <span className="text-lg">📍</span>
                ¿Por qué necesitamos tu ubicación?
              </p>
              <ul className="space-y-2">
                <li className="flex items-start gap-2.5 text-muted-foreground">
                  <span className="mt-0.5 w-1.5 h-1.5 rounded-full bg-primary shrink-0" />
                  Ver propiedades cerca de ti en el mapa
                </li>
                <li className="flex items-start gap-2.5 text-muted-foreground">
                  <span className="mt-0.5 w-1.5 h-1.5 rounded-full bg-primary shrink-0" />
                  Filtrar por distancia (1–50 km)
                </li>
                <li className="flex items-start gap-2.5 text-muted-foreground">
                  <span className="mt-0.5 w-1.5 h-1.5 rounded-full bg-primary shrink-0" />
                  Calcular rutas hacia las propiedades
                </li>
              </ul>
            </div>
          </div>
          <DialogFooter className="px-6 pb-6 gap-2 sm:gap-3 flex-col sm:flex-row">
            <Button type="button" variant="outline" onClick={dismissLocationDialog} className="w-full sm:w-auto rounded-xl">
              Ahora no
            </Button>
            <Button type="button" onClick={requestLocation} className="w-full sm:w-auto rounded-xl shadow-md">
              <MapPin className="h-4 w-4 mr-2" />
              Permitir ubicación
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default memo(DiscoverSection);
