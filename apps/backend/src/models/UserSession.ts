import { DataTypes, Model } from 'sequelize';
import { sequelize } from '../config/database';
import User from './User';

export interface UserSessionAttributes {
  id: number;
  userId: number;
  startedAt: Date;
  endedAt?: Date | null;
  durationSeconds?: number | null;
  osDevice?: string | null;
  createdAt?: Date;
  updatedAt?: Date;
}

export interface UserSessionCreationAttributes extends Omit<UserSessionAttributes, 'id' | 'createdAt' | 'updatedAt'> {}

class UserSession extends Model<UserSessionAttributes, UserSessionCreationAttributes> implements UserSessionAttributes {
  public id!: number;
  public userId!: number;
  public startedAt!: Date;
  public endedAt!: Date | null;
  public durationSeconds!: number | null;
  public osDevice!: string | null;
  public readonly createdAt!: Date;
  public readonly updatedAt!: Date;
}

UserSession.init(
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
    startedAt: {
      type: DataTypes.DATE,
      allowNull: false
    },
    endedAt: {
      type: DataTypes.DATE,
      allowNull: true
    },
    durationSeconds: {
      type: DataTypes.INTEGER,
      allowNull: true
    },
    osDevice: {
      type: DataTypes.STRING,
      allowNull: true
    }
  },
  {
    sequelize,
    tableName: 'user_sessions',
    modelName: 'UserSession',
    timestamps: true,
    createdAt: 'createdAt',
    updatedAt: 'updatedAt'
  }
);

export default UserSession;