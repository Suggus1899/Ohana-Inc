import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, Legend,
  LineChart, Line,
} from "recharts";
import {
  Activity, Clock, Search, MousePointerClick, Eye, TrendingUp,
  Users, Calendar, Loader2, Brain,
} from "lucide-react";
import { api } from "@/services/api";
import { toast } from "sonner";

// ─── Types ────────────────────────────────────────────────────────────────────

interface BehaviorSummary {
  topSearches: Array<{ term: string; count: number }>;
  averageSessionDurationSeconds: number;
  topZones: Array<{ zone: string; count: number }>;
  eventDistribution: Array<{ eventType: string; count: number; percentage: number }>;
  generatedAt: string;
}

interface TrendingData {
  trending: Array<{ term: string; count: number }>;
  month: string;
}

interface FrequencyData {
  frequency: Array<{ date: string; sessions: number }>;
  days: number;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

const EVENT_COLORS: Record<string, string> = {
  CLICK: "#3b82f6",
  SEARCH: "#8b5cf6",
  VIEW: "#10b981",
  SCROLL_LIMIT: "#f59e0b",
};

const EVENT_LABELS: Record<string, string> = {
  CLICK: "Clicks",
  SEARCH: "Búsquedas",
  VIEW: "Visualizaciones",
  SCROLL_LIMIT: "Scroll Límite",
};

const EVENT_ICONS: Record<string, React.ReactNode> = {
  CLICK: <MousePointerClick className="h-4 w-4" />,
  SEARCH: <Search className="h-4 w-4" />,
  VIEW: <Eye className="h-4 w-4" />,
  SCROLL_LIMIT: <Activity className="h-4 w-4" />,
};

function formatDuration(seconds: number): string {
  if (seconds < 60) return `${Math.round(seconds)}s`;
  const m = Math.floor(seconds / 60);
  const s = Math.round(seconds % 60);
  return `${m} min${s > 0 ? `, ${s}s` : ""}`;
}

// ─── Sub-components ───────────────────────────────────────────────────────────

const StatCard = ({
  icon,
  label,
  value,
  sub,
  color,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  sub?: string;
  color: string;
}) => (
  <Card className="border-none shadow-sm">
    <CardContent className="p-5">
      <div className="flex items-center gap-4">
        <div className={`p-3 rounded-xl ${color}`}>{icon}</div>
        <div>
          <p className="text-2xl font-bold tracking-tight">{value}</p>
          <p className="text-sm text-muted-foreground font-medium">{label}</p>
          {sub && <p className="text-xs text-muted-foreground mt-0.5">{sub}</p>}
        </div>
      </div>
    </CardContent>
  </Card>
);

// ─── Main Component ───────────────────────────────────────────────────────────

const HumanBehaviorSection = () => {
  const [isLoading, setIsLoading] = useState(true);
  const [days, setDays] = useState("30");
  const [summary, setSummary] = useState<BehaviorSummary | null>(null);
  const [trending, setTrending] = useState<TrendingData | null>(null);
  const [frequency, setFrequency] = useState<FrequencyData | null>(null);

  const fetchAll = async () => {
    setIsLoading(true);
    try {
      const [sumRes, trendRes, freqRes] = await Promise.all([
        api.getBehaviorSummary(),
        api.getTrendingSearches(),
        api.getSessionFrequency(Number(days)),
      ]);

      if (sumRes.success && sumRes.data) setSummary(sumRes.data);
      else toast.error("No se pudo cargar el resumen de comportamiento");

      if (trendRes.success && trendRes.data) setTrending(trendRes.data);
      if (freqRes.success && freqRes.data) setFrequency(freqRes.data);
    } catch {
      toast.error("Error al cargar métricas de comportamiento");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchAll();
  }, [days]);

  // ── Derived values ──────────────────────────────────────────────────────────
  const totalEvents = summary?.eventDistribution.reduce((acc, e) => acc + e.count, 0) ?? 0;

  const pieData = (summary?.eventDistribution ?? []).map((e) => ({
    name: EVENT_LABELS[e.eventType] ?? e.eventType,
    value: e.count,
    color: EVENT_COLORS[e.eventType] ?? "#94a3b8",
  }));

  const topSearchesToday = summary?.topSearches ?? [];
  const trendingList = trending?.trending ?? [];

  const freqData = (frequency?.frequency ?? []).map((f) => ({
    date: new Date(f.date).toLocaleDateString("es-VE", { month: "short", day: "numeric" }),
    sesiones: f.sessions,
  }));

  // ── Render ──────────────────────────────────────────────────────────────────
  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-primary/40" />
      </div>
    );
  }

  return (
    <div className="space-y-6 pb-10">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold flex items-center gap-2">
            <Brain className="h-7 w-7 text-violet-600" />
            Comportamiento Humano
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            Análisis del comportamiento real de los clientes en la plataforma
          </p>
        </div>
        <Select value={days} onValueChange={setDays}>
          <SelectTrigger className="w-40">
            <Calendar className="h-4 w-4 mr-2" />
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="7">Últimos 7 días</SelectItem>
            <SelectItem value="30">Últimos 30 días</SelectItem>
            <SelectItem value="60">Últimos 60 días</SelectItem>
            <SelectItem value="90">Últimos 90 días</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* KPI Cards */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          icon={<Clock className="h-6 w-6 text-blue-600" />}
          label="Tiempo Promedio de Uso"
          value={formatDuration(summary?.averageSessionDurationSeconds ?? 0)}
          sub="por sesión de usuario"
          color="bg-blue-50"
        />
        <StatCard
          icon={<Activity className="h-6 w-6 text-violet-600" />}
          label="Total de Eventos"
          value={totalEvents.toLocaleString()}
          sub="hoy en la plataforma"
          color="bg-violet-50"
        />
        <StatCard
          icon={<Search className="h-6 w-6 text-emerald-600" />}
          label="Búsquedas Hoy"
          value={(summary?.topSearches.reduce((a, s) => a + s.count, 0) ?? 0).toLocaleString()}
          sub="términos únicos rastreados"
          color="bg-emerald-50"
        />
        <StatCard
          icon={<Users className="h-6 w-6 text-amber-600" />}
          label="Sesiones del Período"
          value={(frequency?.frequency.reduce((a, f) => a + f.sessions, 0) ?? 0).toLocaleString()}
          sub={`últimos ${days} días`}
          color="bg-amber-50"
        />
      </div>

      {/* Row 1: Distribución de eventos + Top búsquedas hoy */}
      <div className="grid gap-6 lg:grid-cols-2">
        {/* Distribución de eventos — Pie */}
        <Card className="border-none shadow-lg">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <Activity className="h-5 w-5 text-violet-500" />
              Distribución de Eventos
            </CardTitle>
            <CardDescription>Proporción de tipos de interacción registrados hoy</CardDescription>
          </CardHeader>
          <CardContent>
            {pieData.length === 0 ? (
              <div className="flex items-center justify-center h-48 text-muted-foreground text-sm">
                Sin datos de eventos aún
              </div>
            ) : (
              <div className="flex flex-col sm:flex-row items-center gap-4">
                <ResponsiveContainer width={200} height={200}>
                  <PieChart>
                    <Pie
                      data={pieData}
                      cx="50%"
                      cy="50%"
                      innerRadius={55}
                      outerRadius={85}
                      paddingAngle={3}
                      dataKey="value"
                    >
                      {pieData.map((entry, i) => (
                        <Cell key={i} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip
                      formatter={(value: number) => [`${value} eventos`, ""]}
                      contentStyle={{ borderRadius: 8, border: "none", boxShadow: "0 4px 6px -1px rgb(0 0 0 / 0.1)" }}
                    />
                  </PieChart>
                </ResponsiveContainer>
                <div className="flex flex-col gap-2 flex-1">
                  {pieData.map((entry) => (
                    <div key={entry.name} className="flex items-center justify-between gap-3">
                      <div className="flex items-center gap-2">
                        <div className="w-3 h-3 rounded-full flex-shrink-0" style={{ background: entry.color }} />
                        <span className="text-sm font-medium">{entry.name}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-bold">{entry.value.toLocaleString()}</span>
                        <Badge variant="outline" className="text-xs">
                          {totalEvents > 0 ? Math.round((entry.value / totalEvents) * 100) : 0}%
                        </Badge>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Top búsquedas hoy — Bar */}
        <Card className="border-none shadow-lg">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <Search className="h-5 w-5 text-emerald-500" />
              Top Búsquedas de Hoy
            </CardTitle>
            <CardDescription>Términos más buscados en las últimas 24 horas</CardDescription>
          </CardHeader>
          <CardContent>
            {topSearchesToday.length === 0 ? (
              <div className="flex items-center justify-center h-48 text-muted-foreground text-sm">
                Sin búsquedas registradas hoy
              </div>
            ) : (
              <ResponsiveContainer width="100%" height={220}>
                <BarChart data={topSearchesToday} layout="vertical" margin={{ left: 8, right: 16 }}>
                  <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#f1f5f9" />
                  <XAxis type="number" axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: "#64748b" }} />
                  <YAxis
                    type="category"
                    dataKey="term"
                    width={130}
                    axisLine={false}
                    tickLine={false}
                    tick={{ fontSize: 11, fill: "#374151" }}
                  />
                  <Tooltip
                    formatter={(v: number) => [`${v} búsquedas`, "Cantidad"]}
                    contentStyle={{ borderRadius: 8, border: "none", boxShadow: "0 4px 6px -1px rgb(0 0 0 / 0.1)" }}
                  />
                  <Bar dataKey="count" fill="#10b981" radius={[0, 6, 6, 0]} barSize={18} />
                </BarChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Row 2: Frecuencia de sesiones (LineChart) */}
      <Card className="border-none shadow-lg">
        <CardHeader>
          <div className="flex items-center justify-between flex-wrap gap-2">
            <div>
              <CardTitle className="flex items-center gap-2 text-base">
                <TrendingUp className="h-5 w-5 text-blue-500" />
                Frecuencia de Conexión
              </CardTitle>
              <CardDescription>Sesiones nuevas por día en los últimos {days} días</CardDescription>
            </div>
            {freqData.length > 0 && (
              <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-100">
                {frequency?.frequency.reduce((a, f) => a + f.sessions, 0) ?? 0} sesiones totales
              </Badge>
            )}
          </div>
        </CardHeader>
        <CardContent>
          {freqData.length === 0 ? (
            <div className="flex items-center justify-center h-48 text-muted-foreground text-sm">
              Sin datos de sesiones para este período
            </div>
          ) : (
            <ResponsiveContainer width="100%" height={260}>
              <LineChart data={freqData} margin={{ top: 8, right: 16, left: 0, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis
                  dataKey="date"
                  axisLine={false}
                  tickLine={false}
                  tick={{ fontSize: 11, fill: "#64748b" }}
                  interval={Math.floor(freqData.length / 8)}
                />
                <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: "#64748b" }} />
                <Tooltip
                  formatter={(v: number) => [`${v} sesiones`, "Sesiones"]}
                  contentStyle={{ borderRadius: 8, border: "none", boxShadow: "0 4px 6px -1px rgb(0 0 0 / 0.1)" }}
                />
                <Line
                  type="monotone"
                  dataKey="sesiones"
                  stroke="#3b82f6"
                  strokeWidth={2.5}
                  dot={false}
                  activeDot={{ r: 5, fill: "#3b82f6" }}
                />
              </LineChart>
            </ResponsiveContainer>
          )}
        </CardContent>
      </Card>

      {/* Row 3: Trending searches del mes */}
      <Card className="border-none shadow-lg">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <TrendingUp className="h-5 w-5 text-violet-500" />
            Trending Searches del Mes
          </CardTitle>
          <CardDescription>
            Términos más buscados en {trending?.month ?? "este mes"} — lo que realmente busca la gente
          </CardDescription>
        </CardHeader>
        <CardContent>
          {trendingList.length === 0 ? (
            <div className="flex items-center justify-center h-24 text-muted-foreground text-sm">
              Sin búsquedas registradas este mes
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b">
                    <th className="text-left py-2 px-3 text-muted-foreground font-medium w-10">#</th>
                    <th className="text-left py-2 px-3 text-muted-foreground font-medium">Término</th>
                    <th className="text-right py-2 px-3 text-muted-foreground font-medium">Búsquedas</th>
                    <th className="text-right py-2 px-3 text-muted-foreground font-medium w-32">Popularidad</th>
                  </tr>
                </thead>
                <tbody>
                  {trendingList.map((item, i) => {
                    const max = trendingList[0]?.count ?? 1;
                    const pct = Math.round((item.count / max) * 100);
                    return (
                      <tr key={item.term} className="border-b last:border-0 hover:bg-muted/30 transition-colors">
                        <td className="py-2.5 px-3 text-muted-foreground font-mono">{i + 1}</td>
                        <td className="py-2.5 px-3 font-medium">{item.term}</td>
                        <td className="py-2.5 px-3 text-right font-bold">{item.count.toLocaleString()}</td>
                        <td className="py-2.5 px-3">
                          <div className="flex items-center justify-end gap-2">
                            <div className="w-20 h-2 bg-muted rounded-full overflow-hidden">
                              <div
                                className="h-full bg-violet-500 rounded-full"
                                style={{ width: `${pct}%` }}
                              />
                            </div>
                            <span className="text-xs text-muted-foreground w-8 text-right">{pct}%</span>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Row 4: Top zonas de clicks */}
      {(summary?.topZones ?? []).length > 0 && (
        <Card className="border-none shadow-lg">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <MousePointerClick className="h-5 w-5 text-amber-500" />
              Zonas con Más Clicks
            </CardTitle>
            <CardDescription>Áreas de la plataforma con mayor interacción</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {(summary?.topZones ?? []).map((zone, i) => {
                const max = summary!.topZones[0]?.count ?? 1;
                const pct = Math.round((zone.count / max) * 100);
                return (
                  <div key={zone.zone} className="flex items-center gap-3">
                    <span className="text-xs text-muted-foreground font-mono w-5">{i + 1}</span>
                    <span className="text-sm font-medium w-32 truncate">{zone.zone}</span>
                    <div className="flex-1 h-2.5 bg-muted rounded-full overflow-hidden">
                      <div
                        className="h-full bg-amber-400 rounded-full transition-all"
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                    <span className="text-sm font-bold w-12 text-right">{zone.count}</span>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default HumanBehaviorSection;
