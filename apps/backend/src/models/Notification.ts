import { DataTypes, Model } from 'sequelize';
import { sequelize } from '../config/database';

interface NotificationAttributes {
  id: number;
  userId: number;
  type: 'transaction' | 'message' | 'kyc' | 'system' | 'property' | 'review';
  title: string;
  message: string;
  data: Record<string, unknown> | null;
  isRead: boolean;
  createdAt?: Date;
  updatedAt?: Date;
}

interface NotificationCreationAttributes {
  userId: number;
  type: NotificationAttributes['type'];
  title: string;
  message: string;
  data?: Record<string, unknown>;
}

class Notification extends Model<NotificationAttributes, NotificationCreationAttributes>
  implements NotificationAttributes {
  public id!: number;
  public userId!: number;
  public type!: NotificationAttributes['type'];
  public title!: string;
  public message!: string;
  public data!: Record<string, unknown> | null;
  public isRead!: boolean;
  public createdAt!: Date;
  public updatedAt!: Date;
}

Notification.init(
  {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true
    },
    userId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: { model: 'users', key: 'id' }
    },
    type: {
      type: DataTypes.ENUM('transaction', 'message', 'kyc', 'system', 'property', 'review'),
      allowNull: false
    },
    title: {
      type: DataTypes.STRING(255),
      allowNull: false
    },
    message: {
      type: DataTypes.TEXT,
      allowNull: false
    },
    data: {
      type: DataTypes.JSON,
      allowNull: true,
      defaultValue: null
    },
    isRead: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: false
    }
  },
  {
    sequelize,
    tableName: 'notifications',
    modelName: 'Notification',
    timestamps: true,
    indexes: [
      { name: 'notifications_user_idx', fields: ['userId'] },
      { name: 'notifications_user_read_idx', fields: ['userId', 'isRead'] }
    ]
  }
);

export default Notification;