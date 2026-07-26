import { Response } from 'express';
import { Op } from 'sequelize';
import { ChatConversation, ChatMessage, ChatMessageDeletion, ChatUserBlock, User, RentalRequest as RentRequest, Property } from '../models';
import { AuthRequest } from '../types';
import { getIO } from '../websocket/socket';

export const getConversations = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user?.userId;

    // Obtener IDs de usuarios bloqueados
    const blocks = await ChatUserBlock.findAll({
      where: { [Op.or]: [{ blockerId: userId }, { blockedId: userId }] },
      attributes: ['blockerId', 'blockedId'],
    });
    const blockedUserIds = blocks.map((b: any) =>
      b.blockerId === userId ? b.blockedId : b.blockerId
    );

    const blockedFilter = blockedUserIds.length > 0 ? {
      participant1Id: { [Op.notIn]: blockedUserIds },
      participant2Id: { [Op.notIn]: blockedUserIds },
    } : {};

    const conversations = await ChatConversation.findAll({
      where: {
        [Op.or]: [
          { participant1Id: userId, deletedForP1: false },
          { participant2Id: userId, deletedForP2: false },
        ],
        ...blockedFilter,
      },
      include: [
        {
          model: User,
          as: 'participant1',
          attributes: ['id', 'name', 'email', 'profilePhotoUrl'],
        },
        {
          model: User,
          as: 'participant2',
          attributes: ['id', 'name', 'email', 'profilePhotoUrl'],
        },
        {
          model: RentRequest,
          as: 'rentRequest',
          attributes: ['id', 'status'],
          include: [
            {
              model: Property,
              as: 'property',
              attributes: ['id', 'title', 'address'],
            },
          ],
        },
      ],
      order: [['lastMessageAt', 'DESC NULLS LAST']],
    });

    // Separar en bandeja principal (accepted) y solicitudes (pending)
    const mainConversations = conversations.filter(c => c.status !== 'pending' || 
      c.participant2Id === userId /* quien recibe */
    );

    // Get unread counts for each conversation
    const conversationsWithUnread = await Promise.all(
      conversations.map(async (conv) => {
        const unreadCount = await ChatMessage.count({
          where: {
            conversationId: conv.id,
            senderId: { [Op.ne]: userId },
            readAt: null,
          },
        });

        // Get last message
        const lastMessage = await ChatMessage.findOne({
          where: { conversationId: conv.id },
          order: [['createdAt', 'DESC']],
          attributes: ['id', 'content', 'senderId', 'createdAt', 'isBlocked'],
        });

        const convJson = conv.toJSON() as any;
        return {
          ...convJson,
          unreadCount,
          lastMessage,
          isRequest: conv.status === 'pending' && conv.participant2Id === userId,
          clearedForP1At: convJson.clearedForP1At ?? null,
          clearedForP2At: convJson.clearedForP2At ?? null,
        };
      })
    );

    res.json({ success: true, data: { conversations: conversationsWithUnread } });
  } catch (error: any) {
    console.error('Get conversations error:', error);
    res.status(500).json({
      success: false,
      error: { message: 'Error al obtener conversaciones' },
    });
  }
};

