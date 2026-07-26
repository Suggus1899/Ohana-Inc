import Transaction, { TransactionStatus, EscrowStatus } from '../models/Transaction';
import TransactionTimeline from '../models/TransactionTimeline';
import PropertyAssignment from '../models/PropertyAssignment';
import Property from '../models/Property';
import RentalRequest from '../models/RentalRequest';

export class EscrowService {
  // Iniciar escrow cuando cliente marca como pagado
  public async holdPayment(transactionId: number, userId: number): Promise<Transaction> {
    const transaction = await Transaction.findByPk(transactionId);

    if (!transaction) {
      throw new Error('Transacción no encontrada');
    }

    if (transaction.clientId !== userId) {
      throw new Error('No autorizado');
    }

    if (transaction.status !== TransactionStatus.PENDING_PAYMENT && transaction.status !== TransactionStatus.REJECTED) {
      throw new Error('Estado de transacción inválido para iniciar escrow');
    }

    const previousStatus = transaction.status;

    // Actualizar a estado de escrow
    await transaction.update({
      status: TransactionStatus.PAYMENT_SUBMITTED,
      escrowStatus: EscrowStatus.HOLDING,
      clientConfirmedAt: new Date(),
    });

    // Registrar en timeline
    await TransactionTimeline.create({
      transactionId: transaction.id,
      action: 'payment_submitted',
      actor: 'client',
      actorId: userId,
      previousStatus,
      newStatus: TransactionStatus.PAYMENT_SUBMITTED,
      description: previousStatus === TransactionStatus.REJECTED
        ? 'Cliente reenvió el comprobante de pago'
        : 'Cliente marcó el pago como realizado',
    });

    // Sincronizar estado de la solicitud de alquiler
    if (transaction.rentalRequestId) {
      await RentalRequest.update(
        { status: 'payment_submitted' },
        { where: { id: transaction.rentalRequestId } }
      );
    }

    return transaction;
  }

  // Liberar pago cuando propietario confirma
  public async releasePayment(transactionId: number, userId: number): Promise<Transaction> {
    const transaction = await Transaction.findByPk(transactionId, {
      include: [{ model: Property, as: 'property' }],
    });

    if (!transaction) {
      throw new Error('Transacción no encontrada');
    }

    if (transaction.ownerId !== userId) {
      throw new Error('No autorizado');
    }

    if (transaction.status !== TransactionStatus.PAYMENT_SUBMITTED) {
      throw new Error('Estado de transacción inválido para liberar pago');
    }

    // Liberar escrow y completar transacción
    await transaction.update({
      status: TransactionStatus.PAYMENT_CONFIRMED,
      escrowStatus: EscrowStatus.RELEASED,
      ownerConfirmedAt: new Date(),
      completedAt: new Date(),
    });

    // Registrar en timeline
    await TransactionTimeline.create({
      transactionId: transaction.id,
      action: 'payment_confirmed',
      actor: 'owner',
      actorId: userId,
      previousStatus: TransactionStatus.PAYMENT_SUBMITTED,
      newStatus: TransactionStatus.PAYMENT_CONFIRMED,
      description: 'Propietario confirmó la recepción del pago',
    });

    // Asignar propiedad al cliente
    await this.assignProperty(transaction);

    // Actualizar estado de la propiedad y contadores de habitaciones
    const property = transaction.property;
    if (property) {
      if (property.type === 'Residencia') {
        const currentAvail = (property as any).availableRooms ?? 0;
        const currentOccup = (property as any).occupiedRooms ?? 0;
        const newAvail = Math.max(0, currentAvail - 1);
        const newOccup = currentOccup + 1;
        await Property.update(
          {
            availableRooms: newAvail,
            occupiedRooms: newOccup,
          },
          { where: { id: transaction.propertyId } }
        );
      } else {
        const newPropertyStatus = property.listingType === 'Venta' ? 'sold' : 'rented';
        await Property.update(
          { status: newPropertyStatus as any },
          { where: { id: transaction.propertyId } }
        );
      }
    }

    // Marcar como completada
    await transaction.update({
      status: TransactionStatus.COMPLETED,
    });

    await TransactionTimeline.create({
      transactionId: transaction.id,
      action: 'completed',
      actor: 'system',
      actorId: null,
      previousStatus: TransactionStatus.PAYMENT_CONFIRMED,
      newStatus: TransactionStatus.COMPLETED,
      description: 'Transacción completada y propiedad asignada',
    });

    // Sincronizar estado de la solicitud de alquiler como completada
    if (transaction.rentalRequestId) {
      await RentalRequest.update(
        { status: 'completed' },
        { where: { id: transaction.rentalRequestId } }
      );
    }

    return transaction;
  }

  // Reembolsar en caso de disputa o cancelación
  public async refundPayment(
    transactionId: number,
    reason: string,
    actorId: number
  ): Promise<Transaction> {
    const transaction = await Transaction.findByPk(transactionId);

    if (!transaction) {
      throw new Error('Transacción no encontrada');
    }

    if (![TransactionStatus.PAYMENT_SUBMITTED, TransactionStatus.PAYMENT_CONFIRMED, TransactionStatus.COMPLETED, TransactionStatus.DISPUTED].includes(transaction.status)) {
      throw new Error('No se puede reembolsar en este estado');
    }

    const previousStatus = transaction.status;

    await transaction.update({
      status: TransactionStatus.REFUNDED,
      escrowStatus: EscrowStatus.REFUNDED,
    });

    // Registrar en timeline
    await TransactionTimeline.create({
      transactionId: transaction.id,
      action: 'refunded',
      actor: 'operator',
      actorId,
      previousStatus,
      newStatus: TransactionStatus.REFUNDED,
      description: `Pago reembolsado. Razón: ${reason}`,
    });

    return transaction;
  }

  // Congelar escrow en caso de disputa
  public async freezeEscrow(transactionId: number): Promise<Transaction> {
    const transaction = await Transaction.findByPk(transactionId);

    if (!transaction) {
      throw new Error('Transacción no encontrada');
    }

    const previousStatus = transaction.status;

    await transaction.update({
      status: TransactionStatus.DISPUTED,
      escrowStatus: EscrowStatus.FROZEN,
    });

    await TransactionTimeline.create({
      transactionId: transaction.id,
      action: 'disputed',
      actor: 'system',
      actorId: null,
      previousStatus,
      newStatus: TransactionStatus.DISPUTED,
      description: 'Escrow congelado por disputa',
    });

    return transaction;
  }

  // Asignar propiedad al cliente
  private async assignProperty(transaction: Transaction): Promise<void> {
    await PropertyAssignment.create({
      propertyId: transaction.propertyId,
      clientId: transaction.clientId,
      transactionId: transaction.id,
      startDate: new Date(),
      status: 'active',
    });
  }
}
