import { Response, NextFunction } from 'express';
import { AuthRequest } from '../types';
import Transaction, { TransactionStatus } from '../models/Transaction';
import User from '../models/User';
import { Op } from 'sequelize';
import { FraudDetectionService } from '../services/fraud-detection.service';

const fraudDetectionService = new FraudDetectionService();

export const transactionLimitsMiddleware = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const userId = req.user?.userId;
    if (!userId) {
      res.status(401).json({ success: false, error: { code: 'UNAUTHORIZED', message: 'No autenticado' } });
      return;
    }

    // Límite de transacciones activas simultáneas
    const activeTransactions = await Transaction.count({
      where: {
        clientId: userId,
        status: {
          [Op.in]: [
            TransactionStatus.PENDING_OWNER_APPROVAL,
            TransactionStatus.PENDING_PAYMENT,
            TransactionStatus.PAYMENT_SUBMITTED,
          ],
        },
      },
    });

    if (activeTransactions >= 5) {
      res.status(429).json({
        success: false,
        error: {
          code: 'LIMIT_EXCEEDED',
          message: 'Has alcanzado el límite de transacciones activas simultáneas (5)',
        },
      });
      return;
    }

    // Límite de monto diario para cuentas nuevas (< 30 días)
    const user = await User.findByPk(userId);
    if (user) {
      const accountAge = Date.now() - new Date(user.createdAt).getTime();
      const daysSinceCreation = accountAge / (24 * 60 * 60 * 1000);

      if (daysSinceCreation < 30) {
        const todaySum = await Transaction.sum('amount', {
          where: {
            clientId: userId,
            createdAt: {
              [Op.gte]: new Date(new Date().setHours(0, 0, 0, 0)),
            },
          },
        });

        if ((todaySum || 0) >= 50000) {
          res.status(429).json({
            success: false,
            error: {
              code: 'LIMIT_EXCEEDED',
              message: 'Has alcanzado el límite diario de transacciones para cuentas nuevas ($50,000)',
            },
          });
          return;
        }
      }
    }

    // Verificar actividad sospechosa
    const { isSuspicious, reasons } = await fraudDetectionService.checkSuspiciousActivity(userId);
    if (isSuspicious) {
      console.warn(`⚠️ Actividad sospechosa detectada para usuario ${userId}:`, reasons);
      // No bloquear, pero registrar en metadata de la transacción
      (req as any).suspiciousActivity = { isSuspicious, reasons };
    }

    next();
  } catch (error) {
    console.error('Error in transaction limits middleware:', error);
    next();
  }
};
