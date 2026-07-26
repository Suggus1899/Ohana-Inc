import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { MapPin, BedDouble, Bath, Maximize, Heart, ChevronLeft, ChevronRight, Star } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { m, AnimatePresence } from "framer-motion";
import { useState, useCallback, useEffect, memo } from "react";
import { useGeolocation } from "@/hooks/useGeolocation";
import { useRouteCalculation } from "@/hooks/useRouteCalculation";
import { useExchangeRate } from "../contexts/ExchangeRateContext";
import { usdToVes } from "../utils/formatPrice";
import { DualPrice } from "./DualPrice";

interface PropertyCardProps {
  id: string;
  image: string;
  images?: string[];
  title: string;
  description: string;
  price: string;
  bedrooms?: number;
  bathrooms?: number;
  area?: number;
  type: string;
  location?: string;
  listingType?: string;
  isFeatured?: boolean;
  status?: string;
  coordinates?: { lat: number; lng: number };
  index?: number;
  rating?: number;
  reviews?: number;
  showFavorite?: boolean;
}

const PropertyCard = ({
  id,
  image,
  images,
  title,
  description,
  price,
  bedrooms,
  bathrooms,
  area,
  type,
  location,
  listingType = "Alquiler",
  isFeatured,
  status,
  coordinates,
  index = 0,
  rating = 0,
  reviews = 0,
  showFavorite = false,
}: PropertyCardProps) => {
  const navigate = useNavigate();
  const { position } = useGeolocation();
  const { route, calculateRoute } = useRouteCalculation();
  const { rate } = useExchangeRate();
  const [distance, setDistance] = useState<string | null>(null);
  const [isLiked, setIsLiked] = useState(false);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [imageErrors, setImageErrors] = useState<Record<number, boolean>>({});

  const fallbackImage = "https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?w=800";
  
  // Use images array if available, otherwise use single image
  const imageList = images && images.length > 0 ? images : [image];
  const hasMultipleImages = imageList.length > 1;

  const handlePrevImage = useCallback((e: React.MouseEvent) => {
    e.stopPropagation();
    setCurrentImageIndex((prev) => (prev === 0 ? imageList.length - 1 : prev - 1));
  }, [imageList.length]);

  const handleNextImage = useCallback((e: React.MouseEvent) => {
    e.stopPropagation();
    setCurrentImageIndex((prev) => (prev === imageList.length - 1 ? 0 : prev + 1));
  }, [imageList.length]);

  const handleImageError = (index: number) => {
    setImageErrors((prev) => ({ ...prev, [index]: true }));
  };

  const currentImage = imageErrors[currentImageIndex] ? fallbackImage : imageList[currentImageIndex];
  
  // Calculate distance when position or coordinates change
  useEffect(() => {
    if (position && coordinates) {
      calculateRoute(
        { lat: position.lat, lng: position.lng },
        { lat: coordinates.lat, lng: coordinates.lng },
        'foot'
      );
    }
  }, [position, coordinates, calculateRoute]);

  useEffect(() => {
    if (route) {
      const distKm = (route.distance / 1000).toFixed(1);
      setDistance(`${distKm} km`);
    }
  }, [route]);

  // Parse USD amount from price string (e.g. "$180.00/mes" → 180)
  const parseUsdPrice = (priceStr: string): number => {
    const cleaned = priceStr.replace(/[^0-9.]/g, '');
    return parseFloat(cleaned) || 0;
  };

  // Extract period from price string or infer from listing type
  const getPeriod = (priceStr: string): string | undefined => {
    const match = priceStr.match(/\/(mes|d[ií]a)/i);
    if (match) return match[1].toLowerCase().replace('í', 'i');
    return listingType !== "Venta" ? 'mes' : undefined;
  };

  const usdAmount = parseUsdPrice(price);
  const period = getPeriod(price);
  const vesAmount = rate?.usdToVes ? usdToVes(usdAmount, rate.usdToVes) : 0;

  return (
    <m.div
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-30px" }}
      transition={{ duration: 0.4, delay: index * 0.05 }}
      className="h-full"
    >
      <Card 
        className="group overflow-hidden hover:shadow-lg transition-all duration-300 border-border h-full flex flex-col cursor-pointer"
        onClick={() => navigate(`/propiedades/${id}`)}
      >
        {/* Image Container - Compact */}
        <div className="relative aspect-[16/10] overflow-visible" style={{ perspective: '1200px' }}>
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
            {imageList.map((img, index) => {
              const isError = imageErrors[index];
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
                  className="overflow-hidden rounded-lg"
                >
                  <img
                    src={imageSrc}
                    alt={`${title} - ${index + 1}`}
                    className="w-full h-full object-cover"
                    onError={() => handleImageError(index)}
                  />
                </div>
              );
            })}
          </m.div>
          
          {/* Gradient Overlay */}
          <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-transparent" />

          {/* Rented / Sold overlay badge */}
          {(status === 'rented' || status === 'sold') && (
            <div className="absolute inset-0 z-10 flex items-center justify-center pointer-events-none">
              <div className="bg-gray-900/80 backdrop-blur-sm rounded-lg px-4 py-2 rotate-[-8deg] border-2 border-gray-400/60">
                <span className="text-white font-black text-lg tracking-widest uppercase">
                  {status === 'sold' ? 'VENDIDA' : 'ALQUILADA'}
                </span>
              </div>
            </div>
          )}

          {/* Top Badges */}
          <div className="absolute top-2 left-2 flex flex-wrap gap-1.5">
            <Badge 
              className={`text-xs px-2 py-0.5 ${
                listingType === "Venta" 
                  ? "bg-green-600 hover:bg-green-600" 
                  : "bg-primary hover:bg-primary"
              }`}
            >
              {listingType}
            </Badge>

            {distance && (
              <Badge className="text-xs px-2 py-0.5 bg-blue-600/90 backdrop-blur-md hover:bg-blue-600 border-none">
                <MapPin className="h-3 w-3 mr-0.5" /> A {distance} de vos
              </Badge>
            )}
          </div>

          {/* Like Button - Only show for authenticated users */}
          {showFavorite && (
            <m.button
              whileTap={{ scale: 0.9 }}
              onClick={(e) => {
                e.stopPropagation();
                setIsLiked(!isLiked);
              }}
              className="absolute top-2 right-2 p-1.5 bg-white/90 backdrop-blur-sm rounded-full shadow-sm hover:bg-white transition-colors"
            >
              <Heart
                className={`h-4 w-4 transition-colors ${
                  isLiked ? "fill-red-500 text-red-500" : "text-gray-600"
                }`}
              />
            </m.button>
          )}

          {/* Image Navigation - Only show if multiple images */}
          {hasMultipleImages && (
            <>
              <button
                onClick={handlePrevImage}
                className="absolute left-2 top-1/2 -translate-y-1/2 p-1 bg-white/80 backdrop-blur-sm rounded-full opacity-0 group-hover:opacity-100 transition-opacity hover:bg-white"
              >
                <ChevronLeft className="h-4 w-4" />
              </button>
              <button
                onClick={handleNextImage}
                className="absolute right-2 top-1/2 -translate-y-1/2 p-1 bg-white/80 backdrop-blur-sm rounded-full opacity-0 group-hover:opacity-100 transition-opacity hover:bg-white"
              >
                <ChevronRight className="h-4 w-4" />
              </button>

              {/* Image Dots */}
              <div className="absolute bottom-2 left-1/2 -translate-x-1/2 flex gap-1">
                {imageList.slice(0, 5).map((_, idx) => (
                  <button
                    key={idx}
                    onClick={(e) => {
                      e.stopPropagation();
                      setCurrentImageIndex(idx);
                    }}
                    className={`w-1.5 h-1.5 rounded-full transition-all ${
                      idx === currentImageIndex 
                        ? "bg-white w-3" 
                        : "bg-white/60 hover:bg-white/80"
                    }`}
                  />
                ))}
                {imageList.length > 5 && (
                  <span className="text-white text-xs ml-1">+{imageList.length - 5}</span>
                )}
              </div>
            </>
          )}

          {/* Price on Image */}
          <div className="absolute bottom-2 left-2">
            {rate?.usdToVes ? (
              <DualPrice
                usd={usdAmount}
                vesAmount={vesAmount}
                period={period}
                variant="card"
              />
            ) : (
              <span className="text-lg sm:text-xl font-bold text-white drop-shadow-lg">
                {price}
                {listingType !== "Venta" && (
                  <span className="text-sm font-normal opacity-90">/mes</span>
                )}
              </span>
            )}
          </div>
        </div>

        {/* Content - Compact */}
        <div className="p-2.5 sm:p-3 flex flex-col flex-1">
          {/* Location & Type */}
          <div className="flex items-center gap-1 text-xs text-muted-foreground mb-1">
            <MapPin className="h-3 w-3 shrink-0" />
            <span className="truncate">{location || "San Juan de los Morros"}</span>
            <span className="text-border">•</span>
            <span className="shrink-0">{type}</span>
          </div>

          {/* Title */}
          <h3 className="font-semibold text-sm leading-tight mb-1 line-clamp-1 group-hover:text-primary transition-colors">
            {title}
          </h3>

          {/* Description - Hidden on mobile */}
          <p className="hidden sm:block text-xs text-muted-foreground mb-2 line-clamp-2 flex-1">
            {description}
          </p>

          {/* Rating */}
          {rating > 0 && (
            <div className="flex items-center gap-1.5 text-xs text-muted-foreground mt-2 mb-1">
              <div className="flex items-center gap-0.5">
                {[1, 2, 3, 4, 5].map((star) => (
                  <div key={star} className="relative h-3 w-3">
                    <Star className="h-3 w-3 text-gray-300 fill-current" />
                    {star <= Math.floor(rating) && (
                      <div className="absolute top-0 left-0 overflow-hidden" style={{ width: '100%' }}>
                        <Star className="h-3 w-3 text-yellow-400 fill-current" />
                      </div>
                    )}
                    {star === Math.floor(rating) + 1 && rating % 1 > 0 && (
                      <div 
                        className="absolute top-0 left-0 overflow-hidden" 
                        style={{ width: `${(rating % 1) * 100}%` }}
                      >
                        <Star className="h-3 w-3 text-yellow-400 fill-current" />
                      </div>
                    )}
                  </div>
                ))}
              </div>
              <span className="font-medium text-foreground">{(rating || 0).toFixed(1)}</span>
              {reviews > 0 && (
                <span className="opacity-70">({reviews})</span>
              )}
            </div>
          )}

          {/* Features */}
          <div className="flex items-center gap-2 text-xs sm:text-sm text-muted-foreground mt-auto pt-1.5 border-t">
            {bedrooms !== undefined && bedrooms > 0 && (
              <span className="flex items-center gap-1">
                <BedDouble className="h-3.5 w-3.5" />
                <span>{bedrooms}</span>
              </span>
            )}
            {bathrooms !== undefined && bathrooms > 0 && (
              <span className="flex items-center gap-1">
                <Bath className="h-3.5 w-3.5" />
                <span>{bathrooms}</span>
              </span>
            )}
            {area !== undefined && area > 0 && (
              <span className="flex items-center gap-1">
                <Maximize className="h-3.5 w-3.5" />
                <span>{area >= 1000 ? `${(area / 1000).toFixed(0)}k` : area} m²</span>
              </span>
            )}
            <Button
              variant="ghost"
              size="sm"
              className="ml-auto text-xs h-7 px-2 text-primary hover:text-primary"
              onClick={(e) => {
                e.stopPropagation();
                navigate(`/propiedades/${id}`);
              }}
            >
              Ver más →
            </Button>
          </div>
        </div>
      </Card>
    </m.div>
  );
};

export default memo(PropertyCard);