export const getMessages = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user?.userId;
    const { id } = req.params;
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 50;

    const conversation = await ChatConversation.findByPk(id);
    if (!conversation) {
      return res.status(404).json({
        success: false,
        error: { message: 'Conversación no encontrada' },
      });
    }

    // Verify participant
    if (conversation.participant1Id !== userId && conversation.participant2Id !== userId) {
      return res.status(403).json({
        success: false,
        error: { message: 'No tienes acceso a esta conversación' },
      });
    }

    const offset = (page - 1) * limit;

    // Determinar desde qué fecha ver mensajes (respeta cleared_at per-user)
    const isP1 = conversation.participant1Id === userId;
    const clearedAt = isP1 ? conversation.clearedForP1At : conversation.clearedForP2At;
    const createdAtFilter = clearedAt ? { [Op.gt]: clearedAt } : undefined;

    // Obtener IDs de mensajes borrados por el usuario SOLO en esta conversación
    const deletedByUser = await ChatMessageDeletion.findAll({
      where: { userId },
      attributes: ['messageId'],
      include: [{
        model: ChatMessage,
        as: 'message',
        attributes: [],
        where: { conversationId: id },
        required: true,
      }],
    });
    const deletedMessageIds = deletedByUser.map((d: any) => d.messageId);

    const { count, rows: messages } = await ChatMessage.findAndCountAll({
      where: {
        conversationId: id,
        deletedAt: null,
        ...(createdAtFilter ? { createdAt: createdAtFilter } : {}),
        ...(deletedMessageIds.length > 0 ? { id: { [Op.notIn]: deletedMessageIds } } : {}),
      },
      include: [
        {
          model: User,
          as: 'sender',
          attributes: ['id', 'name', 'profilePhotoUrl'],
        },
      ],
      order: [['createdAt', 'DESC']],
      limit,
      offset,
    });

    // Mark unread messages as read
    await ChatMessage.update(
      { readAt: new Date() },
      {
        where: {
          conversationId: id,
          senderId: { [Op.ne]: userId },
          readAt: null,
        },
      }
    );

    res.json({
      success: true,
      data: {
        messages: messages.reverse(),
        pagination: {
          total: count,
          page,
          limit,
          totalPages: Math.ceil(count / limit),
        },
      },
    });
  } catch (error: any) {
    console.error('Get messages error:', error);
    res.status(500).json({
      success: false,
      error: { message: 'Error al obtener mensajes' },
    });
  }
};

export const createOrGetConversation = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user?.userId;
    const { rentRequestId } = req.body;

    if (!rentRequestId) {
      return res.status(400).json({
        success: false,
        error: { message: 'rentRequestId es requerido' },
      });
    }

    // Verify the rent request exists
    const rentRequest = await RentRequest.findByPk(rentRequestId, {
      include: [
        {
          model: Property,
          as: 'property',
          attributes: ['id', 'title', 'authorId'],
        },
      ],
    });

    if (!rentRequest) {
      return res.status(404).json({
        success: false,
        error: { message: 'Solicitud de alquiler no encontrada' },
      });
    }

    const property = (rentRequest as any).property;
    const tenantId = rentRequest.tenantId;
    const ownerId = property?.authorId;

    // Verify the user is part of this transaction
    if (userId !== tenantId && userId !== ownerId) {
      return res.status(403).json({
        success: false,
        error: { message: 'No eres parte de esta transacción' },
      });
    }

    // Check if conversation already exists
    let conversation = await ChatConversation.findOne({
      where: { rentRequestId },
      include: [
        {
          model: User,
          as: 'participant1',
          attributes: ['id', 'name', 'email', 'profilePhotoUrl'],
        },
        {
          model: User,
          as: 'participant2',
          attributes: ['id', 'name', 'email', 'profilePhotoUrl'],
        },
        {
          model: RentRequest,
          as: 'rentRequest',
          attributes: ['id', 'status'],
          include: [
            {
              model: Property,
              as: 'property',
              attributes: ['id', 'title', 'address'],
            },
          ],
        },
      ],
    });

    if (!conversation) {
      // Check if conversation already exists between these participants
      const existingPair = await ChatConversation.findOne({
        where: {
          [Op.or]: [
            { participant1Id: tenantId, participant2Id: ownerId },
            { participant1Id: ownerId, participant2Id: tenantId },
          ],
        },
      });
      if (existingPair) {
        // Associate existing conversation with this rent request
        await existingPair.update({ rentRequestId });
        conversation = await ChatConversation.findByPk(existingPair.id, {
          include: [
            { model: User, as: 'participant1', attributes: ['id', 'name', 'email', 'profilePhotoUrl'] },
            { model: User, as: 'participant2', attributes: ['id', 'name', 'email', 'profilePhotoUrl'] },
            { model: RentRequest, as: 'rentRequest', attributes: ['id', 'status'],
              include: [{ model: Property, as: 'property', attributes: ['id', 'title', 'address'] }],
            },
          ],
        });
      } else {
        // Create new conversation
        conversation = await ChatConversation.create({
          rentRequestId,
          participant1Id: tenantId,
          participant2Id: ownerId,
        });

        // Re-fetch with includes
        conversation = await ChatConversation.findByPk(conversation.id, {
        include: [
          {
            model: User,
            as: 'participant1',
            attributes: ['id', 'name', 'email', 'profilePhotoUrl'],
          },
          {
            model: User,
            as: 'participant2',
            attributes: ['id', 'name', 'email', 'profilePhotoUrl'],
          },
          {
            model: RentRequest,
            as: 'rentRequest',
            attributes: ['id', 'status'],
            include: [
              {
                model: Property,
                as: 'property',
                attributes: ['id', 'title', 'address'],
              },
            ],
          },
        ],
      });
      }
    }

    res.json({ success: true, data: { conversation } });
  } catch (error: any) {
    console.error('Create/get conversation error:', error);
    res.status(500).json({
      success: false,
      error: { message: 'Error al crear/obtener conversación' },
    });
  }
};

