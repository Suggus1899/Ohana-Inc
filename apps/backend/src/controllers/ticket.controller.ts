import { Response } from 'express';
import { AuthRequest } from '../types';
import { Ticket, User, TicketResponse } from '../models';
import { Op } from 'sequelize';

declare const console: any;

export const createTicket = async (req: AuthRequest, res: Response) => {
  try {
    const { subject, description, message, priority, category } = req.body;
    const userId = req.user?.userId;

    if (!userId) {
      return res.status(401).json({ success: false, message: 'Unauthorized' });
    }

    const ticket = await Ticket.create({
      userId,
      subject,
      description: description || message,
      message: message || description,
      priority: priority || 'medium',
      category: category || 'other',
      status: 'open'
    });

    return res.status(201).json({
      success: true,
      message: 'Ticket created successfully',
      data: ticket
    });
  } catch (error) {
    console.error('Error creating ticket:', error);
    return res.status(500).json({ success: false, message: 'Internal server error' });
  }
};

export const getTickets = async (req: AuthRequest, res: Response) => {
  try {
    const { status, priority, assignedTo, userId, category, startDate, endDate, page = 1, limit = 50 } = req.query;
    const where: any = {};

    if (status) where.status = status;
    if (priority) where.priority = priority;
    if (category) where.category = category;
    if (assignedTo) where.assignedTo = assignedTo;
    if (userId) where.userId = userId;
    if (startDate) where.createdAt = { ...where.createdAt, [Op.gte]: new Date(startDate as string) };
    if (endDate) where.createdAt = { ...where.createdAt, [Op.lte]: new Date(endDate as string) };

    const offset = (Number(page) - 1) * Number(limit);

    const { count, rows: tickets } = await Ticket.findAndCountAll({
      where,
      include: [
        { model: User, as: 'user', attributes: ['id', 'name', 'email', 'profilePhotoUrl'] },
        { model: User, as: 'assignedToOperator', attributes: ['id', 'name'] }
      ],
      offset,
      limit: Number(limit),
      order: [['createdAt', 'DESC']]
    });

    return res.json({
      success: true,
      data: {
        tickets,
        pagination: {
          total: count,
          page: Number(page),
          limit: Number(limit),
          totalPages: Math.ceil(count / Number(limit)),
        },
      },
    });
  } catch (error) {
    console.error('Error fetching tickets:', error);
    return res.status(500).json({ success: false, message: 'Internal server error' });
  }
};

export const updateTicket = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const { status, priority, assignedTo, escalationReason, resolution } = req.body;
    const operatorId = req.user?.userId;

    const ticket = await Ticket.findByPk(id);

    if (!ticket) {
      return res.status(404).json({ success: false, message: 'Ticket not found' });
    }

    const updateData: any = {};
    if (status) updateData.status = status;
    if (priority) updateData.priority = priority;
    if (assignedTo) updateData.assignedTo = assignedTo;
    if (status === 'resolved') updateData.resolvedAt = new Date();
    if (escalationReason) updateData.escalationReason = escalationReason;
    if (resolution) updateData.resolution = resolution;

    await ticket.update(updateData);

    const updatedTicket = await Ticket.findByPk(id, {
      include: [
        { model: User, as: 'user', attributes: ['id', 'name', 'email'] },
        { model: User, as: 'assignedToOperator', attributes: ['id', 'name'] },
        { model: TicketResponse, as: 'responses' }
      ]
    });

    return res.json({
      success: true,
      message: 'Ticket updated successfully',
      data: updatedTicket
    });
  } catch (error) {
    console.error('Error updating ticket:', error);
    return res.status(500).json({ success: false, message: 'Internal server error' });
  }
};

export const replyToTicket = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const { message } = req.body;
    const userId = req.user?.userId;
    const userRole = req.user?.role;

    if (!userId) {
      return res.status(401).json({ success: false, message: 'Unauthorized' });
    }

    if (!message || !message.trim()) {
      return res.status(400).json({ success: false, message: 'Message is required' });
    }

    const ticket = await Ticket.findByPk(id);
    if (!ticket) {
      return res.status(404).json({ success: false, message: 'Ticket not found' });
    }

    const isOperatorOrAdmin = userRole === 'admin' || userRole === 'operator';

    const response = await TicketResponse.create({
      ticketId: parseInt(id),
      userId,
      message: message.trim(),
      isInternal: isOperatorOrAdmin && req.body.isInternal === true,
    });

    if (isOperatorOrAdmin && ticket.status === 'open') {
      await ticket.update({ status: 'in_progress' });
    }

    const updatedTicket = await Ticket.findByPk(id, {
      include: [
        { model: User, as: 'user', attributes: ['id', 'name', 'email'] },
        { model: User, as: 'assignedToOperator', attributes: ['id', 'name'] },
        { model: TicketResponse, as: 'responses' },
      ],
    });

    return res.status(201).json({
      success: true,
      message: 'Reply added successfully',
      data: { response, ticket: updatedTicket },
    });
  } catch (error) {
    console.error('Error replying to ticket:', error);
    return res.status(500).json({ success: false, message: 'Internal server error' });
  }
};
