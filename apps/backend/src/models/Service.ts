import { DataTypes, Model } from 'sequelize';
import { sequelize } from '../config/database';
import { ServiceAttributes, ServiceCreationAttributes } from '../types';

class Service extends Model<ServiceAttributes, ServiceCreationAttributes> implements ServiceAttributes {
  public id!: number;
  public name!: string;
  public description?: string;
  public icon!: string;
  public category!: 'basic' | 'premium' | 'amenity';
  public isActive!: boolean;

  public readonly createdAt!: Date;
  public readonly updatedAt!: Date;
}

Service.init(
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
    description: {
      type: DataTypes.TEXT,
      allowNull: true
    },
    icon: {
      type: DataTypes.STRING(50),
      allowNull: false
    },
    category: {
      type: DataTypes.ENUM('basic', 'premium', 'amenity'),
      defaultValue: 'basic'
    },
    isActive: {
      type: DataTypes.BOOLEAN,
      defaultValue: true
    }
  },
  {
    sequelize,
    tableName: 'services',
    modelName: 'Service',
  }
);

export default Service;
