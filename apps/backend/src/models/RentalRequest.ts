import { DataTypes, Model } from 'sequelize';
import { sequelize } from '../config/database';
import { RentalRequestAttributes, RentalRequestCreationAttributes } from '../types';

class RentalRequest extends Model<RentalRequestAttributes, RentalRequestCreationAttributes> implements RentalRequestAttributes {
  public id!: number;
  public tenantId!: number;
  public propertyId!: number;
  public ownerId!: number;
  public status!: 'pending' | 'viewed' | 'accepted' | 'rejected' | 'cancelled' | 'payment_submitted' | 'completed';
  public message?: string;
  public phoneNumber?: string;
  public moveInDate!: Date;
  public leaseDuration?: number | null;
  public respondedAt?: Date;

  public readonly createdAt!: Date;
  public readonly updatedAt!: Date;
}

RentalRequest.init(
  {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true
    },
    tenantId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: 'users',
        key: 'id'
      }
    },
    propertyId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: 'properties',
        key: 'id'
      }
    },
    ownerId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: 'users',
        key: 'id'
      }
    },
    status: {
      type: DataTypes.ENUM('pending', 'viewed', 'accepted', 'rejected', 'cancelled', 'payment_submitted', 'completed'),
      defaultValue: 'pending'
    },
    message: {
      type: DataTypes.TEXT,
      allowNull: true
    },
    phoneNumber: {
      type: DataTypes.STRING(20),
      allowNull: true
    },
    moveInDate: {
      type: DataTypes.DATE,
      allowNull: false
    },
    leaseDuration: {
      type: DataTypes.INTEGER,
      allowNull: true
    },
    respondedAt: {
      type: DataTypes.DATE,
      allowNull: true
    }
  },
  {
    sequelize,
    tableName: 'rental_requests',
    modelName: 'RentalRequest',
    indexes: [
      { name: 'rental_requests_tenant_idx', fields: ['tenantId'] },
      { name: 'rental_requests_owner_idx', fields: ['ownerId'] },
      { name: 'rental_requests_property_idx', fields: ['propertyId'] },
      { name: 'rental_requests_status_idx', fields: ['status'] }
    ]
  }
);

export default RentalRequest;
