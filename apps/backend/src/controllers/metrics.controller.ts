import { Request, Response, NextFunction } from 'express';
import { Op } from 'sequelize';
import { AuthRequest } from '../types';
import UserSession from '../models/UserSession';
import UserBehaviorEvent from '../models/UserBehaviorEvent';
import { sequelize } from '../config/database';

/**
 * POST /api/metrics/track-batch
 */
export const trackBatch = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const events = req.body;
    if (!Array.isArray(events) || events.length === 0) {
      return res.status(400).json({ success: false, error: { code: 'INVALID_PAYLOAD', message: 'Expected array of events' } });
    }
    // Limitar tamaño del batch para evitar abuso
    if (events.length > 100) {
      return res.status(400).json({ success: false, error: { code: 'BATCH_TOO_LARGE', message: 'Max 100 events per batch' } });
    }
    const VALID_EVENT_TYPES = new Set(['CLICK', 'SEARCH', 'VIEW', 'SCROLL_LIMIT']);
    const toCreate = events
      .filter((e: any) => VALID_EVENT_TYPES.has(e.event_type ?? e.eventType))
      .map((e: any) => ({
        sessionId: e.sessionId ?? null,
        userId: e.userId ?? null,
        eventType: e.event_type ?? e.eventType,
        targetElement: e.target_element ?? e.targetElement ?? null,
        metadata: e.metadata ?? null,
        createdAt: e.created_at ? new Date(e.created_at) : new Date()
      }));
    if (toCreate.length === 0) {
      return res.status(400).json({ success: false, error: { code: 'INVALID_PAYLOAD', message: 'No valid events in batch' } });
    }
    await UserBehaviorEvent.bulkCreate(toCreate, { validate: true });
    res.status(201).json({ success: true, data: { saved: toCreate.length } });
  } catch (error) {
    next(error);
  }
};

/**
 * POST /api/metrics/session/start
 */
export const sessionStart = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const userId = req.user?.userId ?? req.body.userId;
    if (!userId) return res.status(400).json({ success: false, error: { code: 'INVALID_USER', message: 'userId required' } });
    const osDevice = req.body.osDevice ?? null;
    const session = await UserSession.create({
      userId,
      startedAt: new Date(),
      osDevice
    });
    res.status(201).json({ success: true, data: { sessionId: session.id } });
  } catch (error) {
    next(error);
  }
};

/**
 * PUT /api/metrics/session/end
 */
export const sessionEnd = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const { sessionId } = req.body;
    if (!sessionId) return res.status(400).json({ success: false, error: { code: 'INVALID_PAYLOAD', message: 'sessionId required' } });
    const session = await UserSession.findByPk(sessionId);
    if (!session) return res.status(404).json({ success: false, error: { code: 'NOT_FOUND', message: 'Session not found' } });
    session.endedAt = new Date();
    if (session.startedAt) {
      const diff = (session.endedAt.getTime() - new Date(session.startedAt).getTime()) / 1000;
      session.durationSeconds = Math.max(0, Math.round(diff));
    }
    await session.save();
    res.json({ success: true, data: { sessionId: session.id, durationSeconds: session.durationSeconds } });
  } catch (error) {
    next(error);
  }
};

/**
 * GET /api/metrics/operator/behavior-summary
 */
