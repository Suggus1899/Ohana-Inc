import { DataTypes, Model } from 'sequelize';
import { sequelize } from '../config/database';
import bcrypt from 'bcryptjs';
import { UserAttributes, UserCreationAttributes, UserRole, AccountStatus } from '../types';
import UserSession from './UserSession';
import UserBehaviorEvent from './UserBehaviorEvent';

export type AuthProvider = 'local' | 'google';

class User extends Model<UserAttributes, UserCreationAttributes> implements UserAttributes {
  public id!: number;
  public name!: string;
  public email!: string;
  public password?: string;
  public phonePrefix!: string;
  public phone!: string;
  public cedulaType!: string;
  public cedula!: string;
  public dateOfBirth?: string;
  public gender?: string;
  public city?: string;
  public role!: UserRole;
  public isVerified!: boolean;
  public accountStatus!: AccountStatus;
  public verifiedById?: number | null;
  public verificationLevel?: number;
  public profilePhotoUrl?: string;
  public status!: 'active' | 'blocked' | 'suspended';
  public statusReason?: string | null;
  public suspendedUntil?: Date | null;
  public bankName?: string | null;
  public bankAccountNumber?: string | null;
  public bankAccountHolder?: string | null;
  public bankAccountType?: string | null;
  public bankPhone?: string | null;
  public bankPhoneId?: string | null;
  public bankPhoneName?: string | null;
  public address?: string;
  public preferences?: {
    emailNotifications?: boolean;
    whatsappNotifications?: boolean;
  };
  public emailVerified!: boolean;
  public authProvider!: AuthProvider;
  public googleId?: string;
  public tutorialCompleted!: boolean;
  public avgRatingAsOwner?: number;
  public reviewCountAsOwner?: number;
  public avgRatingAsTenant?: number;
  public reviewCountAsTenant?: number;

  public readonly createdAt!: Date;
  public readonly updatedAt!: Date;

  public async comparePassword(candidatePassword: string): Promise<boolean> {
    return bcrypt.compare(candidatePassword, this.password);
  }

  public toJSON(): Omit<UserAttributes, 'password'> {
    const values = { ...this.get() };
    delete (values as any).password;
    return values as unknown as Omit<UserAttributes, 'password'>;
  }
}

