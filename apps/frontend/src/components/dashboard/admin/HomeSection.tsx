import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Users, Building, ShieldCheck, AlertTriangle, TrendingUp, TrendingDown, Clock, MessageSquare, UserCog, Loader2, CheckCircle, Megaphone } from "lucide-react";
import { api, AdminStats, User } from "@/services/api";
import { useAuth } from "@/contexts/AuthContext";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

const roleLabel: Record<string, string> = {
  admin: "Admin",
  operator: "Operador",
  propietario: "Propietario",
  cliente: "Cliente",
  estudiante: "Estudiante",
};

const roleBadgeClass: Record<string, string> = {
  admin: "bg-red-100 text-red-800",
  operator: "bg-purple-100 text-purple-800",
  propietario: "bg-blue-100 text-blue-800",
  cliente: "bg-gray-100 text-gray-800",
  estudiante: "bg-green-100 text-green-800",
};

const HomeSection = () => {
  const { user } = useAuth();
  const [stats, setStats] = useState<AdminStats | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      setIsLoading(true);
      try {
        const res = await api.getAdminStats();
        if (res.success && res.data) setStats(res.data);
      } catch {
        toast.error("Error al cargar estadísticas del dashboard");
      } finally {
        setIsLoading(false);
      }
    };
    load();
  }, []);

  const mainStats = stats ? [
    {
      label: "Total Usuarios",
      value: stats.totals.users,
      icon: Users,
      change: stats.growth.userGrowthPercent,
      sub: `+${stats.growth.usersThisMonth} este mes`,
    },
    {
      label: "Propiedades",
      value: stats.totals.properties,
      icon: Building,
      change: null,
      sub: `${stats.totals.pendingProperties} pendientes`,
    },
    {
      label: "Solicitudes",
      value: stats.totals.requests,
      icon: MessageSquare,
      change: null,
      sub: null,
    },
    {
      label: "Operadores",
      value: stats.totals.operators,
      icon: UserCog,
      change: null,
      sub: null,
    },
    {
      label: "Anuncios Activos",
      value: stats.totals.activeAnnouncements ?? 0,
      icon: Megaphone,
      change: null,
      sub: null,
    },
  ] : [];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Panel de Administración</h1>
        <p className="text-muted-foreground mt-1">
          Bienvenido, {user?.name}. Aquí tienes un resumen de la plataforma.
        </p>
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      ) : (
        <>
          {/* Main Stats */}
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-5">
            {mainStats.map((stat) => {
              const Icon = stat.icon;
              const isPositive = stat.change !== null && stat.change >= 0;
              return (
                <Card key={stat.label}>
                  <CardHeader className="flex flex-row items-center justify-between pb-2">
                    <CardTitle className="text-sm font-medium text-muted-foreground">{stat.label}</CardTitle>
                    <Icon className="h-4 w-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                    <div className="flex items-center gap-2">
                      <span className="text-2xl font-bold">{stat.value}</span>
                      {stat.change !== null && (
                        <span className={cn("flex items-center text-xs font-medium", isPositive ? "text-green-600" : "text-red-600")}>
                          {isPositive ? <TrendingUp className="h-3 w-3 mr-0.5" /> : <TrendingDown className="h-3 w-3 mr-0.5" />}
                          {Math.abs(stat.change)}%
                        </span>
                      )}
                    </div>
                    {stat.sub && <p className="text-xs text-muted-foreground mt-1">{stat.sub}</p>}
                  </CardContent>
                </Card>
              );
            })}
          </div>

          {/* Alerts */}
          {stats && stats.totals.pendingProperties > 0 && (
            <Card className="border-yellow-200 bg-yellow-50/50">
              <CardContent className="flex items-center gap-4 py-4">
                <AlertTriangle className="h-5 w-5 text-yellow-600 shrink-0" />
                <div className="flex-1">
                  <p className="font-medium text-yellow-800">
                    {stats.totals.pendingProperties} {stats.totals.pendingProperties === 1 ? "propiedad pendiente" : "propiedades pendientes"} de revisión
                  </p>
                  <p className="text-sm text-yellow-700">Requieren aprobación de un operador o administrador</p>
                </div>
              </CardContent>
            </Card>
          )}

          {stats && stats.totals.pendingTickets > 0 && (
            <Card className="border-orange-200 bg-orange-50/50">
              <CardContent className="flex items-center gap-4 py-4">
                <MessageSquare className="h-5 w-5 text-orange-600 shrink-0" />
                <div className="flex-1">
                  <p className="font-medium text-orange-800">
                    {stats.totals.pendingTickets} {stats.totals.pendingTickets === 1 ? "ticket abierto" : "tickets abiertos"} de soporte
                  </p>
                  <p className="text-sm text-orange-700">Tickets sin resolver en el sistema</p>
                </div>
              </CardContent>
            </Card>
          )}

          <div className="grid gap-6 lg:grid-cols-2">
            {/* Recent Users */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Users className="h-5 w-5" />
                  Usuarios Recientes
                </CardTitle>
                <CardDescription>Últimos registros en la plataforma</CardDescription>
              </CardHeader>
              <CardContent>
                {stats?.recentUsers?.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    <Users className="h-8 w-8 mx-auto mb-2 opacity-50" />
                    <p>No hay usuarios registrados</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {stats?.recentUsers?.filter((u: User) => u.role !== 'admin').map((u: User) => (
                      <div key={u.id} className="flex items-center justify-between p-3 rounded-lg border">
                        <div>
                          <p className="font-medium text-sm">{u.name}</p>
                          <p className="text-xs text-muted-foreground">{u.email}</p>
                        </div>
                        <div className="text-right flex flex-col items-end gap-1">
                          <Badge className={cn("text-xs", roleBadgeClass[u.role] || "bg-gray-100 text-gray-800")}>
                            {roleLabel[u.role] || u.role}
                          </Badge>
                          <p className="text-xs text-muted-foreground">
                            {new Date(u.createdAt).toLocaleDateString("es-CO")}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Platform summary */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <ShieldCheck className="h-5 w-5" />
                  Resumen de la Plataforma
                </CardTitle>
                <CardDescription>Estado actual del sistema</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="flex items-center justify-between p-3 rounded-lg border">
                    <div className="flex items-center gap-2">
                      <CheckCircle className="h-4 w-4 text-green-500" />
                      <span className="text-sm font-medium">Propiedades aprobadas</span>
                    </div>
                    <span className="text-lg font-bold text-green-600">{stats?.totals.approvedProperties ?? 0}</span>
                  </div>
                  <div className="flex items-center justify-between p-3 rounded-lg border">
                    <div className="flex items-center gap-2">
                      <Clock className="h-4 w-4 text-yellow-500" />
                      <span className="text-sm font-medium">Propiedades pendientes</span>
                    </div>
                    <span className="text-lg font-bold text-yellow-600">{stats?.totals.pendingProperties ?? 0}</span>
                  </div>
                  <div className="flex items-center justify-between p-3 rounded-lg border">
                    <div className="flex items-center gap-2">
                      <MessageSquare className="h-4 w-4 text-purple-500" />
                      <span className="text-sm font-medium">Tickets de soporte</span>
                    </div>
                    <span className="text-lg font-bold text-purple-600">{stats?.totals.pendingTickets ?? 0}</span>
                  </div>
                  <div className="flex items-center justify-between p-3 rounded-lg border">
                    <div className="flex items-center gap-2">
                      <UserCog className="h-4 w-4 text-blue-500" />
                      <span className="text-sm font-medium">Operadores activos</span>
                    </div>
                    <span className="text-lg font-bold text-blue-600">{stats?.totals.operators ?? 0}</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </>
      )}
    </div>
  );
};

export default HomeSection;
