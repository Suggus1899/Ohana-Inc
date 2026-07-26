import { Request, Response } from 'express';
import PropertyVisit from '../models/PropertyVisit';
import Property from '../models/Property';
import { AuthRequest } from '../types';

export const createVisit = async (req: AuthRequest, res: Response) => {
  try {
    const { propertyId, name, email, phone, visitDate, message } = req.body;

    if (!propertyId || !name || !email || !phone || !visitDate) {
      return res.status(400).json({
        success: false,
        error: { code: 'VALIDATION_ERROR', message: 'Faltan campos requeridos: propertyId, name, email, phone, visitDate' }
      });
    }

    const property = await Property.findByPk(propertyId);
    if (!property) {
      return res.status(404).json({
        success: false,
        error: { code: 'NOT_FOUND', message: 'Propiedad no encontrada' }
      });
    }

    const visit = await PropertyVisit.create({
      propertyId,
      userId: req.user?.id || null,
      name,
      email,
      phone,
      visitDate: new Date(visitDate),
      message: message || null,
      status: 'pending',
    });

    res.status(201).json({ success: true, data: { visit } });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      error: { code: 'CREATE_ERROR', message: error.message }
    });
  }
};

export const getPropertyVisits = async (req: AuthRequest, res: Response) => {
  try {
    const { propertyId } = req.params;
    const userId = req.user?.userId;
    const userRole = req.user?.role;
    if (!userId) {
      return res.status(401).json({
        success: false,
        error: { code: 'UNAUTHORIZED', message: 'No autenticado' }
      });
    }

    // Authorization: property owner or admin/operator
    const isPrivileged = userRole === 'admin' || userRole === 'operator';
    if (!isPrivileged) {
      const property = await Property.findByPk(propertyId, { attributes: ['authorId'] });
      if (!property) {
        return res.status(404).json({
          success: false,
          error: { code: 'NOT_FOUND', message: 'Propiedad no encontrada' }
        });
      }
      if (property.authorId !== userId) {
        return res.status(403).json({
          success: false,
          error: { code: 'FORBIDDEN', message: 'No tienes acceso a las visitas de esta propiedad' }
        });
      }
    }

    const visits = await PropertyVisit.findAll({
      where: { propertyId },
      order: [['createdAt', 'DESC']],
    });
    res.json({ success: true, data: { visits } });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      error: { code: 'FETCH_ERROR', message: error.message }
    });
  }
};

export const updateVisitStatus = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const { status, scheduledTime } = req.body;

    if (!['pending', 'confirmed', 'cancelled', 'completed'].includes(status)) {
      return res.status(400).json({
        success: false,
        error: { code: 'VALIDATION_ERROR', message: 'Estado inválido' }
      });
    }

    const visit = await PropertyVisit.findByPk(id);
    if (!visit) {
      return res.status(404).json({
        success: false,
        error: { code: 'NOT_FOUND', message: 'Visita no encontrada' }
      });
    }

    const updateData: any = { status };

    if (status === 'confirmed' && scheduledTime) {
      const current = new Date(visit.visitDate);
      const [hours, minutes] = scheduledTime.split(':').map(Number);
      current.setHours(hours, minutes, 0, 0);
      updateData.visitDate = current;
    }

    await visit.update(updateData);
    const updated = await PropertyVisit.findByPk(id, {
      include: [{ model: Property, as: 'property', attributes: ['id', 'title', 'address', 'mainImage'] }],
    });
    res.json({ success: true, data: { visit: updated } });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      error: { code: 'UPDATE_ERROR', message: error.message }
    });
  }
};

export const getMyVisits = async (req: AuthRequest, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        error: { code: 'UNAUTHORIZED', message: 'No autenticado' }
      });
    }

    const visits = await PropertyVisit.findAll({
      where: { userId: req.user.id },
      include: [{ model: Property, as: 'property', attributes: ['id', 'title', 'address', 'mainImage'] }],
      order: [['visitDate', 'DESC']],
    });

    res.json({ success: true, data: { visits } });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      error: { code: 'FETCH_ERROR', message: error.message }
    });
  }
};

export const getOwnerVisits = async (req: AuthRequest, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        error: { code: 'UNAUTHORIZED', message: 'No autenticado' }
      });
    }

    const properties = await Property.findAll({
      where: { authorId: req.user.id },
      attributes: ['id'],
    });

    const propertyIds = properties.map(p => p.id);
    if (propertyIds.length === 0) {
      return res.json({ success: true, data: { visits: [] } });
    }

    const visits = await PropertyVisit.findAll({
      where: { propertyId: propertyIds },
      include: [
        { model: Property, as: 'property', attributes: ['id', 'title', 'address', 'mainImage'] },
      ],
      order: [['createdAt', 'DESC']],
    });

    res.json({ success: true, data: { visits } });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      error: { code: 'FETCH_ERROR', message: error.message }
    });
  }
};