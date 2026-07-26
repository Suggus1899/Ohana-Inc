import { useParams, Link, useNavigate, useLocation } from "react-router-dom";
import { useEffect, useRef, useState } from "react";
import { m } from "framer-motion";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogTitle,
  DialogHeader,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectTrigger,
  SelectContent,
  SelectItem,
  SelectValue,
} from "@/components/ui/select";
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
} from "@/components/ui/carousel";
import PropertyCard from "@/components/PropertyCard";
import NavigationButton from "@/components/navigation/NavigationButton";
import Footer from "@/components/Footer";
import Navbar from "@/components/layout/Navbar";
import { AmenityGrid } from "@/components/common/AmenityCard";
import { useAuth } from "@/contexts/AuthContext";
import { useExchangeRate } from "@/contexts/ExchangeRateContext";
import { formatDualPrice, formatCurrency, usdToVes } from "@/utils/formatPrice";
import RequestTransactionModal from "@/components/transactions/RequestTransactionModal";
import { useChat } from "@/hooks/useChat";
import { toast } from "sonner";
import api, { Property, PropertyReview } from "@/services/api";
import {
  ArrowLeft,
  MapPin,
  BedDouble,
  Bath,
  Maximize,
  Heart,
  Share2,
  Phone,
  MessageCircle,
  Calendar,
  User,
  Home,
  Eye,
  CheckCircle,
  Loader2,
  AlertCircle,
  Shield,
  MessageSquare,
  Star,
  Send,
  ChevronDown,
  Video,
  X,
  BadgeCheck,
  Copy,
  Check,
  ExternalLink,
  Wifi,
  Droplets,
  Zap,
  Wind,
  CookingPot,
  Car,
  Sofa,
  Tv,
  Flame,
  Sparkles,
  Waves,
  Dumbbell,
  TreePine,
  BookOpen,
  UtensilsCrossed,
  ShowerHead,
  Fan,
  Sun,
} from "lucide-react";
import "leaflet/dist/leaflet.css";
import L from "leaflet";
import { RatingStars, ReviewCard, ReviewForm } from "@/components/reviews";

const iconMap: Record<string, string> = {
  Residencia: '/images/icon-maps/residencia.png',
  Apartamento: '/images/icon-maps/apartamento.png',
  Casa: '/images/icon-maps/casa.png',
  Local: '/images/icon-maps/local.png',
  Finca: '/images/icon-maps/finca.png',
  Terreno: '/images/icon-maps/terreno.png',
};

const getPropertyIcon = (type: string) => L.icon({
  iconUrl: iconMap[type] || iconMap.Residencia,
  iconSize: [24, 24],
  iconAnchor: [12, 24],
  popupAnchor: [0, -24],
});

// Related properties - TODO: fetch from API based on type/location
const relatedProperties: Property[] = [];

const PropertyDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const state = location.state as { startChatWithOwner?: number } | null;
  const mapRef = useRef<HTMLDivElement | null>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);
  const [isLiked, setIsLiked] = useState(false);
  const [imageError, setImageError] = useState<Record<number, boolean>>({});
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [rentRequestTarget, setRentRequestTarget] = useState<Property | null>(null);
  const [rentMoveInDate, setRentMoveInDate] = useState("");
  const [rentLeaseDuration, setRentLeaseDuration] = useState("12");
  const [rentIndefinite, setRentIndefinite] = useState(false);
  const [isSubmittingRent, setIsSubmittingRent] = useState(false);
  const { user } = useAuth();
  const { rate } = useExchangeRate();
  const { startDirectConversation } = useChat();

  // API integration states
  const [property, setProperty] = useState<Property | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [verificationLevel, setVerificationLevel] = useState(0);
  const [canRequest, setCanRequest] = useState(false);
  const [hasConfirmedTransaction, setHasConfirmedTransaction] = useState(false);
  const [checkingTransaction, setCheckingTransaction] = useState(true);
  const [remainingFreeRequests, setRemainingFreeRequests] = useState<number | null>(null);
  
  // Reviews states
  const [reviews, setReviews] = useState<PropertyReview[]>([]);
  const [reviewsPagination, setReviewsPagination] = useState({ page: 1, limit: 5, total: 0, totalPages: 1 });
  const [myReview, setMyReview] = useState<PropertyReview | null>(null);
  const [showReviewForm, setShowReviewForm] = useState(false);
  const [isLoadingReviews, setIsLoadingReviews] = useState(false);
  const [isSubmittingReview, setIsSubmittingReview] = useState(false);
  const [visitForm, setVisitForm] = useState({ name: '', email: '', phone: '', visitDate: '', message: '' });
  const [visitSubmitting, setVisitSubmitting] = useState(false);
  const [visitSuccess, setVisitSuccess] = useState(false);
  const [visitError, setVisitError] = useState<string | null>(null);
  const [showVideoModal, setShowVideoModal] = useState(false);
  const [showShareDialog, setShowShareDialog] = useState(false);
  const [copied, setCopied] = useState(false);

  // Fetch property from API
  useEffect(() => {
    const fetchProperty = async () => {
      if (!id) return;
      setLoading(true);
      try {
        // Get property details
        const propertyId = parseInt(id);
        if (isNaN(propertyId)) {
          setError('ID de propiedad inválido');
          return;
        }
        const res = await api.getProperty(propertyId);
        if (!res.success || !res.data?.property) {
          setError('Propiedad no encontrada');
          return;
        }
        setProperty(res.data.property);
        
        // Load reviews for this property
        await loadReviews(propertyId);
      } catch (err: unknown) {
        setError(err instanceof Error ? err.message : 'Error cargando propiedad');
      } finally {
        setLoading(false);
      }
    };
    
    const loadReviews = async (propertyId: number) => {
      setIsLoadingReviews(true);
      try {
        // Load property reviews
        const reviewsResponse = await api.getPropertyReviews(propertyId, 1, 5);
        if (reviewsResponse.success && reviewsResponse.data) {
          setReviews(reviewsResponse.data.reviews);
          setReviewsPagination(reviewsResponse.data.pagination);
        }
        
        // Load my review if exists
        if (user) {
          const myReviewResponse = await api.getMyPropertyReview(propertyId);
          if (myReviewResponse.success && myReviewResponse.data) {
            setMyReview(myReviewResponse.data.review);
          }
        }
      } catch (error) {
        console.error('Error cargando reviews:', error);
        toast.error('No se pudieron cargar las reseñas');
      } finally {
        setIsLoadingReviews(false);
      }
    };
    
    fetchProperty();
  }, [id, user]);

  // Visit form handling
  const handleVisitSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!property || !visitForm.name || !visitForm.email || !visitForm.phone || !visitForm.visitDate) {
      setVisitError('Completa todos los campos requeridos');
      return;
    }
    setVisitSubmitting(true);
    setVisitError(null);
    setVisitSuccess(false);
    try {
      const res = await api.createVisit({
        propertyId: property.id,
        name: visitForm.name,
        email: visitForm.email,
        phone: visitForm.phone,
        visitDate: visitForm.visitDate,
        message: visitForm.message || undefined,
      });
      if (res.success) {
        setVisitSuccess(true);
        setVisitForm({ name: '', email: '', phone: '', visitDate: '', message: '' });
        toast.success('Visita solicitada con éxito');
      } else {
        setVisitError(res.error?.message || 'Error al solicitar la visita');
      }
    } catch (err: unknown) {
      setVisitError(err instanceof Error ? err.message : 'Error de red');
    } finally {
      setVisitSubmitting(false);
    }
  };

  // Review handling functions
  const handleSubmitReview = async (data: { rating: number; comment?: string }) => {
    if (!property || !user) return;
    
    setIsSubmittingReview(true);
    try {
      let response;
      
      if (myReview) {
        // Update existing review
        response = await api.updatePropertyReview(myReview.id, data);
      } else {
        // Create new review
        response = await api.createPropertyReview({
          propertyId: property.id,
          rating: data.rating,
          comment: data.comment,
        });
      }
      
      if (response.success && response.data) {
        toast.success(myReview ? "Reseña actualizada" : "Reseña enviada");
        
        // Update state
        setMyReview(response.data.review);
        setShowReviewForm(false);
        
        // Reload reviews list
        const reviewsResponse = await api.getPropertyReviews(property.id, 1, 5);
        if (reviewsResponse.success && reviewsResponse.data) {
          setReviews(reviewsResponse.data.reviews);
          setReviewsPagination(reviewsResponse.data.pagination);
        }
      } else {
        toast.error(response.error?.message || "No se pudo enviar la reseña");
      }
    } catch (error) {
      console.error('Error enviando review:', error);
      toast.error('No se pudo enviar la reseña');
    } finally {
      setIsSubmittingReview(false);
    }
  };

  const propertyUrl = `${window.location.origin}${location.pathname}`;
  const propertyTitle = property?.title || 'Propiedad en Habitas';

  const handleShare = (platform: string) => {
    const text = `Mira esta propiedad en Habitas: ${propertyTitle} - ${propertyUrl}`;
    switch (platform) {
      case 'whatsapp':
        window.open(`https://wa.me/?text=${encodeURIComponent(text)}`, '_blank');
        break;
      case 'twitter':
        window.open(`https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}`, '_blank');
        break;
      case 'facebook':
        window.open(`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(propertyUrl)}`, '_blank');
        break;
      case 'copy':
        navigator.clipboard.writeText(propertyUrl).then(() => {
          setCopied(true);
          setTimeout(() => setCopied(false), 2000);
          toast.success('Enlace copiado al portapapeles');
        });
        break;
    }
    setShowShareDialog(false);
  };

  const handleNativeShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: propertyTitle,
          text: `Mira esta propiedad en Habitas: ${propertyTitle}`,
          url: propertyUrl,
        });
      } catch {
        // User cancelled
      }
    } else {
      setShowShareDialog(true);
    }
  };

  const handleDeleteReview = async () => {
    if (!myReview) return;
    
    try {
      const response = await api.deletePropertyReview(myReview.id);
      if (response.success) {
        toast.success("Reseña eliminada");
        setMyReview(null);
        
        // Reload reviews list
        const reviewsResponse = await api.getPropertyReviews(property.id, 1, 5);
        if (reviewsResponse.success && reviewsResponse.data) {
          setReviews(reviewsResponse.data.reviews);
          setReviewsPagination(reviewsResponse.data.pagination);
        }
      } else {
        toast.error(response.error?.message || "No se pudo eliminar la reseña");
      }
    } catch (error) {
      console.error('Error eliminando review:', error);
      toast.error('No se pudo eliminar la reseña');
    }
  };

  // Rent request handling
  const handleQuickRequest = () => {
    if (!property) return;
    setRentRequestTarget(property);
    setRentMoveInDate("");
    setRentLeaseDuration("12");
    setRentIndefinite(false);
  };

  const submitRentRequest = async () => {
    if (!rentRequestTarget) return;
    if (!rentMoveInDate) {
      toast.error("Selecciona una fecha de mudanza");
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
        toast.success("¡Solicitud enviada!");
        setRentRequestTarget(null);
      } else {
        const errCode = response.error?.code;
        const isDuplicate = errCode === 'DUPLICATE_REQUEST';
        toast.error(isDuplicate ? "Ya enviaste una solicitud para esta propiedad" : (response.error?.message || "No se pudo enviar la solicitud"));
      }
    } catch {
      toast.error("No se pudo enviar la solicitud");
    } finally {
      setIsSubmittingRent(false);
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
      toast.error('No se pudieron cargar más reseñas');
    }
  };

  // Fetch verification level for students
  useEffect(() => {
    const checkVerification = async () => {
      if (!user || (user.role !== 'cliente' && user.role !== 'estudiante')) {
        setCheckingTransaction(false);
        return;
      }
      try {
        const level = await api.getMyVerificationLevel();
        setVerificationLevel(level.verificationLevel);
        setCanRequest(level.canRequestProperty);
      } catch (err) {
        console.error('Error checking verification:', err);
        setCanRequest(false);
      } finally {
        setCheckingTransaction(false);
      }
    };
    checkVerification();
  }, [user]);

  // Start chat automatically if redirected after login
  useEffect(() => {
    if (state?.startChatWithOwner && user && property) {
      const ownerId = state.startChatWithOwner;
      startDirectConversation(ownerId).then((result) => {
        if (result) {
          // Clean state
          window.history.replaceState({}, document.title);
          navigate('/estudiante', { 
            state: { activeSection: 'messages', conversationId: result.id } 
          });
        }
      });
    }
  }, [state?.startChatWithOwner, user, property, startDirectConversation, navigate]);

  useEffect(() => {
    if (!mapRef.current || !property) return;

    // Clean up previous map instance
    if (mapInstanceRef.current) {
      mapInstanceRef.current.remove();
      mapInstanceRef.current = null;
    }

    const map = L.map(mapRef.current).setView(
      [property.lat, property.lng],
      15
    );

    L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
      attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
    }).addTo(map);

    L.marker([property.lat, property.lng], { icon: getPropertyIcon(property.type) })
      .addTo(map)
      .bindPopup(`<b>${property.title}</b><br>${property.address}`)
      .openPopup();

    mapInstanceRef.current = map;

    return () => {
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
      }
    };
  }, [property]);

  if (!property) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-3xl font-bold mb-4">Propiedad no encontrada</h1>
          <Button onClick={() => navigate("/")}>Volver al inicio</Button>
        </div>
      </div>
    );
  }

  const fallbackImage = "https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?w=800";

  return (
    <div className="min-h-screen bg-background">
      <Navbar />

      {/* Hero Section */}
      <m.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="relative"
      >
        {/* Image Gallery */}
        <div className="container mx-auto px-4 py-6">
          <div className="flex items-center justify-between mb-4">
            <Link to="/">
              <Button variant="ghost" size="sm">
                <ArrowLeft className="w-4 h-4 mr-2" />
                Volver
              </Button>
            </Link>
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="icon"
                onClick={() => setIsLiked(!isLiked)}
              >
                <Heart className={`h-4 w-4 ${isLiked ? "fill-red-500 text-red-500" : ""}`} />
              </Button>
              <Button variant="outline" size="icon" onClick={handleNativeShare}>
                <Share2 className="h-4 w-4" />
              </Button>
            </div>
          </div>

          <div className="relative h-[400px] md:h-[500px] overflow-visible" style={{ perspective: '1500px' }}>
            <m.div
              animate={{ rotateY: currentImageIndex * -90 }}
              transition={{
                duration: 0.8,
                ease: [0.25, 0.46, 0.45, 0.94]
              }}
              style={{
                transformStyle: 'preserve-3d',
                position: 'relative',
                width: '100%',
                height: '100%'
              }}
            >
              {property.images.map((img, index) => {
                const isError = imageError[index];
                const imageSrc = isError ? fallbackImage : img;

                return (
                  <div
                    key={index}
                    style={{
                      position: 'absolute',
                      width: '100%',
                      height: '100%',
                      backfaceVisibility: 'hidden',
                      transform: `rotateY(${index * 90}deg) translateZ(${index === 0 ? '0px' : '0px'})`,
                      transformStyle: 'preserve-3d'
                    }}
                    className="overflow-hidden rounded-xl"
                  >
                    <img
                      src={imageSrc}
                      alt={`${property.title} - ${index + 1}`}
                      className="w-full h-full object-cover"
                      onError={() => setImageError((prev) => ({ ...prev, [index]: true }))}
                    />
                  </div>
                );
              })}
            </m.div>

            {/* Image Counter */}
            <div className="absolute top-4 right-4 bg-black/60 backdrop-blur-sm text-white px-3 py-1.5 rounded-full text-sm z-10">
              {currentImageIndex + 1} / {property.images.length}
            </div>

            {/* Navigation Buttons */}
            <button
              onClick={() => setCurrentImageIndex((prev) => (prev === 0 ? property.images.length - 1 : prev - 1))}
              className="absolute left-4 top-1/2 -translate-y-1/2 p-3 bg-white/90 backdrop-blur-sm rounded-full shadow-lg hover:bg-white transition-colors z-10"
            >
              <ArrowLeft className="h-5 w-5" />
            </button>
            <button
              onClick={() => setCurrentImageIndex((prev) => (prev === property.images.length - 1 ? 0 : prev + 1))}
              className="absolute right-4 top-1/2 -translate-y-1/2 p-3 bg-white/90 backdrop-blur-sm rounded-full shadow-lg hover:bg-white transition-colors z-10"
            >
              <ArrowLeft className="h-5 w-5 rotate-180" />
            </button>

            {/* Image Dots */}
            <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-2 z-10">
              {property.images.map((_, idx) => (
                <button
                  key={idx}
                  onClick={() => setCurrentImageIndex(idx)}
                  className={`transition-all ${idx === currentImageIndex
                    ? "bg-white w-8 h-2"
                    : "bg-white/60 hover:bg-white/80 w-2 h-2"
                    } rounded-full`}
                />
              ))}
            </div>
          </div>
        </div>
      </m.div>

      {/* Mobile Action Bar */}
      <div className="lg:hidden fixed bottom-0 left-0 right-0 z-50 bg-white border-t border-gray-200 shadow-[0_-4px_20px_rgba(0,0,0,0.1)] px-4 py-3">
        <div className="flex items-center gap-3">
          <div className="flex-1 min-w-0">
            <p className="text-lg font-bold text-primary truncate">
              {rate && rate.usdToVes > 0
                ? formatDualPrice(
                    typeof property.price === 'number' ? property.price : parseFloat(property.price) || 0,
                    usdToVes(typeof property.price === 'number' ? property.price : parseFloat(property.price) || 0, rate.usdToVes),
                    property.listingType !== "Venta" ? "mes" : undefined
                  )
                : `${formatCurrency(typeof property.price === 'number' ? property.price : parseFloat(property.price) || 0, 'USD')}${property.listingType !== "Venta" ? '/mes' : ''}`
              }
            </p>
          </div>
          <div className="flex gap-2 shrink-0">
            {property.type === 'Residencia' && (property.availableRooms ?? 0) === 0 ? (
              <Button size="sm" disabled>Sin disponibilidad</Button>
            ) : !user ? (
              <Button size="sm" onClick={() => navigate('/login', { state: { redirectAfterLogin: `/propiedades/${id}` } })}>
                Solicitar
              </Button>
            ) : user.id === property.authorId ? (
              <Button size="sm" disabled variant="outline">Tu propiedad</Button>
            ) : user.role === 'cliente' || user.role === 'estudiante' ? (
              checkingTransaction ? (
                <Button size="sm" disabled><Loader2 className="h-4 w-4 animate-spin" /></Button>
              ) : canRequest ? (
                <Button size="sm" onClick={handleQuickRequest}>Solicitar</Button>
              ) : (
                <Button size="sm" disabled>Verificado</Button>
              )
            ) : (
              <Button size="sm" onClick={handleQuickRequest}>Solicitar</Button>
            )}
            {!user ? (
              <Button size="sm" variant="outline" onClick={() => navigate('/login', { state: { redirectAfterLogin: `/propiedades/${id}`, startChatWithOwner: property.authorId } })}>
                <MessageCircle className="h-4 w-4 mr-1" /> Contactar
              </Button>
            ) : user.id !== property.authorId ? (
              <Button size="sm" variant="outline" onClick={async () => {
                const ownerId = property.authorId;
                if (ownerId === user.id) { toast.error("No puedes chatear contigo mismo"); return; }
                try {
                  const result = await startDirectConversation(ownerId);
                  if (result) {
                    toast.success("Conversación iniciada");
                    const dashboardPath = user.role === 'estudiante' ? '/estudiante' : '/cliente';
                    navigate(dashboardPath, { state: { activeSection: 'messages', conversationId: result.id } });
                  } else {
                    toast.error("No se pudo iniciar la conversación");
                  }
                } catch {
                  toast.error("Error al iniciar la conversación");
                }
              }}>
                <MessageCircle className="h-4 w-4 mr-1" /> Contactar
              </Button>
            ) : null}
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="container mx-auto px-4 py-8 pb-24 lg:pb-8">
        <div className="grid lg:grid-cols-3 gap-8">
          {/* Main Content */}
          <m.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="lg:col-span-2 space-y-6"
          >
            {/* Header */}
            <div>
              <div className="flex flex-wrap gap-2 mb-3">
                <Badge className={property.listingType === "Venta" ? "bg-green-600" : "bg-primary"}>
                  {property.listingType}
                </Badge>
                <Badge variant="outline">{property.type}</Badge>
                {property.isFeatured && (
                  <Badge className="bg-yellow-500 text-yellow-950">Destacado</Badge>
                )}
                {property.status === 'rented' && (
                  <Badge className="bg-gray-800 text-white hover:bg-gray-800">ALQUILADA</Badge>
                )}
                {property.type === 'Residencia' && (property.availableRooms ?? 0) === 0 && (
                  <Badge className="bg-red-700 text-white hover:bg-red-700">OCUPADA</Badge>
                )}
                {property.status === 'sold' && (
                  <Badge className="bg-gray-800 text-white hover:bg-gray-800">VENDIDA</Badge>
                )}
                {property.videoUrl && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setShowVideoModal(true)}
                    className="gap-1.5 text-xs h-7"
                  >
                    <Video className="h-3.5 w-3.5" />
                    Ver video
                  </Button>
                )}
              </div>
              <h1 className="text-3xl md:text-4xl font-bold mb-2">{property.title}</h1>
              <p className="text-muted-foreground flex items-center gap-2">
                <MapPin className="h-4 w-4" />
                {property.location}
              </p>
            </div>

            {/* Quick Stats */}
            <Card>
              <CardContent className="p-6">
                <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
                  <div className="flex items-center gap-3">
                    <div className="p-3 bg-primary/10 rounded-lg">
                      <BedDouble className="h-5 w-5 text-primary" />
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">{property.type === 'Residencia' ? 'Total cuartos' : 'Habitaciones'}</p>
                      <p className="font-semibold">{property.bedrooms}</p>
                    </div>
                  </div>
                  {property.type === 'Residencia' && (
                    <div className="flex items-center gap-3">
                      <div className="p-3 bg-green-100 rounded-lg">
                        <BedDouble className="h-5 w-5 text-green-600" />
                      </div>
                      <div>
                        <p className="text-sm text-muted-foreground">Disponibles</p>
                        <p className="font-semibold text-green-600">{property.availableRooms ?? 0}</p>
                      </div>
                    </div>
                  )}
                  {property.type === 'Residencia' && (
                    <div className="flex items-center gap-3">
                      <div className="p-3 bg-amber-100 rounded-lg">
                        <BedDouble className="h-5 w-5 text-amber-600" />
                      </div>
                      <div>
                        <p className="text-sm text-muted-foreground">Ocupados</p>
                        <p className="font-semibold text-amber-600">{property.occupiedRooms ?? 0}</p>
                      </div>
                    </div>
                  )}
                  <div className="flex items-center gap-3">
                    <div className="p-3 bg-primary/10 rounded-lg">
                      <Bath className="h-5 w-5 text-primary" />
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Baños</p>
                      <p className="font-semibold">{property.bathrooms}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="p-3 bg-primary/10 rounded-lg">
                      <Maximize className="h-5 w-5 text-primary" />
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Área</p>
                      <p className="font-semibold">{property.area} m²</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="p-3 bg-primary/10 rounded-lg">
                      <Eye className="h-5 w-5 text-primary" />
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Vistas</p>
                      <p className="font-semibold">{property.views}</p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Description */}
            <Card>
              <CardContent className="p-6">
                <h2 className="text-xl font-bold mb-4">Descripción</h2>
                <p className="text-muted-foreground leading-relaxed">{property.description}</p>
              </CardContent>
            </Card>

            {/* Features */}
            <Card>
              <CardContent className="p-6">
                <h2 className="text-xl font-bold mb-1">Características</h2>
                <p className="text-sm text-muted-foreground mb-4">
                  Servicios y comodidades incluidas en esta propiedad
                </p>
                <AmenityGrid features={property.features} />
              </CardContent>
            </Card>

            {/* Map */}
            <Card>
              <CardContent className="p-6">
                <h2 className="text-xl font-bold mb-4">Ubicación</h2>
                <div
                  ref={mapRef}
                  className="h-[400px] rounded-xl overflow-hidden mb-4 relative z-0"
                />
                <p className="text-sm text-muted-foreground flex items-center gap-2">
                  <MapPin className="h-4 w-4" />
                  {property.address}
                </p>
              </CardContent>
            </Card>

            {/* Author */}
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center gap-4">
                  <div className="w-14 h-14 rounded-full bg-primary flex items-center justify-center text-primary-foreground font-bold text-lg">
                    {property.author?.name?.charAt(0) || '?'}
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Publicado por</p>
                    <p className="font-semibold text-lg">{property.author?.name || 'Propietario'}{property.author?.isVerified && <BadgeCheck className="h-4 w-4 text-blue-500 inline ml-1" />}</p>
                    <p className="text-xs text-muted-foreground">
                      Publicado el {new Date(property.createdAt).toLocaleDateString("es-VE")}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Reviews Section */}
            <Card>
              <CardHeader>
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-2">
                  <div>
                    <CardTitle className="text-xl flex items-center gap-2">
                      <MessageSquare className="h-5 w-5" />
                      Reseñas de la propiedad
                    </CardTitle>
                    <CardDescription>
                      {property.reviewCount || 0} reseñas • Promedio: {property.avgRating?.toFixed(1) || '0.0'} estrellas
                    </CardDescription>
                  </div>
                  
                  {/* Rate button - only for non-owner authenticated users without existing review */}
                  {user && user.role !== 'propietario' && !myReview && (
                    <Button 
                      onClick={() => setShowReviewForm(true)}
                      disabled={isLoadingReviews}
                    >
                      <Star className="h-4 w-4 mr-2" />
                      Calificar propiedad
                    </Button>
                  )}
                </div>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Review Form */}
                {showReviewForm && (
                  <Card>
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

                {/* Reviews List */}
                <div className="space-y-4">
                  {isLoadingReviews ? (
                    <div className="flex justify-center py-8">
                      <Loader2 className="h-8 w-8 animate-spin text-primary" />
                    </div>
                  ) : reviews.length === 0 ? (
                    <div className="text-center py-8 border rounded-lg">
                      <MessageSquare className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                      <h4 className="font-medium mb-2">Aún no hay reseñas</h4>
                      <p className="text-sm text-muted-foreground">
                        Sé el primero en calificar esta propiedad
                      </p>
                    </div>
                  ) : (
                    <>
                      {reviews.map((review) => (
                        <ReviewCard
                          key={review.id}
                          review={review}
                          type="property"
                          isOwner={user?.id === review.userId}
                          onEdit={user?.id === review.userId ? () => { setShowReviewForm(true); } : undefined}
                          onDelete={user?.id === review.userId ? handleDeleteReview : undefined}
                        />
                      ))}
                      
                      {/* Load more button */}
                      {reviewsPagination.total > reviews.length && (
                        <div className="flex justify-center pt-4">
                          <Button
                            variant="outline"
                            onClick={handleLoadMoreReviews}
                            disabled={isLoadingReviews}
                          >
                            {isLoadingReviews ? (
                              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                            ) : (
                              <ChevronDown className="h-4 w-4 mr-2" />
                            )}
                            Cargar más reseñas ({reviews.length} de {reviewsPagination.total})
                          </Button>
                        </div>
                      )}
                    </>
                  )}
                </div>
              </CardContent>
            </Card>
          </m.div>

          {/* Sidebar */}
          <m.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="lg:col-span-1"
          >
            <div className="sticky top-20 space-y-6">
              {/* Price Card */}
              <Card className="border-primary">
                <CardContent className="p-6">
                  <div className="mb-4">
                    {rate && rate.usdToVes > 0 ? (
                      <span className="text-3xl font-bold text-primary">
                        {formatDualPrice(
                          typeof property.price === 'number' ? property.price : parseFloat(property.price) || 0,
                          usdToVes(
                            typeof property.price === 'number' ? property.price : parseFloat(property.price) || 0,
                            rate.usdToVes
                          ),
                          property.listingType !== "Venta" ? "mes" : undefined
                        )}
                      </span>
                    ) : (
                      <>
                        <span className="text-3xl font-bold text-primary">
                          {formatCurrency(
                            typeof property.price === 'number' ? property.price : parseFloat(property.price) || 0,
                            'USD'
                          )}
                        </span>
                        {property.listingType !== "Venta" && (
                          <span className="text-muted-foreground">/mes</span>
                        )}
                      </>
                    )}
                  </div>
                  <div className="space-y-3">
                    {/* Solicitar Propiedad - always visible */}
                    {property.type === 'Residencia' && (property.availableRooms ?? 0) === 0 ? (
                      <Button className="w-full" size="lg" disabled>
                        Sin habitaciones disponibles
                      </Button>
                    ) : !user ? (
                      <Button
                        className="w-full bg-blue-600 hover:bg-blue-700 text-white"
                        size="lg"
                        onClick={() => navigate('/login', {
                          state: { redirectAfterLogin: `/propiedades/${id}` }
                        })}
                      >
                        Solicitar Propiedad
                      </Button>
                    ) : user.id === property.authorId ? (
                      <Button className="w-full" size="lg" disabled variant="outline">
                        <BadgeCheck className="h-4 w-4 mr-2" />
                        Tu propiedad
                      </Button>
                    ) : user.role === 'cliente' || user.role === 'estudiante' ? (
                      checkingTransaction ? (
                        <Button className="w-full" size="lg" disabled>
                          <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                          Verificando...
                        </Button>
                      ) : canRequest ? (
                        <Button
                          className="w-full bg-blue-600 hover:bg-blue-700 text-white"
                          size="lg"
                          onClick={handleQuickRequest}
                        >
                          Solicitar Propiedad
                        </Button>
                      ) : (
                        <div className="space-y-2">
                          <Button
                            className="w-full bg-gray-400 cursor-not-allowed"
                            size="lg"
                            disabled
                          >
                            <Shield className="h-4 w-4 mr-2" />
                            Verificación Requerida
                          </Button>
                          <p className="text-xs text-center text-muted-foreground">
                            Necesitas completar la verificación KYC nivel 2 para solicitar propiedades.{" "}
                            <Link to="/kyc" className="text-primary hover:underline">
                              Verificar ahora
                            </Link>
                          </p>
                        </div>
                      )
                    ) : (
                      <Button
                        className="w-full bg-blue-600 hover:bg-blue-700 text-white"
                        size="lg"
                        onClick={handleQuickRequest}
                      >
                        Solicitar Propiedad
                      </Button>
                    )}
                    {/* Comunicarse con Propietario - always visible */}
                    {!user ? (
                      <Button
                        className="w-full bg-primary hover:bg-primary/90 text-primary-foreground"
                        size="lg"
                        onClick={() => navigate('/login', {
                          state: {
                            redirectAfterLogin: `/propiedades/${id}`,
                            startChatWithOwner: property.authorId
                          }
                        })}
                      >
                        <MessageCircle className="h-4 w-4 mr-2" />
                        Comunicarse con Propietario
                      </Button>
                    ) : user.id !== property.authorId ? (
                      <Button
                        className="w-full bg-primary hover:bg-primary/90 text-primary-foreground"
                      size="lg"
                      onClick={async () => {
                        if (!property) return;
                        const ownerId = property.authorId;
                        if (ownerId === user.id) {
                          toast.error("No puedes chatear contigo mismo");
                          return;
                        }
                        try {
                          const result = await startDirectConversation(ownerId);
                          if (result) {
                            toast.success("Conversación iniciada con el propietario");
                            const dashboardPath = user.role === 'estudiante' ? '/estudiante' : '/cliente';
                            navigate(dashboardPath, { state: { activeSection: 'messages', conversationId: result.id } });
                          } else {
                            toast.error("No se pudo iniciar la conversación. Intenta más tarde.");
                          }
                          } catch (error: unknown) {
                            console.error("Error al iniciar chat:", error);
                            toast.error(error instanceof Error ? error.message : "Error al iniciar la conversación");
                          }
                        }}
                      >
                        <MessageCircle className="h-4 w-4 mr-2" />
                        Comunicarse con Propietario
                      </Button>
                    ) : null}
                    {remainingFreeRequests !== null && user && (user.role === 'cliente' || user.role === 'estudiante') && (
                      <p className="text-xs text-center text-muted-foreground mt-1">
                        Te quedan <span className="font-medium">{remainingFreeRequests}</span> solicitudes gratuitas
                      </p>
                    )}
                    {/* Contact Info - Only visible after payment confirmed or to owner */}
                    {hasConfirmedTransaction && property.author?.phone && (
                      <div className="p-3 bg-green-50 border border-green-200 rounded-lg">
                        <p className="text-xs text-green-600 font-medium mb-1">Contacto del propietario:</p>
                        <a
                          href={`tel:${property.author.phone}`}
                          className="flex items-center gap-2 text-primary hover:underline"
                        >
                          <Phone className="h-4 w-4" />
                          {property.author.phone}
                        </a>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>

              {/* Contact Form */}
              <Card>
                <CardContent className="p-6">
                  <h3 className="font-bold mb-4 flex items-center gap-2">
                    <Calendar className="h-5 w-5" />
                    Agendar visita
                  </h3>
                  <form className="space-y-4" onSubmit={handleVisitSubmit}>
                    <div>
                      <Input
                        placeholder="Tu nombre"
                        value={visitForm.name}
                        onChange={(e) => setVisitForm(f => ({ ...f, name: e.target.value }))}
                        required
                      />
                    </div>
                    <div>
                      <Input
                        type="email"
                        placeholder="Correo electrónico"
                        value={visitForm.email}
                        onChange={(e) => setVisitForm(f => ({ ...f, email: e.target.value }))}
                        required
                      />
                    </div>
                    <div>
                      <Input
                        type="tel"
                        placeholder="Teléfono"
                        value={visitForm.phone}
                        onChange={(e) => setVisitForm(f => ({ ...f, phone: e.target.value }))}
                        required
                      />
                    </div>
                    <div>
                      <Input
                        type="date"
                        value={visitForm.visitDate}
                        onChange={(e) => setVisitForm(f => ({ ...f, visitDate: e.target.value }))}
                        required
                      />
                      <p className="text-xs text-muted-foreground mt-1.5">
                        La hora de la visita será definida por el propietario al confirmar la solicitud.
                      </p>
                    </div>
                    <div>
                      <Textarea
                        placeholder="Mensaje (opcional)"
                        rows={3}
                        value={visitForm.message}
                        onChange={(e) => setVisitForm(f => ({ ...f, message: e.target.value }))}
                      />
                    </div>
                    <Button type="submit" className="w-full" disabled={visitSubmitting}>
                      {visitSubmitting ? (
                        <><Loader2 className="h-4 w-4 mr-2 animate-spin" /> Enviando...</>
                      ) : 'Solicitar visita'}
                    </Button>
                    {visitSuccess && (
                      <p className="text-sm text-green-600 text-center">Visita solicitada con éxito. El propietario se pondrá en contacto contigo.</p>
                    )}
                    {visitError && (
                      <p className="text-sm text-red-600 text-center">{visitError}</p>
                    )}
                  </form>
                </CardContent>
              </Card>
            </div>
          </m.div>
        </div>

        {/* Related Properties */}
        {relatedProperties.length > 0 && (
          <m.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="mt-16"
          >
            <h2 className="text-2xl font-bold mb-6">Propiedades similares</h2>
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {relatedProperties.map((prop, index) => (
                <PropertyCard
                  key={prop.id}
                  id={String(prop.id)}
                  image={prop.images[0]}
                  title={prop.title}
                  description={prop.description}
                  price={`$${prop.price.toLocaleString()}`}
                  bedrooms={prop.bedrooms}
                  bathrooms={prop.bathrooms}
                  area={prop.area}
                  type={prop.type}
                  location={prop.location}
                  listingType={prop.listingType}
                  index={index}
                />
              ))}
            </div>
          </m.div>
        )}
      </div>

      <Footer />

      {/* Rent Request Dialog */}
      <Dialog open={!!rentRequestTarget} onOpenChange={(open) => { if (!open) setRentRequestTarget(null); }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Solicitar Propiedad</DialogTitle>
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

      {/* Share Dialog */}
      <Dialog open={showShareDialog} onOpenChange={setShowShareDialog}>
        <DialogContent className="sm:max-w-sm rounded-2xl">
          <DialogHeader>
            <DialogTitle>Compartir propiedad</DialogTitle>
            <DialogDescription>Elige cómo quieres compartir esta propiedad</DialogDescription>
          </DialogHeader>
          <div className="flex flex-col gap-2">
            <Button variant="outline" className="justify-start gap-3 h-12" onClick={() => handleShare('whatsapp')}>
              <MessageCircle className="h-5 w-5 text-green-600" />
              <span>Compartir por WhatsApp</span>
            </Button>
            <Button variant="outline" className="justify-start gap-3 h-12" onClick={() => handleShare('twitter')}>
              <svg className="h-5 w-5" viewBox="0 0 24 24" fill="currentColor"><path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/></svg>
              <span>Compartir en X (Twitter)</span>
            </Button>
            <Button variant="outline" className="justify-start gap-3 h-12" onClick={() => handleShare('facebook')}>
              <svg className="h-5 w-5 text-blue-600" viewBox="0 0 24 24" fill="currentColor"><path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/></svg>
              <span>Compartir en Facebook</span>
            </Button>
            <Button variant="outline" className="justify-start gap-3 h-12" onClick={() => handleShare('copy')}>
              {copied ? <Check className="h-5 w-5 text-green-600" /> : <Copy className="h-5 w-5" />}
              <span>{copied ? 'Enlace copiado' : 'Copiar enlace'}</span>
            </Button>
            <Button variant="outline" className="justify-start gap-3 h-12" onClick={() => { handleShare('copy'); window.open(propertyUrl, '_blank'); }}>
              <ExternalLink className="h-5 w-5" />
              <span>Abrir enlace</span>
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Video Modal */}
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

export default PropertyDetail;
