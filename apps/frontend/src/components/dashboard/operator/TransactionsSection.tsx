import { useState, useEffect, useCallback } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { ArrowLeftRight, Search, Loader2, RefreshCw, DollarSign, Eye, RotateCcw, BadgeCheck } from "lucide-react";
import { getAllTransactions, refundTransaction } from "@/services/transaction.service";
import { Transaction, TransactionStatus } from "@/types/transaction.types";
import { toast } from "sonner";

const STATUS_LABELS: Record<string, string> = {
  pending_owner_approval: 'Pendiente',
  pending_payment: 'Por Pagar',
  payment_submitted: 'Pago Enviado',
  payment_confirmed: 'Pago Confirmado',
  completed: 'Completada',
  cancelled: 'Cancelada',
  rejected: 'Rechazada',
  disputed: 'En Disputa',
  refunded: 'Reembolsada',
  expired: 'Expirada',
};

const STATUS_COLORS: Record<string, string> = {
  pending_owner_approval: 'bg-yellow-100 text-yellow-800',
  pending_payment: 'bg-blue-100 text-blue-800',
  payment_submitted: 'bg-purple-100 text-purple-800',
  payment_confirmed: 'bg-green-100 text-green-800',
  completed: 'bg-green-200 text-green-900',
  cancelled: 'bg-gray-100 text-gray-800',
  rejected: 'bg-red-100 text-red-800',
  disputed: 'bg-orange-100 text-orange-800',
  refunded: 'bg-indigo-100 text-indigo-800',
  expired: 'bg-gray-100 text-gray-600',
};

