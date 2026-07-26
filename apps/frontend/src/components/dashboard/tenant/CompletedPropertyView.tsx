import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Carousel, CarouselContent, CarouselItem, CarouselNext, CarouselPrevious } from "@/components/ui/carousel";
import {
  Dialog,
  DialogContent,
  DialogTitle,
} from "@/components/ui/dialog";
import { Loader2, ArrowLeft, MapPin, Bed, Bath, Square, Star, Building, Home, CheckCircle, MessageSquare, Calendar, Clock, CreditCard, Video, X } from "lucide-react";
import { api, Property, PropertyReview } from "@/services/api";
import { getTransactionByRentalRequest } from "@/services/transaction.service";
import { RatingStars, ReviewCard, ReviewForm } from "@/components/reviews";
import { useAuth } from "@/contexts/AuthContext";
import { AmenityGrid } from "@/components/common/AmenityCard";
import { useToast } from "@/hooks/use-toast";
import { MapContainer, TileLayer, Marker, Popup } from "react-leaflet";
import { Icon } from "leaflet";
import "leaflet/dist/leaflet.css";

const iconMap: Record<string, string> = {
  Residencia: '/images/icon-maps/residencia.png',
  Apartamento: '/images/icon-maps/apartamento.png',
  Casa: '/images/icon-maps/casa.png',
  Local: '/images/icon-maps/local.png',
  Finca: '/images/icon-maps/finca.png',
  Terreno: '/images/icon-maps/terreno.png',
};

const getPropertyIcon = (type: string) => new Icon({
  iconUrl: iconMap[type] || iconMap.Residencia,
  iconSize: [24, 24],
  iconAnchor: [12, 24],
  popupAnchor: [0, -24],
});

interface RentRequest {
  id: number;
  tenantId: number;
  propertyId: number;
  status: string;
  message: string;
  moveInDate?: string;
  phoneNumber?: string;
  leaseDuration?: number | null;
  property?: {
    id: number;
    title: string;
    address?: string;
    location?: string;
    price: number;
    images?: string[];
    author?: { name: string };
    authorId?: number;
  };
  createdAt: string;
}

interface CompletedPropertyViewProps {
  request: RentRequest;
  onBack: () => void;
}

