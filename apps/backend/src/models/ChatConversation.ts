import { DataTypes, Model } from 'sequelize';
import { sequelize } from '../config/database';

export type ConversationType = 'rent_request' | 'direct';
export type ConversationStatus = 'accepted' | 'pending' | 'rejected';

export interface ChatConversationAttributes {
  id: number;
  rentRequestId: number | null;
  participant1Id: number;
  participant2Id: number;
  type: ConversationType;
  lastMessageAt: Date | null;
  isActive: boolean;
  status: ConversationStatus;
  deletedForP1: boolean;
  deletedForP2: boolean;
  clearedForP1At: Date | null;
  clearedForP2At: Date | null;
  createdAt?: Date;
  updatedAt?: Date;
}

export interface ChatConversationCreationAttributes
  extends Omit<ChatConversationAttributes, 'id' | 'createdAt' | 'updatedAt' | 'lastMessageAt' | 'isActive' | 'type' | 'status' | 'deletedForP1' | 'deletedForP2' | 'clearedForP1At' | 'clearedForP2At'> {
  lastMessageAt?: Date | null;
  isActive?: boolean;
  type?: ConversationType;
  status?: ConversationStatus;
  deletedForP1?: boolean;
  deletedForP2?: boolean;
  clearedForP1At?: Date | null;
  clearedForP2At?: Date | null;
}

class ChatConversation
  extends Model<ChatConversationAttributes, ChatConversationCreationAttributes>
  implements ChatConversationAttributes
{
  public id!: number;
  public rentRequestId!: number | null;
  public participant1Id!: number;
  public participant2Id!: number;
  public type!: ConversationType;
  public lastMessageAt!: Date | null;
  public isActive!: boolean;
  public status!: ConversationStatus;
  public deletedForP1!: boolean;
  public deletedForP2!: boolean;
  public clearedForP1At!: Date | null;
  public clearedForP2At!: Date | null;

  public readonly createdAt!: Date;
  public readonly updatedAt!: Date;
}

ChatConversation.init(
  {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
    },
    rentRequestId: {
      type: DataTypes.INTEGER,
      allowNull: true,
      references: {
        model: 'rental_requests',
        key: 'id',
      },
    },
    type: {
      type: DataTypes.ENUM('rent_request', 'direct'),
      allowNull: false,
      defaultValue: 'rent_request',
    },
    participant1Id: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: 'users',
        key: 'id',
      },
      comment: 'Tenant',
    },
    participant2Id: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: 'users',
        key: 'id',
      },
      comment: 'Property owner',
    },
    lastMessageAt: {
      type: DataTypes.DATE,
      allowNull: true,
      defaultValue: null,
    },
    isActive: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: true,
    },
    status: {
      type: DataTypes.ENUM('accepted', 'pending', 'rejected'),
      allowNull: false,
      defaultValue: 'accepted',
    },
    deletedForP1: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: false,
    },
    deletedForP2: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: false,
    },
    clearedForP1At: {
      type: DataTypes.DATE,
      allowNull: true,
      defaultValue: null,
    },
    clearedForP2At: {
      type: DataTypes.DATE,
      allowNull: true,
      defaultValue: null,
    },
  },
  {
    sequelize,
    tableName: 'chat_conversations',
    modelName: 'ChatConversation',
    indexes: [
      {
        name: 'chat_conversations_rent_request_idx',
        unique: true,
        fields: ['rentRequestId'],
      },
      {
        name: 'chat_conversations_participant1_idx',
        fields: ['participant1Id'],
      },
      {
        name: 'chat_conversations_participant2_idx',
        fields: ['participant2Id'],
      },
      {
        name: 'chat_conversations_last_message_idx',
        fields: ['lastMessageAt'],
      },
    ],
  }
);

export default ChatConversation;
