import { Op } from 'sequelize';
import { User, Notification, ChatConversation, ChatMessage, Property, Transaction } from '../models';
import { TransactionStatus } from '../models/Transaction';

export interface BadgeCounts {
  unreadNotifications: number;
  // Role-specific
  pendingKYC?: number;
  pendingReports?: number;
  draftAnnouncements?: number;
  pendingVerifications?: number;
  pendingReviews?: number;
  pendingSupport?: number;
  pendingTasks?: number;
  unreadMessages?: number;
  pendingRequests?: number;
  activeRequests?: number;
}

export class BadgeService {
  async getCounts(userId: number, role: string): Promise<BadgeCounts> {
    const base = {
      unreadNotifications: await Notification.count({ where: { userId, isRead: false } }),
    };

    const normalizedRole = role.toLowerCase();

    if (normalizedRole === 'admin') {
      const [verifications, reports, announcements] = await Promise.all([
        // Properties not yet verified
        Property.count({ where: { isVerified: false } }),
        // Disputed transactions
        Transaction.count({ where: { status: TransactionStatus.DISPUTED } }),
        // Properties pending approval (draft announcements)
        Property.count({ where: { status: 'pending' as any } }),
      ]);
      return {
        ...base,
        pendingKYC: verifications,
        pendingReports: reports,
        draftAnnouncements: announcements,
      };
    }

    if (normalizedRole === 'operator') {
      const [verifications, reviews, tickets, reports] = await Promise.all([
        // Properties not yet verified
        Property.count({ where: { isVerified: false } }),
        // Properties pending review/approval
        Property.count({ where: { status: 'pending' as any } }),
        // Disputed transactions (support tickets)
        Transaction.count({ where: { status: TransactionStatus.DISPUTED } }),
        // Flagged = disputed
        Transaction.count({ where: { status: TransactionStatus.DISPUTED } }),
      ]);
      return {
        ...base,
        pendingVerifications: verifications,
        pendingReviews: reviews,
        pendingSupport: tickets,
        pendingReports: reports,
      };
    }

    // owner/propietario
    if (normalizedRole === 'owner' || normalizedRole === 'propietario') {
      const [unreadMessages, pendingRequests] = await Promise.all([
        ChatConversation.sum('unreadCount' as any, {
          where: { participant1Id: userId },
        }).then((r: any) => r || 0),
        // Pending transactions owned by this user
        Transaction.count({ where: { ownerId: userId, status: TransactionStatus.PENDING_OWNER_APPROVAL } }),
      ]);
      return {
        ...base,
        unreadMessages: Number(unreadMessages),
        pendingRequests,
      };
    }

    // client / estudiante / default
    const [unreadMessages, activeRequests] = await Promise.all([
      ChatConversation.sum('unreadCount' as any, {
        where: { participant2Id: userId },
      }).then((r: any) => r || 0),
      // Active transactions for this client
      Transaction.count({
        where: {
          clientId: userId,
          status: { [Op.in]: [TransactionStatus.PENDING_OWNER_APPROVAL, TransactionStatus.PENDING_PAYMENT] },
        },
      }),
    ]);
    return {
      ...base,
      unreadMessages: Number(unreadMessages),
      activeRequests,
    };
  }
}

export const badgeService = new BadgeService();
