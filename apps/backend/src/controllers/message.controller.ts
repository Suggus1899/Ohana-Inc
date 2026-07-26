import { Request, Response } from 'express';
import { Message, User, Property } from '../models';
import { Op } from 'sequelize';
import { AuthRequest } from '../types';

export const sendMessage = async (req: AuthRequest, res: Response) => {
  try {
    const { receiverId, propertyId, content } = req.body;
    const senderId = req.user?.userId;

    if (!senderId) {
      return res.status(401).json({ success: false, error: { message: 'Unauthorized' } });
    }

    const message = await Message.create({
      senderId,
      receiverId,
      propertyId,
      content,
      isRead: false
    });

    res.status(201).json({
      success: true,
      data: message
    });
  } catch (error: any) {
    res.status(500).json({ success: false, error: { message: error.message } });
  }
};

export const getConversations = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user?.userId;

    if (!userId) {
      return res.status(401).json({ success: false, error: { message: 'Unauthorized' } });
    }

    // This is a simplified version of getting conversations
    // Get all messages where the user is either sender or receiver
    const messages = await Message.findAll({
      where: {
        [Op.or]: [
          { senderId: userId },
          { receiverId: userId }
        ]
      },
      include: [
        { model: User, as: 'sender', attributes: ['id', 'name', 'profilePhotoUrl'] },
        { model: User, as: 'receiver', attributes: ['id', 'name', 'profilePhotoUrl'] },
        { model: Property, as: 'property', attributes: ['id', 'title'] }
      ],
      order: [['createdAt', 'DESC']]
    });

    // Group by the "other" person in the conversation
    const conversationsMap = new Map();
    
    messages.forEach((msg: any) => {
      const otherUser = msg.senderId === userId ? msg.receiver : msg.sender;
      if (!otherUser) return;
      
      const convId = otherUser.id;
      if (!conversationsMap.has(convId)) {
        conversationsMap.set(convId, {
          user: otherUser,
          lastMessage: msg,
          unreadCount: (!msg.isRead && msg.receiverId === userId) ? 1 : 0
        });
      } else {
        if (!msg.isRead && msg.receiverId === userId) {
          conversationsMap.get(convId).unreadCount++;
        }
      }
    });

    res.json({
      success: true,
      data: Array.from(conversationsMap.values())
    });
  } catch (error: any) {
    res.status(500).json({ success: false, error: { message: error.message } });
  }
};

export const getMessagesWithUser = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user?.userId;
    const { otherUserId } = req.params;

    if (!userId) {
      return res.status(401).json({ success: false, error: { message: 'Unauthorized' } });
    }

    const messages = await Message.findAll({
      where: {
        [Op.or]: [
          { senderId: userId, receiverId: otherUserId },
          { senderId: otherUserId, receiverId: userId }
        ]
      },
      include: [
        { model: User, as: 'sender', attributes: ['id', 'name', 'profilePhotoUrl'] },
        { model: Property, as: 'property', attributes: ['id', 'title'] }
      ],
      order: [['createdAt', 'ASC']]
    });

    // Mark as read
    await Message.update(
      { isRead: true },
      { 
        where: { 
          senderId: otherUserId, 
          receiverId: userId, 
          isRead: false 
        } 
      }
    );

    res.json({
      success: true,
      data: messages
    });
  } catch (error: any) {
    res.status(500).json({ success: false, error: { message: error.message } });
  }
};
