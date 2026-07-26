import { DataTypes, Model } from 'sequelize';
import { sequelize } from '../config/database';

export type VerificationStatus = 
  | 'not_started'
  | 'in_progress'
  | 'level_1_in_progress'
  | 'level_1_completed'
  | 'level_2_in_progress'
  | 'level_2_completed'
  | 'level_3_in_progress'
  | 'level_3_completed'
  | 'documents_uploaded'
  | 'pending_review'
  | 'under_review'
  | 'approved'
  | 'rejected'
  | 'expired'
  | 'resubmission_required';

export interface KYCVerificationAttributes {
  id?: number;
  userId: number;
  status: VerificationStatus;
  verificationLevel: number;
  currentLevel: number;
  level1Data?: Record<string, any>;
  level2Data?: Record<string, any>;
  level3Data?: Record<string, any>;
  level1CompletedAt?: Date;
  level2CompletedAt?: Date;
  level3CompletedAt?: Date;
  fullName?: string;
  documentNumber?: string;
  documentType?: string;
  dateOfBirth?: Date;
  nationality?: string;
  address?: string;
  documentFrontUrl?: string;
  documentBackUrl?: string;
  selfieUrl?: string;
  selfieWithDocumentUrl?: string;
  livenessVideoUrl?: string;
  proofOfAddressUrl?: string;
  faceMatchScore?: number;
  livenessScore?: number;
  documentValidityScore?: number;
  fraudScore?: number;
  ocrData?: Record<string, any>;
  reviewedBy?: number;
  reviewedAt?: Date;
  reviewNotes?: string;
  rejectionReason?: string;
  attempts: number;
  lastAttemptAt?: Date;
  verifiedAt?: Date;
  expiresAt?: Date;
  consentedAt?: Date;
  createdAt?: Date;
  updatedAt?: Date;
}

class KYCVerification extends Model<KYCVerificationAttributes> implements KYCVerificationAttributes {
  public id!: number;
  public userId!: number;
  public status!: VerificationStatus;
  public verificationLevel!: number;
  public currentLevel!: number;
  public level1Data?: Record<string, any>;
  public level2Data?: Record<string, any>;
  public level3Data?: Record<string, any>;
  public level1CompletedAt?: Date;
  public level2CompletedAt?: Date;
  public level3CompletedAt?: Date;
  public fullName?: string;
  public documentNumber?: string;
  public documentType?: string;
  public dateOfBirth?: Date;
  public nationality?: string;
  public address?: string;
  public documentFrontUrl?: string;
  public documentBackUrl?: string;
  public selfieUrl?: string;
  public selfieWithDocumentUrl?: string;
  public livenessVideoUrl?: string;
  public proofOfAddressUrl?: string;
  public faceMatchScore?: number;
  public livenessScore?: number;
  public documentValidityScore?: number;
  public fraudScore?: number;
  public ocrData?: Record<string, any>;
  public reviewedBy?: number;
  public reviewedAt?: Date;
  public reviewNotes?: string;
  public rejectionReason?: string;
  public attempts!: number;
  public lastAttemptAt?: Date;
  public verifiedAt?: Date;
  public expiresAt?: Date;
  public consentedAt?: Date;
  
  public readonly createdAt!: Date;
  public readonly updatedAt!: Date;
}

