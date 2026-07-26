import React, { useState, useEffect, useCallback } from 'react';
import { Transaction, TransactionStatus, STATUS_LABELS, STATUS_COLORS, TimelineEvent } from '@/types/transaction.types';
import {
  getTransactionDetails,
  approveTransaction,
  rejectTransaction,
  confirmPayment,
  cancelTransaction,
} from '@/services/transaction.service';
import SubmitPaymentForm from './SubmitPaymentForm';
import CreateDisputeModal from '../disputes/CreateDisputeModal';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { useToast } from '@/hooks/use-toast';
import { ERROR_TOAST, ERROR_MESSAGES } from '@/constants';
import {
  Loader2,
  Clock,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  CreditCard,
  Image as ImageIcon,
  ShieldAlert,
  BadgeCheck,
} from 'lucide-react';

interface TransactionDetailsProps {
  transactionId: number;
  currentUserId: number;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  inline?: boolean;
  onBack?: () => void;
  onUpdate?: () => void;
}

const TransactionDetails: React.FC<TransactionDetailsProps> = ({
  transactionId,
  currentUserId,
  open,
  onOpenChange,
  inline,
  onBack,
  onUpdate,
}) => {
  const { toast } = useToast();
  const [transaction, setTransaction] = useState<Transaction | null>(null);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [showPaymentForm, setShowPaymentForm] = useState(false);
  const [showDisputeForm, setShowDisputeForm] = useState(false);
  const [showRejectDialog, setShowRejectDialog] = useState(false);
  const [rejectReason, setRejectReason] = useState('');

  const isOwner = transaction?.ownerId === currentUserId;
  const isClient = transaction?.clientId === currentUserId;

  const loadDetails = useCallback(async () => {
    try {
      setLoading(true);
      const { transaction: data } = await getTransactionDetails(transactionId);
      setTransaction(data);
    } catch (error: unknown) {
      toast(ERROR_TOAST(error instanceof Error ? error.message : ERROR_MESSAGES.UNKNOWN));
    } finally {
      setLoading(false);
    }
  }, [transactionId, toast]);

  useEffect(() => {
    if (open && transactionId) {
      loadDetails();
    }
  }, [open, transactionId, loadDetails]);

  const handleApprove = async () => {
    if (!transaction || !window.confirm('¿Aprobar esta solicitud?')) return;
    try {
      setActionLoading(true);
      await approveTransaction(transaction.id);
      toast({ title: 'Solicitud aprobada', description: 'El cliente ha sido notificado para proceder con el pago.' });
      onUpdate?.();
      loadDetails();
    } catch (error: unknown) {
      toast(ERROR_TOAST(error instanceof Error ? error.message : ERROR_MESSAGES.UNKNOWN));
    } finally {
      setActionLoading(false);
    }
  };

  const handleReject = async () => {
    if (!transaction) return;
    const reason = prompt('¿Por qué rechazas esta solicitud?');
    if (!reason) return;
    try {
      setActionLoading(true);
      await rejectTransaction(transaction.id, reason);
      toast({ title: 'Solicitud rechazada' });
      onUpdate?.();
      loadDetails();
    } catch (error: unknown) {
      toast(ERROR_TOAST(error instanceof Error ? error.message : ERROR_MESSAGES.UNKNOWN));
    } finally {
      setActionLoading(false);
    }
  };

  const handleConfirmPayment = async () => {
    if (!transaction) return;
    if (!window.confirm('¿Confirmas que recibiste el pago? Esta acción no se puede deshacer.')) return;
    try {
      setActionLoading(true);
      await confirmPayment(transaction.id);
      toast({ title: '¡Pago confirmado!', description: 'La propiedad ha sido asignada al cliente.' });
      onUpdate?.();
      loadDetails();
    } catch (error: unknown) {
      toast(ERROR_TOAST(error instanceof Error ? error.message : ERROR_MESSAGES.UNKNOWN));
    } finally {
      setActionLoading(false);
    }
  };

  const handleRejectPayment = async () => {
    if (!transaction || !rejectReason.trim()) return;
    try {
      setActionLoading(true);
      await rejectTransaction(transaction.id, rejectReason.trim());
      toast({ title: 'Pago rechazado', description: 'Se ha notificado al estudiante.' });
      setShowRejectDialog(false);
      setRejectReason('');
      onUpdate?.();
      loadDetails();
    } catch (error: unknown) {
      toast(ERROR_TOAST(error instanceof Error ? error.message : ERROR_MESSAGES.UNKNOWN));
    } finally {
      setActionLoading(false);
    }
  };

  const handleCancel = async () => {
    if (!transaction) return;
    const reason = prompt('¿Por qué deseas cancelar esta transacción?');
    if (!reason) return;
    try {
      setActionLoading(true);
      await cancelTransaction(transaction.id, reason);
      toast({ title: 'Transacción cancelada' });
      onUpdate?.();
      loadDetails();
    } catch (error: unknown) {
      toast(ERROR_TOAST(error instanceof Error ? error.message : ERROR_MESSAGES.UNKNOWN));
    } finally {
      setActionLoading(false);
    }
  };

  const getStatusIcon = (status: TransactionStatus) => {
    switch (status) {
      case TransactionStatus.COMPLETED:
      case TransactionStatus.PAYMENT_CONFIRMED:
        return <CheckCircle2 className="h-5 w-5 text-green-500" />;
      case TransactionStatus.DISPUTED:
        return <AlertTriangle className="h-5 w-5 text-orange-500" />;
      case TransactionStatus.CANCELLED:
      case TransactionStatus.REJECTED:
      case TransactionStatus.EXPIRED:
        return <XCircle className="h-5 w-5 text-red-500" />;
      default:
        return <Clock className="h-5 w-5 text-blue-500" />;
    }
  };

  if (!open && !inline) return null;

  const content = loading ? (
    <div className="flex items-center justify-center py-12">
      <Loader2 className="h-8 w-8 animate-spin text-blue-500" />
    </div>
  ) : !transaction ? (
    <p className="text-center text-gray-500 py-8">Transacción no encontrada</p>
  ) : (
    <div className="space-y-6">
      {/* Property Info */}
      <div className="bg-gray-50 p-4 rounded-lg">
        <h3 className="font-semibold">{transaction.property?.title || 'Propiedad'}</h3>
        <p className="text-gray-500 text-sm">{transaction.property?.address}</p>
        <p className="text-2xl font-bold text-blue-600 mt-1">
          ${Number(transaction.amount).toLocaleString()} {transaction.currency}
        </p>
      </div>

      {/* Status */}
      <div>
        <h4 className="font-semibold text-sm mb-2">Estado Actual</h4>
        <div className="flex items-center gap-2">
          {getStatusIcon(transaction.status)}
          <Badge className={STATUS_COLORS[transaction.status]}>
            {STATUS_LABELS[transaction.status]}
          </Badge>
          {transaction.expiresAt && !['completed', 'cancelled', 'rejected', 'refunded', 'expired'].includes(transaction.status) && (
            <span className="text-xs text-gray-500">
              Expira: {new Date(transaction.expiresAt).toLocaleString()}
            </span>
          )}
        </div>
      </div>

      {/* Parties */}
      <div className="grid grid-cols-2 gap-4">
        <div className="bg-gray-50 p-3 rounded-lg">
          <p className="text-xs text-gray-500 mb-1">Propietario</p>
           <p className="font-medium text-sm">{transaction.owner?.name}{transaction.owner?.isVerified && <BadgeCheck className="h-4 w-4 text-blue-500 inline ml-1" />}</p>
          <p className="text-xs text-gray-500">{transaction.owner?.email}</p>
        </div>
        <div className="bg-gray-50 p-3 rounded-lg">
          <p className="text-xs text-gray-500 mb-1">Cliente</p>
           <p className="font-medium text-sm">{transaction.client?.name}{transaction.client?.isVerified && <BadgeCheck className="h-4 w-4 text-blue-500 inline ml-1" />}</p>
          <p className="text-xs text-gray-500">{transaction.client?.email}</p>
        </div>
      </div>

      {/* Payment Info */}
      {transaction.paymentMethod && (
        <div>
          <h4 className="font-semibold text-sm mb-2 flex items-center gap-2">
            <CreditCard className="h-4 w-4" />
            Información de Pago
          </h4>
          <div className="bg-gray-50 p-3 rounded-lg space-y-1 text-sm">
            <p><span className="text-gray-500">Método:</span> {transaction.paymentMethod}</p>
            <p><span className="text-gray-500">Referencia:</span> {transaction.paymentReference}</p>
            {transaction.paymentDate && (
              <p><span className="text-gray-500">Fecha:</span> {new Date(transaction.paymentDate).toLocaleString()}</p>
            )}
          </div>
          {transaction.paymentProof && transaction.paymentProof.length > 0 && (
            <div className="mt-2">
              <p className="text-xs font-medium text-gray-600 mb-1 flex items-center gap-1">
                <ImageIcon className="h-3 w-3" /> Comprobantes ({transaction.paymentProof.length})
              </p>
              <div className="grid grid-cols-3 gap-2">
                {transaction.paymentProof.map((url, index) => (
                  <a
                    key={index}
                    href={url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="block bg-gray-100 rounded overflow-hidden h-20 hover:opacity-75 transition-opacity"
                  >
                    <img
                      src={url}
                      alt={`Comprobante ${index + 1}`}
                      className="w-full h-full object-cover"
                      onError={(e) => {
                        (e.target as HTMLImageElement).style.display = 'none';
                      }}
                    />
                  </a>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Timeline */}
      {transaction.timeline && transaction.timeline.length > 0 && (
        <div>
          <h4 className="font-semibold text-sm mb-2">Historial</h4>
          <div className="space-y-2">
            {transaction.timeline.map((event: TimelineEvent) => (
              <div key={event.id} className="flex items-start gap-3">
                <div className="w-2 h-2 bg-blue-500 rounded-full mt-1.5 shrink-0" />
                <div className="flex-1 min-w-0">
                  <p className="text-sm">{event.description}</p>
                  <p className="text-xs text-gray-400">
                    {new Date(event.createdAt).toLocaleString()}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      <Separator />

      {/* Actions */}
      <div className="flex flex-wrap gap-2">
        {/* Owner: Approve/Reject */}
        {isOwner && transaction.status === TransactionStatus.PENDING_OWNER_APPROVAL && (
          <>
            <Button onClick={handleApprove} disabled={actionLoading} className="flex-1">
              {actionLoading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
              Aprobar Solicitud
            </Button>
            <Button variant="destructive" onClick={handleReject} disabled={actionLoading} className="flex-1">
              Rechazar
            </Button>
          </>
        )}

        {/* Client: Submit Payment */}
        {isClient && transaction.status === TransactionStatus.PENDING_PAYMENT && (
          <Button onClick={() => setShowPaymentForm(true)} className="flex-1">
            Marcar como Pagado
          </Button>
        )}

        {/* Owner: Payment submitted actions */}
        {isOwner && transaction.status === TransactionStatus.PAYMENT_SUBMITTED && (
          <>
            <Button variant="outline" onClick={() => setShowRejectDialog(true)} disabled={actionLoading} className="border-red-300 text-red-600 hover:bg-red-50">
              <XCircle className="h-4 w-4 mr-2" />
              Rechazar
            </Button>
            <Button variant="outline" onClick={() => setShowDisputeForm(true)} className="border-orange-300 text-orange-600 hover:bg-orange-50">
              <ShieldAlert className="h-4 w-4 mr-2" />
              Reportar Problema
            </Button>
            <Button onClick={handleConfirmPayment} disabled={actionLoading} className="flex-1 bg-green-600 hover:bg-green-700">
              {actionLoading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <CheckCircle2 className="h-4 w-4 mr-2" />}
              Confirmar Recepción de Pago
            </Button>
          </>
        )}

        {/* Cancel */}
        {[TransactionStatus.PENDING_OWNER_APPROVAL, TransactionStatus.PENDING_PAYMENT].includes(transaction.status) && (
          <Button variant="outline" onClick={handleCancel} disabled={actionLoading} className="border-red-300 text-red-600 hover:bg-red-50">
            Cancelar Transacción
          </Button>
        )}
      </div>
    </div>
  );

  const renderRejectDialog = () => (
    <Dialog open={showRejectDialog} onOpenChange={(open) => { if (!open) { setShowRejectDialog(false); setRejectReason(''); } }}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-red-600">
            <XCircle className="h-5 w-5" />
            Rechazar Comprobante
          </DialogTitle>
        </DialogHeader>
        <div className="space-y-3 py-2">
          <p className="text-sm text-muted-foreground">
            Explica al estudiante por qué el comprobante fue rechazado para que pueda corregirlo y reenviar.
          </p>
          <div className="space-y-1.5">
            <label htmlFor="reject-reason" className="text-sm font-medium">Motivo del rechazo *</label>
            <textarea
              id="reject-reason"
              rows={3}
              className="flex w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
              placeholder="Ej: El comprobante no muestra el número de referencia completo..."
              value={rejectReason}
              onChange={(e) => setRejectReason(e.target.value)}
            />
          </div>
        </div>
        <div className="flex justify-end gap-2">
          <Button variant="outline" onClick={() => { setShowRejectDialog(false); setRejectReason(''); }}>
            Cancelar
          </Button>
          <Button
            variant="destructive"
            disabled={actionLoading || !rejectReason.trim()}
            onClick={handleRejectPayment}
          >
            {actionLoading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <XCircle className="h-4 w-4 mr-2" />}
            Confirmar Rechazo
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );

  if (inline) {
    return (
      <>
        {onBack && (
          <div className="flex items-center gap-2 mb-4">
            <Button variant="ghost" size="sm" onClick={onBack}>
              ← Volver a transacciones
            </Button>
          </div>
        )}
        <h2 className="text-2xl font-bold mb-4">Detalles de Transacción #{transactionId}</h2>
        {content}

        {/* Sub-dialogs */}
        {transaction && showPaymentForm && (
          <SubmitPaymentForm
            transaction={transaction}
            open={showPaymentForm}
            onOpenChange={setShowPaymentForm}
            onSuccess={() => {
              loadDetails();
              onUpdate?.();
            }}
          />
        )}

        {transaction && showDisputeForm && (
          <CreateDisputeModal
            transaction={transaction}
            open={showDisputeForm}
            onOpenChange={setShowDisputeForm}
            onSuccess={() => {
              loadDetails();
              onUpdate?.();
            }}
          />
        )}

        {renderRejectDialog()}
      </>
    );
  }

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Detalles de Transacción #{transactionId}</DialogTitle>
          </DialogHeader>

          {content}
        </DialogContent>
      </Dialog>

      {/* Sub-dialogs */}
      {transaction && showPaymentForm && (
        <SubmitPaymentForm
          transaction={transaction}
          open={showPaymentForm}
          onOpenChange={setShowPaymentForm}
          onSuccess={() => {
            loadDetails();
            onUpdate?.();
          }}
        />
      )}

      {transaction && showDisputeForm && (
        <CreateDisputeModal
          transaction={transaction}
          open={showDisputeForm}
          onOpenChange={setShowDisputeForm}
          onSuccess={() => {
            loadDetails();
            onUpdate?.();
          }}
        />
      )}

      {renderRejectDialog()}
    </>
  );
};

export default TransactionDetails;
