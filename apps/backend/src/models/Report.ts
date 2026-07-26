import { DataTypes, Model } from 'sequelize';
import { sequelize } from '../config/database';
import { ReportAttributes, ReportCreationAttributes } from '../types';

class Report extends Model<ReportAttributes, ReportCreationAttributes> implements ReportAttributes {
  public id!: number;
  public reportedBy!: number;
  public reportedEntity!: 'user' | 'property' | 'comment' | 'message';
  public entityId!: number;
  public reason!: 'spam' | 'inappropriate' | 'fraud' | 'harassment' | 'other';
  public description!: string;
  public status!: 'pending' | 'investigating' | 'resolved' | 'dismissed';
  public assignedTo?: number;
  public resolution?: string;
  public resolvedAt?: Date;

  public readonly createdAt!: Date;
  public readonly updatedAt!: Date;
}

Report.init(
  {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true
    },
    reportedBy: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: 'users',
        key: 'id'
      }
    },
    reportedEntity: {
      type: DataTypes.ENUM('user', 'property', 'comment', 'message'),
      allowNull: false
    },
    entityId: {
      type: DataTypes.INTEGER,
      allowNull: false
    },
    reason: {
      type: DataTypes.ENUM('spam', 'inappropriate', 'fraud', 'harassment', 'other'),
      allowNull: false
    },
    description: {
      type: DataTypes.TEXT,
      allowNull: false
    },
    status: {
      type: DataTypes.ENUM('pending', 'investigating', 'resolved', 'dismissed'),
      defaultValue: 'pending'
    },
    assignedTo: {
      type: DataTypes.INTEGER,
      allowNull: true,
      references: {
        model: 'users',
        key: 'id'
      }
    },
    resolution: {
      type: DataTypes.TEXT,
      allowNull: true
    },
    resolvedAt: {
      type: DataTypes.DATE,
      allowNull: true
    }
  },
  {
    sequelize,
    tableName: 'reports',
    modelName: 'Report',
    indexes: [
      { name: 'reports_reported_by_idx', fields: ['reportedBy'] },
      { name: 'reports_entity_idx', fields: ['reportedEntity', 'entityId'] },
      { name: 'reports_status_idx', fields: ['status'] },
      { name: 'reports_priority_idx', fields: ['assignedTo'] }
    ]
  }
);

export default Report;