export const getUnreadCount = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user?.userId;

    // Get all conversation IDs where user is a participant
    const conversations = await ChatConversation.findAll({
      where: {
        [Op.or]: [
          { participant1Id: userId },
          { participant2Id: userId },
        ],
      },
      attributes: ['id'],
    });

    const conversationIds = conversations.map(c => c.id);

    if (conversationIds.length === 0) {
      return res.json({ success: true, data: { unreadCount: 0 } });
    }

    const unreadCount = await ChatMessage.count({
      where: {
        conversationId: { [Op.in]: conversationIds },
        senderId: { [Op.ne]: userId },
        readAt: null,
      },
    });

    res.json({ success: true, data: { unreadCount } });
  } catch (error: any) {
    console.error('Get unread count error:', error);
    res.status(500).json({
      success: false,
      error: { message: 'Error al obtener conteo de no leídos' },
    });
  }
};

export const createDirectConversation = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user?.userId;
    const { otherUserId } = req.body;

    if (!otherUserId) {
      return res.status(400).json({
        success: false,
        error: { message: 'otherUserId es requerido' },
      });
    }

    const otherUserIdNum = Number(otherUserId);

    if (userId === otherUserIdNum) {
      return res.status(400).json({
        success: false,
        error: { message: 'No puedes crear una conversación contigo mismo' },
      });
    }

    // Verify the other user exists
    const otherUser = await User.findByPk(otherUserIdNum, {
      attributes: ['id', 'name', 'email', 'profilePhotoUrl', 'role'],
    });

    if (!otherUser) {
      return res.status(404).json({
        success: false,
        error: { message: 'Usuario no encontrado' },
      });
    }

    // Check if conversation already exists between these users (any type)
    const existingConversation = await ChatConversation.findOne({
      where: {
        [Op.or]: [
          { participant1Id: userId, participant2Id: otherUserIdNum },
          { participant1Id: otherUserIdNum, participant2Id: userId },
        ],
      },
      include: [
        {
          model: User,
          as: 'participant1',
          attributes: ['id', 'name', 'email', 'profilePhotoUrl'],
        },
        {
          model: User,
          as: 'participant2',
          attributes: ['id', 'name', 'email', 'profilePhotoUrl'],
        },
      ],
    });

    if (existingConversation) {
      // Si el usuario que reabre había borrado su lado, restaurarlo
      const isP1 = existingConversation.participant1Id === userId;
      const wasDeleted = isP1 ? existingConversation.deletedForP1 : existingConversation.deletedForP2;
      if (wasDeleted) {
        const updateFields = isP1
          ? { deletedForP1: false, clearedForP1At: null }
          : { deletedForP2: false, clearedForP2At: null };
        await existingConversation.update(updateFields);
        // Notificar al propio usuario vía socket para que aparezca en su lista
        const ioInstance = getIO();
        if (ioInstance) {
          const refreshed = await ChatConversation.findByPk(existingConversation.id, {
            include: [
              { model: User, as: 'participant1', attributes: ['id', 'name', 'email', 'profilePhotoUrl'] },
              { model: User, as: 'participant2', attributes: ['id', 'name', 'email', 'profilePhotoUrl'] },
            ],
          });
          ioInstance.to(`user_${userId}`).emit('conversation_restored', { conversation: refreshed });
        }
      }
      // Re-fetch actualizado
      const refreshedConv = await ChatConversation.findByPk(existingConversation.id, {
        include: [
          { model: User, as: 'participant1', attributes: ['id', 'name', 'email', 'profilePhotoUrl'] },
          { model: User, as: 'participant2', attributes: ['id', 'name', 'email', 'profilePhotoUrl'] },
        ],
      });
      return res.json({ success: true, data: { conversation: refreshedConv } });
    }

    // Double-check with lock to prevent race conditions
    const existingAfterLock = await ChatConversation.findOne({
      where: {
        [Op.or]: [
          { participant1Id: userId, participant2Id: otherUserIdNum },
          { participant1Id: otherUserIdNum, participant2Id: userId },
        ],
      },
      transaction: undefined,
      lock: true,
    });
    if (existingAfterLock) {
      const refreshedConv = await ChatConversation.findByPk(existingAfterLock.id, {
        include: [
          { model: User, as: 'participant1', attributes: ['id', 'name', 'email', 'profilePhotoUrl'] },
          { model: User, as: 'participant2', attributes: ['id', 'name', 'email', 'profilePhotoUrl'] },
        ],
      });
      return res.json({ success: true, data: { conversation: refreshedConv } });
    }

    // Create new direct conversation (pending = bandeja de solicitudes para el receptor)
    const conversation = await ChatConversation.create({
      participant1Id: userId!,
      participant2Id: otherUserIdNum,
      type: 'direct',
      rentRequestId: null,
      status: 'pending',
    });

    // Notificar al receptor de la nueva solicitud
    const ioInstance = getIO();
    if (ioInstance) {
      const convWithUsers = await ChatConversation.findByPk(conversation.id, {
        include: [
          { model: User, as: 'participant1', attributes: ['id', 'name', 'email', 'profilePhotoUrl'] },
          { model: User, as: 'participant2', attributes: ['id', 'name', 'email', 'profilePhotoUrl'] },
        ],
      });
      ioInstance.to(`user_${otherUserIdNum}`).emit('new_chat_request', { conversation: convWithUsers });
    }

    // Re-fetch with includes
    const conversationWithUsers = await ChatConversation.findByPk(conversation.id, {
      include: [
        {
          model: User,
          as: 'participant1',
          attributes: ['id', 'name', 'email', 'profilePhotoUrl'],
        },
        {
          model: User,
          as: 'participant2',
          attributes: ['id', 'name', 'email', 'profilePhotoUrl'],
        },
      ],
    });

    res.status(201).json({ success: true, data: { conversation: conversationWithUsers } });
  } catch (error: any) {
    console.error('Create direct conversation error:', error);
    res.status(500).json({
      success: false,
      error: { message: 'Error al crear conversación directa' },
    });
  }
};

