import { DataTypes, Model } from 'sequelize';
import { sequelize } from '../config/database';
import { UserBehaviorAttributes, UserBehaviorCreationAttributes } from '../types';

class UserBehavior extends Model<UserBehaviorAttributes, UserBehaviorCreationAttributes> implements UserBehaviorAttributes {
  public id!: number;
  public userId!: number | null;
  public sessionId!: string;
  public eventType!: 'search' | 'view' | 'favorite' | 'request' | 'filter' | 'click' | 'geocode_search' | 'nearby_search' | 'autocomplete' | 'reverse_geocode';
  public eventData!: object;
  public timestamp!: Date;
}

UserBehavior.init(
  {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true
    },
    userId: {
      type: DataTypes.INTEGER,
      allowNull: true,
      references: {
        model: 'users',
        key: 'id'
      }
    },
    sessionId: {
      type: DataTypes.STRING(100),
      allowNull: false
    },
    eventType: {
      type: DataTypes.ENUM('search', 'view', 'favorite', 'request', 'filter', 'click', 'geocode_search', 'nearby_search', 'autocomplete', 'reverse_geocode'),
      allowNull: false
    },
    eventData: {
      type: DataTypes.JSON,
      defaultValue: {}
    },
    timestamp: {
      type: DataTypes.DATE,
      defaultValue: DataTypes.NOW
    }
  },
  {
    sequelize,
    tableName: 'user_behaviors',
    modelName: 'UserBehavior',
    timestamps: false,
    indexes: [
      { name: 'user_behavior_session_idx', fields: ['sessionId'] },
      { name: 'user_behavior_event_idx', fields: ['eventType'] },
      { name: 'user_behavior_timestamp_idx', fields: ['timestamp'] }
    ]
  }
);

export default UserBehavior;
