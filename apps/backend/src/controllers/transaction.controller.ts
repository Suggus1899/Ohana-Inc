import { Response } from 'express';
import { AuthRequest, ApiResponse } from '../types';
import { TransactionService } from '../services/transaction.service';
import Transaction from '../models/Transaction';
import Property from '../models/Property';
import User from '../models/User';
import { Op } from 'sequelize';

const transactionService = new TransactionService();

// Crear solicitud de transacción
export const createTransaction = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const clientId = req.user?.userId;
    if (!clientId) {
      res.status(401).json({ success: false, error: { code: 'UNAUTHORIZED', message: 'No autenticado' } });
      return;
    }

    const { propertyId, amount, currency, notes } = req.body;

    if (!propertyId || !amount) {
      res.status(400).json({ success: false, error: { code: 'VALIDATION_ERROR', message: 'propertyId y amount son requeridos' } });
      return;
    }

    const transaction = await transactionService.createTransaction(
      propertyId,
      clientId,
      { amount: parseFloat(amount), currency: currency || 'USD', notes }
    );

    res.status(201).json({ success: true, data: { transaction } });
  } catch (error: any) {
    console.error('Error creating transaction:', error);
    res.status(error.message.includes('No autorizado') ? 403 : 400).json({
      success: false,
      error: { code: 'CREATE_ERROR', message: error.message },
    });
  }
};

// Aprobar solicitud (propietario)
export const approveTransaction = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const ownerId = req.user?.userId;
    if (!ownerId) {
      res.status(401).json({ success: false, error: { code: 'UNAUTHORIZED', message: 'No autenticado' } });
      return;
    }

    const { id } = req.params;
    const transaction = await transactionService.approveTransaction(parseInt(id), ownerId);

    res.json({ success: true, data: { transaction } });
  } catch (error: any) {
    console.error('Error approving transaction:', error);
    res.status(error.message.includes('No autorizado') ? 403 : 400).json({
      success: false,
      error: { code: 'UPDATE_ERROR', message: error.message },
    });
  }
};

// Rechazar solicitud (propietario)
export const rejectTransaction = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const ownerId = req.user?.userId;
    if (!ownerId) {
      res.status(401).json({ success: false, error: { code: 'UNAUTHORIZED', message: 'No autenticado' } });
      return;
    }

    const { id } = req.params;
    const { reason } = req.body;

    if (!reason) {
      res.status(400).json({ success: false, error: { code: 'VALIDATION_ERROR', message: 'reason es requerido' } });
      return;
    }

    const transaction = await transactionService.rejectTransaction(parseInt(id), ownerId, reason);

    res.json({ success: true, data: { transaction } });
  } catch (error: any) {
    console.error('Error rejecting transaction:', error);
    res.status(error.message.includes('No autorizado') ? 403 : 400).json({
      success: false,
      error: { code: 'UPDATE_ERROR', message: error.message },
    });
  }
};

// Marcar pago como realizado (cliente)
export const submitPayment = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const clientId = req.user?.userId;
    if (!clientId) {
      res.status(401).json({ success: false, error: { code: 'UNAUTHORIZED', message: 'No autenticado' } });
      return;
    }

    const { id } = req.params;
    const { paymentMethod, paymentReference, paymentDate } = req.body;

    if (!paymentMethod || !paymentReference) {
      res.status(400).json({
        success: false,
        error: { code: 'VALIDATION_ERROR', message: 'paymentMethod y paymentReference son requeridos' },
      });
      return;
    }

    // Collect uploaded file paths
    const paymentProof = (req as any).files?.map((f: any) => f.path || f.location || f.key) || [];

    const transaction = await transactionService.submitPayment(
      parseInt(id),
      clientId,
      {
        paymentMethod,
        paymentReference,
        paymentProof,
        paymentDate: paymentDate ? new Date(paymentDate) : new Date(),
      }
    );

    res.json({ success: true, data: { transaction } });
  } catch (error: any) {
    console.error('Error submitting payment:', error);
    res.status(error.message.includes('No autorizado') ? 403 : 400).json({
      success: false,
      error: { code: 'UPDATE_ERROR', message: error.message },
    });
  }
};

// Confirmar recepción de pago (propietario)
export const confirmPayment = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const ownerId = req.user?.userId;
    if (!ownerId) {
      res.status(401).json({ success: false, error: { code: 'UNAUTHORIZED', message: 'No autenticado' } });
      return;
    }

    const { id } = req.params;
    const transaction = await transactionService.confirmPayment(parseInt(id), ownerId);

    res.json({ success: true, data: { transaction } });
  } catch (error: any) {
    console.error('Error confirming payment:', error);
    res.status(error.message.includes('No autorizado') ? 403 : 400).json({
      success: false,
      error: { code: 'UPDATE_ERROR', message: error.message },
    });
  }
};

// Cancelar transacción
export const cancelTransaction = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const userId = req.user?.userId;
    if (!userId) {
      res.status(401).json({ success: false, error: { code: 'UNAUTHORIZED', message: 'No autenticado' } });
      return;
    }

    const { id } = req.params;
    const { reason } = req.body;

    if (!reason) {
      res.status(400).json({ success: false, error: { code: 'VALIDATION_ERROR', message: 'reason es requerido' } });
      return;
    }

    const transaction = await transactionService.cancelTransaction(parseInt(id), userId, reason);

    res.json({ success: true, data: { transaction } });
  } catch (error: any) {
    console.error('Error cancelling transaction:', error);
    res.status(error.message.includes('No autorizado') ? 403 : 400).json({
      success: false,
      error: { code: 'UPDATE_ERROR', message: error.message },
    });
  }
};

