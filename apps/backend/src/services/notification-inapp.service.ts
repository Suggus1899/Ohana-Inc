import Notification from '../models/Notification';
import User from '../models/User';
import Property from '../models/Property';
import { Op } from 'sequelize';
import { getIO } from '../websocket/socket';

type NotificationType = 'transaction' | 'message' | 'kyc' | 'system' | 'property' | 'review';

interface CreateNotificationInput {
  userId: number;
  type: NotificationType;
  title: string;
  message: string;
  data?: Record<string, unknown>;
}

export class NotificationInAppService {
  async create(input: CreateNotificationInput): Promise<Notification> {
    const notification = await Notification.create({
      userId: input.userId,
      type: input.type,
      title: input.title,
      message: input.message,
      data: input.data ?? null,
    } as any);

    this.emitAfterCreate(input.userId, notification).catch(err =>
      console.error('[NotificationService] Socket emit error:', err)
    );

    return notification;
  }

  async createForMany(userIds: number[], input: Omit<CreateNotificationInput, 'userId'>): Promise<number> {
    const records = userIds.map(userId => ({
      userId,
      type: input.type,
      title: input.title,
      message: input.message,
      data: input.data ?? null,
    }));
    const created = await Notification.bulkCreate(records as any);
    return created.length;
  }

  async notifyStudentsNewProperty(property: Property): Promise<number> {
    const students = await User.findAll({
      where: { role: { [Op.in]: ['estudiante', 'cliente'] } },
      attributes: ['id'],
    });
    const userIds = students.map(u => u.id);
    if (userIds.length === 0) return 0;

    return this.createForMany(userIds, {
      type: 'property',
      title: 'Nueva residencia disponible',
      message: `Se ha publicado "${property.title}" en ${property.address || 'tu zona'}. ¡Revisala antes de que se alquile!`,
      data: { propertyId: property.id },
    });
  }

  async notifyRentalRequestAccepted(tenantId: number, propertyTitle: string, propertyId: number): Promise<Notification> {
    return this.create({
      userId: tenantId,
      type: 'transaction',
      title: 'Solicitud de residencia aceptada',
      message: `El propietario acepto tu solicitud para "${propertyTitle}". Revisa los detalles del pago para confirmar tu mudanza.`,
      data: { propertyId },
    });
  }

  async notifyPaymentConfirmed(tenantId: number, propertyTitle: string, propertyId: number): Promise<Notification> {
    return this.create({
      userId: tenantId,
      type: 'transaction',
      title: 'Pago confirmado',
      message: `El propietario confirmo tu pago para "${propertyTitle}". Tu residencia esta lista.`,
      data: { propertyId },
    });
  }

  async notifyMonthlyPaymentReminder(userId: number, propertyTitle: string, propertyId: number, dueDate: Date): Promise<Notification> {
    return this.create({
      userId,
      type: 'transaction',
      title: 'Mensualidad proxima a vencer',
      message: `Tu mensualidad de "${propertyTitle}" vence el ${dueDate.toLocaleDateString('es-ES', { day: 'numeric', month: 'long' })}. Realiza el pago a tiempo.`,
      data: { propertyId, dueDate: dueDate.toISOString() },
    });
  }

  private async emitAfterCreate(userId: number, notification: Notification): Promise<void> {
    const io = getIO();
    if (!io) return;

    io.to(`user_${userId}`).emit('notification:new', { notification });

    const count = await Notification.count({ where: { userId, isRead: false } });
    io.to(`user_${userId}`).emit('badge:update', {
      unreadNotifications: count,
    });
  }

  private async emitBadgeUpdate(userId: number): Promise<void> {
    const io = getIO();
    if (!io) return;
    const count = await Notification.count({ where: { userId, isRead: false } });
    io.to(`user_${userId}`).emit('badge:update', {
      unreadNotifications: count,
    });
  }
}

export const notificationInAppService = new NotificationInAppService();
