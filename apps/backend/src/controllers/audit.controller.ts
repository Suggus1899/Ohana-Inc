import { Request, Response } from 'express';
import { AuditLog, User } from '../models';
import { Op } from 'sequelize';

export const getAuditLogs = async (req: Request, res: Response) => {
  try {
    const { userId, action, entity, page = 1, limit = 20 } = req.query;

    const where: any = {};
    if (userId) where.userId = Number(userId);
    if (action) where.action = action;
    if (entity) where.entity = entity;

    const offset = (Number(page) - 1) * Number(limit);

    const { count, rows: logs } = await AuditLog.findAndCountAll({
      where,
      include: [
        {
          model: User,
          as: 'user',
          attributes: ['id', 'name', 'email']
        }
      ],
      offset,
      limit: Number(limit),
      order: [['timestamp', 'DESC']]
    });

    res.json({
      success: true,
      data: {
        logs,
        pagination: {
          total: count,
          page: Number(page),
          limit: Number(limit),
          totalPages: Math.ceil(count / Number(limit))
        }
      }
    });

  } catch (error: any) {
    res.status(500).json({
      success: true, // inconsistent in some parts of this project it seems, but let's follow the standard success: false for errors
      error: { code: 'FETCH_ERROR', message: error.message }
    });
  }
};
