import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Tooltip,
  ResponsiveContainer,
  Cell,
  PieChart,
  Pie
} from 'recharts';
import { api, AnalyticsDashboard, ConversionStats } from "@/services/api";
import {
  TrendingUp,
  Building,
  MousePointer2,
  Search,
  Activity,
  Loader2
} from "lucide-react";

const COLORS = ['#8b5cf6', '#a78bfa', '#c4b5fd', '#ddd6fe', '#ede9fe'];

const AnalyticsDetailsSection = () => {
  const [analytics, setAnalytics] = useState<AnalyticsDashboard | null>(null);
  const [conversion, setConversion] = useState<ConversionStats | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      setIsLoading(true);
      const [analyticsRes, conversionRes] = await Promise.all([
        api.getAnalyticsDashboard(),
        api.getConversionStats()
      ]);

      if (analyticsRes.success && analyticsRes.data) setAnalytics(analyticsRes.data);
      if (conversionRes.success && conversionRes.data) setConversion(conversionRes.data);
      setIsLoading(false);
    };
    fetchData();
  }, []);

  const typeData = analytics?.actionsByType.map(a => ({
    name: a.action,
    value: a.count
  })) || [];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold font-heading">Analíticas de la Plataforma</h1>
        <p className="text-muted-foreground mt-1">Análisis detallado de comportamiento y KPIs del sistema</p>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {[
          { label: "Vistas Totales", value: conversion?.views || 0, icon: MousePointer2 },
          { label: "Solicitudes", value: conversion?.requests || 0, icon: Building },
          { label: "Búsquedas", value: analytics?.totalActions || 0, icon: Search },
          { label: "Conversión", value: conversion?.conversionRate || "0%", icon: TrendingUp }
        ].map((stat, i) => (
          <Card key={i} className="border-none shadow-sm">
            <CardContent className="p-6">
              <div className="p-2 rounded-lg bg-zinc-50 w-fit">
                <stat.icon className="h-5 w-5 text-zinc-600" />
              </div>
              <div className="mt-4">
                <p className="text-2xl font-black">{stat.value}</p>
                <p className="text-xs text-muted-foreground font-medium uppercase tracking-wider">{stat.label}</p>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <Card className="border-none shadow-lg">
          <CardHeader>
            <CardTitle className="text-lg">Distribución de Acciones</CardTitle>
            <CardDescription>Eventos capturados durante los últimos 30 días</CardDescription>
          </CardHeader>
          <CardContent className="h-[300px]">
            {isLoading ? (
              <div className="flex items-center justify-center h-full"><Loader2 className="animate-spin" /></div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={typeData}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={80}
                    paddingAngle={5}
                    dataKey="value"
                  >
                    {typeData.map((_, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>

        <Card className="border-none shadow-lg">
          <CardHeader>
            <CardTitle className="text-lg">Propiedades más Populares</CardTitle>
            <CardDescription>Top 5 propiedades con mayor número de vistas</CardDescription>
          </CardHeader>
          <CardContent>
             <div className="space-y-4">
               {analytics?.topProperties.map((p, i) => (
                 <div key={i} className="flex items-center justify-between p-3 rounded-xl bg-zinc-50/50 border border-zinc-100">
                    <div className="flex items-center gap-3">
                      <div className="h-10 w-10 rounded-lg bg-white border flex items-center justify-center overflow-hidden">
                        {p.property.images?.[0] ? <img src={p.property.images[0]} alt="" className="object-cover h-full w-full" /> : <Building className="h-4 w-4 text-zinc-400" />}
                      </div>
                      <div className="flex flex-col">
                        <span className="text-sm font-bold truncate max-w-[150px]">{p.property.title}</span>
                        <span className="text-[10px] text-muted-foreground capitalize">{p.property.type}</span>
                      </div>
                    </div>
                    <div className="text-right">
                       <p className="text-sm font-black text-violet-600">{p.views}</p>
                       <p className="text-[9px] text-zinc-400 uppercase font-bold">Vistas</p>
                    </div>
                 </div>
               ))}
             </div>
          </CardContent>
        </Card>
      </div>

      {analytics?.topSearchTerms && analytics.topSearchTerms.length > 0 && (
        <Card className="border-none shadow-xl bg-zinc-900 text-white">
          <div className="p-8">
             <div className="flex items-center gap-2 mb-6">
                <Activity className="h-5 w-5 text-violet-400" />
                <h3 className="font-bold text-xl">Términos de Búsqueda Populares</h3>
             </div>
             <div className="space-y-3">
               {analytics.topSearchTerms.slice(0, 5).map((term, i) => (
                 <div key={i} className="flex items-center justify-between">
                   <span className="text-zinc-300">{term.query || 'Búsqueda vacía'}</span>
                   <span className="text-zinc-500 text-sm">{term.count} búsquedas</span>
                 </div>
               ))}
             </div>
          </div>
        </Card>
      )}
    </div>
  );
};

export default AnalyticsDetailsSection;
