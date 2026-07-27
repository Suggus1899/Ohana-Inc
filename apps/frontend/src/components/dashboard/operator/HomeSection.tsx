import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  ClipboardList,
  CheckSquare,
  AlertCircle,
  MessageSquare,
  ShieldCheck,
  Building,
  UserPlus,
  Loader2,
  BarChart3,
  Search
} from "lucide-react";
import { useState, useEffect } from "react";
import { api, ModerationStats, Property, User as ApiUser, AnalyticsDashboard, ConversionStats } from "@/services/api";
import { useAuth } from "@/contexts/AuthContext";
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  Cell
} from 'recharts';

interface RecentAction {
  id: string;
  type: 'property' | 'user';
  title: string;
  status: string;
  date: Date;
  icon: React.ComponentType<{ className?: string }>; // Using a generic component type for icon components to avoid type conflicts with LucideIcon/ElementType
}

interface HomeSectionProps {
  onNavigate?: (section: string) => void;
}

const HomeSection = ({ onNavigate }: HomeSectionProps) => {
  const { user } = useAuth();
  const [stats, setStats] = useState<ModerationStats | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [_recentActions, setRecentActions] = useState<RecentAction[]>([]);
  const [analytics, setAnalytics] = useState<AnalyticsDashboard | null>(null);
  const [todayAnalytics, setTodayAnalytics] = useState<AnalyticsDashboard | null>(null);
  const [conversion, setConversion] = useState<ConversionStats | null>(null);

  const fetchData = async () => {
    setIsLoading(true);
    try {
      const [statsRes, userRes, analyticsRes, todayRes, conversionRes] = await Promise.all([
        api.getModerationStats(),
        api.getCurrentUser(),
        api.getAnalyticsDashboard('30d'),
        api.getAnalyticsDashboard('today'),
        api.getConversionStats()
      ]);

      if (statsRes.success && statsRes.data) {
        setStats(statsRes.data);
      }

      if (analyticsRes.success && analyticsRes.data) {
        setAnalytics(analyticsRes.data);
      }

      if (todayRes.success && todayRes.data) {
        setTodayAnalytics(todayRes.data);
      }

      if (conversionRes.success && conversionRes.data) {
        setConversion(conversionRes.data);
      }

      if (userRes.success && userRes.data) {
        const userId = userRes.data.user.id;
        const [propRes, usersRes] = await Promise.all([
          api.getProperties({ moderatorId: userId }),
          api.getUsers({ verifiedById: userId })
        ]);

        const actions = [
          ...(propRes.success && propRes.data ? propRes.data.properties.map((p: Property) => ({
            id: `p-${p.id}`,
            type: 'property',
            title: p.title,
            status: p.status,
            date: new Date(p.updatedAt),
            icon: Building
          })) : []),
          ...(usersRes.success && usersRes.data ? usersRes.data.users.map((u: ApiUser) => ({
            id: `u-${u.id}`,
            type: 'user',
            title: u.name,
            status: u.isVerified ? 'approved' : 'pending',
            date: new Date(u.updatedAt),
            icon: UserPlus
          })) : [])
        ].sort((a, b) => b.date.getTime() - a.date.getTime()).slice(0, 5);

        setRecentActions(actions as RecentAction[]);
      }
    } catch (error) {
      console.error("Error fetching dashboard data:", error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const hourlyData = (todayAnalytics?.hourlyActivity ?? analytics?.hourlyActivity ?? []).map((h: Record<string, unknown>) => ({
    name: `${h.hour}:00`,
    valor: Number(h.activity ?? h.count ?? 0),
    fill: '#8b5cf6'
  }));

  const todayTotalActions = todayAnalytics?.totalActions ?? 0;

  const mainStats = [
    { 
      label: "Tareas Pendientes", 
      value: stats?.pending.tasks || 0, 
      icon: ClipboardList, 
      color: "text-blue-600", 
      bg: "bg-blue-50" 
    },
    { 
      label: "Acciones Hoy", 
      value: todayTotalActions, 
      icon: CheckSquare, 
      color: "text-emerald-600", 
      bg: "bg-emerald-50" 
    },
    { 
      label: "Tasa Conversión", 
      value: conversion?.conversionRate || "0%", 
      icon: BarChart3, 
      color: "text-indigo-600", 
      bg: "bg-indigo-50" 
    },
    { 
      label: "Tickets Soporte", 
      value: stats?.pending.tickets || 0, 
      icon: MessageSquare, 
      color: "text-purple-600", 
      bg: "bg-purple-50" 
    },
  ];

  return (
    <div className="space-y-6 pb-10">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold font-heading">Panel Operativo</h1>
          <p className="text-muted-foreground mt-1">
            Resumen de actividad y métricas de comportamiento de <span className="text-zinc-900 font-semibold">{user?.name}</span>.
          </p>
        </div>
      </div>

      {/* Main Stats */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {mainStats.map((stat) => {
          const Icon = stat.icon;
          return (
            <Card key={stat.label} className="border-none shadow-sm hover:shadow-md transition-shadow">
              <CardContent className="p-6">
                <div className="flex items-center gap-4">
                  <div className={`p-3 rounded-xl ${stat.bg}`}>
                    <Icon className={`h-6 w-6 ${stat.color}`} />
                  </div>
                  <div>
                    <p className="text-2xl font-bold tracking-tight">{stat.value}</p>
                    <p className="text-sm text-muted-foreground font-medium">{stat.label}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      <div className="grid gap-6 lg:grid-cols-7">
        {/* Activity Chart */}
        <Card className="lg:col-span-4 border-none shadow-lg">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-lg flex items-center gap-2">
                  <BarChart3 className="h-5 w-5 text-zinc-500" />
                  Actividad de Usuarios (Hoy)
                </CardTitle>
                <CardDescription>Acciones de búsqueda, vistas y solicitudes por hora</CardDescription>
              </div>
              <div className="flex flex-col items-end">
                <Badge variant="outline" className="bg-indigo-50 text-indigo-700 border-indigo-100">
                  Uso Pico: {hourlyData.reduce((max: number, curr) => curr.valor > max ? curr.valor : max, 0)} acciones
                </Badge>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="h-[300px] w-full mt-4">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={hourlyData} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                  <XAxis 
                    dataKey="name" 
                    axisLine={false} 
                    tickLine={false} 
                    tick={{ fill: '#64748b', fontSize: 10 }} 
                  />
                  <YAxis 
                    axisLine={false} 
                    tickLine={false} 
                    tick={{ fill: '#64748b', fontSize: 12 }} 
                  />
                  <Tooltip 
                    cursor={{ fill: '#f8fafc' }}
                    contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                  />
                  <Bar dataKey="valor" radius={[6, 6, 0, 0]} barSize={20}>
                    {hourlyData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.fill} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        {/* Top Searches */}
        <Card className="lg:col-span-3 border-none shadow-lg">
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <Search className="h-5 w-5 text-zinc-500" />
              Tendencias de Búsqueda
            </CardTitle>
            <CardDescription>Lo que más buscan los estudiantes (30d)</CardDescription>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="flex justify-center py-10"><Loader2 className="h-6 w-6 animate-spin text-primary/40" /></div>
            ) : !analytics?.topSearchTerms?.length ? (
              <div className="text-center py-10 text-muted-foreground bg-zinc-50 rounded-xl italic text-xs">
                Sin datos de búsqueda suficientes
              </div>
            ) : (
              <div className="space-y-3">
                {analytics.topSearchTerms.map((s, idx: number) => (
                  <div key={idx} className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-bold text-zinc-400">#{idx+1}</span>
                      <span className="text-sm font-medium">{s.query || "Búsqueda vacía"}</span>
                    </div>
                    <Badge variant="outline" className="text-[10px] bg-zinc-50">{s.count} veces</Badge>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Acciones Rápidas */}
      <div className="space-y-4">
        <h3 className="text-lg font-bold flex items-center gap-2 pl-1">
          <ShieldCheck className="h-5 w-5 text-emerald-600" />
          Acceso Rápido
        </h3>
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <Card className="hover:border-emerald-200 hover:bg-emerald-50/10 cursor-pointer transition-all border shadow-sm group" onClick={() => onNavigate?.('reviews')}>
            <CardContent className="p-6 flex flex-col items-center text-center gap-3">
              <div className="p-4 rounded-full bg-emerald-50 text-emerald-600 group-hover:scale-110 transition-transform">
                <Building className="h-6 w-6" />
              </div>
              <div>
                <p className="font-bold">Verificar Propiedad</p>
                <p className="text-xs text-muted-foreground mt-1">Nuevas publicaciones</p>
              </div>
            </CardContent>
          </Card>

          <Card className="hover:border-blue-200 hover:bg-blue-50/10 cursor-pointer transition-all border shadow-sm group" onClick={() => onNavigate?.('verifications')}>
            <CardContent className="p-6 flex flex-col items-center text-center gap-3">
              <div className="p-4 rounded-full bg-blue-50 text-blue-600 group-hover:scale-110 transition-transform">
                <UserPlus className="h-6 w-6" />
              </div>
              <div>
                <p className="font-bold">Validar Usuarios</p>
                <p className="text-xs text-muted-foreground mt-1">Revisión de identidades</p>
              </div>
            </CardContent>
          </Card>

          <Card className="hover:border-purple-200 hover:bg-purple-50/10 cursor-pointer transition-all border shadow-sm group" onClick={() => onNavigate?.('support')}>
            <CardContent className="p-6 flex flex-col items-center text-center gap-3">
              <div className="p-4 rounded-full bg-purple-50 text-purple-600 group-hover:scale-110 transition-transform">
                <MessageSquare className="h-6 w-6" />
              </div>
              <div>
                <p className="font-bold">Atender Tickets</p>
                <p className="text-xs text-muted-foreground mt-1">Soporte técnico activo</p>
              </div>
            </CardContent>
          </Card>

          <Card className="hover:border-amber-200 hover:bg-amber-50/10 cursor-pointer transition-all border shadow-sm group" onClick={() => onNavigate?.('reports')}>
            <CardContent className="p-6 flex flex-col items-center text-center gap-3">
              <div className="p-4 rounded-full bg-amber-50 text-amber-600 group-hover:scale-110 transition-transform">
                <AlertCircle className="h-6 w-6" />
              </div>
              <div>
                <p className="font-bold">Ver Reportes</p>
                <p className="text-xs text-muted-foreground mt-1">Denuncias de usuarios</p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default HomeSection;
