import Dispute, { DisputeStatus } from '../models/Dispute';
import Transaction, { TransactionStatus } from '../models/Transaction';
import Property from '../models/Property';
import User from '../models/User';
import { EscrowService } from './escrow.service';
import { TransactionNotificationService } from './transaction-notification.service';
import { Op } from 'sequelize';

export class DisputeService {
  private escrowService: EscrowService;
  private notificationService: TransactionNotificationService;

  constructor() {
    this.escrowService = new EscrowService();
    this.notificationService = new TransactionNotificationService();
  }

  // Crear disputa
  public async createDispute(
    transactionId: number,
    reportedBy: number,
    data: {
      reason: string;
      description: string;
      evidence: string[];
    }
  ): Promise<Dispute> {
    const transaction = await Transaction.findByPk(transactionId);

    if (!transaction) {
      throw new Error('Transacción no encontrada');
    }

    // Verificar que el usuario es parte de la transacción
    if (transaction.clientId !== reportedBy && transaction.ownerId !== reportedBy) {
      throw new Error('No autorizado');
    }

    // Solo se puede crear disputa en ciertos estados
    if (![TransactionStatus.PAYMENT_SUBMITTED, TransactionStatus.PENDING_PAYMENT].includes(transaction.status)) {
      throw new Error('No se puede crear una disputa en este estado de transacción');
    }

    // Verificar que no hay disputa abierta para esta transacción
    const existingDispute = await Dispute.findOne({
      where: {
        transactionId,
        status: { [Op.in]: [DisputeStatus.OPEN, DisputeStatus.UNDER_REVIEW] },
      },
    });

    if (existingDispute) {
      throw new Error('Ya existe una disputa abierta para esta transacción');
    }

    // Determinar contra quién es la disputa
    const reportedAgainst = transaction.clientId === reportedBy
      ? transaction.ownerId
      : transaction.clientId;

    // Crear disputa
    const dispute = await Dispute.create({
      transactionId,
      reportedBy,
      reportedAgainst,
      reason: data.reason,
      description: data.description,
      evidence: data.evidence,
      status: DisputeStatus.OPEN,
    });

    // Congelar escrow
    await this.escrowService.freezeEscrow(transactionId);

    // Notificar a operadores/admins
    await this.notificationService.notifyOperatorsNewDispute(dispute);

    return dispute;
  }

  // Resolver disputa (operador/admin)
  public async resolveDispute(
    disputeId: number,
    resolvedBy: number,
    resolution: {
      decision: 'refund' | 'release' | 'cancel';
      notes: string;
    }
  ): Promise<Dispute> {
    const dispute = await Dispute.findByPk(disputeId, {
      include: [{ model: Transaction, as: 'transaction' }],
    });

    if (!dispute) {
      throw new Error('Disputa no encontrada');
    }

    if (dispute.status === DisputeStatus.RESOLVED || dispute.status === DisputeStatus.CLOSED) {
      throw new Error('Esta disputa ya fue resuelta');
    }

    // Actualizar disputa
    await dispute.update({
      status: DisputeStatus.RESOLVED,
      resolution: resolution.notes,
      resolvedBy,
      resolvedAt: new Date(),
    });

    // Ejecutar decisión
    if (resolution.decision === 'refund') {
      await this.escrowService.refundPayment(
        dispute.transactionId,
        'Disputa resuelta a favor del cliente',
        resolvedBy
      );
    } else if (resolution.decision === 'release') {
      await this.escrowService.releasePayment(
        dispute.transactionId,
        dispute.transaction.ownerId
      );
    } else if (resolution.decision === 'cancel') {
      const transaction = dispute.transaction;
      await transaction.update({
        status: TransactionStatus.CANCELLED,
        escrowStatus: 'none',
      });
    }

    // Notificar a ambas partes
    await this.notificationService.notifyDisputeResolved(dispute);

    return dispute;
  }

  // Marcar disputa como bajo revisión
  public async markUnderReview(disputeId: number, operatorId: number): Promise<Dispute> {
    const dispute = await Dispute.findByPk(disputeId);

    if (!dispute) {
      throw new Error('Disputa no encontrada');
    }

    if (dispute.status !== DisputeStatus.OPEN) {
      throw new Error('Solo se pueden revisar disputas abiertas');
    }

    await dispute.update({
      status: DisputeStatus.UNDER_REVIEW,
    });

    return dispute;
  }

  // Obtener disputas pendientes (operadores)
  public async getPendingDisputes(): Promise<Dispute[]> {
    return await Dispute.findAll({
      where: {
        status: {
          [Op.in]: [DisputeStatus.OPEN, DisputeStatus.UNDER_REVIEW],
        },
      },
      include: [
        {
          model: Transaction,
          as: 'transaction',
          include: [
            { model: Property, as: 'property', attributes: ['id', 'title', 'address', 'price'] },
            { model: User, as: 'owner', attributes: ['id', 'name', 'email'] },
            { model: User, as: 'client', attributes: ['id', 'name', 'email'] },
          ],
        },
        { model: User, as: 'reporter', attributes: ['id', 'name', 'email'] },
        { model: User, as: 'reported', attributes: ['id', 'name', 'email'] },
      ],
      order: [['createdAt', 'ASC']],
    });
  }

  // Obtener detalle de disputa
  public async getDisputeDetails(disputeId: number): Promise<Dispute | null> {
    return await Dispute.findByPk(disputeId, {
      include: [
        {
          model: Transaction,
          as: 'transaction',
          include: [
            { model: Property, as: 'property' },
            { model: User, as: 'owner', attributes: ['id', 'name', 'email', 'phone'] },
            { model: User, as: 'client', attributes: ['id', 'name', 'email', 'phone'] },
          ],
        },
        { model: User, as: 'reporter', attributes: ['id', 'name', 'email'] },
        { model: User, as: 'reported', attributes: ['id', 'name', 'email'] },
        { model: User, as: 'resolver', attributes: ['id', 'name', 'email'] },
      ],
    });
  }

  // Obtener disputas de un usuario
  public async getUserDisputes(userId: number): Promise<Dispute[]> {
    return await Dispute.findAll({
      where: {
        [Op.or]: [{ reportedBy: userId }, { reportedAgainst: userId }],
      },
      include: [
        {
          model: Transaction,
          as: 'transaction',
          include: [
            { model: Property, as: 'property', attributes: ['id', 'title', 'address'] },
          ],
        },
      ],
      order: [['createdAt', 'DESC']],
    });
  }
}
