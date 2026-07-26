import { DataTypes, Model } from 'sequelize';
import { sequelize } from '../config/database';

export interface ChatMessageAttributes {
  id: number;
  conversationId: number;
  senderId: number;
  content: string;
  originalContent: string | null;
  isBlocked: boolean;
  blockReason: string | null;
  riskScore: number;
  violations: string[];
  readAt: Date | null;
  deletedAt: Date | null;
  createdAt?: Date;
  updatedAt?: Date;
}

export interface ChatMessageCreationAttributes
  extends Omit<ChatMessageAttributes, 'id' | 'createdAt' | 'updatedAt' | 'readAt' | 'isBlocked' | 'riskScore' | 'violations' | 'blockReason' | 'originalContent' | 'deletedAt'> {
  readAt?: Date | null;
  deletedAt?: Date | null;
  isBlocked?: boolean;
  riskScore?: number;
  violations?: string[];
  blockReason?: string | null;
  originalContent?: string | null;
}

class ChatMessage
  extends Model<ChatMessageAttributes, ChatMessageCreationAttributes>
  implements ChatMessageAttributes
{
  public id!: number;
  public conversationId!: number;
  public senderId!: number;
  public content!: string;
  public originalContent!: string | null;
  public isBlocked!: boolean;
  public blockReason!: string | null;
  public riskScore!: number;
  public violations!: string[];
  public readAt!: Date | null;
  public deletedAt!: Date | null;

  public readonly createdAt!: Date;
  public readonly updatedAt!: Date;
}

ChatMessage.init(
  {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
    },
    conversationId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: 'chat_conversations',
        key: 'id',
      },
    },
    senderId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: 'users',
        key: 'id',
      },
    },
    content: {
      type: DataTypes.TEXT,
      allowNull: false,
    },
    originalContent: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    isBlocked: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: false,
    },
    blockReason: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    riskScore: {
      type: DataTypes.INTEGER,
      defaultValue: 0,
    },
    violations: {
      type: DataTypes.JSONB,
      defaultValue: [],
    },
    readAt: {
      type: DataTypes.DATE,
      allowNull: true,
      defaultValue: null,
    },
    deletedAt: {
      type: DataTypes.DATE,
      allowNull: true,
      defaultValue: null,
    },
  },
  {
    sequelize,
    tableName: 'chat_messages',
    modelName: 'ChatMessage',
    indexes: [
      {
        name: 'chat_messages_conversation_idx',
        fields: ['conversationId'],
      },
      {
        name: 'chat_messages_sender_idx',
        fields: ['senderId'],
      },
      {
        name: 'chat_messages_conversation_created_idx',
        fields: ['conversationId', 'createdAt'],
      },
      {
        name: 'chat_messages_unread_idx',
        fields: ['conversationId', 'readAt'],
      },
    ],
  }
);

export default ChatMessage;
