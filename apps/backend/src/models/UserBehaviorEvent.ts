import { DataTypes, Model } from 'sequelize';
import { sequelize } from '../config/database';
import User from './User';
import UserSession from './UserSession';

export type BehaviorEventType = 'CLICK' | 'SEARCH' | 'VIEW' | 'SCROLL_LIMIT';

export interface UserBehaviorEventAttributes {
  id: number;
  sessionId?: number | null;
  userId?: number | null;
  eventType: BehaviorEventType;
  targetElement?: string | null;
  metadata?: any;
  createdAt?: Date;
}

export interface UserBehaviorEventCreationAttributes extends Omit<UserBehaviorEventAttributes, 'id' | 'createdAt'> {}

class UserBehaviorEvent extends Model<UserBehaviorEventAttributes, UserBehaviorEventCreationAttributes> implements UserBehaviorEventAttributes {
  public id!: number;
  public sessionId!: number | null;
  public userId!: number | null;
  public eventType!: BehaviorEventType;
  public targetElement!: string | null;
  public metadata!: any;
  public readonly createdAt!: Date;
}

UserBehaviorEvent.init(
  {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true
    },
    sessionId: {
      type: DataTypes.INTEGER,
      allowNull: true,
      references: { model: 'user_sessions', key: 'id' }
    },
    userId: {
      type: DataTypes.INTEGER,
      allowNull: true,
      references: { model: 'users', key: 'id' }
    },
    eventType: {
      type: DataTypes.ENUM('CLICK', 'SEARCH', 'VIEW', 'SCROLL_LIMIT'),
      allowNull: false
    },
    targetElement: {
      type: DataTypes.STRING,
      allowNull: true
    },
    metadata: {
      type: DataTypes.JSONB,
      allowNull: true
    }
  },
  {
    sequelize,
    tableName: 'user_behavior_events',
    modelName: 'UserBehaviorEvent',
    timestamps: true,
    createdAt: 'createdAt',
    updatedAt: false
  }
);

export default UserBehaviorEvent;