// Obtener mis transacciones
export const getMyTransactions = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const userId = req.user?.userId;
    const role = req.user?.role;
    if (!userId || !role) {
      res.status(401).json({ success: false, error: { code: 'UNAUTHORIZED', message: 'No autenticado' } });
      return;
    }

    const filters = {
      status: req.query.status as string | undefined,
      propertyId: req.query.propertyId ? parseInt(req.query.propertyId as string) : undefined,
    };

    const transactions = await transactionService.getUserTransactions(userId, role, filters);

    res.json({ success: true, data: { transactions } });
  } catch (error: any) {
    console.error('Error getting transactions:', error);
    res.status(500).json({ success: false, error: { code: 'FETCH_ERROR', message: 'Error al obtener transacciones' } });
  }
};

// Obtener detalles de transacción
export const getTransactionDetails = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const userId = req.user?.userId;
    const userRole = req.user?.role;
    if (!userId || !userRole) {
      res.status(401).json({ success: false, error: { code: 'UNAUTHORIZED', message: 'No autenticado' } });
      return;
    }

    const { id } = req.params;
    const transaction = await transactionService.getTransactionDetails(parseInt(id), userId, userRole);

    res.json({ success: true, data: { transaction } });
  } catch (error: any) {
    console.error('Error getting transaction details:', error);
    const statusCode = error.message.includes('No autorizado') ? 403 : error.message.includes('no encontrada') ? 404 : 500;
    res.status(statusCode).json({
      success: false,
      error: { code: 'FETCH_ERROR', message: error.message },
    });
  }
};

// Obtener transacción por rentalRequestId
export const getTransactionByRentalRequest = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const userId = req.user?.userId;
    if (!userId) {
      res.status(401).json({ success: false, error: { code: 'UNAUTHORIZED', message: 'No autenticado' } });
      return;
    }

    const { rentalRequestId } = req.params;
    const transaction = await transactionService.getTransactionByRentalRequest(
      parseInt(rentalRequestId),
      userId
    );

    if (!transaction) {
      res.status(404).json({ success: false, error: { code: 'NOT_FOUND', message: 'Transacción no encontrada para esta solicitud' } });
      return;
    }

    res.json({ success: true, data: { transaction } });
  } catch (error: any) {
    console.error('Error getting transaction by rental request:', error);
    res.status(500).json({ success: false, error: { code: 'FETCH_ERROR', message: error.message } });
  }
};

// Obtener todas las transacciones (admin/operator)
export const getAllTransactions = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { status, search, page = 1, limit = 20, startDate, endDate, paymentMethod } = req.query;
    const where: any = {};

    if (status) where.status = status;
    if (paymentMethod) where.paymentMethod = paymentMethod;
    if (startDate) where.createdAt = { ...where.createdAt, [Op.gte]: new Date(startDate as string) };
    if (endDate) where.createdAt = { ...where.createdAt, [Op.lte]: new Date(endDate as string) };

    const offset = (Number(page) - 1) * Number(limit);

    const { count, rows: transactions } = await (Transaction as any).findAndCountAll({
      where,
      include: [
        { model: Property, as: 'property', attributes: ['id', 'title', 'address', 'price', 'type', 'listingType'] },
        { model: User, as: 'owner', attributes: ['id', 'name', 'email', 'phone', 'isVerified'] },
        { model: User, as: 'client', attributes: ['id', 'name', 'email', 'phone', 'isVerified'] },
      ],
      offset,
      limit: Number(limit),
      order: [['createdAt', 'DESC']],
    });

    res.json({
      success: true,
      data: {
        transactions,
        pagination: {
          total: count,
          page: Number(page),
          limit: Number(limit),
          totalPages: Math.ceil(count / Number(limit)),
        },
      },
    });
  } catch (error: any) {
    console.error('Error getting all transactions:', error);
    res.status(500).json({ success: false, error: { code: 'FETCH_ERROR', message: 'Error al obtener transacciones' } });
  }
};

// Reembolsar transacción (admin/operator)
export const refundTransaction = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const actorId = req.user?.userId;
    if (!actorId) {
      res.status(401).json({ success: false, error: { code: 'UNAUTHORIZED', message: 'No autenticado' } });
      return;
    }

    const { id } = req.params;
    const { reason } = req.body;

    if (!reason) {
      res.status(400).json({ success: false, error: { code: 'VALIDATION_ERROR', message: 'reason es requerido' } });
      return;
    }

    // TODO: implementar refundPayment en TransactionService
    const transaction = await transactionService.cancelTransaction(parseInt(id), actorId, `[Reembolso] ${reason}`);

    res.json({ success: true, data: { transaction } });
  } catch (error: any) {
    console.error('Error refunding transaction:', error);
    res.status(error.message.includes('No autorizado') ? 403 : 400).json({
      success: false,
      error: { code: 'UPDATE_ERROR', message: error.message },
    });
  }
};

// Obtener estadísticas (admin/operator)
export const getTransactionStats = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const stats = await transactionService.getTransactionStats();
    res.json({ success: true, data: { stats } });
  } catch (error: any) {
    console.error('Error getting transaction stats:', error);
    res.status(500).json({ success: false, error: { code: 'FETCH_ERROR', message: 'Error al obtener estadísticas' } });
  }
};
