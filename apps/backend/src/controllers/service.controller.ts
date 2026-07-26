import { Request, Response } from 'express';
import { Service } from '../models';
import { AuthRequest } from '../types';

const SERVICE_FIELDS = ['name', 'description', 'icon', 'category', 'isActive'] as const;
type ServiceField = typeof SERVICE_FIELDS[number];

function pickServiceFields(body: any): Partial<Record<ServiceField, any>> {
  const picked: Partial<Record<ServiceField, any>> = {};
  for (const field of SERVICE_FIELDS) {
    if (body[field] !== undefined) {
      picked[field] = body[field];
    }
  }
  return picked;
}

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
    const data = pickServiceFields(req.body);
    if (!data.name || !data.icon || !data.category) {
      return res.status(400).json({ success: false, error: { code: 'VALIDATION_ERROR', message: 'name, icon and category are required' } });
    }
    const service = await Service.create(data);
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

    const data = pickServiceFields(req.body);
    await service.update(data);
    res.json({ success: true, data: service });
  } catch (error: any) {
    res.status(500).json({ success: false, error: { message: error.message } });
  }
};
