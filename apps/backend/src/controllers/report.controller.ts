import { Response } from 'express';
import { AuthRequest } from '../types';
import { Report, User } from '../models';
import { Op } from 'sequelize';

export const createReport = async (req: AuthRequest, res: Response) => {
  try {
    const { reportedEntity = 'user', entityId, reportedUserId, reason, description } = req.body;
    const reportedBy = req.user?.userId;

    if (!reportedBy) {
      return res.status(401).json({ success: false, message: 'Unauthorized' });
    }

    const report = await Report.create({
      reportedBy,
      reportedEntity,
      entityId: entityId || reportedUserId,
      reason,
      description,
      status: 'pending'
    });

    return res.status(201).json({
      success: true,
      message: 'Report submitted successfully',
      data: report
    });
  } catch (error) {
    console.error('Error creating report:', error);
    return res.status(500).json({ success: false, message: 'Internal server error' });
  }
};

export const getReports = async (req: AuthRequest, res: Response) => {
  try {
    const { status, entityId, assignedTo } = req.query;
    const where: any = {};

    if (status) where.status = status;
    if (entityId) where.entityId = entityId;
    if (assignedTo) where.assignedTo = assignedTo;

    const reports = await Report.findAll({
      where,
      include: [
        { model: User, as: 'reporter', attributes: ['id', 'name', 'email'] },
        { model: User, as: 'moderator', attributes: ['id', 'name'] }
      ],
      order: [['createdAt', 'DESC']]
    });

    return res.json({
      success: true,
      data: reports
    });
  } catch (error) {
    console.error('Error fetching reports:', error);
    return res.status(500).json({ success: false, message: 'Internal server error' });
  }
};

export const updateReportStatus = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const { status, resolution } = req.body;
    const assignedTo = req.user?.userId;

    const report = await Report.findByPk(id);

    if (!report) {
      return res.status(404).json({ success: false, message: 'Report not found' });
    }

    const updateData: any = { status, assignedTo };
    if (resolution) updateData.resolution = resolution;
    if (status === 'resolved') updateData.resolvedAt = new Date();

    await report.update(updateData);

    return res.json({
      success: true,
      message: 'Report status updated successfully',
      data: report
    });
  } catch (error) {
    console.error('Error updating report status:', error);
    return res.status(500).json({ success: false, message: 'Internal server error' });
  }
};
