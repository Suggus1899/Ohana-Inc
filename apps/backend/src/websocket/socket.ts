import { Server as HttpServer } from 'http';
import { Server, Socket } from 'socket.io';
import { createAdapter } from '@socket.io/redis-adapter';
import { redisPub, redisSub, isRedisConnected } from '../config/redis';
import { verifyToken } from '../services/jwt.service';
import { ChatConversation, ChatMessage, ChatMessageDeletion, ChatUserBlock, User, Property } from '../models';
import { Op } from 'sequelize';
import { filterContent } from '../services/chat.service';
// Email digest se maneja en el cron job (message-digest-job.ts)

let io: Server | null = null;
let isInitializing = false;

// Helper para extraer conversationId de diferentes formatos
const extractConversationId = (data: any): number | null => {
  if (typeof data === 'number') return data;
  if (typeof data === 'string') return parseInt(data, 10);
  if (data && typeof data === 'object') {
    if (data.conversationId) return extractConversationId(data.conversationId);
    if (data.id) return extractConversationId(data.id);
  }
  return null;
};

// Sistema para detectar patrones distribuidos de números de teléfono
interface MessageContext {
  content: string;
  senderId: number;
  timestamp: number;
}

const conversationMessageHistory = new Map<number, MessageContext[]>();

// Función para detectar si hay un patrón de teléfono distribuido
function detectDistributedPhonePattern(conversationId: number, currentMessage: string, senderId: number): { isSuspicious: boolean; combinedScore: number } {
  const now = Date.now();
  const history = conversationMessageHistory.get(conversationId) || [];
  
  // Limpiar mensajes antiguos (más de 5 minutos)
  const recentHistory = history.filter(m => now - m.timestamp < 5 * 60 * 1000);
  
  // Patrones de números sospechosos
  const phoneOperators = ['412', '414', '416', '424', '426'];
  const isOperator = phoneOperators.includes(currentMessage.trim());
  const is7Digits = /^\s*\d{7}\s*$/.test(currentMessage);
  const is4Digits = /^\s*\d{4}\s*$/.test(currentMessage);
  const is3Digits = /^\s*\d{3}\s*$/.test(currentMessage);
  
  let combinedScore = 0;
  
  // Buscar si el mensaje actual es parte de un patrón
  if (isOperator) {
    combinedScore += 35;
    // Buscar si hay dígitos recientes del mismo sender
    const recentDigits = recentHistory.filter(m => 
      m.senderId === senderId && 
      (/^\s*\d{3,7}\s*$/.test(m.content) || /^\s*\d{4}\s*$/.test(m.content))
    );
    if (recentDigits.length > 0) {
      combinedScore += 40; // Patrón sospechoso detectado
    }
  } else if (is7Digits || is4Digits || is3Digits) {
    combinedScore += 25;
    // Buscar si hay operadora reciente del mismo sender
    const recentOperator = recentHistory.find(m =>
      m.senderId === senderId &&
      phoneOperators.includes(m.content.trim())
    );
    if (recentOperator) {
      combinedScore += 45; // Patrón sospechoso: operadora + números
    }
  }
  
  // Agregar mensaje actual al historial
  recentHistory.push({ content: currentMessage, senderId, timestamp: now });
  conversationMessageHistory.set(conversationId, recentHistory);
  
  // Mantener solo los últimos 20 mensajes por conversación
  if (recentHistory.length > 20) {
    conversationMessageHistory.set(conversationId, recentHistory.slice(-20));
  }
  
  return { isSuspicious: combinedScore >= 61, combinedScore };
}

