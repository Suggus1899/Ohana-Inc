import Transaction, { TransactionStatus, EscrowStatus } from '../models/Transaction';
import TransactionTimeline from '../models/TransactionTimeline';
import Property from '../models/Property';
import User from '../models/User';
import RentalRequest from '../models/RentalRequest';
import { EscrowService } from './escrow.service';
import { TransactionNotificationService } from './transaction-notification.service';
import { TransactionStateMachine } from '../utils/transaction-state-machine';
import { TransactionExpiryService } from './transaction-expiry.service';
import { Op } from 'sequelize';
import { notificationInAppService } from './notification-inapp.service';

export class TransactionService {
  private escrowService: EscrowService;
  private notificationService: TransactionNotificationService;

  constructor() {
    this.escrowService = new EscrowService();
    this.notificationService = new TransactionNotificationService();
  }

  // Crear solicitud de transacción
  public async createTransaction(
    propertyId: number,
    clientId: number,
    data: {
      amount: number;
      currency: string;
      notes?: string;
      rentalRequestId?: number;
    },
    initialStatus?: TransactionStatus
  ): Promise<Transaction> {
    // Verificar que la propiedad existe y está disponible
    const property = await Property.findByPk(propertyId);
    if (!property) {
      throw new Error('Propiedad no encontrada');
    }

    if (property.status !== 'approved') {
      throw new Error('Propiedad no disponible');
    }

    // Verificar que el cliente no es el propietario (authorId en el modelo existente)
    if (property.authorId === clientId) {
      throw new Error('No puedes solicitar tu propia propiedad');
    }

    // Verificar que no hay transacción activa para esta propiedad y cliente
    const existingTransaction = await Transaction.findOne({
      where: {
        propertyId,
        clientId,
        status: {
          [Op.in]: [
            TransactionStatus.PENDING_OWNER_APPROVAL,
            TransactionStatus.PENDING_PAYMENT,
            TransactionStatus.PAYMENT_SUBMITTED,
          ],
        },
      },
    });

    if (existingTransaction) {
      throw new Error('Ya tienes una transacción activa para esta propiedad');
    }

    // Crear transacción (ownerId = property.authorId)
    const transaction = await Transaction.create({
      propertyId,
      ownerId: property.authorId,
      clientId,
      rentalRequestId: data.rentalRequestId ?? null,
      amount: data.amount,
      currency: data.currency,
      status: initialStatus ?? TransactionStatus.PENDING_OWNER_APPROVAL,
      escrowStatus: EscrowStatus.NONE,
      notes: data.notes || null,
      expiresAt: TransactionExpiryService.calculateExpiryTime(
        initialStatus ?? TransactionStatus.PENDING_OWNER_APPROVAL
      ),
    });

    // Registrar en timeline
    await TransactionTimeline.create({
      transactionId: transaction.id,
      action: 'created',
      actor: 'client',
      actorId: clientId,
      previousStatus: null,
      newStatus: initialStatus ?? TransactionStatus.PENDING_OWNER_APPROVAL,
      description: 'Solicitud de transacción creada',
    });

    // Notificar al propietario
    await this.notificationService.notifyOwnerNewRequest(transaction);

    return transaction;
  }

  // Propietario aprueba solicitud
  public async approveTransaction(
    transactionId: number,
    ownerId: number
  ): Promise<Transaction> {
    const transaction = await Transaction.findByPk(transactionId);

    if (!transaction) {
      throw new Error('Transacción no encontrada');
    }

    if (transaction.ownerId !== ownerId) {
      throw new Error('No autorizado');
    }

    TransactionStateMachine.validateTransition(
      transaction.status,
      TransactionStatus.PENDING_PAYMENT
    );

    await transaction.update({
      status: TransactionStatus.PENDING_PAYMENT,
      expiresAt: TransactionExpiryService.calculateExpiryTime(
        TransactionStatus.PENDING_PAYMENT
      ),
    });

    await TransactionTimeline.create({
      transactionId: transaction.id,
      action: 'approved',
      actor: 'owner',
      actorId: ownerId,
      previousStatus: TransactionStatus.PENDING_OWNER_APPROVAL,
      newStatus: TransactionStatus.PENDING_PAYMENT,
      description: 'Propietario aprobó la solicitud',
    });

    // Notificar al cliente
    await this.notificationService.notifyClientApproval(transaction);

    return transaction;
  }

