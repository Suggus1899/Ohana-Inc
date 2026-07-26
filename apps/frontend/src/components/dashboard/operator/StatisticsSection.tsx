import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  BarChart3,
  TrendingUp,
  Users,
  Home,
  Activity,
  Eye,
  Search,
  MousePointerClick,
  Clock,
  Calendar,
  ArrowUp,
  ArrowDown,
  Minus,
  FileText,
  Target,
  Zap,
  Heart,
  MessageSquare,
  MapPin,
  PieChart,
  Filter,
  Wifi,
  Car,
  Dumbbell,
  Waves
} from "lucide-react";
import { useState, useEffect, useRef } from "react";
import { api } from "@/services/api";
import { toast } from "sonner";
import { exportToPDF } from "@/lib/pdf-export";
import { Loader2 } from "lucide-react";

interface SystemStats {
  users: {
    total: number;
    active: number;
    new: number;
    growth: number;
  };
  properties: {
    total: number;
    active: number;
    pending: number;
    growth: number;
  };
  activity: {
    searches: number;
    views: number;
    interactions: number;
    avgSessionTime: number;
  };
  trends: {
    topSearches: Array<{ term: string; count: number }>;
    popularProperties: Array<{ id: number; title: string; views: number }>;
    activeHours: Array<{ hour: number; activity: number }>;
  };
  conversion: {
    searches: number;
    views: number;
    favorites: number;
    requests: number;
  };
  heatmap: {
    zones: Array<{ zone: string; searches: number; lat: number; lng: number }>;
    temporal: Array<{ day: string; hours: number[]; }>;
  };
  propertyTypes: Array<{ type: string; count: number; percentage: number }>;
  services: Array<{ service: string; requests: number; icon: string }>;
}

