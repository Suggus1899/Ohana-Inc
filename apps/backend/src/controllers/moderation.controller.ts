import { Request, Response } from 'express';
import { Property, User, Ticket, Report, Task, Announcement } from '../models';
import RentalRequest from '../models/RentalRequest';
import { Op } from 'sequelize';
import { AuthRequest } from '../types';

export const getModeratorStats = async (req: Request, res: Response) => {
  try {
    const authReq = req as AuthRequest;
    if (!authReq.user) {
       return res.status(401).json({ success: false, error: { code: 'UNAUTHORIZED', message: 'Not authenticated' } });
    }
    
    const moderatorId = Number(authReq.user.userId);
    
    // Start of day in UTC for consistency with DB
    const now = new Date();
    const startOfToday = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()));

    // Fetch counts in parallel
    const [
      approvedPropsToday,
      rejectedPropsToday,
      verifiedUsersTodayCount,
      pendingPropertiesCount,
      pendingVerificationsCount,
      pendingTicketsCount,
      pendingReportsCount,
      resolvedTicketsTodayCount,
      pendingTasksCount,
      completedTasksTodayCount
    ] = await Promise.all([
      Property.count({ where: { moderatorId, status: 'approved', updatedAt: { [Op.gte]: startOfToday } } }),
      Property.count({ where: { moderatorId, status: 'rejected', updatedAt: { [Op.gte]: startOfToday } } }),
      User.count({ where: { verifiedById: moderatorId, isVerified: true, updatedAt: { [Op.gte]: startOfToday } } }),
      Property.count({ where: { status: 'pending' } }),
      User.count({ where: { role: 'propietario', isVerified: false } }),
      Ticket.count({ where: { status: { [Op.ne]: 'resolved' } } }),
      Report.count({ where: { status: 'pending' } }),
      Ticket.count({ where: { status: 'resolved', updatedAt: { [Op.gte]: startOfToday } } }),
      Task.count({ where: { assignedToId: moderatorId, status: { [Op.ne]: 'completed' } } }),
      Task.count({ where: { assignedToId: moderatorId, status: 'completed', updatedAt: { [Op.gte]: startOfToday } } })
    ]);

    res.json({
      success: true,
      data: {
        today: {
          propertiesModerated: approvedPropsToday + rejectedPropsToday,
          propertiesApproved: approvedPropsToday,
          propertiesRejected: rejectedPropsToday,
          usersVerified: verifiedUsersTodayCount,
          resolvedTickets: resolvedTicketsTodayCount,
          tasksCompleted: completedTasksTodayCount,
          totalActions: approvedPropsToday + rejectedPropsToday + verifiedUsersTodayCount + resolvedTicketsTodayCount + completedTasksTodayCount
        },
        pending: {
          properties: pendingPropertiesCount,
          verifications: pendingVerificationsCount,
          tickets: pendingTicketsCount,
          reports: pendingReportsCount,
          tasks: pendingTasksCount,
          total: pendingPropertiesCount + pendingVerificationsCount + pendingTicketsCount + pendingReportsCount + pendingTasksCount
        }
      }
    });

  } catch (error: any) {
    console.error('[ERROR] Stats failed:', error);
    res.status(500).json({
      success: false,
      error: { code: 'STATS_ERROR', message: error.message }
    });
  }
};

export const getAdminStats = async (req: Request, res: Response) => {
  try {
    const authReq = req as AuthRequest;
    if (!authReq.user) {
      return res.status(401).json({ success: false, error: { code: 'UNAUTHORIZED', message: 'Not authenticated' } });
    }

    const now = new Date();
    const startOfMonth = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1));
    const startOfLastMonth = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth() - 1, 1));
    const endOfLastMonth = new Date(startOfMonth.getTime() - 1);

    const [
      totalUsers, usersThisMonth, usersLastMonth,
      totalProperties, propertiesThisMonth,
      pendingProperties, approvedProperties,
      totalRequests, pendingTickets,
      totalOperators, activeAnnouncements
    ] = await Promise.all([
      User.count({ where: { role: { [Op.notIn]: ['admin'] } } }),
      User.count({ where: { role: { [Op.notIn]: ['admin'] }, createdAt: { [Op.gte]: startOfMonth } } }),
      User.count({ where: { role: { [Op.notIn]: ['admin'] }, createdAt: { [Op.between]: [startOfLastMonth, endOfLastMonth] } } }),
      Property.count({ paranoid: false }),
      Property.count({ where: { createdAt: { [Op.gte]: startOfMonth } } }),
      Property.count({ where: { status: 'pending' } }),
      Property.count({ where: { status: 'approved' } }),
      RentalRequest.count(),
      Ticket.count({ where: { status: { [Op.ne]: 'resolved' } } }),
      User.count({ where: { role: 'operator' } }),
      Announcement.count({ where: { status: 'active' } }),
    ]);

    const recentUsers = await User.findAll({
      attributes: ['id', 'name', 'email', 'role', 'accountStatus', 'isVerified', 'createdAt'],
      where: { role: { [Op.notIn]: ['admin'] } },
      order: [['createdAt', 'DESC']],
      limit: 5,
    });

    const userGrowth = usersLastMonth > 0
      ? Math.round(((usersThisMonth - usersLastMonth) / usersLastMonth) * 100)
      : usersThisMonth > 0 ? 100 : 0;

    res.json({
      success: true,
      data: {
        totals: {
          users: totalUsers,
          properties: totalProperties,
          requests: totalRequests,
          pendingTickets,
          operators: totalOperators,
          pendingProperties,
          approvedProperties,
          activeAnnouncements,
        },
        growth: {
          usersThisMonth,
          usersLastMonth,
          userGrowthPercent: userGrowth,
          propertiesThisMonth,
        },
        recentUsers,
      },
    });
  } catch (error: any) {
    console.error('[ERROR] Admin stats failed:', error);
    res.status(500).json({ success: false, error: { code: 'ADMIN_STATS_ERROR', message: error.message } });
  }
};