  // Propietario rechaza solicitud
  public async rejectTransaction(
    transactionId: number,
    ownerId: number,
    reason: string
  ): Promise<Transaction> {
    const transaction = await Transaction.findByPk(transactionId);

    if (!transaction) {
      throw new Error('Transacción no encontrada');
    }

    if (transaction.ownerId !== ownerId) {
      throw new Error('No autorizado');
    }

    TransactionStateMachine.validateTransition(
      transaction.status,
      TransactionStatus.REJECTED
    );

    const previousStatus = transaction.status;

    await transaction.update({
      status: TransactionStatus.REJECTED,
      notes: reason,
    });

    await TransactionTimeline.create({
      transactionId: transaction.id,
      action: 'rejected',
      actor: 'owner',
      actorId: ownerId,
      previousStatus,
      newStatus: TransactionStatus.REJECTED,
      description: `Propietario rechazó la solicitud. Razón: ${reason}`,
    });

    // Notificar al cliente
    await this.notificationService.notifyClientRejection(transaction);

    return transaction;
  }

  // Cliente marca pago como realizado
  public async submitPayment(
    transactionId: number,
    clientId: number,
    data: {
      paymentMethod: string;
      paymentReference: string;
      paymentProof: string[];
      paymentDate: Date;
    }
  ): Promise<Transaction> {
    const transaction = await Transaction.findByPk(transactionId);

    if (!transaction) {
      throw new Error('Transacción no encontrada');
    }

    if (transaction.clientId !== clientId) {
      throw new Error('No autorizado');
    }

    TransactionStateMachine.validateTransition(
      transaction.status,
      TransactionStatus.PAYMENT_SUBMITTED
    );

    // Actualizar información de pago
    await transaction.update({
      paymentMethod: data.paymentMethod,
      paymentReference: data.paymentReference,
      paymentProof: data.paymentProof,
      paymentDate: data.paymentDate,
    });

    // Iniciar escrow
    await this.escrowService.holdPayment(transactionId, clientId);

    // Actualizar tiempo de expiración
    await transaction.update({
      expiresAt: TransactionExpiryService.calculateExpiryTime(
        TransactionStatus.PAYMENT_SUBMITTED
      ),
    });

    // Notificar al propietario
    await this.notificationService.notifyOwnerPaymentSubmitted(transaction);

    // Actualizar RentalRequest
    if (transaction.rentalRequestId) {
      await RentalRequest.update(
        { status: 'payment_submitted' },
        { where: { id: transaction.rentalRequestId } }
      );
    }

    // Reload to get latest state
    await transaction.reload();

    return transaction;
  }

  // Propietario confirma recepción de pago
  public async confirmPayment(
    transactionId: number,
    ownerId: number
  ): Promise<Transaction> {
    const transaction = await this.escrowService.releasePayment(transactionId, ownerId);

    // Notificar al cliente (in-app)
    try {
      const property = await Property.findByPk(transaction.propertyId);
      if (property) {
        await notificationInAppService.notifyPaymentConfirmed(
          transaction.clientId,
          property.title,
          property.id,
        );
      }
    } catch (notifErr) {
      console.error('Error sending payment confirmed notification:', notifErr);
    }

    await this.notificationService.notifyClientPaymentConfirmed(transaction);

    // Actualizar RentalRequest
    if (transaction.rentalRequestId) {
      await RentalRequest.update(
        { status: 'completed' },
        { where: { id: transaction.rentalRequestId } }
      );
    }

    return transaction;
  }

  // Cancelar transacción
  public async cancelTransaction(
    transactionId: number,
    userId: number,
    reason: string
  ): Promise<Transaction> {
    const transaction = await Transaction.findByPk(transactionId);

    if (!transaction) {
      throw new Error('Transacción no encontrada');
    }

    // Verificar que el usuario es parte de la transacción
    if (transaction.clientId !== userId && transaction.ownerId !== userId) {
      throw new Error('No autorizado');
    }

    // No se puede cancelar si el pago ya fue confirmado
    if (transaction.status === TransactionStatus.PAYMENT_CONFIRMED ||
        transaction.status === TransactionStatus.COMPLETED) {
      throw new Error('No se puede cancelar una transacción completada');
    }

    TransactionStateMachine.validateTransition(
      transaction.status,
      TransactionStatus.CANCELLED
    );

    const actor = transaction.clientId === userId ? 'client' : 'owner';
    const previousStatus = transaction.status;

    await transaction.update({
      status: TransactionStatus.CANCELLED,
    });

    await TransactionTimeline.create({
      transactionId: transaction.id,
      action: 'cancelled',
      actor,
      actorId: userId,
      previousStatus,
      newStatus: TransactionStatus.CANCELLED,
      description: `Transacción cancelada. Razón: ${reason}`,
    });

    // Notificar a la otra parte
    const notifyUserId = transaction.clientId === userId
      ? transaction.ownerId
      : transaction.clientId;
    await this.notificationService.notifyTransactionCancelled(transaction, notifyUserId);

    return transaction;
  }

