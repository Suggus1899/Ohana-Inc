import { DataTypes, Model } from 'sequelize';
import { sequelize } from '../config/database';
import { UserActionAttributes, UserActionCreationAttributes } from '../types';

class UserAction extends Model<UserActionAttributes, UserActionCreationAttributes> implements UserActionAttributes {
  public id!: number;
  public action!: 'block' | 'unblock' | 'suspend' | 'activate' | 'warn';
  public targetUserId!: number;
  public performedBy!: number;
  public reason!: string;
  public duration?: number;
  public expiresAt?: Date | null;

  public readonly createdAt!: Date;
  public readonly updatedAt!: Date;
}

UserAction.init(
  {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true
    },
    action: {
      type: DataTypes.ENUM('block', 'unblock', 'suspend', 'activate', 'warn'),
      allowNull: false
    },
    targetUserId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: 'users',
        key: 'id'
      }
    },
    performedBy: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: 'users',
        key: 'id'
      }
    },
    reason: {
      type: DataTypes.TEXT,
      allowNull: false
    },
    duration: {
      type: DataTypes.INTEGER,
      allowNull: true
    },
    expiresAt: {
      type: DataTypes.DATE,
      allowNull: true
    }
  },
  {
    sequelize,
    tableName: 'user_actions',
    modelName: 'UserAction',
    indexes: [
      { name: 'user_actions_target_idx', fields: ['targetUserId'] },
      { name: 'user_actions_performer_idx', fields: ['performedBy'] }
    ]
  }
);

export default UserAction;
