import Transaction, { TransactionStatus, EscrowStatus } from '../models/Transaction';
import TransactionTimeline from '../models/TransactionTimeline';
import { Op } from 'sequelize';

export class TransactionExpiryService {
  // Configuración de tiempos límite (en horas)
  private static readonly TIMEOUTS: Record<string, number> = {
    [TransactionStatus.PENDING_OWNER_APPROVAL]: 48,
    [TransactionStatus.PENDING_PAYMENT]: 24,
    [TransactionStatus.PAYMENT_SUBMITTED]: 72,
  };

  // Verificar y expirar transacciones vencidas
  public async expireTransactions(): Promise<number> {
    const now = new Date();
    let expiredCount = 0;

    const expiredTransactions = await Transaction.findAll({
      where: {
        status: {
          [Op.in]: [
            TransactionStatus.PENDING_OWNER_APPROVAL,
            TransactionStatus.PENDING_PAYMENT,
            TransactionStatus.PAYMENT_SUBMITTED,
          ],
        },
        expiresAt: {
          [Op.lt]: now,
        },
      },
    });

    for (const transaction of expiredTransactions) {
      try {
        await this.handleExpiredTransaction(transaction);
        expiredCount++;
      } catch (error) {
        console.error(`Error expiring transaction ${transaction.id}:`, error);
      }
    }

    if (expiredCount > 0) {
      console.log(`⏰ ${expiredCount} transacciones expiradas procesadas`);
    }

    return expiredCount;
  }

  private async handleExpiredTransaction(transaction: Transaction): Promise<void> {
    const previousStatus = transaction.status;

    // Si el pago ya fue enviado, crear disputa automática
    if (transaction.status === TransactionStatus.PAYMENT_SUBMITTED) {
      await transaction.update({
        status: TransactionStatus.DISPUTED,
        escrowStatus: EscrowStatus.FROZEN,
      });

      await TransactionTimeline.create({
        transactionId: transaction.id,
        action: 'auto_disputed',
        actor: 'system',
        actorId: null,
        previousStatus,
        newStatus: TransactionStatus.DISPUTED,
        description: 'Transacción en disputa automática por tiempo de espera excedido',
      });
    } else {
      // Cancelar transacción
      await transaction.update({
        status: TransactionStatus.EXPIRED,
      });

      await TransactionTimeline.create({
        transactionId: transaction.id,
        action: 'expired',
        actor: 'system',
        actorId: null,
        previousStatus,
        newStatus: TransactionStatus.EXPIRED,
        description: 'Transacción expirada por tiempo límite',
      });
    }
  }

  // Calcular tiempo de expiración
  public static calculateExpiryTime(status: TransactionStatus): Date {
    const hours = this.TIMEOUTS[status] || 24;
    const expiryDate = new Date();
    expiryDate.setHours(expiryDate.getHours() + hours);
    return expiryDate;
  }
}
