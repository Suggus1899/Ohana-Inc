import { DataTypes, Model } from 'sequelize';
import { sequelize } from '../config/database';
import { PropertyServiceAttributes, PropertyServiceCreationAttributes } from '../types';

class PropertyService extends Model<PropertyServiceAttributes, PropertyServiceCreationAttributes> implements PropertyServiceAttributes {
  public propertyId!: number;
  public serviceId!: number;

  public readonly createdAt!: Date;
  public readonly updatedAt!: Date;
}

PropertyService.init(
  {
    propertyId: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      references: {
        model: 'properties',
        key: 'id'
      }
    },
    serviceId: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      references: {
        model: 'services',
        key: 'id'
      }
    }
  },
  {
    sequelize,
    tableName: 'property_services',
    modelName: 'PropertyService',
  }
);

export default PropertyService;
