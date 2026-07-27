import { useEffect, useRef, useCallback } from 'react';
import { socketService } from '@/services/socket';

export interface TransactionNotification {
  type: string;
  title: string;
  message: string;
  data: Record<string, unknown>;
  urgent?: boolean;
}

const TRANSACTION_EVENTS = [
  'transaction:new_request',
  'transaction:approved',
  'transaction:rejected',
  'transaction:payment_submitted',
  'transaction:payment_confirmed',
  'transaction:cancelled',
  'transaction:expired',
  'dispute:new',
  'dispute:resolved',
] as const;

const EVENT_MAP: Record<string, Omit<TransactionNotification, 'data'>> = {
  'transaction:new_request': { type: 'new_request', title: 'Nueva Solicitud', message: '' },
  'transaction:approved': { type: 'approved', title: 'Solicitud Aprobada', message: '' },
  'transaction:rejected': { type: 'rejected', title: 'Solicitud Rechazada', message: '' },
  'transaction:payment_submitted': { type: 'payment_submitted', title: '¡Pago Recibido!', message: '', urgent: true },
  'transaction:payment_confirmed': { type: 'payment_confirmed', title: '¡Transacción Completada!', message: '' },
  'transaction:cancelled': { type: 'cancelled', title: 'Transacción Cancelada', message: '' },
  'transaction:expired': { type: 'expired', title: 'Transacción Expirada', message: '' },
  'dispute:new': { type: 'dispute_new', title: 'Nueva Disputa', message: '', urgent: true },
  'dispute:resolved': { type: 'dispute_resolved', title: 'Disputa Resuelta', message: '' },
};

export const useTransactionNotifications = (
  onNotification: (notification: TransactionNotification) => void
) => {
  const callbackRef = useRef(onNotification);
  callbackRef.current = onNotification;

  useEffect(() => {
    const unsubscribers: (() => void)[] = [];

    // Register one handler per event on the shared socket
    for (const event of TRANSACTION_EVENTS) {
      const unsub = socketService.on(event, (data: unknown) => {
        const meta = EVENT_MAP[event];
        if (!meta) return;
        const dataRecord = data as Record<string, unknown>;
        callbackRef.current({
          ...meta,
          message: (typeof dataRecord?.message === 'string' ? dataRecord.message : undefined) || meta.message,
          data,
        });
      });
      unsubscribers.push(unsub);
    }

    // Ensure socket is connected
    socketService.connect();

    return () => {
      unsubscribers.forEach(unsub => unsub());
    };
  }, []);

  const disconnect = useCallback(() => {
    // Don't disconnect — the shared socket is used by other consumers.
    // Just clean up local listeners (already handled by useEffect cleanup).
  }, []);

  return { disconnect };
};
