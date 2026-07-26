import { Request, Response } from 'express';
import { Op } from 'sequelize';
import Announcement from '../models/Announcement';
import User from '../models/User';
import { ApiResponse } from '../types';

export const getAnnouncements = async (req: Request, res: Response) => {
  try {
    const { status, targetAudience, search, page = '1', limit = '20' } = req.query as Record<string, string>;
    const where: Record<string, unknown> = {};

    if (status) where.status = status;
    if (targetAudience) where.targetAudience = targetAudience;
    if (search) where.title = { [Op.iLike]: `%${search}%` };

    const offset = (parseInt(page) - 1) * parseInt(limit);
    const { rows: announcements, count: total } = await Announcement.findAndCountAll({
      where,
      include: [{ model: User, as: 'createdBy', attributes: ['id', 'name', 'email'] }],
      order: [['createdAt', 'DESC']],
      limit: parseInt(limit),
      offset,
    });

    const response: ApiResponse = {
      success: true,
      data: {
        announcements,
        total,
        page: parseInt(page),
        limit: parseInt(limit),
        totalPages: Math.ceil(total / parseInt(limit)),
      },
    };
    res.json(response);
  } catch (error) {
    res.status(500).json({ success: false, message: 'Error al obtener anuncios' });
  }
};

export const createAnnouncement = async (req: Request, res: Response) => {
  try {
    const { title, content, targetAudience, status, expiresAt } = req.body;
    const userId = (req as any).user?.id;

    if (!title?.trim() || !content?.trim()) {
      return res.status(400).json({ success: false, message: 'Título y contenido son requeridos' });
    }

    const announcement = await Announcement.create({
      title: title.trim(),
      content: content.trim(),
      targetAudience: targetAudience ?? 'all',
      status: status ?? 'draft',
      createdById: userId,
      expiresAt: expiresAt ? new Date(expiresAt) : null,
    });

    const full = await Announcement.findByPk(announcement.id, {
      include: [{ model: User, as: 'createdBy', attributes: ['id', 'name', 'email'] }],
    });

    res.status(201).json({ success: true, data: { announcement: full } });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Error al crear anuncio' });
  }
};

export const updateAnnouncement = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { title, content, targetAudience, status, expiresAt } = req.body;

    const announcement = await Announcement.findByPk(id);
    if (!announcement) {
      return res.status(404).json({ success: false, message: 'Anuncio no encontrado' });
    }

    await announcement.update({
      ...(title !== undefined && { title: title.trim() }),
      ...(content !== undefined && { content: content.trim() }),
      ...(targetAudience !== undefined && { targetAudience }),
      ...(status !== undefined && { status }),
      ...(expiresAt !== undefined && { expiresAt: expiresAt ? new Date(expiresAt) : null }),
    });

    const updated = await Announcement.findByPk(id, {
      include: [{ model: User, as: 'createdBy', attributes: ['id', 'name', 'email'] }],
    });

    res.json({ success: true, data: { announcement: updated } });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Error al actualizar anuncio' });
  }
};

export const deleteAnnouncement = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const announcement = await Announcement.findByPk(id);
    if (!announcement) {
      return res.status(404).json({ success: false, message: 'Anuncio no encontrado' });
    }
    await announcement.destroy();
    res.json({ success: true, message: 'Anuncio eliminado' });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Error al eliminar anuncio' });
  }
};

export const publishAnnouncement = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const announcement = await Announcement.findByPk(id);
    if (!announcement) {
      return res.status(404).json({ success: false, message: 'Anuncio no encontrado' });
    }
    await announcement.update({ status: 'active' });
    res.json({ success: true, data: { announcement } });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Error al publicar anuncio' });
  }
};
