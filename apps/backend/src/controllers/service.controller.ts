import { Request, Response } from 'express';
import { Service } from '../models';
import { AuthRequest } from '../types';

export const getServices = async (req: Request, res: Response) => {
  try {
    const { category, isActive } = req.query;
    const where: any = {};
    if (category) where.category = category;
    if (isActive !== undefined) where.isActive = isActive === 'true';

    const services = await Service.findAll({
      where,
      order: [['category', 'ASC'], ['name', 'ASC']]
    });

    res.json({ success: true, data: services });
  } catch (error: any) {
    res.status(500).json({ success: false, error: { message: error.message } });
  }
};

export const createService = async (req: AuthRequest, res: Response) => {
  try {
    const service = await Service.create(req.body);
    res.status(201).json({ success: true, data: service });
  } catch (error: any) {
    res.status(500).json({ success: false, error: { message: error.message } });
  }
};

export const updateService = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const service = await Service.findByPk(id);
    if (!service) return res.status(404).json({ success: false, message: 'Service not found' });

    await service.update(req.body);
    res.json({ success: true, data: service });
  } catch (error: any) {
    res.status(500).json({ success: false, error: { message: error.message } });
  }
};
