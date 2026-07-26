import { TransactionStatus } from '../models/Transaction';

export class TransactionStateMachine {
  private static transitions: Record<TransactionStatus, TransactionStatus[]> = {
    [TransactionStatus.PENDING_OWNER_APPROVAL]: [
      TransactionStatus.PENDING_PAYMENT,
      TransactionStatus.REJECTED,
      TransactionStatus.CANCELLED,
      TransactionStatus.EXPIRED,
    ],
    [TransactionStatus.PENDING_PAYMENT]: [
      TransactionStatus.PAYMENT_SUBMITTED,
      TransactionStatus.CANCELLED,
      TransactionStatus.EXPIRED,
    ],
    [TransactionStatus.PAYMENT_SUBMITTED]: [
      TransactionStatus.PAYMENT_CONFIRMED,
      TransactionStatus.REJECTED,
      TransactionStatus.DISPUTED,
      TransactionStatus.CANCELLED,
    ],
    [TransactionStatus.PAYMENT_CONFIRMED]: [
      TransactionStatus.COMPLETED,
      TransactionStatus.REFUNDED,
    ],
    [TransactionStatus.DISPUTED]: [
      TransactionStatus.PAYMENT_CONFIRMED,
      TransactionStatus.REFUNDED,
      TransactionStatus.CANCELLED,
    ],
    [TransactionStatus.COMPLETED]: [
      TransactionStatus.REFUNDED,
    ],
    [TransactionStatus.CANCELLED]: [],
    [TransactionStatus.REJECTED]: [
      TransactionStatus.PAYMENT_SUBMITTED,
    ],
    [TransactionStatus.REFUNDED]: [],
    [TransactionStatus.EXPIRED]: [],
  };

  public static canTransition(
    currentStatus: TransactionStatus,
    newStatus: TransactionStatus
  ): boolean {
    const allowedTransitions = this.transitions[currentStatus] || [];
    return allowedTransitions.includes(newStatus);
  }

  public static validateTransition(
    currentStatus: TransactionStatus,
    newStatus: TransactionStatus
  ): void {
    if (!this.canTransition(currentStatus, newStatus)) {
      throw new Error(
        `Transición inválida de ${currentStatus} a ${newStatus}`
      );
    }
  }

  public static getAllowedTransitions(status: TransactionStatus): TransactionStatus[] {
    return this.transitions[status] || [];
  }

  public static isTerminalState(status: TransactionStatus): boolean {
    return (this.transitions[status] || []).length === 0;
  }
}
