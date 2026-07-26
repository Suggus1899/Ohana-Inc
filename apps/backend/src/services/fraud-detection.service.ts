import Transaction, { TransactionStatus } from '../models/Transaction';
import Dispute from '../models/Dispute';
import User from '../models/User';
import { Op } from 'sequelize';

export class FraudDetectionService {
  // Verificar comportamiento sospechoso
  public async checkSuspiciousActivity(userId: number): Promise<{
    isSuspicious: boolean;
    reasons: string[];
  }> {
    const reasons: string[] = [];

    // 1. Múltiples transacciones canceladas en los últimos 30 días
    const cancelledCount = await Transaction.count({
      where: {
        [Op.or]: [{ clientId: userId }, { ownerId: userId }],
        status: TransactionStatus.CANCELLED,
        createdAt: {
          [Op.gte]: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
        },
      },
    });

    if (cancelledCount >= 5) {
      reasons.push('Múltiples transacciones canceladas en el último mes');
    }

    // 2. Múltiples disputas en los últimos 30 días
    const disputeCount = await Dispute.count({
      where: {
        [Op.or]: [{ reportedBy: userId }, { reportedAgainst: userId }],
        createdAt: {
          [Op.gte]: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
        },
      },
    });

    if (disputeCount >= 3) {
      reasons.push('Múltiples disputas en el último mes');
    }

    // 3. Cuenta muy nueva con transacciones grandes
    const user = await User.findByPk(userId);
    if (user) {
      const accountAge = Date.now() - new Date(user.createdAt).getTime();
      const daysSinceCreation = accountAge / (24 * 60 * 60 * 1000);

      if (daysSinceCreation < 7) {
        const largeTransactions = await Transaction.count({
          where: {
            clientId: userId,
            amount: { [Op.gte]: 10000 },
          },
        });

        if (largeTransactions > 0) {
          reasons.push('Cuenta nueva con transacciones de alto valor');
        }
      }
    }

    // 4. Patrones de tiempo sospechosos (demasiadas en 24h)
    const recentTransactions = await Transaction.count({
      where: {
        clientId: userId,
        createdAt: {
          [Op.gte]: new Date(Date.now() - 24 * 60 * 60 * 1000),
        },
      },
    });

    if (recentTransactions >= 10) {
      reasons.push('Demasiadas transacciones en poco tiempo');
    }

    return {
      isSuspicious: reasons.length > 0,
      reasons,
    };
  }
}