export const initSocketIO = (httpServer: HttpServer): Server => {
  // Protección contra múltiples inicializaciones
  if (io) {
    console.log('⚠️  Socket.IO ya está inicializado, retornando instancia existente');
    return io;
  }
  
  if (isInitializing) {
    console.log('⚠️  Socket.IO está siendo inicializado, esperando...');
    // Esperar a que termine la inicialización
    while (isInitializing) {
      // Busy wait simple - en producción usar un callback o promise
    }
    if (io) return io;
  }
  
  isInitializing = true;
  
  // Nota: El CORS ya está configurado en app.ts a nivel de Express
  // Socket.IO usará la configuración del servidor HTTP
  io = new Server(httpServer, {
    transports: ['websocket', 'polling'],
    // El CORS se maneja a nivel de Express, no es necesario aquí
    // pero permitimos conexiones del origen configurado
    cors: {
      origin: false // Deshabilitamos el CORS interno de Socket.IO
    }
  });

  // Use Redis adapter if available
  if (isRedisConnected()) {
    try {
      io.adapter(createAdapter(redisPub, redisSub));
      console.log('✅ Socket.IO using Redis adapter');
    } catch (error) {
      console.warn('⚠️  Socket.IO Redis adapter failed, using default adapter:', (error as Error).message);
    }
  } else {
    console.log('ℹ️  Socket.IO using default in-memory adapter (Redis not available)');
  }

  // Authentication middleware
  io.use((socket: Socket, next) => {
    try {
      const token = socket.handshake.auth?.token || socket.handshake.headers?.authorization?.split(' ')[1];

      if (!token) {
        return next(new Error('Authentication token required'));
      }

      const decoded = verifyToken(token);
      if (!decoded) {
        return next(new Error('Invalid or expired token'));
      }

      (socket as any).user = decoded;
      next();
    } catch (error) {
      next(new Error('Authentication failed'));
    }
  });

  io.on('connection', (socket: Socket) => {
    const user = (socket as any).user;

    if (!user) {
      socket.disconnect();
      return;
    }

    // Enriquecer con name desde BD si el JWT no lo trae
    if (!user.name) {
      User.findByPk(user.userId, { attributes: ['name'] }).then(dbUser => {
        user.name = dbUser?.name || '';
      });
    }

    // Rooms personales y por rol
    socket.join(`user_${user.userId}`);
    if (user.role === 'operator' || user.role === 'admin') socket.join('operators');

    // Limpiar digest pendiente al conectarse (ya está online, no necesita email)
    if (isRedisConnected()) {
      redisPub.del(`msg_digest:${user.userId}`).catch(() => {});
    }

    // ── join_conversation ────────────────────────────────────────────────────
    socket.on('join_conversation', async (data: any) => {
      try {
        const conversationId = extractConversationId(data);
        if (!conversationId) return;

        const conversation = await ChatConversation.findByPk(conversationId);
        if (!conversation) return;
        if (conversation.participant1Id !== user.userId && conversation.participant2Id !== user.userId) return;

        socket.join(`conversation_${conversationId}`);

        // Marcar mensajes del otro como leídos
        await ChatMessage.update(
          { readAt: new Date() },
          { where: { conversationId, senderId: { [Op.ne]: user.userId }, readAt: null } }
        );

        const otherUserId = conversation.participant1Id === user.userId
          ? conversation.participant2Id : conversation.participant1Id;

        if (io) io.to(`user_${otherUserId}`).emit('messages_read', { conversationId });
      } catch (err) {
        console.error('join_conversation error:', err);
      }
    });

    socket.on('leave_conversation', (conversationId: number) => {
      socket.leave(`conversation_${conversationId}`);
    });

    // ── send_message ─────────────────────────────────────────────────────────
    socket.on('send_message', async (data: { conversationId: any; content: string; tempId?: number }) => {
      try {
        const conversationId = extractConversationId(data);
        const content = data.content?.trim();
        if (!conversationId || !content) return;

        const conversation = await ChatConversation.findByPk(conversationId);
        if (!conversation || !conversation.isActive) return;
        if (conversation.participant1Id !== user.userId && conversation.participant2Id !== user.userId) return;

        // Verificar bloqueo
        const otherUserId = conversation.participant1Id === user.userId
          ? conversation.participant2Id : conversation.participant1Id;
        const isBlocked = await ChatUserBlock.findOne({
          where: { blockerId: otherUserId, blockedId: user.userId },
        });
        if (isBlocked) { socket.emit('error', { message: 'No puedes enviar mensajes a este usuario' }); return; }

        // No puede responder hasta aceptar solicitud
        if (conversation.status === 'pending' && conversation.participant2Id === user.userId) {
          socket.emit('error', { message: 'Debes aceptar la solicitud antes de responder' }); return;
        }

        let { filtered, wasBlocked, riskScore, violations } = filterContent(content);
        const distributedCheck = detectDistributedPhonePattern(conversationId, content, user.userId);
        if (distributedCheck.isSuspicious) {
          riskScore = Math.max(riskScore, distributedCheck.combinedScore);
          violations.push('distributed_phone_pattern');
          wasBlocked = riskScore >= 61;
          if (wasBlocked) filtered = '[CONTENIDO BLOQUEADO - Patrón de contacto detectado]';
        }

        const message = await ChatMessage.create({
          conversationId,
          senderId: user.userId,
          content: filtered,
          originalContent: wasBlocked ? content : null,
          isBlocked: wasBlocked,
          blockReason: wasBlocked ? 'Se detectó información de contacto externa' : null,
          riskScore,
          violations,
        });

        // Si la conv fue rechazada, el nuevo mensaje la convierte en nueva solicitud (solo visible para el receptor)
        const wasRejected = conversation.status === 'rejected';
        const restoreFields: Record<string, any> = {};
        if (wasRejected) {
          // Resetear a pending y restaurar visibilidad solo del receptor (P2)
          restoreFields.status = 'pending';
          restoreFields.deletedForP2 = false;
          restoreFields.clearedForP2At = null;
        } else {
          // Restaurar visibilidad normal si alguno había borrado el chat
          if (conversation.deletedForP1) { restoreFields.deletedForP1 = false; restoreFields.clearedForP1At = null; }
          if (conversation.deletedForP2) { restoreFields.deletedForP2 = false; restoreFields.clearedForP2At = null; }
        }
        await conversation.update({ lastMessageAt: new Date(), ...restoreFields });

        if (io && (restoreFields.deletedForP1 || restoreFields.deletedForP2 || wasRejected)) {
          const refreshed = await ChatConversation.findByPk(conversationId, {
            include: [
              { model: User, as: 'participant1', attributes: ['id', 'name', 'email', 'profilePhotoUrl'] },
              { model: User, as: 'participant2', attributes: ['id', 'name', 'email', 'profilePhotoUrl'] },
            ],
          });
          if (wasRejected) {
            // El receptor recibe nueva solicitud, el sender ve su conv restaurada
            io.to(`user_${otherUserId}`).emit('new_chat_request', { conversation: refreshed });
            io.to(`user_${user.userId}`).emit('conversation_restored', { conversation: refreshed });
          } else {
            io.to(`user_${user.userId}`).emit('conversation_restored', { conversation: refreshed });
            io.to(`user_${otherUserId}`).emit('conversation_restored', { conversation: refreshed });
          }
        }

        const sender = await User.findByPk(user.userId, { attributes: ['id', 'name', 'profilePhotoUrl'] });

        const messagePayload = {
          id: message.id,
          conversationId: message.conversationId,
          senderId: message.senderId,
          content: message.content,
          isBlocked: message.isBlocked,
          riskScore: message.riskScore,
          violations: message.violations,
          readAt: message.readAt,
          createdAt: message.createdAt,
          sender: sender ? { id: sender.id, name: sender.name, profilePhotoUrl: sender.profilePhotoUrl } : null,
          tempId: data.tempId ?? null,
        };

        if (io) {
          if (wasRejected) {
            // Solo al sender — el receptor ya recibió new_chat_request y verá el mensaje al abrir la solicitud
            io.to(`user_${user.userId}`).emit('message_received', messagePayload);
          } else {
            // Flujo normal: room + rooms personales
            io.to(`conversation_${conversationId}`).emit('message_received', messagePayload);
            io.to(`user_${user.userId}`).emit('message_received', messagePayload);
            io.to(`user_${otherUserId}`).emit('message_received', messagePayload);
            io.to(`user_${otherUserId}`).emit('new_message_notification', { conversationId, message: messagePayload });
          }
        }

        if (wasBlocked) {
          socket.emit('content_blocked', {
            messageId: message.id,
            reason: 'Se detectó información de contacto externa. Por seguridad, esta información ha sido bloqueada.',
            riskScore, violations,
          });
        }

        // Registrar mensaje pendiente para digest diario (6PM VEN) si el destinatario NO está online
        if (io && !wasBlocked) {
          const recipientRoom = io.sockets.adapter.rooms.get(`user_${otherUserId}`);
          const isRecipientOnline = recipientRoom && recipientRoom.size > 0;

          if (!isRecipientOnline && isRedisConnected()) {
            // Agregar sender al set de personas que escribieron a este usuario hoy
            const digestKey = `msg_digest:${otherUserId}`;
            redisPub.sadd(digestKey, String(user.userId)).catch(() => {});
            redisPub.expire(digestKey, 86400).catch(() => {}); // TTL 24h de seguridad
          }
        }
      } catch (err: any) {
        console.error('[Socket] send_message error:', err?.message);
        socket.emit('error', { message: 'Error al enviar mensaje' });
      }
    });

    // ── delete_message (solo para mí — persiste en BD) ───────────────────────
    socket.on('delete_message', async (data: { messageId: number }) => {
      try {
        const { messageId } = data;
        if (!messageId) return;

        const message = await ChatMessage.findByPk(messageId);
        if (!message) return;

        const conv = await ChatConversation.findByPk(message.conversationId);
        if (!conv || (conv.participant1Id !== user.userId && conv.participant2Id !== user.userId)) return;

        // Persistir en chat_message_deletions — el mensaje sigue existiendo para el otro
        await (ChatMessageDeletion as any).findOrCreate({
          where: { messageId, userId: user.userId },
          defaults: { messageId, userId: user.userId },
        });

        // Solo notificar al usuario que borró
        if (io) {
          io.to(`user_${user.userId}`).emit('message_deleted_for_me', {
            messageId,
            conversationId: message.conversationId,
          });
        }
      } catch (err: any) {
        console.error('[Socket] delete_message error:', err?.message);
      }
    });

    // ── user_typing ──────────────────────────────────────────────────────────
    socket.on('user_typing', async (data: { conversationId: any; isTyping: boolean }) => {
      const conversationId = extractConversationId(data);
      if (!conversationId) return;
      const typingPayload = { userId: user.userId, name: user.name || '', isTyping: data.isTyping, conversationId };
      // Emitir a todos en la room EXCEPTO el propio sender
      socket.to(`conversation_${conversationId}`).emit('user_typing', typingPayload);
      // Fallback: emitir directo a la room personal del receptor (por si no está en la room)
      if (io) {
        const conv = await ChatConversation.findByPk(conversationId);
        if (conv) {
          const otherUserId = conv.participant1Id === user.userId ? conv.participant2Id : conv.participant1Id;
          io.to(`user_${otherUserId}`).emit('user_typing', typingPayload);
        }
      }
    });

    // ── mark_read ────────────────────────────────────────────────────────────
    socket.on('mark_read', async (data: any) => {
      try {
        const conversationId = extractConversationId(data);
        if (!conversationId) return;

        const conversation = await ChatConversation.findByPk(conversationId);
        if (!conversation) return;
        if (conversation.participant1Id !== user.userId && conversation.participant2Id !== user.userId) return;

        const [updatedCount] = await ChatMessage.update(
          { readAt: new Date() },
          { where: { conversationId, senderId: { [Op.ne]: user.userId }, readAt: null } }
        );

        if (updatedCount > 0 && io) {
          const otherUserId = conversation.participant1Id === user.userId
            ? conversation.participant2Id : conversation.participant1Id;
          io.to(`user_${otherUserId}`).emit('messages_read', { conversationId });
        }
      } catch (err) {
        console.error('mark_read error:', err);
      }
    });

    socket.on('disconnect', () => {});

    socket.on('ping', () => socket.emit('pong', { timestamp: Date.now() }));
  });

  isInitializing = false;
  console.log('✅ Socket.IO initialized');
  return io;
};

export const getIO = (): Server => {
  if (!io) {
    throw new Error('Socket.IO not initialized. Call initSocketIO first.');
  }
  return io;
};

// Exportar io con tipo que permite null para compatibilidad
export { io };
