import { DataTypes, Model } from 'sequelize';
import { sequelize } from '../config/database';

export interface TransactionTimelineAttributes {
  id: number;
  transactionId: number;
  action: string;
  actor: string;
  actorId?: number | null;
  previousStatus?: string | null;
  newStatus: string;
  description?: string | null;
  metadata?: any;
  createdAt?: Date;
}

export interface TransactionTimelineCreationAttributes extends Omit<TransactionTimelineAttributes, 'id' | 'createdAt'> {}

class TransactionTimeline extends Model<TransactionTimelineAttributes, TransactionTimelineCreationAttributes> implements TransactionTimelineAttributes {
  public id!: number;
  public transactionId!: number;
  public action!: string;
  public actor!: string;
  public actorId!: number | null;
  public previousStatus!: string | null;
  public newStatus!: string;
  public description!: string | null;
  public metadata!: any;

  public readonly createdAt!: Date;
}

TransactionTimeline.init(
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
      onDelete: 'CASCADE',
    },
    action: {
      type: DataTypes.STRING(50),
      allowNull: false,
      comment: 'created, approved, payment_submitted, confirmed, etc.',
    },
    actor: {
      type: DataTypes.STRING(20),
      allowNull: false,
      comment: 'client, owner, operator, system',
    },
    actorId: {
      type: DataTypes.INTEGER,
      allowNull: true,
      references: {
        model: 'users',
        key: 'id',
      },
    },
    previousStatus: {
      type: DataTypes.STRING(50),
      allowNull: true,
    },
    newStatus: {
      type: DataTypes.STRING(50),
      allowNull: false,
    },
    description: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    metadata: {
      type: DataTypes.JSONB,
      defaultValue: {},
    },
  },
  {
    sequelize,
    tableName: 'transaction_timeline',
    modelName: 'TransactionTimeline',
    timestamps: true,
    updatedAt: false,
    indexes: [
      { name: 'timeline_transaction_idx', fields: ['transactionId'] },
      { name: 'timeline_created_at_idx', fields: ['createdAt'] },
    ],
  }
);

export default TransactionTimeline;
