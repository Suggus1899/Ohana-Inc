import { Response } from 'express';
import { AuthRequest } from '../types';
import { DisputeService } from '../services/dispute.service';

const disputeService = new DisputeService();

// Crear disputa
export const createDispute = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const userId = req.user?.userId;
    if (!userId) {
      res.status(401).json({ success: false, error: { code: 'UNAUTHORIZED', message: 'No autenticado' } });
      return;
    }

    const { transactionId, reason, description } = req.body;

    if (!transactionId || !reason || !description) {
      res.status(400).json({
        success: false,
        error: { code: 'VALIDATION_ERROR', message: 'transactionId, reason y description son requeridos' },
      });
      return;
    }

    // Collect uploaded evidence file paths
    const evidence = (req as any).files?.map((f: any) => f.path || f.location || f.key) || [];

    const dispute = await disputeService.createDispute(transactionId, userId, {
      reason,
      description,
      evidence,
    });

    res.status(201).json({ success: true, data: { dispute } });
  } catch (error: any) {
    console.error('Error creating dispute:', error);
    res.status(error.message.includes('No autorizado') ? 403 : 400).json({
      success: false,
      error: { code: 'CREATE_ERROR', message: error.message },
    });
  }
};

// Resolver disputa (operador/admin)
export const resolveDispute = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const resolvedBy = req.user?.userId;
    if (!resolvedBy) {
      res.status(401).json({ success: false, error: { code: 'UNAUTHORIZED', message: 'No autenticado' } });
      return;
    }

    const { id } = req.params;
    const { decision, notes } = req.body;

    if (!decision || !notes) {
      res.status(400).json({
        success: false,
        error: { code: 'VALIDATION_ERROR', message: 'decision y notes son requeridos' },
      });
      return;
    }

    if (!['refund', 'release', 'cancel'].includes(decision)) {
      res.status(400).json({
        success: false,
        error: { code: 'VALIDATION_ERROR', message: 'decision debe ser refund, release o cancel' },
      });
      return;
    }

    const dispute = await disputeService.resolveDispute(parseInt(id), resolvedBy, { decision, notes });

    res.json({ success: true, data: { dispute } });
  } catch (error: any) {
    console.error('Error resolving dispute:', error);
    res.status(400).json({
      success: false,
      error: { code: 'UPDATE_ERROR', message: error.message },
    });
  }
};

// Marcar como bajo revisión (operador/admin)
export const markUnderReview = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const operatorId = req.user?.userId;
    if (!operatorId) {
      res.status(401).json({ success: false, error: { code: 'UNAUTHORIZED', message: 'No autenticado' } });
      return;
    }

    const { id } = req.params;
    const dispute = await disputeService.markUnderReview(parseInt(id), operatorId);

    res.json({ success: true, data: { dispute } });
  } catch (error: any) {
    console.error('Error marking dispute under review:', error);
    res.status(400).json({
      success: false,
      error: { code: 'UPDATE_ERROR', message: error.message },
    });
  }
};

// Obtener disputas pendientes (operador/admin)
export const getPendingDisputes = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const disputes = await disputeService.getPendingDisputes();
    res.json({ success: true, data: { disputes } });
  } catch (error: any) {
    console.error('Error getting pending disputes:', error);
    res.status(500).json({
      success: false,
      error: { code: 'FETCH_ERROR', message: 'Error al obtener disputas' },
    });
  }
};

// Obtener detalle de disputa
export const getDisputeDetails = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const userId = req.user?.userId;
    const userRole = req.user?.role;
    if (!userId) {
      res.status(401).json({ success: false, error: { code: 'UNAUTHORIZED', message: 'No autenticado' } });
      return;
    }

    const dispute = await disputeService.getDisputeDetails(parseInt(id));

    if (!dispute) {
      res.status(404).json({
        success: false,
        error: { code: 'NOT_FOUND', message: 'Disputa no encontrada' },
      });
      return;
    }

    // Authorization: reporter, reported, transaction owner/client, or admin/operator
    const isPrivileged = userRole === 'admin' || userRole === 'operator';
    const isInvolved =
      dispute.reporterId === userId ||
      dispute.reportedId === userId ||
      dispute.transaction?.ownerId === userId ||
      dispute.transaction?.clientId === userId;

    if (!isInvolved && !isPrivileged) {
      res.status(403).json({
        success: false,
        error: { code: 'FORBIDDEN', message: 'No tienes acceso a esta disputa' },
      });
      return;
    }

    res.json({ success: true, data: { dispute } });
  } catch (error: any) {
    console.error('Error getting dispute details:', error);
    res.status(500).json({
      success: false,
      error: { code: 'FETCH_ERROR', message: error.message },
    });
  }
};

// Obtener mis disputas
export const getMyDisputes = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const userId = req.user?.userId;
    if (!userId) {
      res.status(401).json({ success: false, error: { code: 'UNAUTHORIZED', message: 'No autenticado' } });
      return;
    }

    const disputes = await disputeService.getUserDisputes(userId);
    res.json({ success: true, data: { disputes } });
  } catch (error: any) {
    console.error('Error getting user disputes:', error);
    res.status(500).json({
      success: false,
      error: { code: 'FETCH_ERROR', message: 'Error al obtener disputas' },
    });
  }
};
