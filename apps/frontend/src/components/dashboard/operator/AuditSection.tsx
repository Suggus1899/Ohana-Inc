import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { api, AuditLog } from "@/services/api";
import { 
  History, 
  Search, 
  Calendar, 
  Terminal, 
  User, 
  Activity,
  Globe,
  Monitor,
  Database,
  ArrowUpDown,
  Filter,
  Loader2
} from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

const AuditSection = () => {
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [pagination, setPagination] = useState({ total: 0, page: 1, limit: 20 });

  const fetchLogs = async (page = 1) => {
    setIsLoading(true);
    const response = await api.getAuditLogs({ search: searchQuery, page });
    if (response.success && response.data) {
      setLogs(response.data.logs);
      setPagination(response.data.pagination);
    }
    setIsLoading(false);
  };

  useEffect(() => {
    fetchLogs();
  }, []);

  const getActionColor = (action: string) => {
    const a = action.toLowerCase();
    if (a.includes('create') || a.includes('add')) return "text-green-600 bg-green-50 border-green-200";
    if (a.includes('delete') || a.includes('remove') || a.includes('block')) return "text-red-600 bg-red-50 border-red-200";
    if (a.includes('update') || a.includes('edit')) return "text-blue-600 bg-blue-50 border-blue-200";
    return "text-zinc-600 bg-zinc-50 border-zinc-200";
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold font-heading">Auditoría y Logs</h1>
          <p className="text-muted-foreground mt-1">
            Historial detallado de todas las acciones importantes en la plataforma
          </p>
        </div>
      </div>

      {/* Audit Filters */}
      <Card className="border-none shadow-sm">
        <CardHeader className="pb-4">
          <div className="flex flex-col md:flex-row items-center justify-between gap-4">
            <div className="relative w-full md:w-96">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input 
                placeholder="Filtrar por usuario, acción o entidad..." 
                className="pl-9 h-11 border-zinc-200"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && fetchLogs()}
              />
            </div>
            <div className="flex items-center gap-2">
              <Button variant="outline" size="sm" onClick={() => fetchLogs()}>
                <Filter className="h-4 w-4 mr-2" /> Más Filtros
              </Button>
              <Button size="sm" className="bg-zinc-900 border-none px-6" onClick={() => fetchLogs()} disabled={isLoading}>
                {isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : "Buscar"}
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="rounded-xl border overflow-hidden">
            <Table>
              <TableHeader className="bg-zinc-50/50">
                <TableRow>
                  <TableHead className="w-[180px]">Timestamp</TableHead>
                  <TableHead>Operador / Usuario</TableHead>
                  <TableHead>Acción</TableHead>
                  <TableHead>Entidad</TableHead>
                  <TableHead>Detalles</TableHead>
                  <TableHead className="text-right">Origen</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoading ? (
                  <TableRow>
                    <TableCell colSpan={6} className="h-48 text-center">
                      <div className="flex flex-col items-center justify-center gap-2 opacity-50">
                        <Loader2 className="h-8 w-8 animate-spin" />
                        <span className="text-sm font-medium">Sincronizando logs...</span>
                      </div>
                    </TableCell>
                  </TableRow>
                ) : logs.length === 0 ? (
                  <TableRow>
                     <TableCell colSpan={6} className="h-48 text-center text-muted-foreground italic">
                        No se han encontrado registros de auditoría bajo estos filtros.
                     </TableCell>
                  </TableRow>
                ) : (
                  logs.map((log) => (
                    <TableRow key={log.id} className="hover:bg-zinc-50/50 transition-colors">
                      <TableCell className="text-xs font-mono text-muted-foreground">
                        {new Date(log.timestamp).toLocaleString('es-CO', { 
                          day: '2-digit', 
                          month: '2-digit', 
                          hour: '2-digit', 
                          minute: '2-digit',
                          second: '2-digit'
                        })}
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <div className="h-7 w-7 rounded-full bg-zinc-100 flex items-center justify-center border">
                            <User className="h-3.5 w-3.5 text-zinc-600" />
                          </div>
                          <div className="flex flex-col">
                            <span className="text-sm font-semibold">{log.user?.name || "Sistema"}</span>
                            <span className="text-[10px] text-muted-foreground">{log.user?.email || "N/A"}</span>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline" className={`px-2 py-0 border capitalize font-normal ${getActionColor(log.action)}`}>
                          {log.action.replace(/_/g, ' ')}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1 text-xs">
                          <Database className="h-3 w-3 text-zinc-400" />
                          <span className="font-medium text-zinc-900 capitalize">{log.entity}</span>
                          <span className="text-zinc-400">#{log.entityId}</span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <p className="text-xs max-w-[200px] truncate text-muted-foreground hover:text-foreground transition-colors cursor-help" title={JSON.stringify(log.changes || {})}>
                          {log.changes ? JSON.stringify(log.changes) : "Sin cambios registrados"}
                        </p>
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex flex-col items-end gap-0.5">
                           <div className="flex items-center gap-1 text-[10px] text-muted-foreground">
                              <Globe className="h-2.5 w-2.5" />
                              {log.ipAddress}
                           </div>
                           <div className="flex items-center gap-1 text-[10px] text-muted-foreground max-w-[120px] truncate">
                              <Monitor className="h-2.5 w-2.5" />
                              {log.userAgent}
                           </div>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>

          <div className="flex items-center justify-between mt-6">
            <p className="text-xs text-muted-foreground">
              Mostrando logs <strong>{(pagination.page-1)*pagination.limit+1}</strong> al 
              <strong> {Math.min(pagination.page*pagination.limit, pagination.total)}</strong> de 
              <strong> {pagination.total}</strong> en total.
            </p>
            <div className="flex items-center gap-1">
              <Button 
                variant="outline" 
                size="sm" 
                disabled={pagination.page === 1 || isLoading}
                onClick={() => fetchLogs(pagination.page - 1)}
              >
                Anterior
              </Button>
              <div className="flex items-center px-4 text-xs font-bold text-zinc-600 bg-zinc-50 rounded-md border h-8">
                {pagination.page} / {pagination.totalPages}
              </div>
              <Button 
                variant="outline" 
                size="sm" 
                disabled={pagination.page === pagination.totalPages || isLoading}
                onClick={() => fetchLogs(pagination.page + 1)}
              >
                Siguiente
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default AuditSection;
