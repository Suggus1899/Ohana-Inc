import { DataTypes, Model } from 'sequelize';
import { sequelize } from '../config/database';

export interface ChatUserBlockAttributes {
  id: number;
  blockerId: number;
  blockedId: number;
  createdAt?: Date;
}

export interface ChatUserBlockCreationAttributes
  extends Omit<ChatUserBlockAttributes, 'id' | 'createdAt'> {}

class ChatUserBlock
  extends Model<ChatUserBlockAttributes, ChatUserBlockCreationAttributes>
  implements ChatUserBlockAttributes
{
  public id!: number;
  public blockerId!: number;
  public blockedId!: number;
  public readonly createdAt!: Date;
}

ChatUserBlock.init(
  {
    id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
    blockerId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: { model: 'users', key: 'id' },
    },
    blockedId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: { model: 'users', key: 'id' },
    },
  },
  {
    sequelize,
    tableName: 'chat_user_blocks',
    modelName: 'ChatUserBlock',
    updatedAt: false,
    indexes: [
      { unique: true, fields: ['blockerId', 'blockedId'], name: 'chat_user_blocks_unique_idx' },
      { fields: ['blockedId'], name: 'chat_user_blocks_blocked_idx' },
    ],
  }
);

export default ChatUserBlock;
