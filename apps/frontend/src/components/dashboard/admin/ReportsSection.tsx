import { useState, useEffect, useRef } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Progress } from "@/components/ui/progress";
import {
  BarChart3,
  FileBarChart,
  TrendingUp,
  TrendingDown,
  Users,
  Building,
  Download,
  Target,
  PieChart,
  MapPin,
  ArrowUpRight,
  ArrowDownRight,
  UserCheck,
  Building2,
  Loader2,
} from "lucide-react";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";
import { api, AdminStats, AnalyticsDashboard } from "@/services/api";
import { toast } from "sonner";
import { exportToPDF } from "@/lib/pdf-export";
import { useAuth } from "@/contexts/AuthContext";
import { useExchangeRate } from "../../../contexts/ExchangeRateContext";
import { usdToVes } from "../../../utils/formatPrice";

const DIST_COLORS = [
  "bg-blue-500", "bg-green-500", "bg-yellow-500",
  "bg-purple-500", "bg-orange-500", "bg-pink-500",
];

export const ReportsSection = () => {
  const [adminStats, setAdminStats] = useState<AdminStats | null>(null);
  const [analytics, setAnalytics] = useState<AnalyticsDashboard | null>(null);
  const [propertyCounts, setPropertyCounts] = useState<{ type: string; count: number }[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const refreshRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const { rate } = useExchangeRate();

  const fetchData = async () => {
    setIsLoading(true);
    try {
      const [statsRes, analyticsRes, countsRes] = await Promise.all([
        api.getAdminStats(),
        api.getAnalyticsDashboard(),
        api.getPropertyCountsByType(),
      ]);
      if (statsRes.success && statsRes.data) setAdminStats(statsRes.data);
      if (analyticsRes.success && analyticsRes.data) setAnalytics(analyticsRes.data);
      if (countsRes.success && countsRes.data) setPropertyCounts(countsRes.data.counts);
    } catch {
      toast.error("Error al cargar reportes");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
    refreshRef.current = setInterval(fetchData, 30000);
    return () => { if (refreshRef.current) clearInterval(refreshRef.current); };
  }, []);

  const handleExportUsers = async () => {
    const res = await api.getUsers({ limit: 1000 });
    if (!res.success || !res.data) return;
    const rows = res.data.users.map(u => [u.id, u.name, u.email, u.role, u.accountStatus, new Date(u.createdAt).toLocaleDateString()].join(','));
    const csv = ['ID,Nombre,Email,Rol,Estado,Fecha Registro', ...rows].join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a'); a.href = url; a.download = 'usuarios.csv'; a.click();
    URL.revokeObjectURL(url);
  };

  const handleExportProperties = async () => {
    const res = await api.getProperties({ limit: 1000 });
    if (!res.success || !res.data) return;
    const rows = res.data.properties.map(p => {
      const vesPrice = rate ? usdToVes(p.price, rate.usdToVes) : 0;
      return [p.id, p.title, p.type, p.status, p.price, vesPrice, p.location, new Date(p.createdAt).toLocaleDateString()].join(',');
    });
    const csv = ['ID,Título,Tipo,Estado,Precio (USD),Precio (VES),Ubicación,Fecha'].concat(rows).join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a'); a.href = url; a.download = 'propiedades.csv'; a.click();
    URL.revokeObjectURL(url);
  };

  const handleExportFullReport = () => {
    if (!adminStats) return;
    const content = `
      REPORTE COMPLETO - HABITAS\n
      Fecha: ${new Date().toLocaleDateString()}\n\n
      USUARIOS\n
      Total: ${adminStats.totals.users}\n
      Operadores: ${adminStats.totals.operators}\n
      Crecimiento: ${adminStats.growth.userGrowthPercent}%\n\n
      PROPIEDADES\n
      Total: ${adminStats.totals.properties}\n
      Aprobadas: ${adminStats.totals.approvedProperties}\n
      Pendientes: ${adminStats.totals.pendingProperties}\n
    `;
    const blob = new Blob([content], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a'); a.href = url; a.download = 'reporte_completo.txt'; a.click();
    URL.revokeObjectURL(url);
  };

  const handleExportPDF = () => {
    if (!adminStats) return;
    const user = (window as any).__AUTH_USER__ || { name: "Administrador" };
    exportToPDF({
      title: "Reporte General - Habitas",
      subtitle: `Generado: ${new Date().toLocaleDateString()}`,
      operatorName: user.name || "Admin",
      stats: {
        total: adminStats.totals.users + adminStats.totals.properties + (adminStats.totals.requests || 0),
        approved: adminStats.totals.approvedProperties,
        rejected: adminStats.totals.pendingProperties,
      },
      headers: ["Metrica", "Valor"],
      rows: [
        ["Usuarios Totales", String(adminStats.totals.users)],
        ["Propiedades Totales", String(adminStats.totals.properties)],
        ["Propiedades Aprobadas", String(adminStats.totals.approvedProperties)],
        ["Propiedades Pendientes", String(adminStats.totals.pendingProperties)],
        ["Operadores", String(adminStats.totals.operators)],
        ["Solicitudes", String(adminStats.totals.requests || 0)],
        ["Crecimiento Usuarios", `${adminStats.growth.userGrowthPercent}%`],
      ],
      fileName: "reporte_admin",
    });
  };

  const totalPropertyCount = propertyCounts.reduce((s, c) => s + c.count, 0);

  const mainKPIs = adminStats ? [
    {
      label: "Total Usuarios",
      value: adminStats.totals.users.toLocaleString(),
      change: adminStats.growth.userGrowthPercent,
      icon: Users,
      color: "text-blue-500",
    },
    {
      label: "Propiedades Listadas",
      value: adminStats.totals.properties.toLocaleString(),
      change: null,
      icon: Building,
      color: "text-green-500",
    },
    {
      label: "Solicitudes de Alquiler",
      value: adminStats.totals.requests.toLocaleString(),
      change: null,
      icon: Target,
      color: "text-purple-500",
    },
    {
      label: "Operadores",
      value: adminStats.totals.operators.toLocaleString(),
      change: null,
      icon: UserCheck,
      color: "text-yellow-500",
    },
  ] : [];

  const propertyDistribution = propertyCounts.map((c, i) => ({
    type: c.type,
    count: c.count,
    percentage: totalPropertyCount > 0 ? Math.round((c.count / totalPropertyCount) * 100) : 0,
    color: DIST_COLORS[i % DIST_COLORS.length],
  }));

  const performanceMetrics = adminStats ? [
    {
      label: "Propiedades Aprobadas",
      value: adminStats.totals.approvedProperties,
      total: adminStats.totals.properties,
      percentage: adminStats.totals.properties > 0
        ? Math.round((adminStats.totals.approvedProperties / adminStats.totals.properties) * 100) : 0,
    },
    {
      label: "Propiedades Pendientes",
      value: adminStats.totals.pendingProperties,
      total: adminStats.totals.properties,
      percentage: adminStats.totals.properties > 0
        ? Math.round((adminStats.totals.pendingProperties / adminStats.totals.properties) * 100) : 0,
    },
    {
      label: "Usuarios Este Mes",
      value: adminStats.growth.usersThisMonth,
      total: adminStats.totals.users,
      percentage: adminStats.totals.users > 0
        ? Math.round((adminStats.growth.usersThisMonth / adminStats.totals.users) * 100) : 0,
    },
    {
      label: "Solicitudes de Alquiler",
      value: adminStats.totals.requests,
      total: adminStats.totals.requests,
      percentage: 100,
    },
  ] : [];

  const topSearches = (analytics?.topSearchTerms ?? []).slice(0, 5).map(s => ({ term: s.query, count: s.count }));

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold">Analytics & Reportes</h1>
          <p className="text-muted-foreground mt-1">
            Métricas estratégicas y análisis de la plataforma
          </p>
        </div>
        {isLoading && <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />}
      </div>

      {isLoading && (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      )}

      {/* KPIs Principales */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {mainKPIs.map((kpi) => {
          const Icon = kpi.icon;
          const hasChange = kpi.change !== null;
          const isPositive = hasChange && kpi.change! >= 0;
          return (
            <Card key={kpi.label}>
              <CardContent className="p-6">
                <div className="flex items-center justify-between mb-4">
                  <div className={`p-2 rounded-lg bg-muted ${kpi.color}`}>
                    <Icon className="h-5 w-5" />
                  </div>
                  {hasChange && (
                    <Badge variant={isPositive ? "default" : "destructive"} className="text-xs">
                      {isPositive ? <ArrowUpRight className="h-3 w-3 mr-1" /> : <ArrowDownRight className="h-3 w-3 mr-1" />}
                      {Math.abs(kpi.change!)}%
                    </Badge>
                  )}
                </div>
                <div className="text-2xl font-bold">{kpi.value}</div>
                <p className="text-sm text-muted-foreground">{kpi.label}</p>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Tabs de Análisis */}
      <Tabs defaultValue="overview" className="space-y-6">
        <TabsList className="grid w-full grid-cols-3 lg:w-auto lg:inline-grid">
          <TabsTrigger value="overview">General</TabsTrigger>
          <TabsTrigger value="properties">Propiedades</TabsTrigger>
          <TabsTrigger value="engagement">Búsquedas</TabsTrigger>
        </TabsList>

        {/* Tab General */}
        <TabsContent value="overview" className="space-y-6">
          <div className="grid gap-6 lg:grid-cols-2">
            {/* Resumen de usuarios */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Users className="h-5 w-5" />
                  Resumen de Usuarios
                </CardTitle>
                <CardDescription>Distribución actual de cuentas</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                  <div className="flex items-center gap-3">
                    <Users className="h-5 w-5 text-blue-500" />
                    <span>Total usuarios</span>
                  </div>
                  <span className="font-bold">{adminStats?.totals.users.toLocaleString() ?? "—"}</span>
                </div>
                <div className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                  <div className="flex items-center gap-3">
                    <Building2 className="h-5 w-5 text-green-500" />
                    <span>Operadores</span>
                  </div>
                  <span className="font-bold">{adminStats?.totals.operators ?? "—"}</span>
                </div>
                <div className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                  <div className="flex items-center gap-3">
                    <TrendingUp className="h-5 w-5 text-purple-500" />
                    <span>Nuevos este mes</span>
                  </div>
                  <span className="font-bold text-green-600">+{adminStats?.growth.usersThisMonth ?? 0}</span>
                </div>
                <div className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                  <div className="flex items-center gap-3">
                    <UserCheck className="h-5 w-5 text-orange-500" />
                    <span>Mes anterior</span>
                  </div>
                  <span className="font-bold">{adminStats?.growth.usersLastMonth ?? 0}</span>
                </div>
              </CardContent>
            </Card>

            {/* Distribución de Propiedades */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <PieChart className="h-5 w-5" />
                  Distribución por Tipo
                </CardTitle>
                <CardDescription>Propiedades por categoría</CardDescription>
              </CardHeader>
              <CardContent>
                {propertyDistribution.length === 0 ? (
                  <p className="text-sm text-muted-foreground text-center py-6">Sin datos disponibles</p>
                ) : (
                  <div className="space-y-4">
                    {propertyDistribution.map((item) => (
                      <div key={item.type} className="space-y-2">
                        <div className="flex items-center justify-between text-sm">
                          <span>{item.type}</span>
                          <span className="font-medium">{item.count} ({item.percentage}%)</span>
                        </div>
                        <div className="h-2 bg-muted rounded-full overflow-hidden">
                          <div className={`h-full ${item.color} rounded-full transition-all`} style={{ width: `${item.percentage}%` }} />
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Métricas de Rendimiento */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Target className="h-5 w-5" />
                Métricas de Rendimiento
              </CardTitle>
              <CardDescription>Estado actual de la plataforma</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
                {performanceMetrics.map((metric) => (
                  <div key={metric.label} className="space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium">{metric.label}</span>
                      <span className="text-sm text-muted-foreground">{metric.value}/{metric.total}</span>
                    </div>
                    <Progress value={metric.percentage} className="h-2" />
                    <p className="text-2xl font-bold">{metric.percentage}%</p>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Tab Propiedades */}
        <TabsContent value="properties" className="space-y-6">
          <div className="grid gap-6 lg:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <MapPin className="h-5 w-5" />
                  Distribución por Tipo
                </CardTitle>
                <CardDescription>Conteo de propiedades por categoría</CardDescription>
              </CardHeader>
              <CardContent>
                {propertyDistribution.length === 0 ? (
                  <p className="text-sm text-muted-foreground text-center py-6">Sin datos disponibles</p>
                ) : (
                  <div className="space-y-4">
                    {propertyDistribution.map((item, index) => (
                      <div key={item.type} className="flex items-center gap-4">
                        <span className="w-6 h-6 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-xs font-bold shrink-0">
                          {index + 1}
                        </span>
                        <div className="flex-1">
                          <div className="flex items-center justify-between mb-1">
                            <span className="font-medium">{item.type}</span>
                            <span className="text-sm text-muted-foreground">{item.count} props.</span>
                          </div>
                          <div className="h-2 bg-muted rounded-full overflow-hidden">
                            <div className={`h-full ${item.color} rounded-full`} style={{ width: `${item.percentage}%` }} />
                          </div>
                        </div>
                        <span className="text-sm font-medium w-10 text-right">{item.percentage}%</span>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Target className="h-5 w-5" />
                  Estado de Propiedades
                </CardTitle>
                <CardDescription>Aprobadas vs pendientes</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid grid-cols-2 gap-4">
                  <div className="p-4 bg-green-50 dark:bg-green-950/30 rounded-lg">
                    <p className="text-sm text-muted-foreground">Aprobadas</p>
                    <p className="text-3xl font-bold text-green-600">{adminStats?.totals.approvedProperties ?? 0}</p>
                  </div>
                  <div className="p-4 bg-yellow-50 dark:bg-yellow-950/30 rounded-lg">
                    <p className="text-sm text-muted-foreground">Pendientes</p>
                    <p className="text-3xl font-bold text-yellow-600">{adminStats?.totals.pendingProperties ?? 0}</p>
                  </div>
                </div>
                <div className="space-y-3">
                  <div className="flex items-center justify-between text-sm">
                    <span>Total listadas</span>
                    <span className="font-medium">{adminStats?.totals.properties ?? 0}</span>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span>Nuevas este mes</span>
                    <span className="font-medium text-green-600">+{adminStats?.growth.propertiesThisMonth ?? 0}</span>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span>Solicitudes de alquiler</span>
                    <span className="font-medium">{adminStats?.totals.requests ?? 0}</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <BarChart3 className="h-5 w-5" />
                Propiedades por Tipo (Grafico)
              </CardTitle>
              <CardDescription>Distribucion visual de propiedades</CardDescription>
            </CardHeader>
            <CardContent>
              {propertyDistribution.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-6">Sin datos disponibles</p>
              ) : (
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={propertyDistribution} margin={{ top: 5, right: 20, left: 0, bottom: 5 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                    <XAxis dataKey="type" tick={{ fontSize: 12 }} stroke="hsl(var(--muted-foreground))" />
                    <YAxis stroke="hsl(var(--muted-foreground))" />
                    <Tooltip />
                    <Bar dataKey="count" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Tab Engagement / Búsquedas */}
        <TabsContent value="engagement" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <TrendingUp className="h-5 w-5" />
                Términos Más Buscados
              </CardTitle>
              <CardDescription>Top búsquedas registradas en la plataforma</CardDescription>
            </CardHeader>
            <CardContent>
              {topSearches.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <TrendingUp className="h-8 w-8 mx-auto mb-2 opacity-50" />
                  <p>No hay datos de búsqueda disponibles</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {topSearches.map((s: any, i: number) => {
                    const maxCount = topSearches[0]?.count ?? 1;
                    return (
                      <div key={s.term} className="flex items-center gap-4">
                        <span className="w-6 h-6 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-xs font-bold shrink-0">
                          {i + 1}
                        </span>
                        <div className="flex-1">
                          <div className="flex items-center justify-between mb-1">
                            <span className="font-medium capitalize">{s.term}</span>
                            <span className="text-sm text-muted-foreground">{s.count} búsquedas</span>
                          </div>
                          <div className="h-2 bg-muted rounded-full overflow-hidden">
                            <div className="h-full bg-primary rounded-full" style={{ width: `${(s.count / maxCount) * 100}%` }} />
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Exportar */}
      <Card>
        <CardHeader>
          <CardTitle>Exportar Reportes</CardTitle>
          <CardDescription>Descarga datos de la plataforma</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            <Button variant="outline" className="h-auto py-4 flex flex-col gap-2" onClick={handleExportUsers}>
              <Users className="h-6 w-6 text-blue-500" />
              <span>Reporte de Usuarios</span>
              <span className="text-xs text-muted-foreground">CSV</span>
            </Button>
            <Button variant="outline" className="h-auto py-4 flex flex-col gap-2" onClick={handleExportProperties}>
              <Building className="h-6 w-6 text-green-500" />
              <span>Reporte de Propiedades</span>
              <span className="text-xs text-muted-foreground">CSV</span>
            </Button>
            <Button variant="outline" className="h-auto py-4 flex flex-col gap-2" onClick={handleExportFullReport} disabled={!adminStats}>
              <FileBarChart className="h-6 w-6 text-purple-500" />
              <span>Reporte Completo</span>
              <span className="text-xs text-muted-foreground">TXT</span>
            </Button>
            <Button variant="outline" className="h-auto py-4 flex flex-col gap-2" onClick={handleExportPDF} disabled={!adminStats}>
              <FileBarChart className="h-6 w-6 text-red-500" />
              <span>Reporte PDF</span>
              <span className="text-xs text-muted-foreground">PDF</span>
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default ReportsSection;
