import { DataTypes, Model } from 'sequelize';
import { sequelize } from '../config/database';

export interface ChatMessageDeletionAttributes {
  id: number;
  messageId: number;
  userId: number;
  createdAt?: Date;
}

class ChatMessageDeletion
  extends Model<ChatMessageDeletionAttributes, Omit<ChatMessageDeletionAttributes, 'id'>>
  implements ChatMessageDeletionAttributes
{
  public id!: number;
  public messageId!: number;
  public userId!: number;
  public readonly createdAt!: Date;
}

ChatMessageDeletion.init(
  {
    id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
    messageId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: { model: 'chat_messages', key: 'id' },
      onDelete: 'CASCADE',
    },
    userId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: { model: 'users', key: 'id' },
      onDelete: 'CASCADE',
    },
  },
  {
    sequelize,
    tableName: 'chat_message_deletions',
    modelName: 'ChatMessageDeletion',
    updatedAt: false,
    indexes: [
      { unique: true, fields: ['messageId', 'userId'], name: 'chat_message_deletions_unique' },
      { fields: ['userId'], name: 'chat_message_deletions_user_idx' },
    ],
  }
);

export default ChatMessageDeletion;
