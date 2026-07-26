import { useState, useEffect, useCallback } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Plus, Building, Eye, TrendingUp, ArrowRight, MessageSquare, Loader2, Star } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { api, Property, RentalRequest } from "@/services/api";
import { UserReviewsModal } from "@/components/reviews";
import { useExchangeRate } from "../../../contexts/ExchangeRateContext";
import { usdToCop } from "../../../utils/formatPrice";
import { DualPrice } from "../../../components/common/DualPrice";

interface OwnerStats {
  activeProperties: number;
  totalViews: number;
  pendingRequests: number;
}

const HomeSection = ({ onNavigate }: { onNavigate?: (section: string) => void }) => {
  const { user } = useAuth();
  const { rate, loading: rateLoading } = useExchangeRate();
  const [stats, setStats] = useState<OwnerStats>({ activeProperties: 0, totalViews: 0, pendingRequests: 0 });
  const [recentProperties, setRecentProperties] = useState<Property[]>([]);
  const [pendingRequests, setPendingRequests] = useState<RentalRequest[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showReviewsModal, setShowReviewsModal] = useState(false);

  const fetchData = useCallback(async () => {
    setIsLoading(true);
    try {
      const [propsRes, reqsRes] = await Promise.all([
        api.getMyProperties(1, 6),
        api.getReceivedRentRequests(),
      ]);

      const properties = propsRes.properties ?? [];
      const requests = (reqsRes.data?.requests ?? []) as RentalRequest[];

      const activeProperties = properties.filter((p) => p.status === 'approved').length;
      const totalViews = properties.reduce((acc, p) => acc + (p.views || 0), 0);
      const pending = requests.filter((r) => r.status === 'pending');

      setStats({ activeProperties, totalViews, pendingRequests: pending.length });
      setRecentProperties(properties.slice(0, 3));
      setPendingRequests(pending.slice(0, 3));
    } catch (error) {
      console.error('Error fetching owner home data:', error);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const statCards = [
    { label: "Propiedades Activas", value: stats.activeProperties, icon: Building },
    { label: "Vistas Totales", value: stats.totalViews, icon: Eye },
    { label: "Solicitudes Pendientes", value: stats.pendingRequests, icon: TrendingUp },
    { label: "Mensajes Sin Leer", value: 0, icon: MessageSquare },
  ];

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold">¡Bienvenido, {user?.name?.split(" ")[0]}!</h1>
          <p className="text-muted-foreground mt-1">
            Gestiona tus propiedades y solicitudes
          </p>
        </div>
        <Button onClick={() => onNavigate?.('properties')}>
          <Plus className="h-4 w-4 mr-2" />
          Nueva Propiedad
        </Button>
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      ) : (
        <>
          {/* Stats */}
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            {statCards.map((stat) => {
              const Icon = stat.icon;
              return (
                <Card key={stat.label}>
                  <CardHeader className="flex flex-row items-center justify-between pb-2">
                    <CardTitle className="text-sm font-medium text-muted-foreground">
                      {stat.label}
                    </CardTitle>
                    <Icon className="h-4 w-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                    <span className="text-2xl font-bold">{stat.value}</span>
                  </CardContent>
                </Card>
              );
            })}
          </div>

          {/* Reputation Card */}
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  Reputación
                </CardTitle>
                <Star className="h-4 w-4 text-yellow-500 fill-yellow-500" />
              </CardHeader>
              <CardContent>
                <div className="flex items-center gap-2">
                  <span className="text-2xl font-bold">
                    {typeof user?.avgRatingAsOwner === 'number' ? user.avgRatingAsOwner.toFixed(1) : '0.0'}
                  </span>
                  <div className="flex flex-col gap-1">
                    <div className="flex items-center">
                      {[1, 2, 3, 4, 5].map((star) => (
                        <div
                          key={star}
                          className="relative h-4 w-4"
                        >
                          <Star className="h-4 w-4 text-gray-300 fill-current" />
                          {typeof user?.avgRatingAsOwner === 'number' && star <= Math.floor(user.avgRatingAsOwner) && (
                            <div className="absolute top-0 left-0 overflow-hidden" style={{ width: '100%' }}>
                              <Star className="h-4 w-4 text-yellow-500 fill-current" />
                            </div>
                          )}
                          {typeof user?.avgRatingAsOwner === 'number' && star === Math.floor(user.avgRatingAsOwner) + 1 && 
                           user.avgRatingAsOwner % 1 > 0 && (
                            <div 
                              className="absolute top-0 left-0 overflow-hidden" 
                              style={{ width: `${(user.avgRatingAsOwner % 1) * 100}%` }}
                            >
                              <Star className="h-4 w-4 text-yellow-500 fill-current" />
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                    <span className="text-xs text-muted-foreground">
                      {user?.reviewCountAsOwner || 0} reseñas
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

          {/* Recent Properties + Pending Requests */}
          <div className="grid gap-6 lg:grid-cols-2">
            {/* Recent Properties */}
            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <div>
                  <CardTitle>Propiedades Recientes</CardTitle>
                  <CardDescription>Tus últimas publicaciones</CardDescription>
                </div>
                <Button variant="ghost" size="sm" onClick={() => onNavigate?.('properties')}>
                  Ver todas <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </CardHeader>
              <CardContent>
                {recentProperties.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    <Building className="h-8 w-8 mx-auto mb-2 opacity-50" />
                    <p>No tienes propiedades publicadas</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {recentProperties.map((property) => (
                      <div
                        key={property.id}
                        className="flex items-center justify-between p-3 rounded-lg border"
                      >
                        <div className="flex items-center gap-3">
                          <div className="h-10 w-10 rounded bg-muted flex items-center justify-center">
                            <Building className="h-5 w-5 text-muted-foreground" />
                          </div>
                          <div>
                            <p className="font-medium text-sm">{property.title}</p>
                            <p className="text-xs text-muted-foreground">{property.location}</p>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="text-primary">{rate && !rateLoading ? <DualPrice usd={Number(property.price)} copRate={rate.usdToCop} period="mes" variant="inline" /> : `$${Number(property.price).toLocaleString()}/mes`}</p>
                          <div className="flex items-center gap-1 text-xs text-muted-foreground">
                            <Eye className="h-3 w-3" />
                            {property.views} vistas
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Pending Requests */}
            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <div>
                  <CardTitle>Solicitudes Pendientes</CardTitle>
                  <CardDescription>Requieren tu atención</CardDescription>
                </div>
                <Button variant="ghost" size="sm" onClick={() => onNavigate?.('requests')}>
                  Ver todas <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </CardHeader>
              <CardContent>
                {pendingRequests.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    <TrendingUp className="h-8 w-8 mx-auto mb-2 opacity-50" />
                    <p>No hay solicitudes pendientes</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {pendingRequests.map((request) => (
                      <div
                        key={request.id}
                        className="flex items-center justify-between p-3 rounded-lg border"
                      >
                        <div>
                          <p className="font-medium text-sm">{request.tenant?.name ?? `Inquilino #${request.tenantId}`}</p>
                          <p className="text-xs text-muted-foreground">{request.property?.title}</p>
                        </div>
                        <Button size="sm" variant="outline" onClick={() => onNavigate?.('requests')}>
                          Ver
                        </Button>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </>
      )}
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
