import { DataTypes, Model } from 'sequelize';
import { sequelize } from '../config/database';
import { AuditLogAttributes, AuditLogCreationAttributes } from '../types';

class AuditLog extends Model<AuditLogAttributes, AuditLogCreationAttributes> implements AuditLogAttributes {
  public id!: number;
  public userId!: number;
  public action!: string;
  public entity!: string;
  public entityId!: number;
  public changes?: object;
  public ipAddress!: string;
  public userAgent!: string;
  public timestamp!: Date;
}

AuditLog.init(
  {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true
    },
    userId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: 'users',
        key: 'id'
      }
    },
    action: {
      type: DataTypes.STRING(100),
      allowNull: false
    },
    entity: {
      type: DataTypes.STRING(100),
      allowNull: false
    },
    entityId: {
      type: DataTypes.INTEGER,
      allowNull: false
    },
    changes: {
      type: DataTypes.JSON,
      allowNull: true
    },
    ipAddress: {
      type: DataTypes.STRING(45),
      allowNull: false
    },
    userAgent: {
      type: DataTypes.STRING(255),
      allowNull: false
    },
    timestamp: {
      type: DataTypes.DATE,
      defaultValue: DataTypes.NOW
    }
  },
  {
    sequelize,
    tableName: 'audit_logs',
    modelName: 'AuditLog',
    timestamps: false,
    indexes: [
      { name: 'audit_logs_user_idx', fields: ['userId'] },
      { name: 'audit_logs_timestamp_idx', fields: ['timestamp'] },
      { name: 'audit_logs_entity_idx', fields: ['entity', 'entityId'] }
    ]
  }
);

export default AuditLog;
