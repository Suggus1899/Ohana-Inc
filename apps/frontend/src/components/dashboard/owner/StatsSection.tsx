import { useState, useEffect, memo } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { BarChart3, TrendingUp, TrendingDown, Eye, Building, Users, Calendar, DollarSign, Loader2, ChevronDown, ChevronUp, FileDown } from "lucide-react";
import { cn } from "@/lib/utils";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import api, { Property } from "@/services/api";
import { useToast } from "@/hooks/use-toast";
import { getMyTransactions } from "@/services/transaction.service";
import { TransactionStatus } from "@/types/transaction.types";
import { useExchangeRate } from "../../../contexts/ExchangeRateContext";
import { formatCurrency, usdToCop } from "../../../utils/formatPrice";

interface MonthlyIncome {
  month: string;
  year: number;
  monthLabel: string;
  total: number;
  count: number;
}

interface OwnerStats {
  totalViews: number;
  totalRequests: number;
  conversionRate: number;
  projectedIncome: number;
  collectedIncome: number;
  activeProperties: number;
  rentedProperties: number;
  monthlyHistory: MonthlyIncome[];
}

const StatsSection = () => {
  const { rate, loading: rateLoading } = useExchangeRate();
  const [properties, setProperties] = useState<Property[]>([]);
  const [stats, setStats] = useState<OwnerStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [showHistory, setShowHistory] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    let cancelled = false;
    (async () => {
      setLoading(true);
      try {
        const [data, requestsRes, transactionsRes] = await Promise.all([
          api.getMyProperties(1, 100),
          api.getReceivedRentRequests(),
          getMyTransactions({ status: TransactionStatus.COMPLETED }),
        ]);
        if (cancelled) return;
        setProperties(data.properties);
        
        const totalViews = data.properties.reduce((acc, p) => acc + (p.views || 0), 0);
        const activeProperties = data.properties.filter((p) => p.status === 'approved').length;
        const rentedProperties = data.properties.filter((p) => p.status === 'rented' || p.status === 'sold').length;
        
        const projectedIncome = data.properties
          .filter((p) => p.status === 'rented' || p.status === 'sold')
          .reduce((acc, p) => acc + (p.price || 0), 0);
        
        const totalRequests = requestsRes.data?.requests?.length ?? 0;
        const conversionRate = totalViews > 0 ? (totalRequests / totalViews) * 100 : 0;
        
        const now = new Date();
        const currentMonth = now.getMonth();
        const currentYear = now.getFullYear();

        const monthlyMap = new Map<string, { total: number; count: number }>();

        for (const t of transactionsRes.transactions) {
          const date = t.completedAt ? new Date(t.completedAt) : new Date(t.createdAt);
          const key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
          const entry = monthlyMap.get(key) || { total: 0, count: 0 };
          entry.total += t.amount || 0;
          entry.count += 1;
          monthlyMap.set(key, entry);
        }

        const monthlyHistory: MonthlyIncome[] = Array.from(monthlyMap.entries())
          .map(([key, data]) => {
            const [yearStr, monthStr] = key.split('-');
            const year = parseInt(yearStr);
            const month = parseInt(monthStr) - 1;
            const date = new Date(year, month);
            const monthLabel = date.toLocaleDateString('es-ES', { month: 'long', year: 'numeric' });
            return { month: key, year, monthLabel, total: data.total, count: data.count };
          })
          .sort((a, b) => b.year - a.year || b.month.localeCompare(a.month));

        const collectedIncome = monthlyHistory
          .filter(m => m.year === currentYear && parseInt(m.month.split('-')[1]) - 1 === currentMonth)
          .reduce((acc, m) => acc + m.total, 0);
        
        setStats({
          totalViews,
          totalRequests,
          conversionRate,
          projectedIncome,
          collectedIncome,
          activeProperties,
          rentedProperties,
          monthlyHistory,
        });
      } catch (error) {
        if (cancelled) return;
        toast({
          title: "Error",
          description: "No se pudieron cargar las estadísticas",
          variant: "destructive"
        });
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => { cancelled = true; };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Mock weekly data (will be replaced with real data when backend supports it)
  const weeklyViews = [
    { day: "Lun", views: Math.floor((stats?.totalViews || 0) / 7 * 0.8) },
    { day: "Mar", views: Math.floor((stats?.totalViews || 0) / 7 * 0.9) },
    { day: "Mié", views: Math.floor((stats?.totalViews || 0) / 7 * 0.7) },
    { day: "Jue", views: Math.floor((stats?.totalViews || 0) / 7 * 1.0) },
    { day: "Vie", views: Math.floor((stats?.totalViews || 0) / 7 * 1.2) },
    { day: "Sáb", views: Math.floor((stats?.totalViews || 0) / 7 * 1.4) },
    { day: "Dom", views: Math.floor((stats?.totalViews || 0) / 7 * 0.6) },
  ];

  const maxViews = Math.max(...weeklyViews.map((d) => d.views), 1);

  const exportPDF = () => {
    if (!stats?.monthlyHistory.length) return;
    const doc = new jsPDF();
    const title = "Historial de Ingresos";
    doc.setFontSize(16);
    doc.text(title, 14, 20);
    doc.setFontSize(10);
    doc.text(`Generado: ${new Date().toLocaleDateString('es-ES', { year: 'numeric', month: 'long', day: 'numeric' })}`, 14, 28);
    doc.text(`Ingresos Proyectados: $${(stats.projectedIncome || 0).toLocaleString()}`, 14, 35);
    doc.text(`Ingresos Recaudados (este mes): $${(stats.collectedIncome || 0).toLocaleString()}`, 14, 42);
    const rows = stats.monthlyHistory.map(m => [
      m.monthLabel.charAt(0).toUpperCase() + m.monthLabel.slice(1),
      `$${m.total.toLocaleString()}`,
      `${m.count}`,
    ]);
    autoTable(doc, {
      startY: 50,
      head: [["Mes", "Total", "Transacciones"]],
      body: rows,
      theme: "striped",
      headStyles: { fillColor: [22, 163, 74] },
    });
    const total = stats.monthlyHistory.reduce((acc, m) => acc + m.total, 0);
    doc.setFontSize(11);
    doc.text(`Total histórico: $${total.toLocaleString()}`, 14, (doc as any).lastAutoTable.finalY + 10);
    doc.save(`historial-ingresos-${new Date().toISOString().slice(0, 7)}.pdf`);
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold">Estadísticas</h1>
          <p className="text-muted-foreground mt-1">Cargando datos...</p>
        </div>
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      </div>
    );
  }

  const mainStats = [
    { label: "Vistas Totales", value: stats?.totalViews || 0, icon: Eye, change: 12 },
    { label: "Propiedades Activas", value: stats?.activeProperties || 0, icon: Building },
    { label: "Solicitudes", value: stats?.totalRequests || 0, icon: Users, change: -5 },
    { label: "Tasa de Conversión", value: `${(stats?.conversionRate || 0).toFixed(1)}%`, icon: TrendingUp },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Estadísticas</h1>
        <p className="text-muted-foreground mt-1">
          Analiza el rendimiento de tus propiedades
        </p>
      </div>

      {/* Main Stats */}
      <div className="grid grid-cols-2 gap-3 md:grid-cols-2 lg:grid-cols-4">
        {mainStats.map((stat) => {
          const Icon = stat.icon;
          const isPositive = stat.change && stat.change > 0;
          const isNumeric = typeof stat.value === 'number';
          
          return (
            <Card key={stat.label}>
              <CardHeader className="flex flex-row items-center justify-between pb-2 px-3 pt-3">
                <CardTitle className="text-xs font-medium text-muted-foreground truncate">
                  {stat.label}
                </CardTitle>
                <Icon className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
              </CardHeader>
              <CardContent className="px-3 pb-3">
                <div className="flex items-center gap-1.5 flex-wrap">
                  <span className="text-lg sm:text-xl font-bold truncate max-w-full">
                    {isNumeric ? stat.value.toLocaleString() : stat.value}
                  </span>
                  {stat.change !== undefined && (
                    <span className={cn(
                      "flex items-center text-xs font-medium shrink-0",
                      isPositive ? "text-green-600" : "text-red-600"
                    )}>
                      {isPositive ? (
                        <TrendingUp className="h-3 w-3" />
                      ) : (
                        <TrendingDown className="h-3 w-3" />
                      )}
                      {Math.abs(stat.change)}%
                    </span>
                  )}
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Income Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <Card>
          <CardHeader className="px-3 pt-3 pb-1">
            <CardTitle className="flex items-center gap-2 text-sm">
              <DollarSign className="h-3.5 w-3.5 shrink-0" />
              Ingresos Proyectados
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">${(stats?.projectedIncome || 0).toLocaleString()}</div>
            {rate && !rateLoading && (
              <div className="text-base font-semibold text-muted-foreground">
                {formatCurrency(usdToCop(stats?.projectedIncome || 0, rate.usdToCop), 'COP')}
              </div>
            )}
            <p className="text-sm text-muted-foreground mt-1">
              Mensual de propiedades publicadas
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="px-3 pt-3 pb-1">
            <CardTitle className="flex items-center gap-2 text-sm">
              <DollarSign className="h-3.5 w-3.5 text-green-600 shrink-0" />
              Ingresos Recaudados
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-green-600">${(stats?.collectedIncome || 0).toLocaleString()}</div>
            {rate && !rateLoading && (
              <div className="text-base font-semibold text-muted-foreground">
                {formatCurrency(usdToCop(stats?.collectedIncome || 0, rate.usdToCop), 'COP')}
              </div>
            )}
            <p className="text-sm text-muted-foreground mt-1">
              Total de transacciones completadas
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Income History */}
      {stats?.monthlyHistory && stats.monthlyHistory.length > 0 && (
        <Card>
          <CardHeader
            className="px-3 pt-3 pb-1 cursor-pointer select-none"
            onClick={() => setShowHistory(!showHistory)}
          >
            <CardTitle className="flex items-center justify-between text-sm">
              <span className="flex items-center gap-2">
                <Calendar className="h-3.5 w-3.5 shrink-0" />
                Historial de Ingresos
              </span>
              <div className="flex items-center gap-1">
                {stats.monthlyHistory.length > 0 && (
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="h-7 w-7"
                    onClick={(e) => { e.stopPropagation(); exportPDF(); }}
                    title="Exportar PDF"
                  >
                    <FileDown className="h-4 w-4" />
                  </Button>
                )}
                {showHistory ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
              </div>
            </CardTitle>
          </CardHeader>
          {showHistory && (
            <CardContent className="px-3 pb-3">
              <div className="space-y-1">
                {stats.monthlyHistory.map((m) => (
                  <div key={m.month} className="flex items-center justify-between py-2 border-b last:border-0">
                    <span className="text-sm capitalize">{m.monthLabel}</span>
                    <div className="flex items-center gap-3">
                      <span className="text-xs text-muted-foreground">{m.count} transacción{m.count !== 1 ? 'es' : ''}</span>
                      <span className="text-sm font-semibold text-green-600">${m.total.toLocaleString()}</span>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          )}
        </Card>
      )}

      <div className="grid gap-4 lg:grid-cols-2">
        {/* Weekly Views Chart */}
        <Card>
          <CardHeader className="px-3 pt-3 pb-1 sm:px-6 sm:pt-6 sm:pb-2">
            <CardTitle className="flex items-center gap-2 text-sm sm:text-base">
              <BarChart3 className="h-4 w-4 sm:h-5 sm:w-5" />
              Vistas Semanales
            </CardTitle>
            <CardDescription className="text-xs sm:text-sm">
              Distribución estimada de visitas
            </CardDescription>
          </CardHeader>
          <CardContent className="px-3 pb-3 sm:px-6 sm:pb-6">
            <div className="flex items-end justify-between gap-1 sm:gap-2 h-40 sm:h-48">
              {weeklyViews.map((data) => (
                <div key={data.day} className="flex flex-col items-center gap-1 sm:gap-2 flex-1">
                  <div className="w-full bg-muted rounded-t relative" style={{ height: "120px" }}>
                    <div
                      className="absolute bottom-0 left-0 right-0 bg-primary rounded-t transition-all"
                      style={{ height: `${(data.views / maxViews) * 100}%` }}
                    />
                  </div>
                  <span className="text-[10px] sm:text-xs text-muted-foreground">{data.day}</span>
                </div>
              ))}
            </div>
            <div className="flex items-center justify-between mt-3 sm:mt-4 pt-3 sm:pt-4 border-t">
              <span className="text-xs sm:text-sm text-muted-foreground">Total estimado</span>
              <span className="text-sm sm:text-base font-bold">{stats?.totalViews?.toLocaleString() || 0} vistas</span>
            </div>
          </CardContent>
        </Card>

        {/* Property Performance */}
        <Card>
          <CardHeader className="px-3 pt-3 pb-1 sm:px-6 sm:pb-2">
            <CardTitle className="flex items-center gap-2 text-sm sm:text-base">
              <Building className="h-4 w-4 sm:h-5 sm:w-5" />
              Rendimiento por Propiedad
            </CardTitle>
            <CardDescription className="text-xs sm:text-sm">
              Vistas de cada propiedad
            </CardDescription>
          </CardHeader>
          <CardContent className="px-3 pb-3 sm:px-6 sm:pb-6">
            <div className="space-y-3 sm:space-y-4">
              {properties.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-4">
                  No hay propiedades para mostrar
                </p>
              ) : (
                properties.slice(0, 5).map((property) => {
                  const percentage = stats?.totalViews 
                    ? ((property.views || 0) / stats.totalViews) * 100 
                    : 0;
                  
                  return (
                    <div key={property.id} className="space-y-2">
                      <div className="flex items-center justify-between text-sm">
                        <span className="font-medium truncate max-w-[200px]">
                          {property.title}
                        </span>
                        <span className="text-muted-foreground">
                          {property.views || 0} vistas
                        </span>
                      </div>
                      <div className="h-2 bg-muted rounded-full overflow-hidden">
                        <div
                          className="h-full bg-primary rounded-full transition-all"
                          style={{ width: `${percentage}%` }}
                        />
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Additional Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <Card>
          <CardHeader className="px-3 pt-3 pb-1">
            <CardTitle className="flex items-center gap-2 text-sm">
              <Building className="h-3.5 w-3.5 shrink-0" />
              <span className="truncate">Propiedades Publicadas</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="px-3 pb-3">
            <div className="text-xl sm:text-2xl font-bold">{stats?.activeProperties || 0}</div>
            <p className="text-xs text-muted-foreground mt-0.5">
              Disponibles para alquiler
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="px-3 pt-3 pb-1">
            <CardTitle className="flex items-center gap-2 text-sm">
              <Building className="h-3.5 w-3.5 text-blue-600 shrink-0" />
              <span className="truncate">Alquiladas/Vendidas</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="px-3 pb-3">
            <div className="text-xl sm:text-2xl font-bold text-blue-600">{stats?.rentedProperties || 0}</div>
            <p className="text-xs text-muted-foreground mt-0.5">
              Transacciones completadas
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="px-3 pt-3 pb-1">
            <CardTitle className="flex items-center gap-2 text-sm">
              <Calendar className="h-3.5 w-3.5 shrink-0" />
              Tiempo Promedio
            </CardTitle>
          </CardHeader>
          <CardContent className="px-3 pb-3">
            <div className="text-xl sm:text-2xl font-bold">15 días</div>
            <p className="text-xs text-muted-foreground mt-0.5">
              Para alquilar una propiedad
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default memo(StatsSection);
