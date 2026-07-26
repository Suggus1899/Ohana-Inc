import { DataTypes, Model } from 'sequelize';
import { sequelize } from '../config/database';

export type DocumentType = 
  | 'id_front'
  | 'id_back'
  | 'selfie'
  | 'selfie_with_doc'
  | 'liveness_video'
  | 'proof_of_address';

export interface KYCDocumentAttributes {
  id?: number;
  verificationId: number;
  documentType: DocumentType;
  url: string;
  encryptedUrl: string;
  fileHash: string;
  metadata?: Record<string, any>;
  uploadedAt?: Date;
}

class KYCDocument extends Model<KYCDocumentAttributes> implements KYCDocumentAttributes {
  public id!: number;
  public verificationId!: number;
  public documentType!: DocumentType;
  public url!: string;
  public encryptedUrl!: string;
  public fileHash!: string;
  public metadata?: Record<string, any>;
  public uploadedAt?: Date;
  
  public readonly verification?: any;
}

KYCDocument.init(
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
    documentType: {
      type: DataTypes.ENUM(
        'id_front',
        'id_back',
        'selfie',
        'selfie_with_doc',
        'liveness_video',
        'proof_of_address'
      ),
      allowNull: false
    },
    url: {
      type: DataTypes.TEXT,
      allowNull: false
    },
    encryptedUrl: {
      type: DataTypes.TEXT,
      allowNull: false
    },
    fileHash: {
      type: DataTypes.STRING(64),
      allowNull: false
    },
    metadata: {
      type: DataTypes.JSONB,
      allowNull: false,
      defaultValue: {}
    },
    uploadedAt: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: DataTypes.NOW
    }
  },
  {
    sequelize,
    tableName: 'kyc_documents',
    modelName: 'KYCDocument',
    timestamps: false,
    indexes: [
      {
        name: 'kyc_documents_verification_id_idx',
        fields: ['verificationId']
      },
      {
        name: 'kyc_documents_document_type_idx',
        fields: ['documentType']
      },
      {
        name: 'kyc_documents_file_hash_idx',
        fields: ['fileHash']
      }
    ]
  }
);

export default KYCDocument;
