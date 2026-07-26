import { DataTypes, Model } from 'sequelize';
import { sequelize } from '../config/database';

export enum DisputeStatus {
  OPEN = 'open',
  UNDER_REVIEW = 'under_review',
  RESOLVED = 'resolved',
  CLOSED = 'closed',
}

export interface DisputeAttributes {
  id: number;
  transactionId: number;
  reportedBy: number;
  reportedAgainst: number;
  reason: string;
  description: string;
  evidence?: string[];
  status: DisputeStatus;
  resolution?: string | null;
  resolvedBy?: number | null;
  resolvedAt?: Date | null;
  createdAt?: Date;
  updatedAt?: Date;
}

export interface DisputeCreationAttributes extends Omit<DisputeAttributes, 'id' | 'createdAt' | 'updatedAt'> {}

class Dispute extends Model<DisputeAttributes, DisputeCreationAttributes> implements DisputeAttributes {
  public id!: number;
  public transactionId!: number;
  public reportedBy!: number;
  public reportedAgainst!: number;
  public reason!: string;
  public description!: string;
  public evidence!: string[];
  public status!: DisputeStatus;
  public resolution!: string | null;
  public resolvedBy!: number | null;
  public resolvedAt!: Date | null;

  public readonly createdAt!: Date;
  public readonly updatedAt!: Date;

  // Virtual associations
  public transaction?: any;
}

Dispute.init(
  {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
    },
    transactionId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: 'transactions',
        key: 'id',
      },
    },
    reportedBy: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: 'users',
        key: 'id',
      },
    },
    reportedAgainst: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: 'users',
        key: 'id',
      },
    },
    reason: {
      type: DataTypes.STRING(100),
      allowNull: false,
    },
    description: {
      type: DataTypes.TEXT,
      allowNull: false,
    },
    evidence: {
      type: DataTypes.JSONB,
      defaultValue: [],
      comment: 'URLs de evidencias (capturas, documentos)',
    },
    status: {
      type: DataTypes.ENUM(...Object.values(DisputeStatus)),
      defaultValue: DisputeStatus.OPEN,
    },
    resolution: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    resolvedBy: {
      type: DataTypes.INTEGER,
      allowNull: true,
      references: {
        model: 'users',
        key: 'id',
      },
    },
    resolvedAt: {
      type: DataTypes.DATE,
      allowNull: true,
    },
  },
  {
    sequelize,
    tableName: 'disputes',
    modelName: 'Dispute',
    indexes: [
      { name: 'disputes_transaction_idx', fields: ['transactionId'] },
      { name: 'disputes_reported_by_idx', fields: ['reportedBy'] },
      { name: 'disputes_status_idx', fields: ['status'] },
      { name: 'disputes_created_at_idx', fields: ['createdAt'] },
    ],
  }
);

export default Dispute;