KYCVerification.init(
  {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true
    },
    userId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      unique: true,
      references: {
        model: 'users',
        key: 'id'
      }
    },
    status: {
      type: DataTypes.ENUM(
        'not_started',
        'in_progress',
        'level_1_in_progress',
        'level_1_completed',
        'level_2_in_progress',
        'level_2_completed',
        'level_3_in_progress',
        'level_3_completed',
        'documents_uploaded',
        'pending_review',
        'under_review',
        'approved',
        'rejected',
        'expired',
        'resubmission_required'
      ),
      defaultValue: 'not_started',
      allowNull: false
    },
    verificationLevel: {
      type: DataTypes.INTEGER,
      defaultValue: 0,
      allowNull: false,
      validate: {
        min: 0,
        max: 5
      }
    },
    currentLevel: {
      type: DataTypes.INTEGER,
      defaultValue: 0,
      allowNull: false,
      validate: {
        min: 0,
        max: 3
      }
    },
    level1Data: {
      type: DataTypes.JSONB,
      allowNull: true,
      defaultValue: null
    },
    level2Data: {
      type: DataTypes.JSONB,
      allowNull: true,
      defaultValue: null
    },
    level3Data: {
      type: DataTypes.JSONB,
      allowNull: true,
      defaultValue: null
    },
    level1CompletedAt: {
      type: DataTypes.DATE,
      allowNull: true
    },
    level2CompletedAt: {
      type: DataTypes.DATE,
      allowNull: true
    },
    level3CompletedAt: {
      type: DataTypes.DATE,
      allowNull: true
    },
    fullName: {
      type: DataTypes.STRING(255),
      allowNull: true
    },
    documentNumber: {
      type: DataTypes.STRING(50),
      allowNull: true
    },
    documentType: {
      type: DataTypes.STRING(50),
      allowNull: true
    },
    dateOfBirth: {
      type: DataTypes.DATEONLY,
      allowNull: true
    },
    nationality: {
      type: DataTypes.STRING(100),
      allowNull: true
    },
    address: {
      type: DataTypes.TEXT,
      allowNull: true
    },
    documentFrontUrl: {
      type: DataTypes.TEXT,
      allowNull: true
    },
    documentBackUrl: {
      type: DataTypes.TEXT,
      allowNull: true
    },
    selfieUrl: {
      type: DataTypes.TEXT,
      allowNull: true
    },
    selfieWithDocumentUrl: {
      type: DataTypes.TEXT,
      allowNull: true
    },
    livenessVideoUrl: {
      type: DataTypes.TEXT,
      allowNull: true
    },
    proofOfAddressUrl: {
      type: DataTypes.TEXT,
      allowNull: true
    },
    faceMatchScore: {
      type: DataTypes.DECIMAL(5, 2),
      allowNull: true,
      validate: {
        min: 0,
        max: 100
      }
    },
    livenessScore: {
      type: DataTypes.DECIMAL(5, 2),
      allowNull: true,
      validate: {
        min: 0,
        max: 100
      }
    },
    documentValidityScore: {
      type: DataTypes.DECIMAL(5, 2),
      allowNull: true,
      validate: {
        min: 0,
        max: 100
      }
    },
    fraudScore: {
      type: DataTypes.DECIMAL(5, 2),
      allowNull: true,
      validate: {
        min: 0,
        max: 100
      }
    },
    ocrData: {
      type: DataTypes.JSONB,
      allowNull: true,
      defaultValue: null
    },
    reviewedBy: {
      type: DataTypes.INTEGER,
      allowNull: true,
      references: {
        model: 'users',
        key: 'id'
      }
    },
    reviewedAt: {
      type: DataTypes.DATE,
      allowNull: true
    },
    reviewNotes: {
      type: DataTypes.TEXT,
      allowNull: true
    },
    rejectionReason: {
      type: DataTypes.TEXT,
      allowNull: true
    },
    attempts: {
      type: DataTypes.INTEGER,
      defaultValue: 0,
      allowNull: false
    },
    lastAttemptAt: {
      type: DataTypes.DATE,
      allowNull: true
    },
    verifiedAt: {
      type: DataTypes.DATE,
      allowNull: true
    },
    expiresAt: {
      type: DataTypes.DATE,
      allowNull: true
    },
    consentedAt: {
      type: DataTypes.DATE,
      allowNull: true
    },
    createdAt: {
      type: DataTypes.DATE,
      allowNull: false
    },
    updatedAt: {
      type: DataTypes.DATE,
      allowNull: false
    }
  },
  {
    sequelize,
    tableName: 'kyc_verifications',
    modelName: 'KYCVerification',
    indexes: [
      {
        name: 'kyc_verifications_user_id_idx',
        unique: true,
        fields: ['userId']
      },
      {
        name: 'kyc_verifications_status_idx',
        fields: ['status']
      },
      {
        name: 'kyc_verifications_verification_level_idx',
        fields: ['verificationLevel']
      },
      {
        name: 'kyc_verifications_document_number_idx',
        fields: ['documentNumber']
      },
      {
        name: 'kyc_verifications_created_at_idx',
        fields: ['createdAt']
      },
      {
        name: 'kyc_verifications_reviewed_by_idx',
        fields: ['reviewedBy']
      }
    ]
  }
);

export default KYCVerification;
