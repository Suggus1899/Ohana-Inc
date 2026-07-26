import { DataTypes, Model } from 'sequelize';
import { sequelize } from '../config/database';

interface EmailVerificationCodeAttributes {
  id: number;
  userId: number | null;
  email: string;
  code: string;
  type: 'email_verification' | 'password_reset';
  expiresAt: Date;
  usedAt: Date | null;
  createdAt?: Date;
}

interface EmailVerificationCodeCreationAttributes {
  userId?: number | null;
  email: string;
  code: string;
  type: 'email_verification' | 'password_reset';
  expiresAt: Date;
}

class EmailVerificationCode extends Model<EmailVerificationCodeAttributes, EmailVerificationCodeCreationAttributes>
  implements EmailVerificationCodeAttributes {
  public id!: number;
  public userId!: number | null;
  public email!: string;
  public code!: string;
  public type!: 'email_verification' | 'password_reset';
  public expiresAt!: Date;
  public usedAt!: Date | null;
  public createdAt!: Date;
}

EmailVerificationCode.init(
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
    email: {
      type: DataTypes.STRING(255),
      allowNull: false
    },
    code: {
      type: DataTypes.STRING(10),
      allowNull: false
    },
    type: {
      type: DataTypes.ENUM('email_verification', 'password_reset'),
      allowNull: false
    },
    expiresAt: {
      type: DataTypes.DATE,
      allowNull: false
    },
    usedAt: {
      type: DataTypes.DATE,
      allowNull: true,
      defaultValue: null
    }
  },
  {
    sequelize,
    tableName: 'email_verification_codes',
    modelName: 'EmailVerificationCode',
    timestamps: true,
    updatedAt: false,
    indexes: [
      { name: 'evc_email_type_idx', fields: ['email', 'type'] },
      { name: 'evc_code_idx', fields: ['code'] },
      { name: 'evc_expires_idx', fields: ['expiresAt'] }
    ]
  }
);

export default EmailVerificationCode;