export const behaviorSummary = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    if (!req.user) return res.status(401).json({ success: false, error: { code: 'UNAUTHORIZED', message: 'No autenticado' } });

    const startOfDay = new Date();
    startOfDay.setHours(0,0,0,0);

    const searches = await UserBehaviorEvent.findAll({
      where: { eventType: 'SEARCH', createdAt: { [Op.gte]: startOfDay } },
      attributes: ['metadata']
    });
    const counts = new Map<string, number>();
    for (const s of searches) {
      const md = (s as any).metadata || {};
      const q = md.query || md.q || md.term ? String(md.query || md.q || md.term).toLowerCase().trim() : null;
      if (!q) continue;
      counts.set(q, (counts.get(q) || 0) + 1);
    }
    const topSearches = Array.from(counts.entries()).sort((a,b)=>b[1]-a[1]).slice(0,5).map(([term, count])=>({ term, count }));

    const avgResult: any = await UserSession.findOne({
      attributes: [[sequelize.fn('AVG', sequelize.col('durationSeconds')), 'avgDuration']]
    });
    const avgDurationSeconds = avgResult?.get('avgDuration') ? Number(avgResult.get('avgDuration')) : 0;

    const clicks = await UserBehaviorEvent.findAll({ where: { eventType: 'CLICK' }, attributes: ['targetElement', 'metadata'] });
    const zoneCounts = new Map<string, number>();
    for (const c of clicks) {
      // targetElement es la zona real (ej: "BotonSolicitarAlquiler", "BotonFavorito")
      // fallback a metadata.zone si existe
      const md = (c as any).metadata || {};
      const zone = (c as any).targetElement || md.zone || md.region || 'unknown';
      zoneCounts.set(zone, (zoneCounts.get(zone) || 0) + 1);
    }
    const topZones = Array.from(zoneCounts.entries()).sort((a,b)=>b[1]-a[1]).slice(0,5).map(([zone, count])=>({ zone, count }));

    const totalEvents = await UserBehaviorEvent.count();
    const distributionRows = await UserBehaviorEvent.findAll({
      attributes: ['eventType', [sequelize.fn('COUNT', sequelize.col('eventType')), 'cnt']],
      group: ['eventType']
    });
    const distribution = distributionRows.map((r:any)=>{
      const cnt = Number(r.get('cnt'));
      return { eventType: r.get('eventType'), count: cnt, percentage: totalEvents > 0 ? Math.round((cnt/totalEvents)*100) : 0 };
    });

    const response = {
      topSearches,
      averageSessionDurationSeconds: Math.round(avgDurationSeconds),
      topZones,
      eventDistribution: distribution,
      generatedAt: new Date()
    };
    res.json({ success: true, data: response });
  } catch (error) {
    next(error);
  }
};

/**
 * GET /api/metrics/operator/trending-searches
 * Top búsquedas del mes actual (para la tabla "Trending Searches")
 */
export const trendingSearches = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    if (!req.user) return res.status(401).json({ success: false, error: { code: 'UNAUTHORIZED', message: 'No autenticado' } });

    const startOfMonth = new Date();
    startOfMonth.setDate(1);
    startOfMonth.setHours(0, 0, 0, 0);

    const searches = await UserBehaviorEvent.findAll({
      where: { eventType: 'SEARCH', createdAt: { [Op.gte]: startOfMonth } },
      attributes: ['metadata']
    });

    const counts = new Map<string, number>();
    for (const s of searches) {
      const md = (s as any).metadata || {};
      const q = md.query || md.q || md.term ? String(md.query || md.q || md.term).toLowerCase().trim() : null;
      if (!q) continue;
      counts.set(q, (counts.get(q) || 0) + 1);
    }

    const trending = Array.from(counts.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 20)
      .map(([term, count]) => ({ term, count }));

    res.json({ success: true, data: { trending, month: startOfMonth.toISOString().slice(0, 7) } });
  } catch (error) {
    next(error);
  }
};

/**
 * GET /api/metrics/operator/session-frequency
 * Sesiones nuevas por día en los últimos N días (para el LineChart)
 * Query param: ?days=30 (default 30)
 */
export const sessionFrequency = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    if (!req.user) return res.status(401).json({ success: false, error: { code: 'UNAUTHORIZED', message: 'No autenticado' } });

    const days = Math.min(Math.max(parseInt(req.query.days as string) || 30, 1), 90);
    const since = new Date();
    since.setDate(since.getDate() - days);
    since.setHours(0, 0, 0, 0);

    const rows = await UserSession.findAll({
      where: { startedAt: { [Op.gte]: since } },
      attributes: [
        [sequelize.fn('DATE', sequelize.col('startedAt')), 'date'],
        [sequelize.fn('COUNT', sequelize.col('id')), 'sessions']
      ],
      group: [sequelize.fn('DATE', sequelize.col('startedAt'))],
      order: [[sequelize.fn('DATE', sequelize.col('startedAt')), 'ASC']]
    });

    const data = rows.map((r: any) => ({
      date: r.get('date'),
      sessions: Number(r.get('sessions'))
    }));

    res.json({ success: true, data: { frequency: data, days } });
  } catch (error) {
    next(error);
  }
};
