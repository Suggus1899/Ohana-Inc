import { Request, Response } from 'express';
import { UserBehavior, Property, User, SearchHistory, PropertyView } from '../models';
import { Op, fn, col, literal } from 'sequelize';
import { AuthRequest } from '../types';

export const getBehaviorDashboard = async (req: Request, res: Response) => {
  try {
    const { timeRange = '30d' } = req.query as { timeRange?: string };
    const range = new Date();
    if (timeRange === 'today') {
      range.setHours(0, 0, 0, 0);
    } else if (timeRange === '7d') {
      range.setDate(range.getDate() - 7);
    } else {
      range.setDate(range.getDate() - 30);
    }

    const [
      totalActions,
      actionsByType,
      topProperties,
      topSearchTerms,
      hourlyActivity
    ] = await Promise.all([
      UserBehavior.count({
        where: { timestamp: { [Op.gte]: range } }
      }),
      UserBehavior.findAll({
        attributes: [
          'eventType',
          [fn('COUNT', col('id')), 'count']
        ],
        where: { timestamp: { [Op.gte]: range } },
        group: ['eventType']
      }),
      PropertyView.findAll({
        attributes: [
          'propertyId',
          [fn('COUNT', col('PropertyView.id')), 'views']
        ],
        where: { 
          timestamp: { [Op.gte]: range } 
        },
        include: [{
          model: Property,
          as: 'property',
          attributes: ['id', 'title', 'price', 'type']
        }],
        group: ['propertyId', 'property.id', 'property.title', 'property.price', 'property.type'],
        order: [[literal('views'), 'DESC']],
        limit: 5
      }),
      SearchHistory.findAll({
        attributes: [
          [literal('COALESCE("searchQuery", \'General\')'), 'query'],
          [fn('COUNT', col('id')), 'count']
        ],
        where: { timestamp: { [Op.gte]: range } },
        group: [literal('COALESCE("searchQuery", \'General\')') as any],
        order: [[literal('count'), 'DESC']],
        limit: 10
      }),
      UserBehavior.findAll({
        attributes: [
          [literal('EXTRACT(HOUR FROM "timestamp")'), 'hour'],
          [fn('COUNT', col('id')), 'count']
        ],
        where: { timestamp: { [Op.gte]: range } },
        group: [literal('EXTRACT(HOUR FROM "timestamp")') as any],
        order: [[literal('hour'), 'ASC']]
      })
    ]);

    res.json({
      success: true,
      data: {
        totalActions,
        actionsByType,
        topProperties,
        topSearchTerms,
        hourlyActivity
      }
    });

  } catch (error: any) {
    console.error('[ANALYTICS] Error:', error);
    res.status(500).json({
      success: false,
      error: { code: 'ANALYTICS_ERROR', message: error.message }
    });
  }
};

export const getConversionStats = async (req: Request, res: Response) => {
    try {
        const stats = await UserBehavior.findAll({
            attributes: [
                'eventType',
                [fn('COUNT', col('id')), 'count']
            ],
            where: {
                eventType: { [Op.in]: ['view', 'request'] }
            },
            group: ['eventType']
        });

        const counts: Record<string, number> = { view: 0, request: 0 };
        stats.forEach((s: any) => {
            const type = s.get('eventType') as string;
            if (type in counts) {
                counts[type] = parseInt(s.get('count'));
            }
        });

        const rate = counts.view > 0 ? (counts.request / counts.view) * 100 : 0;

        res.json({
            success: true,
            data: {
                views: counts.view,
                requests: counts.request,
                conversionRate: rate.toFixed(2) + '%'
            }
        });
    } catch (error: any) {
        res.status(500).json({ success: false, error: { message: error.message } });
    }
};