export const searchUsersForChat = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user?.userId;
    const { query } = req.query;

    if (!query || typeof query !== 'string' || query.trim().length < 2) {
      return res.status(400).json({
        success: false,
        error: { message: 'Query debe tener al menos 2 caracteres' },
      });
    }

    const searchTerm = `%${query.trim().toLowerCase()}%`;

    // Search users excluding the current user and admins
    // Búsqueda por nombre o email
    const users = await User.findAll({
      where: {
        id: { [Op.ne]: userId },
        role: { [Op.in]: ['cliente', 'estudiante', 'propietario', 'operator'] },
        [Op.or]: [
          { name: { [Op.iLike]: searchTerm } },
          { email: { [Op.iLike]: searchTerm } },
        ],
      },
      attributes: ['id', 'name', 'email', 'profilePhotoUrl', 'role'],
      limit: 20,
      order: [['name', 'ASC']],
    });

    // Enriquecer con estado de bloqueo (el caller bloqueó al resultado)
    const blockedByMe = await ChatUserBlock.findAll({
      where: { blockerId: userId, blockedId: { [Op.in]: users.map((u: any) => u.id) } },
      attributes: ['blockedId'],
    });
    const blockedSet = new Set(blockedByMe.map((b: any) => b.blockedId));

    const usersWithBlockStatus = users.map((u: any) => ({
      ...u.toJSON(),
      isBlockedByMe: blockedSet.has(u.id),
    }));

    res.json({ success: true, data: { users: usersWithBlockStatus } });
  } catch (error: any) {
    console.error('Search users for chat error:', error);
    res.status(500).json({
      success: false,
      error: { message: 'Error al buscar usuarios' },
    });
  }
};