User.init(
  {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true
    },
    name: {
      type: DataTypes.STRING(100),
      allowNull: false
    },
    email: {
      type: DataTypes.STRING(255),
      allowNull: false,
      unique: true
    },
    password: {
      type: DataTypes.STRING(255),
      allowNull: true
    },
    phonePrefix: {
      type: DataTypes.STRING(10),
      allowNull: false
    },
    phone: {
      type: DataTypes.STRING(20),
      allowNull: false
    },
    cedulaType: {
      type: DataTypes.STRING(1),
      allowNull: false
    },
    cedula: {
      type: DataTypes.STRING(20),
      allowNull: false,
      unique: true
    },
    dateOfBirth: {
      type: DataTypes.DATEONLY,
      allowNull: true
    },
    gender: {
      type: DataTypes.STRING(20),
      allowNull: true
    },
    role: {
      type: DataTypes.ENUM('admin', 'cliente', 'operator', 'propietario', 'estudiante'),
      defaultValue: 'cliente',
      allowNull: false
    },
    isVerified: {
      type: DataTypes.BOOLEAN,
      defaultValue: false,
      allowNull: false
    },
    accountStatus: {
      type: DataTypes.ENUM('pending', 'active', 'suspended', 'rejected'),
      defaultValue: 'pending',
      allowNull: false,
      comment: 'Estado de la cuenta del usuario',
    },
    verifiedById: {
      type: DataTypes.INTEGER,
      allowNull: true,
      references: {
        model: 'users',
        key: 'id'
      }
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
    profilePhotoUrl: {
      type: DataTypes.TEXT,
      allowNull: true
    },
    status: {
      type: DataTypes.ENUM('active', 'blocked', 'suspended'),
      defaultValue: 'active',
      allowNull: false
    },
    statusReason: {
      type: DataTypes.TEXT,
      allowNull: true,
      defaultValue: null,
      comment: 'Motivo del cambio de estado de la cuenta'
    },
    suspendedUntil: {
      type: DataTypes.DATE,
      allowNull: true,
      defaultValue: null,
      comment: 'Fecha hasta la que el usuario está suspendido'
    },
    bankName: {
      type: DataTypes.STRING,
      allowNull: true,
      defaultValue: null
    },
    bankAccountNumber: {
      type: DataTypes.STRING,
      allowNull: true,
      defaultValue: null
    },
    bankAccountHolder: {
      type: DataTypes.STRING,
      allowNull: true,
      defaultValue: null
    },
    bankAccountType: {
      type: DataTypes.STRING,
      allowNull: true,
      defaultValue: null
    },
    bankPhone: {
      type: DataTypes.STRING,
      allowNull: true,
      defaultValue: null
    },
    bankPhoneId: {
      type: DataTypes.STRING,
      allowNull: true,
      defaultValue: null
    },
    bankPhoneName: {
      type: DataTypes.STRING,
      allowNull: true,
      defaultValue: null
    },
    address: {
      type: DataTypes.STRING(255),
      allowNull: true
    },
    preferences: {
      type: DataTypes.JSON,
      allowNull: true,
      defaultValue: {
        emailNotifications: true,
        whatsappNotifications: false
      }
    },
    avgRatingAsOwner: {
      type: DataTypes.DECIMAL(3, 2),
      defaultValue: 0,
      field: 'avg_rating_as_owner'
    },
    reviewCountAsOwner: {
      type: DataTypes.INTEGER,
      defaultValue: 0,
      field: 'review_count_as_owner'
    },
    avgRatingAsTenant: {
      type: DataTypes.DECIMAL(3, 2),
      defaultValue: 0,
      field: 'avg_rating_as_tenant'
    },
    reviewCountAsTenant: {
      type: DataTypes.INTEGER,
      defaultValue: 0,
      field: 'review_count_as_tenant'
    },
    emailVerified: {
      type: DataTypes.BOOLEAN,
      defaultValue: false,
      allowNull: false,
      field: 'email_verified'
    },
    authProvider: {
      type: DataTypes.ENUM('local', 'google'),
      defaultValue: 'local',
      allowNull: false,
      field: 'auth_provider'
    },
    googleId: {
      type: DataTypes.STRING(255),
      allowNull: true,
      unique: true,
      field: 'google_id'
    },
    tutorialCompleted: {
      type: DataTypes.BOOLEAN,
      defaultValue: false,
      allowNull: false,
      field: 'tutorial_completed'
    }
  },
  {
    sequelize,
    tableName: 'users',
    modelName: 'User',
    indexes: [
      {
        name: 'users_email_idx',
        unique: true,
        fields: ['email']
      },
      {
        name: 'users_cedula_idx',
        unique: true,
        fields: ['cedula']
      },
      {
        name: 'users_role_idx',
        fields: ['role']
      },
      {
        name: 'users_is_verified_idx',
        fields: ['isVerified']
      },
      {
        name: 'users_account_status_idx',
        fields: ['accountStatus']
      },
      {
        name: 'users_status_role_idx',
        fields: ['accountStatus', 'role']
      },
      {
        name: 'users_role_verified_idx',
        fields: ['role', 'isVerified']
      },
      {
        name: 'users_verified_by_idx',
        fields: ['verifiedById']
      },
      {
        name: 'users_google_id_idx',
        unique: true,
        fields: ['google_id']
      }
    ],
    hooks: {
      beforeCreate: async (user: User) => {
        if (user.password) {
          const salt = await bcrypt.genSalt(10);
          user.password = await bcrypt.hash(user.password, salt);
        }
      },
      beforeUpdate: async (user: User) => {
        if (user.changed('password') && user.password) {
          const salt = await bcrypt.genSalt(10);
          user.password = await bcrypt.hash(user.password, salt);
        }
      }
    }
  }
);

User.hasMany(UserSession, { foreignKey: 'userId', as: 'sessions' });
UserSession.belongsTo(User, { foreignKey: 'userId', as: 'user' });

User.hasMany(UserBehaviorEvent, { foreignKey: 'userId', as: 'behaviorEvents' });
UserBehaviorEvent.belongsTo(User, { foreignKey: 'userId', as: 'user' });

// Asegurar que los campos de rating siempre estén presentes en JSON
User.prototype.toJSON = function() {
  const values = Object.assign({}, this.get());
  
  // Asegurar que avgRatingAsOwner y reviewCountAsOwner estén siempre definidos
  if (values.avgRatingAsOwner === undefined || values.avgRatingAsOwner === null) {
    values.avgRatingAsOwner = 0;
  }
  if (values.reviewCountAsOwner === undefined || values.reviewCountAsOwner === null) {
    values.reviewCountAsOwner = 0;
  }
  if (values.avgRatingAsTenant === undefined || values.avgRatingAsTenant === null) {
    values.avgRatingAsTenant = 0;
  }
  if (values.reviewCountAsTenant === undefined || values.reviewCountAsTenant === null) {
    values.reviewCountAsTenant = 0;
  }
  
  // Convertir ratings a número si son cadenas (pueden venir como string de la BD)
  if (typeof values.avgRatingAsOwner === 'string') {
    values.avgRatingAsOwner = parseFloat(values.avgRatingAsOwner);
  }
  if (typeof values.avgRatingAsTenant === 'string') {
    values.avgRatingAsTenant = parseFloat(values.avgRatingAsTenant);
  }
  
  return values;
};

export default User;
