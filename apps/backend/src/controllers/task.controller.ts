import { Response } from 'express';
import { Task, User } from '../models';
import { AuthRequest } from '../types';

export const getTasks = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user?.userId || (req.user as any)?.id;
    const { status, priority } = req.query;
    
    const filter: any = { assignedToId: userId };
    if (status) filter.status = status;
    if (priority) filter.priority = priority;

    const tasks = await Task.findAll({
      where: filter,
      include: [{ model: User, as: 'assignedBy', attributes: ['name'] }],
      order: [['createdAt', 'DESC']]
    });

    res.json({ success: true, data: { tasks } });
  } catch (error: any) {
    res.status(500).json({ success: false, error: { message: error.message } });
  }
};

export const updateTask = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const { status } = req.body;
    
    const task = await Task.findByPk(id);
    if (!task) return res.status(404).json({ success: false, error: { message: 'Task not found' } });
    
    // Authorization: only the assignee can update status
    if (task.assignedToId !== req.user?.userId && task.assignedToId !== (req.user as any)?.id) {
      return res.status(403).json({ success: false, error: { message: 'Not authorized for this task' } });
    }

    const updates: any = { status };
    if (status === 'completed') {
      updates.completedAt = new Date();
    }

    await task.update(updates);
    res.json({ success: true, data: { task } });
  } catch (error: any) {
    res.status(500).json({ success: false, error: { message: error.message } });
  }
};

export const createTask = async (req: AuthRequest, res: Response) => {
  try {
    const { title, description, priority, assignedToId, type, relatedId, dueDate } = req.body;
    const assignedById = req.user?.userId || (req.user as any)?.id;

    const task = await Task.create({
      title,
      description,
      priority,
      assignedToId,
      assignedById,
      type,
      relatedId,
      dueDate
    });

    res.status(201).json({ success: true, data: { task } });
  } catch (error: any) {
    res.status(500).json({ success: false, error: { message: error.message } });
  }
};