// ── Solicitudes de chat ──────────────────────────────────────────────────────

export const acceptChatRequest = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user?.userId;
    const { id } = req.params;

    const conversation = await ChatConversation.findByPk(id);
    if (!conversation || conversation.participant2Id !== userId) {
      return res.status(404).json({ success: false, error: { message: 'Solicitud no encontrada' } });
    }
    if (conversation.status !== 'pending') {
      return res.status(400).json({ success: false, error: { message: 'No es una solicitud pendiente' } });
    }

    await conversation.update({ status: 'accepted' });

    const io = getIO();
    if (io) {
      io.to(`user_${conversation.participant1Id}`).emit('chat_request_accepted', { conversationId: conversation.id });
    }

    res.json({ success: true, data: { conversation } });
  } catch (error: any) {
    console.error('Accept chat request error:', error);
    res.status(500).json({ success: false, error: { message: 'Error al aceptar solicitud' } });
  }
};

export const rejectChatRequest = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user?.userId;
    const { id } = req.params;

    const conversation = await ChatConversation.findByPk(id);
    if (!conversation || conversation.participant2Id !== userId) {
      return res.status(404).json({ success: false, error: { message: 'Solicitud no encontrada' } });
    }

    // Solo ocultar de la vista del receptor (P2 = quien rechaza). P1 (remitente) sigue viendo su conv.
    await conversation.update({ status: 'rejected', deletedForP2: true });

    res.json({ success: true });
  } catch (error: any) {
    console.error('Reject chat request error:', error);
    res.status(500).json({ success: false, error: { message: 'Error al rechazar solicitud' } });
  }
};

// ── Operadores disponibles ───────────────────────────────────────────────────

export const getAvailableOperators = async (req: AuthRequest, res: Response) => {
  try {
    const operators = await User.findAll({
      where: {
        role: { [Op.in]: ['operator', 'admin'] },
        status: 'active',
      },
      attributes: ['id', 'name', 'email', 'profilePhotoUrl', 'role'],
    });

    let io: any = null;
    try {
      const { getIO } = require('../websocket/socket');
      io = getIO();
    } catch { /* socket not initialized */ }

    const onlineIds: number[] = [];
    if (io) {
      for (const op of operators) {
        const room = io.sockets.adapter.rooms.get(`user_${op.id}`);
        if (room && room.size > 0) {
          onlineIds.push(op.id);
        }
      }
    }

    // Sort: online operators first, then offline
    const sorted = [...operators].sort((a, b) => {
      const aOnline = onlineIds.includes(a.id) ? 0 : 1;
      const bOnline = onlineIds.includes(b.id) ? 0 : 1;
      return aOnline - bOnline;
    });

    res.json({
      success: true,
      data: {
        operators: sorted,
        onlineIds,
      },
    });
  } catch (error: any) {
    console.error('Error fetching available operators:', error);
    res.status(500).json({ success: false, error: { message: 'Error al obtener operadores' } });
  }
};

// ── Bloqueo de usuarios ──────────────────────────────────────────────────────

export const blockUser = async (req: AuthRequest, res: Response) => {
  try {
    const blockerId = req.user?.userId!;
    const { userId: blockedId } = req.body;

    if (!blockedId || blockerId === Number(blockedId)) {
      return res.status(400).json({ success: false, error: { message: 'Usuario inválido' } });
    }

    await ChatUserBlock.findOrCreate({
      where: { blockerId, blockedId: Number(blockedId) },
    });

    res.json({ success: true });
  } catch (error: any) {
    console.error('Block user error:', error);
    res.status(500).json({ success: false, error: { message: 'Error al bloquear usuario' } });
  }
};

