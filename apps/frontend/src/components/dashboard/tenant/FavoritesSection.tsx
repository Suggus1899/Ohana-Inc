import { useState, useEffect, memo } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Heart, MapPin, Bed, HeartOff, ExternalLink, Loader2, Send } from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import { api, Favorite } from "@/services/api";
import { useToast } from "@/hooks/use-toast";
import { useExchangeRate } from "../../../contexts/ExchangeRateContext";
import { usdToVes } from "../../../utils/formatPrice";
import { DualPrice } from "../../../components/DualPrice";

const FavoritesSection = () => {
  const [favorites, setFavorites] = useState<Favorite[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const { toast } = useToast();
  const navigate = useNavigate();
  const { rate } = useExchangeRate();

  useEffect(() => {
    fetchFavorites();
  }, []);

  const fetchFavorites = async () => {
    setIsLoading(true);
    const response = await api.getFavorites();
    if (response.success && response.data) {
      setFavorites(response.data.favorites);
    } else {
      toast({
        title: "Error",
        description: "No se pudieron cargar tus favoritos",
        variant: "destructive"
      });
    }
    setIsLoading(false);
  };

  const removeFavorite = async (propertyId: number) => {
    const response = await api.toggleFavorite(propertyId);
    if (response.success) {
      setFavorites(prev => prev.filter(f => f.propertyId !== propertyId));
      toast({
        title: "Favorito quitado",
        description: "La propiedad ha sido removida de tus favoritos"
      });
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Mis Favoritos</h1>
        <p className="text-muted-foreground mt-1">
          Propiedades que has guardado para revisar después
        </p>
      </div>

      {isLoading ? (
        <div className="flex flex-col items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-primary mb-4" />
          <p className="text-muted-foreground">Cargando tus favoritos...</p>
        </div>
      ) : favorites.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <Heart className="h-12 w-12 text-muted-foreground/50 mb-4" />
            <h3 className="text-lg font-medium mb-2">No tienes favoritos</h3>
            <p className="text-muted-foreground text-center mb-4">
              Explora propiedades y guarda las que te interesen
            </p>
            <Link to="/estudiante">
              <Button>Explorar Propiedades</Button>
            </Link>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {favorites.map((fav) => (
            <Card key={fav.id} className="overflow-hidden">
              <div className="aspect-video bg-muted relative">
                <img 
                  src={fav.property.images?.[0] || "https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?w=800"} 
                  alt={fav.property.title}
                  className="w-full h-full object-cover"
                />
                <Button
                  variant="ghost"
                  size="icon"
                  className="absolute top-2 right-2 bg-background/80 hover:bg-background"
                  onClick={() => removeFavorite(fav.propertyId)}
                >
                  <Heart className="h-4 w-4 fill-red-500 text-red-500" />
                </Button>
              </div>
              <CardHeader className="pb-2">
                <div className="flex items-start justify-between">
                  <div>
                    <CardTitle className="text-lg line-clamp-1">{fav.property.title}</CardTitle>
                    <CardDescription className="flex items-center gap-1 mt-1 truncate">
                      <MapPin className="h-3 w-3" />
                      {fav.property.location}
                    </CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-4 text-sm text-muted-foreground">
                    <span className="flex items-center gap-1">
                      <Bed className="h-4 w-4" />
                      {fav.property.bedrooms} hab.
                    </span>
                    <span className="px-2 py-0.5 bg-muted rounded text-xs">
                      {fav.property.type}
                    </span>
                  </div>
                </div>
                <div className="flex items-center justify-between">
                    {rate?.usdToVes ? (
                      <DualPrice usd={fav.property.price} vesRate={rate.usdToVes} period="mes" variant="inline" />
                    ) : (
                      <span className="text-lg font-bold text-primary">${fav.property.price}/mes</span>
                    )}
                  <div className="flex gap-2">
                    <Button 
                      variant="ghost" 
                      size="icon" 
                      className="text-muted-foreground hover:text-destructive"
                      onClick={() => removeFavorite(fav.propertyId)}
                      title="Quitar de favoritos"
                    >
                      <HeartOff className="h-4 w-4" />
                    </Button>
                    <Button 
                      size="sm" 
                      variant="outline"
                      onClick={() => navigate(`/properties/${fav.propertyId}`)}
                    >
                      <ExternalLink className="h-4 w-4 mr-1" />
                      Ver Detalles
                    </Button>
                  </div>
                </div>
                {fav.property.status === 'approved' && (
                  <Button 
                    className="w-full mt-3"
                    onClick={() => navigate(`/properties/${fav.propertyId}`)}
                  >
                    <Send className="h-4 w-4 mr-2" />
                    Solicitar Ahora
                  </Button>
                )}
                <p className="text-xs text-muted-foreground mt-2">
                  Agregado el {new Date(fav.createdAt).toLocaleDateString("es-VE")}
                </p>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
};

export default memo(FavoritesSection);
