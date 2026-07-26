import { Response } from 'express';
import { AuthRequest } from '../types';
import Settings from '../models/Settings';

declare const console: any;

export const getSettings = async (_req: AuthRequest, res: Response) => {
  try {
    const settings = await Settings.findAll({ order: [['key', 'ASC']] });
    const result: Record<string, any> = {};

    for (const setting of settings) {
      const { key, value, type } = setting;
      switch (type) {
        case 'number':
          result[key] = Number(value);
          break;
        case 'boolean':
          result[key] = value === 'true';
          break;
        case 'json':
          try { result[key] = JSON.parse(value); } catch { result[key] = value; }
          break;
        default:
          result[key] = value;
      }
    }

    res.json({ success: true, data: { settings: result } });
  } catch (error: any) {
    console.error('Error fetching settings:', error);
    res.status(500).json({
      success: false,
      error: { code: 'FETCH_ERROR', message: 'Error al cargar configuración' },
    });
  }
};

export const updateSettings = async (req: AuthRequest, res: Response) => {
  try {
    const updates = req.body.settings;

    if (!updates || typeof updates !== 'object') {
      return res.status(400).json({
        success: false,
        error: { code: 'VALIDATION_ERROR', message: 'settings object is required' },
      });
    }

    const errors: string[] = [];

    for (const [key, value] of Object.entries(updates)) {
      try {
        const existing = await Settings.findOne({ where: { key } });
        if (existing) {
          const serialized = existing.type === 'json' ? JSON.stringify(value) : String(value);
          await existing.update({ value: serialized });
        } else {
          const inferredType = typeof value === 'number' ? 'number'
            : typeof value === 'boolean' ? 'boolean'
            : typeof value === 'object' ? 'json'
            : 'string';
          const serialized = typeof value === 'object' ? JSON.stringify(value) : String(value);
          await Settings.create({
            key,
            value: serialized,
            type: inferredType as any,
            description: `Auto-created setting: ${key}`,
          });
        }
      } catch (err: any) {
        errors.push(`${key}: ${err.message}`);
      }
    }

    const settings = await Settings.findAll({ order: [['key', 'ASC']] });
    const result: Record<string, any> = {};
    for (const setting of settings) {
      const { key, value, type } = setting;
      switch (type) {
        case 'number': result[key] = Number(value); break;
        case 'boolean': result[key] = value === 'true'; break;
        case 'json':
          try { result[key] = JSON.parse(value); } catch { result[key] = value; }
          break;
        default: result[key] = value;
      }
    }

    res.json({
      success: true,
      data: { settings: result },
      ...(errors.length > 0 && { warnings: errors }),
    });
  } catch (error: any) {
    console.error('Error updating settings:', error);
    res.status(500).json({
      success: false,
      error: { code: 'UPDATE_ERROR', message: 'Error al actualizar configuración' },
    });
  }
};
