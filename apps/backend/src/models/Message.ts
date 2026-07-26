import { DataTypes, Model } from 'sequelize';
import { sequelize } from '../config/database';
import { MessageAttributes, MessageCreationAttributes } from '../types';

class Message extends Model<MessageAttributes, MessageCreationAttributes> implements MessageAttributes {
  public id!: number;
  public senderId!: number;
  public receiverId!: number;
  public propertyId?: number | null;
  public content!: string;
  public isRead!: boolean;

  public readonly createdAt!: Date;
  public readonly updatedAt!: Date;
}

Message.init(
  {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true
    },
    senderId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: { model: 'users', key: 'id' }
    },
    receiverId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: { model: 'users', key: 'id' }
    },
    propertyId: {
      type: DataTypes.INTEGER,
      allowNull: true,
      references: { model: 'properties', key: 'id' }
    },
    content: {
      type: DataTypes.TEXT,
      allowNull: false
    },
    isRead: {
      type: DataTypes.BOOLEAN,
      defaultValue: false,
      allowNull: false
    }
  },
  {
    sequelize,
    tableName: 'messages',
    modelName: 'Message',
    indexes: [
      { name: 'messages_sender_idx', fields: ['senderId'] },
      { name: 'messages_receiver_idx', fields: ['receiverId'] },
      { name: 'messages_property_idx', fields: ['propertyId'] }
    ]
  }
);

export default Message;