  // Obtener transacciones del usuario
  public async getUserTransactions(
    userId: number,
    role: string,
    filters: any = {}
  ): Promise<Transaction[]> {
    const where: any = {};

    // Both roles can see their transactions
    if (role === 'propietario') {
      where.ownerId = userId;
    } else if (role === 'cliente' || role === 'estudiante') {
      where.clientId = userId;
    } else if (role === 'admin' || role === 'operator') {
      // Admins/operators can see all - no user filter
    } else {
      // Default: show transactions where user is involved
      where[Op.or] = [{ ownerId: userId }, { clientId: userId }];
    }

    if (filters.status) {
      where.status = filters.status;
    }

    if (filters.propertyId) {
      where.propertyId = filters.propertyId;
    }

    return await Transaction.findAll({
      where,
      include: [
        {
          model: Property,
          as: 'property',
          attributes: ['id', 'title', 'address', 'price', 'images', 'listingType', 'type'],
        },
        {
          model: User,
          as: 'owner',
          attributes: ['id', 'name', 'email', 'phone', 'isVerified'],
        },
        {
          model: User,
          as: 'client',
          attributes: ['id', 'name', 'email', 'phone', 'isVerified'],
        },
      ],
      order: [['createdAt', 'DESC']],
    });
  }

  // Obtener detalles de transacción
  public async getTransactionDetails(
    transactionId: number,
    userId: number,
    userRole: string
  ): Promise<any> {
    const transaction = await Transaction.findByPk(transactionId, {
      include: [
        {
          model: Property,
          as: 'property',
        },
        {
          model: User,
          as: 'owner',
          attributes: ['id', 'name', 'email', 'phone', 'isVerified'],
        },
        {
          model: User,
          as: 'client',
          attributes: ['id', 'name', 'email', 'phone', 'isVerified'],
        },
      ],
    });

    if (!transaction) {
      throw new Error('Transacción no encontrada');
    }

    // Verificar que el usuario es parte de la transacción o es admin/operator
    const isParty = transaction.clientId === userId || transaction.ownerId === userId;
    const isAdmin = userRole === 'admin' || userRole === 'operator';

    if (!isParty && !isAdmin) {
      throw new Error('No autorizado');
    }

    // Obtener timeline
    const timeline = await TransactionTimeline.findAll({
      where: { transactionId },
      order: [['createdAt', 'ASC']],
    });

    return {
      ...transaction.toJSON(),
      timeline,
    };
  }

  // Obtener transacción por rentalRequestId
  public async getTransactionByRentalRequest(
    rentalRequestId: number,
    userId: number
  ): Promise<Transaction | null> {
    const transaction = await Transaction.findOne({
      where: { rentalRequestId },
      include: [
        {
          model: Property,
          as: 'property',
          attributes: ['id', 'title', 'address', 'price', 'images', 'listingType', 'type'],
        },
        {
          model: User,
          as: 'owner',
          attributes: ['id', 'name', 'email', 'phone', 'isVerified'],
        },
        {
          model: User,
          as: 'client',
          attributes: ['id', 'name', 'email', 'phone', 'isVerified'],
        },
      ],
    });

    if (!transaction) return null;

    // Verify the user is part of this transaction
    if (transaction.clientId !== userId && transaction.ownerId !== userId) {
      throw new Error('No autorizado');
    }

    return transaction;
  }

  // Obtener estadísticas de transacciones (para admin/operator)
  public async getTransactionStats(): Promise<any> {
    const [total, pending, inProgress, completed, disputed] = await Promise.all([
      Transaction.count(),
      Transaction.count({ where: { status: TransactionStatus.PENDING_OWNER_APPROVAL } }),
      Transaction.count({ where: { status: { [Op.in]: [TransactionStatus.PENDING_PAYMENT, TransactionStatus.PAYMENT_SUBMITTED] } } }),
      Transaction.count({ where: { status: TransactionStatus.COMPLETED } }),
      Transaction.count({ where: { status: TransactionStatus.DISPUTED } }),
    ]);

    return { total, pending, inProgress, completed, disputed };
  }
}
