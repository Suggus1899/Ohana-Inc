import { Request, Response } from 'express';
import { Op } from 'sequelize';
import { Notification } from '../models';
import { AuthRequest, ApiResponse } from '../types';
import { badgeService } from '../services/badge.service';
import { getIO } from '../websocket/socket';

export async function getNotifications(req: AuthRequest, res: Response): Promise<void> {
  try {
    const userId = req.user!.id;
    const page = Math.max(1, parseInt(req.query.page as string) || 1);
    const limit = Math.min(50, Math.max(1, parseInt(req.query.limit as string) || 20));
    const offset = (page - 1) * limit;

    const { rows, count } = await Notification.findAndCountAll({
      where: { userId },
      order: [['createdAt', 'DESC']],
      limit,
      offset
    });

    const response: ApiResponse = {
      success: true,
      data: {
        notifications: rows,
        pagination: { page, limit, total: count, pages: Math.ceil(count / limit) }
      }
    };
    res.json(response);
  } catch (error) {
    res.status(500).json({ success: false, error: { message: 'Error al obtener notificaciones' } });
  }
}

export async function getUnreadCount(req: AuthRequest, res: Response): Promise<void> {
  try {
    const userId = req.user!.id;
    const count = await Notification.count({ where: { userId, isRead: false } });
    res.json({ success: true, data: { count } });
  } catch (error) {
    res.status(500).json({ success: false, error: { message: 'Error al contar notificaciones' } });
  }
}

export async function markAsRead(req: AuthRequest, res: Response): Promise<void> {
  try {
    const userId = req.user!.id;
    const { id } = req.params;

    const notification = await Notification.findOne({ where: { id, userId } });
    if (!notification) {
      res.status(404).json({ success: false, error: { message: 'Notificación no encontrada' } });
      return;
    }

    await notification.update({ isRead: true });

    const io = getIO();
    if (io) {
      const count = await Notification.count({ where: { userId, isRead: false } });
      io.to(`user_${userId}`).emit('badge:update', { unreadNotifications: count });
    }

    res.json({ success: true, data: notification });
  } catch (error) {
    res.status(500).json({ success: false, error: { message: 'Error al actualizar notificación' } });
  }
}

export async function markAllAsRead(req: AuthRequest, res: Response): Promise<void> {
  try {
    const userId = req.user!.id;
    await Notification.update({ isRead: true }, { where: { userId, isRead: false } });

    const io = getIO();
    if (io) {
      io.to(`user_${userId}`).emit('badge:update', { unreadNotifications: 0 });
    }

    res.json({ success: true, data: { message: 'Todas las notificaciones marcadas como leídas' } });
  } catch (error) {
    res.status(500).json({ success: false, error: { message: 'Error al actualizar notificaciones' } });
  }
}

export async function deleteNotification(req: AuthRequest, res: Response): Promise<void> {
  try {
    const userId = req.user!.id;
    const { id } = req.params;

    const notification = await Notification.findOne({ where: { id, userId } });
    if (!notification) {
      res.status(404).json({ success: false, error: { message: 'Notificación no encontrada' } });
      return;
    }

    await notification.destroy();

    const io = getIO();
    if (io) {
      const count = await Notification.count({ where: { userId, isRead: false } });
      io.to(`user_${userId}`).emit('badge:update', { unreadNotifications: count });
    }

    res.json({ success: true, data: { message: 'Notificación eliminada' } });
  } catch (error) {
    res.status(500).json({ success: false, error: { message: 'Error al eliminar notificación' } });
  }
}

export async function getBadgeCounts(req: AuthRequest, res: Response): Promise<void> {
  try {
    const userId = req.user!.id;
    const role = req.user!.role || 'cliente';
    const counts = await badgeService.getCounts(userId, role);
    res.json({ success: true, data: counts });
  } catch (error) {
    res.status(500).json({ success: false, error: { message: 'Error al obtener contadores' } });
  }
}