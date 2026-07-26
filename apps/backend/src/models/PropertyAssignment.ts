import { DataTypes, Model } from 'sequelize';
import { sequelize } from '../config/database';

export type AssignmentStatus = 'active' | 'completed' | 'cancelled';

export interface PropertyAssignmentAttributes {
  id: number;
  propertyId: number;
  clientId: number;
  transactionId: number;
  startDate: Date;
  endDate?: Date | null;
  status: AssignmentStatus;
  createdAt?: Date;
  updatedAt?: Date;
}

export interface PropertyAssignmentCreationAttributes extends Omit<PropertyAssignmentAttributes, 'id' | 'createdAt' | 'updatedAt'> {}

class PropertyAssignment extends Model<PropertyAssignmentAttributes, PropertyAssignmentCreationAttributes> implements PropertyAssignmentAttributes {
  public id!: number;
  public propertyId!: number;
  public clientId!: number;
  public transactionId!: number;
  public startDate!: Date;
  public endDate!: Date | null;
  public status!: AssignmentStatus;

  public readonly createdAt!: Date;
  public readonly updatedAt!: Date;
}

PropertyAssignment.init(
  {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
    },
    propertyId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: 'properties',
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
    transactionId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: 'transactions',
        key: 'id',
      },
    },
    startDate: {
      type: DataTypes.DATE,
      allowNull: false,
    },
    endDate: {
      type: DataTypes.DATE,
      allowNull: true,
      comment: 'Para alquileres',
    },
    status: {
      type: DataTypes.ENUM('active', 'completed', 'cancelled'),
      defaultValue: 'active',
    },
  },
  {
    sequelize,
    tableName: 'property_assignments',
    modelName: 'PropertyAssignment',
    indexes: [
      { name: 'assignments_property_idx', fields: ['propertyId'] },
      { name: 'assignments_client_idx', fields: ['clientId'] },
      { name: 'assignments_transaction_idx', fields: ['transactionId'] },
      { name: 'assignments_status_idx', fields: ['status'] },
    ],
  }
);

export default PropertyAssignment;
