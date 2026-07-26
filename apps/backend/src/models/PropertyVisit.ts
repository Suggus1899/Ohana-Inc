import { DataTypes, Model } from 'sequelize';
import { sequelize } from '../config/database';
import { PropertyVisitAttributes, PropertyVisitCreationAttributes } from '../types';

class PropertyVisit extends Model<PropertyVisitAttributes, PropertyVisitCreationAttributes> implements PropertyVisitAttributes {
  public id!: number;
  public propertyId!: number;
  public userId!: number | null;
  public name!: string;
  public email!: string;
  public phone!: string;
  public visitDate!: Date;
  public message!: string | null;
  public status!: 'pending' | 'confirmed' | 'cancelled' | 'completed';
  public readonly createdAt!: Date;
  public readonly updatedAt!: Date;
}

PropertyVisit.init(
  {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
    },
    propertyId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: { model: 'properties', key: 'id' },
    },
    userId: {
      type: DataTypes.INTEGER,
      allowNull: true,
      references: { model: 'users', key: 'id' },
    },
    name: {
      type: DataTypes.STRING(150),
      allowNull: false,
    },
    email: {
      type: DataTypes.STRING(255),
      allowNull: false,
    },
    phone: {
      type: DataTypes.STRING(30),
      allowNull: false,
    },
    visitDate: {
      type: DataTypes.DATE,
      allowNull: false,
    },
    message: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    status: {
      type: DataTypes.ENUM('pending', 'confirmed', 'cancelled', 'completed'),
      defaultValue: 'pending',
    },
  },
  {
    sequelize,
    tableName: 'property_visits',
    modelName: 'PropertyVisit',
    timestamps: true,
    indexes: [
      { name: 'property_visit_property_idx', fields: ['propertyId'] },
      { name: 'property_visit_user_idx', fields: ['userId'] },
      { name: 'property_visit_date_idx', fields: ['visitDate'] },
    ],
  }
);

export default PropertyVisit;