export const unblockUser = async (req: AuthRequest, res: Response) => {
  try {
    const blockerId = req.user?.userId!;
    const { userId: blockedId } = req.body;

    await ChatUserBlock.destroy({
      where: { blockerId, blockedId: Number(blockedId) },
    });

    res.json({ success: true });
  } catch (error: any) {
    console.error('Unblock user error:', error);
    res.status(500).json({ success: false, error: { message: 'Error al desbloquear usuario' } });
  }
};

export const getBlockedUsers = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user?.userId;
    const blocks = await ChatUserBlock.findAll({
      where: { blockerId: userId },
      include: [{ model: User, as: 'blocked', attributes: ['id', 'name', 'profilePhotoUrl'] }],
    });
    res.json({ success: true, data: { blocks } });
  } catch (error: any) {
    res.status(500).json({ success: false, error: { message: 'Error al obtener bloqueos' } });
  }
};

// ── Soft-delete de mensajes ──────────────────────────────────────────────────

export const deleteMessage = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user?.userId;
    const { id } = req.params;

    const message = await ChatMessage.findByPk(id);
    if (!message) {
      return res.status(404).json({ success: false, error: { message: 'Mensaje no encontrado' } });
    }

    // Verificar que el usuario es participante de esta conversación
    const conv = await ChatConversation.findByPk(message.conversationId);
    if (!conv || (conv.participant1Id !== userId && conv.participant2Id !== userId)) {
      return res.status(403).json({ success: false, error: { message: 'Sin acceso' } });
    }

    // Borrado por usuario: inserta fila en chat_message_deletions (no toca el mensaje)
    await (ChatMessageDeletion as any).findOrCreate({
      where: { messageId: message.id, userId },
      defaults: { messageId: message.id, userId },
    });

    // Notificar al usuario que borra (sin importar quién envió el mensaje)
    const io = getIO();
    if (io) {
      io.to(`user_${userId}`).emit('message_deleted_for_me', { messageId: message.id, conversationId: message.conversationId });
    }

    res.json({ success: true });
  } catch (error: any) {
    console.error('Delete message error:', error);
    res.status(500).json({ success: false, error: { message: 'Error al eliminar mensaje' } });
  }
};

// ── Borrar chat (para mí) ────────────────────────────────────────────────────

export const deleteConversationForMe = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user?.userId;
    const { id } = req.params;

    const conversation = await ChatConversation.findByPk(id);
    if (!conversation) {
      return res.status(404).json({ success: false, error: { message: 'Conversación no encontrada' } });
    }
    if (conversation.participant1Id !== userId && conversation.participant2Id !== userId) {
      return res.status(403).json({ success: false, error: { message: 'No tienes acceso a esta conversación' } });
    }

    const now = new Date();
    if (conversation.participant1Id === userId) {
      await conversation.update({ deletedForP1: true, clearedForP1At: now });
    } else {
      await conversation.update({ deletedForP2: true, clearedForP2At: now });
    }

    // Insertar en chat_message_deletions TODOS los mensajes actuales de esta conv
    // para que no reaparezcan aunque el otro siga enviando y se resetee el clearedAt
    const allMessages = await ChatMessage.findAll({
      where: { conversationId: conversation.id, deletedAt: null },
      attributes: ['id'],
    });
    if (allMessages.length > 0) {
      const deletionRows = allMessages.map((m: any) => ({ messageId: m.id, userId }));
      // bulkCreate con ignoreDuplicates para no fallar si alguno ya existe
      await (ChatMessageDeletion as any).bulkCreate(deletionRows, { ignoreDuplicates: true });
    }

    res.json({ success: true });
  } catch (error: any) {
    console.error('Delete conversation error:', error);
    res.status(500).json({ success: false, error: { message: 'Error al eliminar conversación' } });
  }
};
