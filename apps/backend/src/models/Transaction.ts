import { DataTypes, Model } from 'sequelize';
import { sequelize } from '../config/database';

export enum TransactionStatus {
  PENDING_OWNER_APPROVAL = 'pending_owner_approval',
  PENDING_PAYMENT = 'pending_payment',
  PAYMENT_SUBMITTED = 'payment_submitted',
  PAYMENT_CONFIRMED = 'payment_confirmed',
  COMPLETED = 'completed',
  CANCELLED = 'cancelled',
  REJECTED = 'rejected',
  DISPUTED = 'disputed',
  REFUNDED = 'refunded',
  EXPIRED = 'expired',
}

export enum EscrowStatus {
  NONE = 'none',
  HOLDING = 'holding',
  RELEASED = 'released',
  REFUNDED = 'refunded',
  FROZEN = 'frozen',
}

export interface TransactionAttributes {
  id: number;
  rentalRequestId?: number | null;
  propertyId: number;
  ownerId: number;
  clientId: number;
  amount: number;
  currency: string;
  status: TransactionStatus;
  escrowStatus: EscrowStatus;
  paymentMethod?: string | null;
  paymentReference?: string | null;
  paymentProof?: string[];
  paymentDate?: Date | null;
  clientConfirmedAt?: Date | null;
  ownerConfirmedAt?: Date | null;
  expiresAt?: Date | null;
  completedAt?: Date | null;
  notes?: string | null;
  metadata?: any;
  createdAt?: Date;
  updatedAt?: Date;
}

export interface TransactionCreationAttributes extends Omit<TransactionAttributes, 'id' | 'createdAt' | 'updatedAt'> {}


class Transaction extends Model<TransactionAttributes, TransactionCreationAttributes> implements TransactionAttributes {
  public id!: number;
  public rentalRequestId!: number | null;
  public propertyId!: number;
  public ownerId!: number;
  public clientId!: number;
  public amount!: number;
  public currency!: string;
  public status!: TransactionStatus;
  public escrowStatus!: EscrowStatus;
  public paymentMethod!: string | null;
  public paymentReference!: string | null;
  public paymentProof!: string[];
  public paymentDate!: Date | null;
  public clientConfirmedAt!: Date | null;
  public ownerConfirmedAt!: Date | null;
  public expiresAt!: Date | null;
  public completedAt!: Date | null;
  public notes!: string | null;
  public metadata!: any;

  public readonly createdAt!: Date;
  public readonly updatedAt!: Date;

  // Virtual associations
  public property?: any;
  public owner?: any;
  public client?: any;
}

Transaction.init(
  {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
    },
    rentalRequestId: {
      type: DataTypes.INTEGER,
      allowNull: true,
      references: {
        model: 'rental_requests',
        key: 'id',
      },
    },
    propertyId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: 'properties',
        key: 'id',
      },
    },
    ownerId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: 'users',
        key: 'id',
      },
    },
    clientId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: 'users',
        key: 'id',
      },
    },
    amount: {
      type: DataTypes.DECIMAL(12, 2),
      allowNull: false,
    },
    currency: {
      type: DataTypes.STRING(3),
      defaultValue: 'USD',
    },
    status: {
      type: DataTypes.ENUM(...Object.values(TransactionStatus)),
      defaultValue: TransactionStatus.PENDING_OWNER_APPROVAL,
    },
    escrowStatus: {
      type: DataTypes.ENUM(...Object.values(EscrowStatus)),
      defaultValue: EscrowStatus.NONE,
    },
    paymentMethod: {
      type: DataTypes.STRING(50),
      allowNull: true,
      comment: 'PSE, Nequi, Daviplata, Efecty, etc.',
    },
    paymentReference: {
      type: DataTypes.STRING(100),
      allowNull: true,
    },
    paymentProof: {
      type: DataTypes.JSONB,
      defaultValue: [],
      comment: 'URLs de comprobantes de pago',
    },
    paymentDate: {
      type: DataTypes.DATE,
      allowNull: true,
    },
    clientConfirmedAt: {
      type: DataTypes.DATE,
      allowNull: true,
    },
    ownerConfirmedAt: {
      type: DataTypes.DATE,
      allowNull: true,
    },
    expiresAt: {
      type: DataTypes.DATE,
      allowNull: true,
      comment: 'Tiempo límite para completar la transacción',
    },
    completedAt: {
      type: DataTypes.DATE,
      allowNull: true,
    },
    notes: {
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
    tableName: 'transactions',
    modelName: 'Transaction',
    indexes: [
      { name: 'transactions_property_idx', fields: ['propertyId'] },
      { name: 'transactions_owner_idx', fields: ['ownerId'] },
      { name: 'transactions_client_idx', fields: ['clientId'] },
      { name: 'transactions_status_idx', fields: ['status'] },
      { name: 'transactions_escrow_status_idx', fields: ['escrowStatus'] },
      { name: 'transactions_created_at_idx', fields: ['createdAt'] },
      { name: 'transactions_expires_at_idx', fields: ['expiresAt'] },
    ],
  }
);

export default Transaction;
