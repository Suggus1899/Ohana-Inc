import { Request, Response } from 'express';
import { Op, fn, col, literal } from 'sequelize';
import { User, Property, SearchHistory, UserBehavior, Service, PropertyService } from '../models';

export const getStatisticsOverview = async (req: Request, res: Response) => {
  try {
    const { timeRange = '30' } = req.query;
    const days = parseInt(timeRange as string) || 30;
    const since = new Date();
    since.setDate(since.getDate() - days);

    const [
      totalUsers,
      activeUsers,
      newUsers,
      prevPeriodUsers,
      totalProperties,
      approvedProperties,
      pendingProperties,
      prevPeriodProperties,
    ] = await Promise.all([
      User.count({ where: { role: { [Op.notIn]: ['admin', 'operator'] } } }),
      User.count({ where: { role: { [Op.notIn]: ['admin', 'operator'] }, accountStatus: 'active' } }),
      User.count({ where: { role: { [Op.notIn]: ['admin', 'operator'] }, createdAt: { [Op.gte]: since } } }),
      User.count({ where: { role: { [Op.notIn]: ['admin', 'operator'] }, createdAt: { [Op.lt]: since } } }),
      Property.count({ paranoid: false }),
      Property.count({ where: { status: 'approved' } }),
      Property.count({ where: { status: 'pending' } }),
      Property.count({ where: { createdAt: { [Op.lt]: since } } }),
    ]);

    const userGrowth = prevPeriodUsers > 0 ? ((newUsers / prevPeriodUsers) * 100) : 0;
    const propNew = await Property.count({ where: { createdAt: { [Op.gte]: since } } });
    const propGrowth = prevPeriodProperties > 0 ? ((propNew / prevPeriodProperties) * 100) : 0;

    return res.json({
      success: true,
      data: {
        users: { total: totalUsers, active: activeUsers, new: newUsers, growth: Math.round(userGrowth * 10) / 10 },
        properties: { total: totalProperties, active: approvedProperties, pending: pendingProperties, growth: Math.round(propGrowth * 10) / 10 },
      }
    });
  } catch (error) {
    console.error('[Statistics] getStatisticsOverview error:', error);
    return res.status(500).json({ success: false, message: 'Internal server error' });
  }
};

export const getPropertyTypeCounts = async (_req: Request, res: Response) => {
  try {
    const counts = await Property.findAll({
      attributes: ['type', [fn('COUNT', col('Property.id')), 'count']],
      group: ['type'],
      raw: true,
    });
    return res.json({
      success: true,
      data: (counts as any[]).map(r => ({ type: r.type, count: parseInt(r.count) }))
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: 'Internal server error' });
  }
};

export const getServicePropertyCounts = async (_req: Request, res: Response) => {
  try {
    const counts = await PropertyService.findAll({
      attributes: ['serviceId', [fn('COUNT', col('PropertyService.propertyId')), 'count']],
      group: ['serviceId'],
      raw: true,
    });
    return res.json({
      success: true,
      data: (counts as any[]).map(r => ({ serviceId: r.serviceId, count: parseInt(r.count) }))
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: 'Internal server error' });
  }
};

export const getStatisticsTrends = async (req: Request, res: Response) => {
  try {
    const { timeRange = '30' } = req.query;
    const days = parseInt(timeRange as string) || 30;
    const since = new Date();
    since.setDate(since.getDate() - days);

    const [topSearches, hourlyActivity, propertyTypes] = await Promise.all([
      SearchHistory.findAll({
        attributes: [
          [literal('COALESCE("searchQuery", \'General\')'), 'term'],
          [fn('COUNT', col('SearchHistory.id')), 'count']
        ],
        where: { timestamp: { [Op.gte]: since } },
        group: [literal('COALESCE("searchQuery", \'General\')') as any],
        order: [[literal('count'), 'DESC']],
        limit: 10,
        raw: true,
      }),
      UserBehavior.findAll({
        attributes: [
          [literal('EXTRACT(HOUR FROM "timestamp")::int'), 'hour'],
          [fn('COUNT', col('UserBehavior.id')), 'activity']
        ],
        where: { timestamp: { [Op.gte]: since } },
        group: [literal('EXTRACT(HOUR FROM "timestamp")::int') as any],
        order: [[literal('EXTRACT(HOUR FROM "timestamp")::int'), 'ASC']],
        raw: true,
      }),
      Property.findAll({
        attributes: [
          'type',
          [fn('COUNT', col('Property.id')), 'count']
        ],
        group: ['type'],
        order: [[fn('COUNT', col('Property.id')), 'DESC']],
        raw: true,
      }),
    ]);

    const totalTypes = (propertyTypes as any[]).reduce((s, r) => s + parseInt(r.count), 0);
    const formattedTypes = (propertyTypes as any[]).map(r => ({
      type: r.type,
      count: parseInt(r.count),
      percentage: totalTypes > 0 ? Math.round((parseInt(r.count) / totalTypes) * 1000) / 10 : 0,
    }));

    return res.json({
      success: true,
      data: {
        topSearches: (topSearches as any[]).map(r => ({ term: r.term, count: parseInt(r.count) })),
        hourlyActivity: (hourlyActivity as any[]).map(r => ({ hour: r.hour, activity: parseInt(r.activity) })),
        propertyTypes: formattedTypes,
      }
    });
  } catch (error) {
    console.error('[Statistics] getStatisticsTrends error:', error);
    return res.status(500).json({ success: false, message: 'Internal server error' });
  }
};
