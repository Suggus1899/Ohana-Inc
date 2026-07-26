import React, { useEffect, useState, useCallback } from 'react';
import { getMyTransactions } from '@/services/transaction.service';
import { Transaction, TransactionStatus, STATUS_LABELS, STATUS_COLORS } from '@/types/transaction.types';
import { useTransactionNotifications, TransactionNotification } from '@/hooks/useTransactionNotifications';
import TransactionDetails from './TransactionDetails';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { ERROR_TOAST, ERROR_MESSAGES } from '@/constants';
import { Loader2, ArrowRight, RefreshCw, BadgeCheck } from 'lucide-react';

interface TransactionPanelProps {
  currentUserId: number;
}

const FILTER_OPTIONS = [
  { value: 'all', label: 'Todas' },
  { value: TransactionStatus.PENDING_OWNER_APPROVAL, label: 'Pendientes' },
  { value: TransactionStatus.PENDING_PAYMENT, label: 'Por Pagar' },
  { value: TransactionStatus.PAYMENT_SUBMITTED, label: 'En Proceso' },
  { value: TransactionStatus.COMPLETED, label: 'Completadas' },
  { value: TransactionStatus.DISPUTED, label: 'En Disputa' },
];

const TransactionPanel: React.FC<TransactionPanelProps> = ({ currentUserId }) => {
  const { toast } = useToast();
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');
  const [selectedTransactionId, setSelectedTransactionId] = useState<number | null>(null);

  const loadTransactions = useCallback(async () => {
    try {
      setLoading(true);
      const filters = filter !== 'all' ? { status: filter } : {};
      const { transactions: data } = await getMyTransactions(filters);
      setTransactions(data);
    } catch (error: unknown) {
      console.error('Error loading transactions:', error);
      toast(ERROR_TOAST(ERROR_MESSAGES.LOAD_TRANSACTIONS));
    } finally {
      setLoading(false);
    }
  }, [filter, toast]);

  useEffect(() => {
    loadTransactions();
  }, [loadTransactions]);

  // Real-time notifications
  const handleNotification = useCallback((notification: TransactionNotification) => {
    toast({
      title: notification.title,
      description: notification.message,
      variant: notification.urgent ? 'destructive' : 'default',
    });
    // Refresh transactions list
    loadTransactions();
  }, [toast, loadTransactions]);

  useTransactionNotifications(handleNotification);

  if (selectedTransactionId) {
    return (
      <div className="space-y-6">
        <TransactionDetails
          transactionId={selectedTransactionId}
          currentUserId={currentUserId}
          open={true}
          onOpenChange={() => {}}
          inline
          onBack={() => setSelectedTransactionId(null)}
          onUpdate={loadTransactions}
        />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold">Mis Transacciones</h2>
        <Button variant="outline" size="sm" onClick={loadTransactions} disabled={loading}>
          <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
          Actualizar
        </Button>
      </div>

      {/* Filters */}
      <div className="flex gap-2 overflow-x-auto pb-2">
        {FILTER_OPTIONS.map((option) => (
          <Button
            key={option.value}
            variant={filter === option.value ? 'default' : 'outline'}
            size="sm"
            onClick={() => setFilter(option.value)}
            className="whitespace-nowrap"
          >
            {option.label}
          </Button>
        ))}
      </div>

      {/* Transactions List */}
      {loading ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-blue-500" />
        </div>
      ) : transactions.length === 0 ? (
        <Card>
          <CardContent className="flex items-center justify-center py-12">
            <p className="text-gray-500">No tienes transacciones{filter !== 'all' ? ' con este filtro' : ''}</p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {transactions.map((tx) => (
            <Card
              key={tx.id}
              className="cursor-pointer hover:shadow-md transition-shadow"
              onClick={() => setSelectedTransactionId(tx.id)}
            >
              <CardContent className="p-4">
                <div className="flex justify-between items-start mb-3">
                  <div className="flex-1 min-w-0">
                    <h3 className="font-semibold truncate">{tx.property?.title || `Propiedad #${tx.propertyId}`}</h3>
                    <p className="text-gray-500 text-sm truncate">{tx.property?.address}</p>
                  </div>
                  <Badge className={`ml-2 shrink-0 text-xs ${STATUS_COLORS[tx.status]}`}>
                    {STATUS_LABELS[tx.status]}
                  </Badge>
                </div>

                <div className="flex justify-between items-center">
                  <div>
                    <p className="text-lg font-bold text-blue-600">
                      ${Number(tx.amount).toLocaleString()} {tx.currency}
                    </p>
                    <p className="text-xs text-gray-400">
                      {new Date(tx.createdAt).toLocaleDateString()}
                    </p>
                  </div>
                  <div className="flex items-center text-blue-600 text-sm">
                    Ver Detalles <ArrowRight className="h-4 w-4 ml-1" />
                  </div>
                </div>

                {/* Counterparty info */}
                <div className="mt-2 pt-2 border-t text-xs text-gray-500">
                  {tx.ownerId === currentUserId ? (
                    <span>Cliente: {tx.client?.name || 'N/A'}{tx.client?.isVerified && <BadgeCheck className="h-4 w-4 text-blue-500 inline ml-1" />}</span>
                  ) : (
                    <span>Propietario: {tx.owner?.name || 'N/A'}{tx.owner?.isVerified && <BadgeCheck className="h-4 w-4 text-blue-500 inline ml-1" />}</span>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
};

export default TransactionPanel;
