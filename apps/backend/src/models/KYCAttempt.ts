import { DataTypes, Model } from 'sequelize';
import { sequelize } from '../config/database';

export type AttemptStep = 
  | 'document_capture'
  | 'selfie'
  | 'liveness'
  | 'ocr'
  | 'face_match'
  | 'document_validation'
  | 'manual_review';

export interface KYCAttemptAttributes {
  id?: number;
  verificationId: number;
  attemptNumber: number;
  step: AttemptStep;
  success?: boolean;
  errorMessage?: string;
  metadata?: Record<string, any>;
  createdAt?: Date;
}

class KYCAttempt extends Model<KYCAttemptAttributes> implements KYCAttemptAttributes {
  public id!: number;
  public verificationId!: number;
  public attemptNumber!: number;
  public step!: AttemptStep;
  public success!: boolean;
  public errorMessage?: string;
  public metadata!: Record<string, any>;
  
  public readonly createdAt!: Date;
  
  public readonly verification?: any;
}

KYCAttempt.init(
  {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true
    },
    verificationId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: 'kyc_verifications',
        key: 'id'
      },
      onDelete: 'CASCADE'
    },
    attemptNumber: {
      type: DataTypes.INTEGER,
      allowNull: false
    },
    step: {
      type: DataTypes.ENUM(
        'document_capture',
        'selfie',
        'liveness',
        'ocr',
        'face_match',
        'document_validation',
        'manual_review'
      ),
      allowNull: false
    },
    success: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: false
    },
    errorMessage: {
      type: DataTypes.TEXT,
      allowNull: true
    },
    metadata: {
      type: DataTypes.JSONB,
      allowNull: false,
      defaultValue: {}
    },
    createdAt: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: DataTypes.NOW
    }
  },
  {
    sequelize,
    tableName: 'kyc_attempts',
    modelName: 'KYCAttempt',
    timestamps: false,
    indexes: [
      {
        name: 'kyc_attempts_verification_id_idx',
        fields: ['verificationId']
      },
      {
        name: 'kyc_attempts_step_idx',
        fields: ['step']
      },
      {
        name: 'kyc_attempts_created_at_idx',
        fields: ['createdAt']
      }
    ]
  }
);

export default KYCAttempt;