const StatisticsSection = () => {
  const [isLoading, setIsLoading] = useState(true);
  const [timeRange, setTimeRange] = useState("7d");
  const [stats, setStats] = useState<SystemStats>({
    users: { total: 0, active: 0, new: 0, growth: 0 },
    properties: { total: 0, active: 0, pending: 0, growth: 0 },
    activity: { searches: 0, views: 0, interactions: 0, avgSessionTime: 0 },
    trends: { topSearches: [], popularProperties: [], activeHours: [] },
    conversion: { searches: 0, views: 0, favorites: 0, requests: 0 },
    heatmap: { zones: [], temporal: [] },
    propertyTypes: [],
    services: []
  });

  const refreshRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    fetchStatistics();
    refreshRef.current = setInterval(fetchStatistics, 30000);
    return () => { if (refreshRef.current) clearInterval(refreshRef.current); };
  }, [timeRange]);

  const fetchStatistics = async () => {
    setIsLoading(true);
    try {
      const days = timeRange === '7d' ? 7 : timeRange === '30d' ? 30 : 90;
      const [overviewRes, trendsRes] = await Promise.all([
        api.getStatisticsOverview(days),
        api.getStatisticsTrends(days),
      ]);

      setStats(prev => ({
        ...prev,
        users: overviewRes.success && overviewRes.data ? overviewRes.data.users : prev.users,
        properties: overviewRes.success && overviewRes.data ? overviewRes.data.properties : prev.properties,
        trends: {
          ...prev.trends,
          topSearches: trendsRes.success && trendsRes.data ? trendsRes.data.topSearches : prev.trends.topSearches,
          activeHours: trendsRes.success && trendsRes.data ? trendsRes.data.hourlyActivity : prev.trends.activeHours,
        },
        propertyTypes: trendsRes.success && trendsRes.data ? trendsRes.data.propertyTypes : prev.propertyTypes,
      }));
    } catch (error) {
      toast.error("Error al cargar estadísticas");
    } finally {
      setIsLoading(false);
    }
  };

  const getTrendIcon = (growth: number) => {
    if (growth > 0) return <ArrowUp className="h-4 w-4 text-green-600" />;
    if (growth < 0) return <ArrowDown className="h-4 w-4 text-red-600" />;
    return <Minus className="h-4 w-4 text-gray-600" />;
  };

  const getTrendColor = (growth: number) => {
    if (growth > 0) return "text-green-600";
    if (growth < 0) return "text-red-600";
    return "text-gray-600";
  };

  const getServiceIcon = (iconName: string) => {
    const icons: Record<string, JSX.Element> = {
      wifi: <Wifi className="h-5 w-5" />,
      car: <Car className="h-5 w-5" />,
      gym: <Dumbbell className="h-5 w-5" />,
      pool: <Waves className="h-5 w-5" />,
      shield: <Target className="h-5 w-5" />,
      washing: <Activity className="h-5 w-5" />
    };
    return icons[iconName] || <Activity className="h-5 w-5" />;
  };

  const getHeatmapColor = (value: number) => {
    if (value >= 80) return "bg-red-500";
    if (value >= 60) return "bg-orange-500";
    if (value >= 40) return "bg-yellow-500";
    if (value >= 20) return "bg-green-500";
    return "bg-blue-500";
  };

  const handleExportReport = () => {
    const reportData = [
      ['Métrica', 'Valor', 'Cambio'],
      ['Total Usuarios', stats.users.total.toString(), `${stats.users.growth > 0 ? '+' : ''}${stats.users.growth}%`],
      ['Usuarios Activos', stats.users.active.toString(), '-'],
      ['Nuevos Usuarios', stats.users.new.toString(), '-'],
      ['Total Propiedades', stats.properties.total.toString(), `${stats.properties.growth > 0 ? '+' : ''}${stats.properties.growth}%`],
      ['Propiedades Activas', stats.properties.active.toString(), '-'],
      ['Búsquedas', stats.activity.searches.toString(), '-'],
      ['Visualizaciones', stats.activity.views.toString(), '-'],
      ['Interacciones', stats.activity.interactions.toString(), '-']
    ];

    exportToPDF({
      title: "Reporte de Estadísticas del Sistema",
      subtitle: `Período: ${timeRange === '7d' ? 'Últimos 7 días' : timeRange === '30d' ? 'Últimos 30 días' : 'Último año'}`,
      operatorName: "Sistema Habitas",
      stats: {
        total: stats.users.total + stats.properties.total,
        approved: stats.properties.active,
        rejected: stats.properties.pending
      },
      headers: reportData[0],
      rows: reportData.slice(1),
      fileName: `estadisticas_${timeRange}`
    });
  };

  return (
    <div className="space-y-4 sm:space-y-6 p-2 sm:p-0">
      {/* Header */}
      <div className="flex flex-col gap-3 sm:gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold">Estadísticas y Análisis</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Monitorea métricas clave y comportamiento del sistema
          </p>
        </div>
        
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 sm:gap-3">
          <Select value={timeRange} onValueChange={setTimeRange}>
            <SelectTrigger className="w-full sm:w-40">
              <Calendar className="h-4 w-4 mr-2" />
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="7d">Últimos 7 días</SelectItem>
              <SelectItem value="30d">Últimos 30 días</SelectItem>
              <SelectItem value="1y">Último año</SelectItem>
            </SelectContent>
          </Select>
          
          <Button 
            className="flex items-center justify-center gap-2 bg-red-600 hover:bg-red-700 text-white w-full sm:w-auto"
            onClick={handleExportReport}
            disabled={isLoading}
          >
            <div className="bg-white/20 p-1 rounded">
              <span className="text-[10px] font-bold">PDF</span>
            </div>
            <span className="font-semibold">Exportar</span>
          </Button>
        </div>
      </div>

      {isLoading && (
        <div className="flex flex-col items-center justify-center py-16">
          <Loader2 className="h-10 w-10 animate-spin text-primary mb-3" />
          <p className="text-muted-foreground">Cargando estadísticas...</p>
        </div>
      )}

      {/* KPIs Cards */}
      <div className="grid gap-3 sm:gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-4">
        {/* Total Usuarios */}
        <Card className="border-none shadow-lg">
          <CardContent className="p-4 sm:p-6">
            <div className="flex items-center justify-between mb-3 sm:mb-4">
              <div className="p-2 sm:p-3 rounded-xl bg-blue-50">
                <Users className="h-5 w-5 sm:h-6 sm:w-6 text-blue-600" />
              </div>
              <div className={`flex items-center gap-1 ${getTrendColor(stats.users.growth)}`}>
                {getTrendIcon(stats.users.growth)}
                <span className="text-xs sm:text-sm font-semibold">{Math.abs(stats.users.growth)}%</span>
              </div>
            </div>
            <h3 className="text-xl sm:text-2xl font-bold">{stats.users.total}</h3>
            <p className="text-xs sm:text-sm text-muted-foreground">Total Usuarios</p>
            <div className="mt-2 text-xs text-muted-foreground">
              {stats.users.active} activos • {stats.users.new} nuevos
            </div>
          </CardContent>
        </Card>

        {/* Total Propiedades */}
        <Card className="border-none shadow-lg">
          <CardContent className="p-4 sm:p-6">
            <div className="flex items-center justify-between mb-3 sm:mb-4">
              <div className="p-2 sm:p-3 rounded-xl bg-green-50">
                <Home className="h-5 w-5 sm:h-6 sm:w-6 text-green-600" />
              </div>
              <div className={`flex items-center gap-1 ${getTrendColor(stats.properties.growth)}`}>
                {getTrendIcon(stats.properties.growth)}
                <span className="text-xs sm:text-sm font-semibold">{Math.abs(stats.properties.growth)}%</span>
              </div>
            </div>
            <h3 className="text-xl sm:text-2xl font-bold">{stats.properties.total}</h3>
            <p className="text-xs sm:text-sm text-muted-foreground">Total Propiedades</p>
            <div className="mt-2 text-xs text-muted-foreground">
              {stats.properties.active} activas • {stats.properties.pending} pendientes
            </div>
          </CardContent>
        </Card>

        {/* Búsquedas */}
        <Card className="border-none shadow-lg">
          <CardContent className="p-4 sm:p-6">
            <div className="flex items-center justify-between mb-3 sm:mb-4">
              <div className="p-2 sm:p-3 rounded-xl bg-purple-50">
                <Search className="h-5 w-5 sm:h-6 sm:w-6 text-purple-600" />
              </div>
              <Target className="h-4 w-4 sm:h-5 sm:w-5 text-purple-600" />
            </div>
            <h3 className="text-xl sm:text-2xl font-bold">{stats.activity.searches.toLocaleString()}</h3>
            <p className="text-xs sm:text-sm text-muted-foreground">Búsquedas Realizadas</p>
            <div className="mt-2 text-xs text-muted-foreground">
              {stats.activity.interactions} interacciones
            </div>
          </CardContent>
        </Card>

        {/* Visualizaciones */}
        <Card className="border-none shadow-lg">
          <CardContent className="p-4 sm:p-6">
            <div className="flex items-center justify-between mb-3 sm:mb-4">
              <div className="p-2 sm:p-3 rounded-xl bg-orange-50">
                <Eye className="h-5 w-5 sm:h-6 sm:w-6 text-orange-600" />
              </div>
              <Zap className="h-4 w-4 sm:h-5 sm:w-5 text-orange-600" />
            </div>
            <h3 className="text-xl sm:text-2xl font-bold">{stats.activity.views.toLocaleString()}</h3>
            <p className="text-xs sm:text-sm text-muted-foreground">Visualizaciones</p>
            <div className="mt-2 text-xs text-muted-foreground">
              {stats.activity.avgSessionTime} min promedio
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Tabs de Análisis */}
      <Tabs defaultValue="overview" className="space-y-4 sm:space-y-6">
        <div className="overflow-x-auto -mx-2 px-2 sm:mx-0 sm:px-0">
          <TabsList className="inline-flex w-full min-w-max sm:w-full sm:min-w-0 sm:grid sm:grid-cols-5 h-auto">
            <TabsTrigger value="overview" className="flex items-center gap-1 sm:gap-2 text-xs sm:text-sm px-2 sm:px-3 py-2">
              <BarChart3 className="h-3 w-3 sm:h-4 sm:w-4" />
              <span className="whitespace-nowrap">Resumen</span>
            </TabsTrigger>
            <TabsTrigger value="conversion" className="flex items-center gap-1 sm:gap-2 text-xs sm:text-sm px-2 sm:px-3 py-2">
              <Target className="h-3 w-3 sm:h-4 sm:w-4" />
              <span className="whitespace-nowrap">Conversión</span>
            </TabsTrigger>
            <TabsTrigger value="heatmaps" className="flex items-center gap-1 sm:gap-2 text-xs sm:text-sm px-2 sm:px-3 py-2">
              <MapPin className="h-3 w-3 sm:h-4 sm:w-4" />
              <span className="whitespace-nowrap">Mapas</span>
            </TabsTrigger>
            <TabsTrigger value="behavior" className="flex items-center gap-1 sm:gap-2 text-xs sm:text-sm px-2 sm:px-3 py-2">
              <Activity className="h-3 w-3 sm:h-4 sm:w-4" />
              <span className="whitespace-nowrap">Comportamiento</span>
            </TabsTrigger>
            <TabsTrigger value="trends" className="flex items-center gap-1 sm:gap-2 text-xs sm:text-sm px-2 sm:px-3 py-2">
              <TrendingUp className="h-3 w-3 sm:h-4 sm:w-4" />
              <span className="whitespace-nowrap">Tendencias</span>
            </TabsTrigger>
          </TabsList>
        </div>

        {/* Tab: Resumen */}
        <TabsContent value="overview" className="space-y-4 sm:space-y-6">
          <div className="grid gap-4 sm:gap-6 grid-cols-1 lg:grid-cols-2">
            {/* Actividad por Hora */}
            <Card>
              <CardHeader className="p-4 sm:p-6">
                <CardTitle className="flex items-center gap-2 text-base sm:text-lg">
                  <Clock className="h-4 w-4 sm:h-5 sm:w-5" />
                  Actividad por Hora
                </CardTitle>
                <CardDescription className="text-xs sm:text-sm">Horas pico de uso del sistema</CardDescription>
              </CardHeader>
              <CardContent className="p-4 sm:p-6 pt-0">
                <div className="space-y-2 sm:space-y-3">
                  {stats.trends.activeHours.map((item) => (
                    <div key={item.hour} className="flex items-center gap-2 sm:gap-3">
                      <span className="text-xs sm:text-sm font-medium w-12 sm:w-16">{item.hour}:00</span>
                      <div className="flex-1 bg-gray-100 rounded-full h-5 sm:h-6 overflow-hidden min-w-0">
                        <div 
                          className="bg-gradient-to-r from-blue-500 to-purple-500 h-full flex items-center justify-end pr-1 sm:pr-2"
                          style={{ width: `${(item.activity / 100) * 100}%` }}
                        >
                          <span className="text-[10px] sm:text-xs text-white font-semibold">{item.activity}</span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Propiedades Populares */}
            <Card>
              <CardHeader className="p-4 sm:p-6">
                <CardTitle className="flex items-center gap-2 text-base sm:text-lg">
                  <TrendingUp className="h-4 w-4 sm:h-5 sm:w-5" />
                  Propiedades Más Vistas
                </CardTitle>
                <CardDescription className="text-xs sm:text-sm">Top 5 propiedades con más visualizaciones</CardDescription>
              </CardHeader>
              <CardContent className="p-4 sm:p-6 pt-0">
                <div className="space-y-3 sm:space-y-4">
                  {stats.trends.popularProperties.map((property, index) => (
                    <div key={property.id} className="flex items-center gap-2 sm:gap-3">
                      <div className="flex items-center justify-center w-7 h-7 sm:w-8 sm:h-8 rounded-full bg-primary/10 text-primary font-bold text-xs sm:text-sm flex-shrink-0">
                        {index + 1}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-xs sm:text-sm truncate">{property.title}</p>
                        <p className="text-[10px] sm:text-xs text-muted-foreground">{property.views} visualizaciones</p>
                      </div>
                      <Eye className="h-3 w-3 sm:h-4 sm:w-4 text-muted-foreground flex-shrink-0" />
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Tab: Embudo de Conversión */}
        <TabsContent value="conversion" className="space-y-4 sm:space-y-6">
          <Card>
            <CardHeader className="p-4 sm:p-6">
              <CardTitle className="flex items-center gap-2 text-base sm:text-lg">
                <Filter className="h-4 w-4 sm:h-5 sm:w-5" />
                Embudo de Conversión
              </CardTitle>
              <CardDescription className="text-xs sm:text-sm">
                Análisis del recorrido del usuario: Búsquedas → Vistas → Favoritos → Solicitudes
              </CardDescription>
            </CardHeader>
            <CardContent className="p-4 sm:p-6 pt-0">
              <div className="space-y-4 sm:space-y-6">
                {/* Embudo Visual */}
                <div className="relative">
                  {/* Búsquedas */}
                  <div className="mb-3 sm:mb-4">
                    <div className="flex items-center justify-between mb-2 flex-wrap gap-2">
                      <div className="flex items-center gap-2">
                        <Search className="h-4 w-4 sm:h-5 sm:w-5 text-blue-600" />
                        <span className="font-semibold text-sm sm:text-base">Búsquedas</span>
                      </div>
                      <span className="text-lg sm:text-2xl font-bold text-blue-600">{stats.conversion.searches}</span>
                    </div>
                    <div className="w-full h-12 sm:h-16 bg-gradient-to-r from-blue-500 to-blue-600 rounded-lg flex items-center justify-center text-white font-bold text-sm sm:text-lg">
                      100%
                    </div>
                  </div>

                  {/* Flecha */}
                  <div className="flex justify-center mb-3 sm:mb-4">
                    <ArrowDown className="h-5 w-5 sm:h-6 sm:w-6 text-gray-400" />
                  </div>

                  {/* Vistas */}
                  <div className="mb-3 sm:mb-4">
                    <div className="flex items-center justify-between mb-2 flex-wrap gap-2">
                      <div className="flex items-center gap-2">
                        <Eye className="h-4 w-4 sm:h-5 sm:w-5 text-purple-600" />
                        <span className="font-semibold text-sm sm:text-base">Visualizaciones</span>
                      </div>
                      <span className="text-lg sm:text-2xl font-bold text-purple-600">{stats.conversion.views}</span>
                    </div>
                    <div className="w-full overflow-hidden">
                      <div 
                        className="h-10 sm:h-14 bg-gradient-to-r from-purple-500 to-purple-600 rounded-lg flex items-center justify-center text-white font-bold text-sm sm:text-base max-w-full"
                        style={{ width: `${Math.min((stats.conversion.views / stats.conversion.searches) * 100, 100)}%` }}
                      >
                        {((stats.conversion.views / stats.conversion.searches) * 100).toFixed(1)}%
                      </div>
                    </div>
                  </div>

                  {/* Flecha */}
                  <div className="flex justify-center mb-3 sm:mb-4">
                    <ArrowDown className="h-5 w-5 sm:h-6 sm:w-6 text-gray-400" />
                  </div>

                  {/* Favoritos */}
                  <div className="mb-3 sm:mb-4">
                    <div className="flex items-center justify-between mb-2 flex-wrap gap-2">
                      <div className="flex items-center gap-2">
                        <Heart className="h-4 w-4 sm:h-5 sm:w-5 text-pink-600" />
                        <span className="font-semibold text-sm sm:text-base">Favoritos</span>
                      </div>
                      <span className="text-lg sm:text-2xl font-bold text-pink-600">{stats.conversion.favorites}</span>
                    </div>
                    <div className="w-full overflow-hidden">
                      <div 
                        className="h-9 sm:h-12 bg-gradient-to-r from-pink-500 to-pink-600 rounded-lg flex items-center justify-center text-white font-bold text-sm sm:text-base max-w-full"
                        style={{ width: `${(stats.conversion.favorites / stats.conversion.searches) * 100}%` }}
                      >
                        {((stats.conversion.favorites / stats.conversion.searches) * 100).toFixed(1)}%
                      </div>
                    </div>
                  </div>

                  {/* Flecha */}
                  <div className="flex justify-center mb-3 sm:mb-4">
                    <ArrowDown className="h-5 w-5 sm:h-6 sm:w-6 text-gray-400" />
                  </div>

                  {/* Solicitudes */}
                  <div>
                    <div className="flex items-center justify-between mb-2 flex-wrap gap-2">
                      <div className="flex items-center gap-2">
                        <MessageSquare className="h-4 w-4 sm:h-5 sm:w-5 text-green-600" />
                        <span className="font-semibold text-sm sm:text-base">Solicitudes de Renta</span>
                      </div>
                      <span className="text-lg sm:text-2xl font-bold text-green-600">{stats.conversion.requests}</span>
                    </div>
                    <div className="w-full overflow-hidden">
                      <div 
                        className="h-8 sm:h-10 bg-gradient-to-r from-green-500 to-green-600 rounded-lg flex items-center justify-center text-white font-bold text-sm sm:text-base max-w-full"
                        style={{ width: `${(stats.conversion.requests / stats.conversion.searches) * 100}%` }}
                      >
                        {((stats.conversion.requests / stats.conversion.searches) * 100).toFixed(1)}%
                      </div>
                    </div>
                  </div>
                </div>

                {/* Métricas de Conversión */}
                <div className="grid gap-3 sm:gap-4 grid-cols-1 sm:grid-cols-3 mt-6 sm:mt-8">
                  <Card className="bg-gradient-to-br from-purple-50 to-purple-100 border-purple-200">
                    <CardContent className="p-3 sm:p-4">
                      <p className="text-xs sm:text-sm text-purple-700 mb-1">Tasa Búsqueda → Vista</p>
                      <p className="text-2xl sm:text-3xl font-bold text-purple-900">
                        {((stats.conversion.views / stats.conversion.searches) * 100).toFixed(1)}%
                      </p>
                    </CardContent>
                  </Card>

                  <Card className="bg-gradient-to-br from-pink-50 to-pink-100 border-pink-200">
                    <CardContent className="p-3 sm:p-4">
                      <p className="text-xs sm:text-sm text-pink-700 mb-1">Tasa Vista → Favorito</p>
                      <p className="text-2xl sm:text-3xl font-bold text-pink-900">
                        {((stats.conversion.favorites / stats.conversion.views) * 100).toFixed(1)}%
                      </p>
                    </CardContent>
                  </Card>

                  <Card className="bg-gradient-to-br from-green-50 to-green-100 border-green-200">
                    <CardContent className="p-3 sm:p-4">
                      <p className="text-xs sm:text-sm text-green-700 mb-1">Tasa Favorito → Solicitud</p>
                      <p className="text-2xl sm:text-3xl font-bold text-green-900">
                        {((stats.conversion.requests / stats.conversion.favorites) * 100).toFixed(1)}%
                      </p>
                    </CardContent>
                  </Card>
                </div>

                {/* Insights */}
                <div className="p-3 sm:p-4 bg-blue-50 rounded-lg border border-blue-200">
                  <div className="flex items-start gap-2 sm:gap-3">
                    <Target className="h-4 w-4 sm:h-5 sm:w-5 text-blue-600 mt-0.5 flex-shrink-0" />
                    <div>
                      <p className="font-medium text-blue-900 text-sm sm:text-base">Análisis de Conversión</p>
                      <p className="text-xs sm:text-sm text-blue-700 mt-1">
                        La tasa de conversión general (búsqueda a solicitud) es del{' '}
                        {((stats.conversion.requests / stats.conversion.searches) * 100).toFixed(1)}%.
                        Los usuarios que agregan favoritos tienen {((stats.conversion.requests / stats.conversion.favorites) * 100).toFixed(0)}% 
                        de probabilidad de enviar una solicitud.
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Tab: Mapas de Calor */}
        <TabsContent value="heatmaps" className="space-y-4 sm:space-y-6">
          {/* Mapa de Calor Geográfico */}
          <Card>
            <CardHeader className="p-4 sm:p-6">
              <CardTitle className="flex items-center gap-2 text-base sm:text-lg">
                <MapPin className="h-4 w-4 sm:h-5 sm:w-5" />
                Mapa de Calor de Búsquedas por Zona
              </CardTitle>
              <CardDescription className="text-xs sm:text-sm">Zonas más buscadas por los usuarios</CardDescription>
            </CardHeader>
            <CardContent className="p-4 sm:p-6 pt-0">
              <div className="space-y-2 sm:space-y-3">
                {stats.heatmap.zones.map((zone, index) => {
                  const maxSearches = stats.heatmap.zones[0].searches;
                  const percentage = (zone.searches / maxSearches) * 100;
                  
                  return (
                    <div key={index} className="space-y-1.5 sm:space-y-2">
                      <div className="flex items-center justify-between flex-wrap gap-2">
                        <div className="flex items-center gap-2">
                          <MapPin className="h-3 w-3 sm:h-4 sm:w-4 text-primary flex-shrink-0" />
                          <span className="font-medium text-sm sm:text-base">{zone.zone}</span>
                        </div>
                        <span className="text-xs sm:text-sm text-muted-foreground whitespace-nowrap">{zone.searches} búsquedas</span>
                      </div>
                      <div className="relative w-full h-7 sm:h-8 bg-gray-100 rounded-lg overflow-hidden">
                        <div 
                          className={`h-full ${
                            percentage >= 80 ? 'bg-gradient-to-r from-red-500 to-red-600' :
                            percentage >= 60 ? 'bg-gradient-to-r from-orange-500 to-orange-600' :
                            percentage >= 40 ? 'bg-gradient-to-r from-yellow-500 to-yellow-600' :
                            'bg-gradient-to-r from-green-500 to-green-600'
                          } flex items-center justify-end pr-2 sm:pr-3`}
                          style={{ width: `${percentage}%` }}
                        >
                          <span className="text-[10px] sm:text-xs text-white font-semibold">{percentage.toFixed(0)}%</span>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>

              {stats.heatmap.zones.length > 0 && (
                <div className="mt-4 sm:mt-6 p-3 sm:p-4 bg-amber-50 rounded-lg border border-amber-200">
                  <div className="flex items-start gap-2 sm:gap-3">
                    <MapPin className="h-4 w-4 sm:h-5 sm:w-5 text-amber-600 mt-0.5 flex-shrink-0" />
                    <div>
                      <p className="font-medium text-amber-900 text-sm sm:text-base">Zonas de Mayor Demanda</p>
                      <p className="text-xs sm:text-sm text-amber-700 mt-1">
                        {stats.heatmap.zones.slice(0, 3).map(z => z.zone).join(', ')} son las zonas con más búsquedas.
                      </p>
                    </div>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Heatmap Temporal */}
          <Card>
            <CardHeader className="p-4 sm:p-6">
              <CardTitle className="flex items-center gap-2 text-base sm:text-lg">
                <Clock className="h-4 w-4 sm:h-5 sm:w-5" />
                Heatmap Temporal - Actividad por Día y Hora
              </CardTitle>
              <CardDescription className="text-xs sm:text-sm">Patrones de actividad durante la semana</CardDescription>
            </CardHeader>
            <CardContent className="p-4 sm:p-6 pt-0">
              <div className="overflow-x-auto">
                <div className="min-w-[900px]">
                  {/* Encabezado de horas */}
                  <div className="flex mb-2">
                    <div className="w-20 flex-shrink-0"></div>
                    <div className="flex-1 flex justify-between px-1">
                      {Array.from({ length: 24 }, (_, i) => (
                        <div key={`hour-${i}`} className="text-xs text-muted-foreground text-center" style={{ width: 'calc(100% / 24)' }}>
                          {i}
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Filas de días */}
                  {stats.heatmap.temporal.map((day, dayIndex) => (
                    <div key={dayIndex} className="flex items-center mb-1">
                      <div className="w-20 text-sm font-medium flex-shrink-0 pr-2">{day.day}</div>
                      <div className="flex-1 flex gap-1">
                        {day.hours.map((value, hourIndex) => (
                          <div
                            key={hourIndex}
                            className={`flex-1 h-8 rounded ${getHeatmapColor(value)} transition-all hover:scale-105 cursor-pointer`}
                            title={`${day.day} ${hourIndex}:00 - Actividad: ${value}%`}
                            style={{ opacity: value / 100 }}
                          />
                        ))}
                      </div>
                    </div>
                  ))}

                  {/* Leyenda */}
                  <div className="flex items-center justify-center gap-4 mt-4 text-xs flex-wrap">
                    <span className="text-muted-foreground">Menos actividad</span>
                    <div className="flex gap-1">
                      <div className="w-6 h-6 bg-blue-500 rounded opacity-30"></div>
                      <div className="w-6 h-6 bg-green-500 rounded opacity-50"></div>
                      <div className="w-6 h-6 bg-yellow-500 rounded opacity-70"></div>
                      <div className="w-6 h-6 bg-orange-500 rounded opacity-85"></div>
                      <div className="w-6 h-6 bg-red-500 rounded opacity-100"></div>
                    </div>
                    <span className="text-muted-foreground">Más actividad</span>
                  </div>
                </div>
              </div>

              {stats.trends.activeHours.length > 0 && (
                <div className="mt-4 sm:mt-6 p-3 sm:p-4 bg-purple-50 rounded-lg border border-purple-200">
                  <div className="flex items-start gap-2 sm:gap-3">
                    <Clock className="h-4 w-4 sm:h-5 sm:w-5 text-purple-600 mt-0.5 flex-shrink-0" />
                    <div>
                      <p className="font-medium text-purple-900 text-sm sm:text-base">Horas Pico</p>
                      <p className="text-xs sm:text-sm text-purple-700 mt-1">
                        La actividad varía según la hora del día. Consulta el heatmap para más detalles.
                      </p>
                    </div>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Tab: Comportamiento */}
        <TabsContent value="behavior" className="space-y-4 sm:space-y-6">
          {/* Tipos de Propiedad */}
          <Card>
            <CardHeader className="p-4 sm:p-6">
              <CardTitle className="flex items-center gap-2 text-base sm:text-lg">
                <PieChart className="h-4 w-4 sm:h-5 sm:w-5" />
                Tipos de Propiedad Más Buscados
              </CardTitle>
              <CardDescription className="text-xs sm:text-sm">Distribución de preferencias de los usuarios</CardDescription>
            </CardHeader>
            <CardContent className="p-4 sm:p-6 pt-0">
              <div className="space-y-3 sm:space-y-4">
                {stats.propertyTypes.map((type, index) => {
                  const colors = [
                    'from-blue-500 to-blue-600',
                    'from-green-500 to-green-600',
                    'from-purple-500 to-purple-600',
                    'from-orange-500 to-orange-600'
                  ];
                  
                  return (
                    <div key={index} className="space-y-2">
                      <div className="flex items-center justify-between flex-wrap gap-2">
                        <div className="flex items-center gap-2">
                          <Home className="h-3 w-3 sm:h-4 sm:w-4 text-primary flex-shrink-0" />
                          <span className="font-medium text-sm sm:text-base">{type.type}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="text-xs sm:text-sm text-muted-foreground">{type.count} búsquedas</span>
                          <span className="text-xs sm:text-sm font-semibold text-primary">{type.percentage}%</span>
                        </div>
                      </div>
                      <div className="relative w-full h-7 sm:h-8 bg-gray-100 rounded-lg overflow-hidden">
                        <div 
                          className={`h-full bg-gradient-to-r ${colors[index]} flex items-center justify-end pr-2 sm:pr-3`}
                          style={{ width: `${type.percentage}%` }}
                        >
                          <span className="text-[10px] sm:text-xs text-white font-semibold">{type.percentage}%</span>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>

          {/* Servicios Más Solicitados */}
          <Card>
            <CardHeader className="p-4 sm:p-6">
              <CardTitle className="flex items-center gap-2 text-base sm:text-lg">
                <BarChart3 className="h-4 w-4 sm:h-5 sm:w-5" />
                Servicios Más Solicitados
              </CardTitle>
              <CardDescription className="text-xs sm:text-sm">Amenidades que los usuarios buscan con mayor frecuencia</CardDescription>
            </CardHeader>
            <CardContent className="p-4 sm:p-6 pt-0">
              <div className="space-y-3 sm:space-y-4">
                {stats.services.map((service, index) => {
                  const maxRequests = stats.services[0].requests;
                  const percentage = (service.requests / maxRequests) * 100;
                  
                  return (
                    <div key={index} className="flex items-center gap-3 sm:gap-4">
                      <div className="p-2 sm:p-3 rounded-lg bg-primary/10 text-primary flex-shrink-0">
                        {getServiceIcon(service.icon)}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between mb-1 flex-wrap gap-1">
                          <span className="font-medium text-sm sm:text-base">{service.service}</span>
                          <span className="text-xs sm:text-sm text-muted-foreground whitespace-nowrap">{service.requests} solicitudes</span>
                        </div>
                        <div className="w-full bg-gray-100 rounded-full h-2.5 sm:h-3">
                          <div 
                            className="bg-gradient-to-r from-primary to-purple-600 h-2.5 sm:h-3 rounded-full transition-all"
                            style={{ width: `${percentage}%` }}
                          />
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>

              {stats.services.length > 0 && (
                <div className="mt-4 sm:mt-6 p-3 sm:p-4 bg-green-50 rounded-lg border border-green-200">
                  <div className="flex items-start gap-2 sm:gap-3">
                    <Zap className="h-4 w-4 sm:h-5 sm:w-5 text-green-600 mt-0.5 flex-shrink-0" />
                    <div>
                      <p className="font-medium text-green-900 text-sm sm:text-base">Servicios Esenciales</p>
                      <p className="text-xs sm:text-sm text-green-700 mt-1">
                        {stats.services.slice(0, 3).map(s => s.service).join(', ')} son los servicios más solicitados.
                      </p>
                    </div>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Métricas de Interacción */}
          <Card>
            <CardHeader className="p-4 sm:p-6">
              <CardTitle className="flex items-center gap-2 text-base sm:text-lg">
                <MousePointerClick className="h-4 w-4 sm:h-5 sm:w-5" />
                Métricas de Interacción
              </CardTitle>
              <CardDescription className="text-xs sm:text-sm">Análisis del comportamiento de usuarios en el sistema</CardDescription>
            </CardHeader>
            <CardContent className="p-4 sm:p-6 pt-0">
              <div className="grid gap-4 sm:gap-6 grid-cols-1 sm:grid-cols-3">
                <div className="p-4 sm:p-6 bg-gradient-to-br from-blue-50 to-blue-100 rounded-xl">
                  <Search className="h-6 w-6 sm:h-8 sm:w-8 text-blue-600 mb-2 sm:mb-3" />
                  <div className="text-2xl sm:text-3xl font-bold text-blue-900">{stats.activity.searches}</div>
                  <p className="text-xs sm:text-sm text-blue-700 mt-1">Búsquedas Totales</p>
                  <p className="text-[10px] sm:text-xs text-blue-600 mt-1 sm:mt-2">
                    ~{Math.round(stats.activity.searches / 7)} por día
                  </p>
                </div>

                <div className="p-4 sm:p-6 bg-gradient-to-br from-purple-50 to-purple-100 rounded-xl">
                  <Eye className="h-6 w-6 sm:h-8 sm:w-8 text-purple-600 mb-2 sm:mb-3" />
                  <div className="text-2xl sm:text-3xl font-bold text-purple-900">{stats.activity.views}</div>
                  <p className="text-xs sm:text-sm text-purple-700 mt-1">Visualizaciones</p>
                  <p className="text-[10px] sm:text-xs text-purple-600 mt-1 sm:mt-2">
                    ~{Math.round(stats.activity.views / stats.activity.searches)} por búsqueda
                  </p>
                </div>

                <div className="p-4 sm:p-6 bg-gradient-to-br from-green-50 to-green-100 rounded-xl">
                  <MousePointerClick className="h-6 w-6 sm:h-8 sm:w-8 text-green-600 mb-2 sm:mb-3" />
                  <div className="text-2xl sm:text-3xl font-bold text-green-900">{stats.activity.interactions}</div>
                  <p className="text-xs sm:text-sm text-green-700 mt-1">Interacciones</p>
                  <p className="text-[10px] sm:text-xs text-green-600 mt-1 sm:mt-2">
                    {((stats.activity.interactions / stats.activity.views) * 100).toFixed(1)}% tasa de conversión
                  </p>
                </div>
              </div>

              <div className="mt-4 sm:mt-6 p-3 sm:p-4 bg-amber-50 rounded-lg border border-amber-200">
                <div className="flex items-start gap-2 sm:gap-3">
                  <Clock className="h-4 w-4 sm:h-5 sm:w-5 text-amber-600 mt-0.5 flex-shrink-0" />
                  <div>
                    <p className="font-medium text-amber-900 text-sm sm:text-base">Tiempo Promedio de Sesión</p>
                    <p className="text-xl sm:text-2xl font-bold text-amber-700 mt-1">{stats.activity.avgSessionTime} minutos</p>
                    <p className="text-xs sm:text-sm text-amber-600 mt-1">
                      Los usuarios pasan en promedio {stats.activity.avgSessionTime} minutos explorando propiedades
                    </p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Tab: Tendencias */}
        <TabsContent value="trends" className="space-y-4 sm:space-y-6">
          <Card>
            <CardHeader className="p-4 sm:p-6">
              <CardTitle className="flex items-center gap-2 text-base sm:text-lg">
                <Search className="h-4 w-4 sm:h-5 sm:w-5" />
                Búsquedas Más Frecuentes
              </CardTitle>
              <CardDescription className="text-xs sm:text-sm">Términos más buscados por los usuarios</CardDescription>
            </CardHeader>
            <CardContent className="p-4 sm:p-6 pt-0">
              <div className="space-y-3 sm:space-y-4">
                {stats.trends.topSearches.map((search, index) => (
                  <div key={index} className="flex items-center gap-3 sm:gap-4">
                    <div className="flex items-center justify-center w-8 h-8 sm:w-10 sm:h-10 rounded-full bg-gradient-to-br from-primary to-purple-600 text-white font-bold text-sm sm:text-base flex-shrink-0">
                      {index + 1}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between mb-1 flex-wrap gap-1">
                        <p className="font-semibold text-sm sm:text-base truncate">{search.term}</p>
                        <span className="text-xs sm:text-sm text-muted-foreground whitespace-nowrap">{search.count} búsquedas</span>
                      </div>
                      <div className="w-full bg-gray-100 rounded-full h-1.5 sm:h-2">
                        <div 
                          className="bg-gradient-to-r from-primary to-purple-600 h-1.5 sm:h-2 rounded-full"
                          style={{ width: `${(search.count / stats.trends.topSearches[0].count) * 100}%` }}
                        />
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              <div className="mt-4 sm:mt-6 p-3 sm:p-4 bg-blue-50 rounded-lg border border-blue-200">
                <div className="flex items-start gap-2 sm:gap-3">
                  <FileText className="h-4 w-4 sm:h-5 sm:w-5 text-blue-600 mt-0.5 flex-shrink-0" />
                  <div>
                    <p className="font-medium text-blue-900 text-sm sm:text-base">Insights de Búsqueda</p>
                    <p className="text-xs sm:text-sm text-blue-700 mt-1">
                      Los usuarios buscan principalmente apartamentos de 2 habitaciones cerca de universidades.
                      Las propiedades amuebladas y económicas son las más demandadas.
                    </p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default StatisticsSection;
