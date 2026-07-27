import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Search, Heart, FileText, MessageSquare, Bell, Loader2, Star } from "lucide-react";
import { api, RentalRequest } from "@/services/api";
import { useAuth } from "@/contexts/AuthContext";
import { Badge } from "@/components/ui/badge";
import { UserReviewsModal } from "@/components/reviews";

const HomeSection = () => {
  const { user } = useAuth();
  const [stats, setStats] = useState({ favorites: 0, requests: 0, unread: 0 });
  const [recentRequests, setRecentRequests] = useState<RentalRequest[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showReviewsModal, setShowReviewsModal] = useState(false);

  useEffect(() => {
    const fetchHomeData = async () => {
      setIsLoading(true);
      try {
        const [favs, reqs] = await Promise.all([
          api.getFavorites(),
          api.getUserRentRequests()
        ]);

        setStats({
          favorites: favs.data?.favorites.length || 0,
          requests: reqs.data?.requests.length || 0,
          unread: 0 // Mock for now
        });

        setRecentRequests((reqs.data?.requests as RentalRequest[] | undefined)?.slice(0, 3) || []);
      } catch (error) {
        console.error("Error fetching tenant home data", error);
      }
      setIsLoading(false);
    };

    fetchHomeData();
  }, []);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">¡Bienvenido, {user?.name?.split(" ")[0]}!</h1>
        <p className="text-muted-foreground mt-1">
          Encuentra tu próximo hogar ideal
        </p>
      </div>

      {/* Quick Stats */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Favoritos</CardTitle>
            <Heart className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.favorites}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Solicitudes</CardTitle>
            <FileText className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.requests}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Mensajes</CardTitle>
            <MessageSquare className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.unread}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Reputación</CardTitle>
            <Star className="h-4 w-4 text-yellow-500 fill-yellow-500" />
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2">
              <span className="text-2xl font-bold">
                {typeof user?.avgRatingAsTenant === 'number' ? user.avgRatingAsTenant.toFixed(1) : '0.0'}
              </span>
              <div className="flex flex-col gap-1">
                <div className="flex items-center">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <div
                      key={star}
                      className="relative h-4 w-4"
                    >
                      <Star className="h-4 w-4 text-gray-300 fill-current" />
                      {user?.avgRatingAsTenant && star <= Math.floor(user.avgRatingAsTenant) && (
                        <div className="absolute top-0 left-0 overflow-hidden" style={{ width: '100%' }}>
                          <Star className="h-4 w-4 text-yellow-500 fill-current" />
                        </div>
                      )}
                      {user?.avgRatingAsTenant && star === Math.floor(user.avgRatingAsTenant) + 1 && 
                       user.avgRatingAsTenant % 1 > 0 && (
                        <div 
                          className="absolute top-0 left-0 overflow-hidden" 
                          style={{ width: `${(user.avgRatingAsTenant % 1) * 100}%` }}
                        >
                          <Star className="h-4 w-4 text-yellow-500 fill-current" />
                        </div>
                      )}
                    </div>
                  ))}
                </div>
                <span className="text-xs text-muted-foreground">
                  {user?.reviewCountAsTenant || 0} reseñas
                </span>
                <button
                  onClick={() => setShowReviewsModal(true)}
                  className="text-xs text-primary hover:underline text-left font-medium block mt-1 focus:outline-none"
                >
                  Ver mis reseñas
                </button>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Quick Actions */}
      <Card>
        <CardHeader>
          <CardTitle>Acciones Rápidas</CardTitle>
          <CardDescription>
            Comienza a buscar tu próximo hogar
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-3">
            <Button variant="outline" className="w-full h-auto py-4 flex flex-col gap-2">
              <Search className="h-6 w-6" />
              <span>Buscar Propiedades</span>
            </Button>
            <Button variant="outline" className="w-full h-auto py-4 flex flex-col gap-2">
              <Heart className="h-6 w-6" />
              <span>Ver Favoritos</span>
            </Button>
            <Button variant="outline" className="w-full h-auto py-4 flex flex-col gap-2">
              <FileText className="h-6 w-6" />
              <span>Mis Solicitudes</span>
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Requests List */}
      <div className="grid gap-4 md:grid-cols-2">
        <Card className="col-span-1">
          <CardHeader>
            <CardTitle className="text-base">Solicitudes Recientes</CardTitle>
            <CardDescription>Estado de tus últimas peticiones</CardDescription>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="flex justify-center p-4">
                <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
              </div>
            ) : recentRequests.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-4">No tienes solicitudes recientes</p>
            ) : (
              <div className="space-y-3">
                {recentRequests.map((request) => (
                  <div key={request.id} className="flex items-center gap-3 p-2 rounded-lg bg-muted/50">
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate">{request.property?.title}</p>
                      <p className="text-xs text-muted-foreground">{new Date(request.createdAt).toLocaleDateString()}</p>
                    </div>
                    <Badge variant={request.status === 'accepted' ? 'default' : request.status === 'rejected' ? 'destructive' : 'secondary'}>
                      {request.status}
                    </Badge>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Placeholder Activity */}
        <Card className="col-span-1">
          <CardHeader>
            <CardTitle className="text-base">Notificaciones</CardTitle>
            <CardDescription>Avisos importantes del sistema</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col items-center justify-center py-4 text-center">
              <Bell className="h-8 w-8 text-muted-foreground/30 mb-2" />
              <p className="text-sm text-muted-foreground">No tienes notificaciones nuevas</p>
            </div>
          </CardContent>
        </Card>
      </div>
      {user && (
        <UserReviewsModal
          isOpen={showReviewsModal}
          onOpenChange={setShowReviewsModal}
          userId={user.id}
          userName={user.name}
          userRole={user.role}
        />
      )}
    </div>
  );
};

export default HomeSection;