const TransactionsSection = () => {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [pagination, setPagination] = useState({ total: 0, page: 1, limit: 20, totalPages: 1 });
  const [isLoading, setIsLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [page, setPage] = useState(1);
  const [refundDialog, setRefundDialog] = useState<{ open: boolean; tx: Transaction | null }>({ open: false, tx: null });
  const [refundReason, setRefundReason] = useState("");
  const [isProcessing, setIsProcessing] = useState<number | null>(null);

  const fetchTransactions = useCallback(async () => {
    setIsLoading(true);
    try {
      const filters: any = { page, limit: 20 };
      if (statusFilter !== "all") filters.status = statusFilter;
      const res = await getAllTransactions(filters);
      let data = res.transactions;
      if (search.trim()) {
        const q = search.trim().toLowerCase();
        data = data.filter((t: Transaction) =>
          t.property?.title?.toLowerCase().includes(q) ||
          t.client?.name?.toLowerCase().includes(q) ||
          t.owner?.name?.toLowerCase().includes(q)
        );
      }
      setTransactions(data);
      setPagination(res.pagination);
    } catch (error: any) {
      toast.error(error.message || "Error al cargar transacciones");
    } finally {
      setIsLoading(false);
    }
  }, [page, statusFilter, search]);

  useEffect(() => { fetchTransactions(); }, [fetchTransactions]);

  const handleRefund = async () => {
    if (!refundDialog.tx || !refundReason.trim()) return;
    setIsProcessing(refundDialog.tx.id);
    try {
      await refundTransaction(refundDialog.tx.id, refundReason.trim());
      toast.success("Transacción reembolsada correctamente");
      setRefundDialog({ open: false, tx: null });
      setRefundReason("");
      fetchTransactions();
    } catch (error: any) {
      toast.error(error.message || "Error al reembolsar");
    } finally {
      setIsProcessing(null);
    }
  };

  const canRefund = (status: string) =>
    ['payment_submitted', 'payment_confirmed', 'completed', 'disputed'].includes(status);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-2">
            <ArrowLeftRight className="h-7 w-7" />
            Transacciones
          </h1>
          <p className="text-muted-foreground mt-1">Gestiona todas las transacciones de la plataforma</p>
        </div>
        <Button variant="outline" size="sm" onClick={fetchTransactions} disabled={isLoading}>
          <RefreshCw className={`h-4 w-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
          Actualizar
        </Button>
      </div>

      {/* Filters */}
      <div className="flex flex-col md:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Buscar por propiedad, cliente o propietario..."
            className="pl-9"
            value={search}
            onChange={e => { setSearch(e.target.value); setPage(1); }}
          />
        </div>
        <Select value={statusFilter} onValueChange={v => { setStatusFilter(v); setPage(1); }}>
          <SelectTrigger className="w-48">
            <SelectValue placeholder="Estado" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos los estados</SelectItem>
            {Object.entries(STATUS_LABELS).map(([key, label]) => (
              <SelectItem key={key} value={key}>{label}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Stats */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card><CardHeader className="pb-2"><CardTitle className="text-sm font-medium text-muted-foreground">Total</CardTitle></CardHeader><CardContent><div className="text-2xl font-bold">{pagination.total}</div></CardContent></Card>
        <Card><CardHeader className="pb-2"><CardTitle className="text-sm font-medium text-muted-foreground">Pendientes</CardTitle></CardHeader><CardContent><div className="text-2xl font-bold text-yellow-600">{transactions.filter(t => t.status === 'pending_owner_approval').length}</div></CardContent></Card>
        <Card><CardHeader className="pb-2"><CardTitle className="text-sm font-medium text-muted-foreground">En Proceso</CardTitle></CardHeader><CardContent><div className="text-2xl font-bold text-blue-600">{transactions.filter(t => ['pending_payment', 'payment_submitted'].includes(t.status)).length}</div></CardContent></Card>
        <Card><CardHeader className="pb-2"><CardTitle className="text-sm font-medium text-muted-foreground">Completadas</CardTitle></CardHeader><CardContent><div className="text-2xl font-bold text-green-600">{transactions.filter(t => ['payment_confirmed', 'completed'].includes(t.status)).length}</div></CardContent></Card>
      </div>

      {/* Table */}
      <Card>
        <CardHeader>
          <CardTitle>Listado de Transacciones</CardTitle>
          <CardDescription>{pagination.total} transacciones en total</CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex flex-col items-center justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-primary mb-3" />
              <p className="text-muted-foreground">Cargando transacciones...</p>
            </div>
          ) : transactions.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12">
              <ArrowLeftRight className="h-12 w-12 text-muted-foreground/50 mb-4" />
              <h3 className="text-lg font-medium mb-2">No hay transacciones</h3>
              <p className="text-muted-foreground text-center">No se encontraron transacciones con los filtros aplicados</p>
            </div>
          ) : (
            <div className="space-y-4">
              {transactions.map((tx) => (
                <div key={tx.id} className="flex flex-col lg:flex-row lg:items-center justify-between p-4 rounded-lg border gap-4 hover:bg-muted/30 transition-colors">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <h4 className="font-medium">{tx.property?.title || `Propiedad #${tx.propertyId}`}</h4>
                      <Badge className={`${STATUS_COLORS[tx.status] || 'bg-gray-100'}`}>
                        {STATUS_LABELS[tx.status] || tx.status}
                      </Badge>
                    </div>
                    <div className="flex flex-wrap items-center gap-4 text-sm text-muted-foreground">
                      <span className="flex items-center gap-1"><DollarSign className="h-3 w-3" />${Number(tx.amount).toLocaleString()} {tx.currency}</span>
                      <span>Cliente: {tx.client?.name || `#${tx.clientId}`}{tx.client?.isVerified && <BadgeCheck className="h-4 w-4 text-blue-500 inline ml-1" />}</span>
                      <span>Propietario: {tx.owner?.name || `#${tx.ownerId}`}{tx.owner?.isVerified && <BadgeCheck className="h-4 w-4 text-blue-500 inline ml-1" />}</span>
                      <span>{new Date(tx.createdAt).toLocaleDateString()}</span>
                    </div>
                    {tx.paymentMethod && (
                      <p className="text-xs text-muted-foreground mt-1">
                        Método: {tx.paymentMethod} | Ref: {tx.paymentReference || 'N/A'}
                      </p>
                    )}
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    {canRefund(tx.status) && (
                      <Button
                        variant="outline"
                        size="sm"
                        className="text-indigo-600 border-indigo-200 hover:bg-indigo-50"
                        onClick={() => setRefundDialog({ open: true, tx })}
                        disabled={isProcessing === tx.id}
                      >
                        <RotateCcw className="h-4 w-4 mr-1" />
                        Reembolsar
                      </Button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Pagination */}
          {pagination.totalPages > 1 && (
            <div className="flex items-center justify-between mt-6 pt-4 border-t">
              <p className="text-sm text-muted-foreground">
                Página {pagination.page} de {pagination.totalPages} — {pagination.total} transacciones
              </p>
              <div className="flex gap-2">
                <Button variant="outline" size="sm" disabled={page <= 1} onClick={() => setPage(p => p - 1)}>Anterior</Button>
                <Button variant="outline" size="sm" disabled={page >= pagination.totalPages} onClick={() => setPage(p => p + 1)}>Siguiente</Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Refund dialog */}
      <Dialog open={refundDialog.open} onOpenChange={open => { if (!open) { setRefundDialog({ open: false, tx: null }); setRefundReason(""); } }}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Reembolsar transacción</DialogTitle>
            <DialogDescription>
              Reembolsar <span className="font-medium">{refundDialog.tx?.property?.title || `Transacción #${refundDialog.tx?.id}`}</span> por <span className="font-medium">${Number(refundDialog.tx?.amount).toLocaleString()}</span>
            </DialogDescription>
          </DialogHeader>
          <Input
            placeholder="Motivo del reembolso..."
            value={refundReason}
            onChange={e => setRefundReason(e.target.value)}
          />
          <DialogFooter>
            <Button variant="outline" onClick={() => { setRefundDialog({ open: false, tx: null }); setRefundReason(""); }}>Cancelar</Button>
            <Button variant="destructive" onClick={handleRefund} disabled={!refundReason.trim() || isProcessing !== null}>
              {isProcessing !== null ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <RotateCcw className="h-4 w-4 mr-2" />}
              Reembolsar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default TransactionsSection;