const CompletedPropertyView = ({ request, onBack }: CompletedPropertyViewProps) => {
  const [property, setProperty] = useState<Property | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [reviews, setReviews] = useState<PropertyReview[]>([]);
  const [reviewsPagination, setReviewsPagination] = useState({ page: 1, limit: 5, total: 0, totalPages: 1 });
  const [myReview, setMyReview] = useState<PropertyReview | null>(null);
  const [showReviewForm, setShowReviewForm] = useState(false);
  const [transaction, setTransaction] = useState<{ amount: number; currency: string } | null>(null);
  const { user } = useAuth();
  const { toast } = useToast();
  const [showVideoModal, setShowVideoModal] = useState(false);

  useEffect(() => {
    const load = async () => {
      setIsLoading(true);
      try {
        const [propRes, txRes] = await Promise.all([
          api.getProperty(request.propertyId),
          getTransactionByRentalRequest(request.id).catch(() => null),
        ]);
        if (propRes.success && propRes.data) {
          setProperty(propRes.data.property);
        }
        if (txRes?.transaction) {
          setTransaction(txRes.transaction);
        }
        const reviewsRes = await api.getPropertyReviews(request.propertyId, 1, 5);
        if (reviewsRes.success && reviewsRes.data) {
          setReviews(reviewsRes.data.reviews);
          setReviewsPagination(reviewsRes.data.pagination);
        }
        if (user) {
          const myRevRes = await api.getMyPropertyReview(request.propertyId);
          if (myRevRes.success && myRevRes.data?.review) {
            setMyReview(myRevRes.data.review);
          }
        }
      } catch {
        toast({ title: "Error", description: "Error al cargar los datos de la propiedad", variant: "destructive" });
      } finally {
        setIsLoading(false);
      }
    };
    load();
  }, [request.id, request.propertyId, user, toast]);

  useEffect(() => {
    const timer = setTimeout(() => window.dispatchEvent(new Event("resize")), 200);
    return () => clearTimeout(timer);
  }, []);

  const handleSubmitReview = async (data: { rating: number; comment?: string }) => {
    if (!property || !user) return;
    try {
      const response = myReview
        ? await api.updatePropertyReview(myReview.id, data)
        : await api.createPropertyReview({ propertyId: property.id, rating: data.rating, comment: data.comment });
      if (response.success && response.data) {
        setMyReview(response.data.review);
        setShowReviewForm(false);
        const reviewsRes = await api.getPropertyReviews(property.id, 1, 5);
        if (reviewsRes.success && reviewsRes.data) {
          setReviews(reviewsRes.data.reviews);
          setReviewsPagination(reviewsRes.data.pagination);
        }
        toast({ title: myReview ? "Reseña actualizada" : "Reseña enviada", description: "Tu calificación ha sido registrada" });
      }
    } catch {
      toast({ title: "Error", description: "No se pudo enviar la reseña", variant: "destructive" });
    }
  };

  const handleDeleteReview = async () => {
    if (!myReview || !property) return;
    try {
      const response = await api.deletePropertyReview(myReview.id);
      if (response.success) {
        setMyReview(null);
        setShowReviewForm(false);
        const reviewsRes = await api.getPropertyReviews(property.id, 1, 5);
        if (reviewsRes.success && reviewsRes.data) {
          setReviews(reviewsRes.data.reviews);
          setReviewsPagination(reviewsRes.data.pagination);
        }
        toast({ title: "Reseña eliminada", description: "Tu reseña ha sido eliminada" });
      }
    } catch {
      toast({ title: "Error", description: "No se pudo eliminar la reseña", variant: "destructive" });
    }
  };

  const TypeIcon = property?.type === "Residencia" ? Building : property?.type === "Casa" ? Home : Building;

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!property) {
    return (
      <div className="text-center py-12">
        <p className="text-muted-foreground">No se pudo cargar la propiedad</p>
        <Button variant="ghost" onClick={onBack} className="mt-4">Volver</Button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="sm" onClick={onBack}>
          <ArrowLeft className="h-4 w-4 mr-1" />
          Volver a solicitudes
        </Button>
      </div>

      <Carousel className="w-full">
        <CarouselContent>
          {(property.images?.length ? property.images : ["https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?w=800"]).map((img, i) => (
            <CarouselItem key={i}>
              <div className="relative h-[250px] md:h-[350px] rounded-xl overflow-hidden">
                <img src={img} alt={`${property.title} - ${i + 1}`} className="w-full h-full object-cover" />
              </div>
            </CarouselItem>
          ))}
        </CarouselContent>
        {property.images && property.images.length > 1 && (
          <>
            <CarouselPrevious className="left-4" />
            <CarouselNext className="right-4" />
          </>
        )}
      </Carousel>

      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold">{property.title}</h1>
          <p className="text-muted-foreground flex items-center gap-1 mt-1"><MapPin className="h-4 w-4" />{property.location}</p>
        </div>
        <div className="text-right">
          <div className="text-3xl font-bold text-primary">${property.price}<span className="text-base text-muted-foreground">/mes</span></div>
          <div className="flex gap-2 mt-2">
            <Badge>{property.listingType}</Badge>
            <Badge variant="outline">{property.type}</Badge>
            {property.furnished && <Badge variant="secondary">Amueblado</Badge>}
            {property.videoUrl && (
              <button
                onClick={() => setShowVideoModal(true)}
                className="inline-flex items-center gap-1 text-xs font-medium text-primary hover:text-primary/80 transition-colors"
              >
                <Video className="h-3.5 w-3.5" />
                Ver video
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Contract Info */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg">
            <CreditCard className="h-5 w-5" />
            Información del contrato
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="flex items-center gap-3">
              <Calendar className="h-5 w-5 text-muted-foreground" />
              <div>
                <p className="text-sm text-muted-foreground">Mudanza</p>
                <p className="font-medium">{request.moveInDate ? new Date(request.moveInDate).toLocaleDateString("es-VE") : "Por definir"}</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <Clock className="h-5 w-5 text-muted-foreground" />
              <div>
                <p className="text-sm text-muted-foreground">Duración</p>
                <p className="font-medium">{request.leaseDuration ? `${request.leaseDuration} meses` : "Indefinido"}</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <CreditCard className="h-5 w-5 text-muted-foreground" />
              <div>
                <p className="text-sm text-muted-foreground">Mensualidad</p>
                <p className="font-medium">${property.price} USD</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <CheckCircle className="h-5 w-5 text-green-500" />
              <div>
                <p className="text-sm text-muted-foreground">Estado</p>
                <p className="font-medium text-green-600">Completada</p>
              </div>
            </div>
          </div>
          {transaction && (
            <div className="mt-4 pt-4 border-t text-sm text-muted-foreground">
              Pago realizado: <span className="font-medium text-foreground">{transaction.amount} {transaction.currency}</span>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Features */}
      <Card>
        <CardContent className="p-4">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-primary/10 rounded-lg"><Bed className="h-5 w-5 text-primary" /></div>
              <div><p className="text-sm text-muted-foreground">{property.type === 'Residencia' ? 'Total cuartos' : 'Habitaciones'}</p><p className="font-semibold">{property.bedrooms}</p></div>
            </div>
            {property.type === 'Residencia' && (
              <div className="flex items-center gap-3">
                <div className="p-2 bg-green-100 rounded-lg"><Bed className="h-5 w-5 text-green-600" /></div>
                <div><p className="text-sm text-muted-foreground">Disponibles</p><p className="font-semibold text-green-600">{property.availableRooms ?? 0}</p></div>
              </div>
            )}
            {property.type === 'Residencia' && (
              <div className="flex items-center gap-3">
                <div className="p-2 bg-amber-100 rounded-lg"><Bed className="h-5 w-5 text-amber-600" /></div>
                <div><p className="text-sm text-muted-foreground">Ocupados</p><p className="font-semibold text-amber-600">{property.occupiedRooms ?? 0}</p></div>
              </div>
            )}
            <div className="flex items-center gap-3">
              <div className="p-2 bg-primary/10 rounded-lg"><Bath className="h-5 w-5 text-primary" /></div>
              <div><p className="text-sm text-muted-foreground">Baños</p><p className="font-semibold">{property.bathrooms}</p></div>
            </div>
            <div className="flex items-center gap-3">
              <div className="p-2 bg-primary/10 rounded-lg"><Square className="h-5 w-5 text-primary" /></div>
              <div><p className="text-sm text-muted-foreground">Área</p><p className="font-semibold">{property.area} m²</p></div>
            </div>
            <div className="flex items-center gap-3">
              <div className="p-2 bg-primary/10 rounded-lg"><TypeIcon className="h-5 w-5 text-primary" /></div>
              <div><p className="text-sm text-muted-foreground">Tipo</p><p className="font-semibold">{property.type}</p></div>
            </div>
          </div>
        </CardContent>
      </Card>

      <div>
        <h3 className="text-lg font-semibold mb-2">Descripción</h3>
        <p className="text-muted-foreground">{property.description}</p>
      </div>

      {property.features?.length > 0 && (
        <div>
          <h3 className="text-lg font-semibold mb-1">Características</h3>
          <p className="text-sm text-muted-foreground mb-3">Servicios y comodidades incluidas</p>
          <AmenityGrid features={property.features} />
        </div>
      )}

      <div>
        <h3 className="text-lg font-semibold mb-3">Ubicación</h3>
        <div className="h-[300px] rounded-xl overflow-hidden border z-0">
          <MapContainer center={[property.lat, property.lng]} zoom={15} scrollWheelZoom={false} className="w-full h-full">
            <TileLayer attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>' url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
            <Marker position={[property.lat, property.lng]} icon={getPropertyIcon(property.type)}>
              <Popup><b>{property.title}</b><br/>{property.address}</Popup>
            </Marker>
          </MapContainer>
        </div>
        <p className="text-sm text-muted-foreground mt-2 flex items-center gap-1"><MapPin className="h-4 w-4" />{property.address}</p>
      </div>

      {/* Reviews */}
      <div className="border-t pt-6">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h3 className="text-xl font-semibold flex items-center gap-2">
              <MessageSquare className="h-5 w-5" />
              Reseñas de esta propiedad
            </h3>
            <p className="text-sm text-muted-foreground mt-1">
              {reviewsPagination.total} reseñas • Promedio: {typeof property.avgRating === 'number' ? property.avgRating.toFixed(1) : '0.0'} estrellas
            </p>
          </div>
          {user && !myReview && user.role !== 'propietario' && (
            <Button onClick={() => setShowReviewForm(true)}>
              <Star className="h-4 w-4 mr-2" />
              Calificar propiedad
            </Button>
          )}
        </div>

        {showReviewForm && (
          <Card className="mb-6">
            <CardContent className="p-6">
              <ReviewForm
                targetName={property.title}
                onSubmit={handleSubmitReview}
                onCancel={() => setShowReviewForm(false)}
                isEditing={false}
              />
            </CardContent>
          </Card>
        )}


        <div className="space-y-4">
          {reviews.length === 0 ? (
            <div className="text-center py-8 border rounded-lg">
              <MessageSquare className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
              <h4 className="font-medium mb-2">Aún no hay reseñas</h4>
              <p className="text-sm text-muted-foreground">Sé el primero en calificar</p>
            </div>
          ) : (
            reviews.map((review) => (
              <ReviewCard key={review.id} review={review} type="property" isOwner={user?.id === review.userId} onEdit={user?.id === review.userId ? () => { setMyReview(review); setShowReviewForm(true); } : undefined} onDelete={user?.id === review.userId ? handleDeleteReview : undefined} />
            ))
          )}
        </div>
      </div>

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

export default CompletedPropertyView;
