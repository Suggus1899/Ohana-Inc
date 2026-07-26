import { DataTypes, Model } from 'sequelize';
import { sequelize } from '../config/database';
import { PropertyViewAttributes, PropertyViewCreationAttributes } from '../types';

class PropertyView extends Model<PropertyViewAttributes, PropertyViewCreationAttributes> implements PropertyViewAttributes {
  public id!: number;
  public propertyId!: number;
  public userId!: number | null;
  public sessionId!: string;
  public viewDuration!: number;
  public source!: 'search' | 'direct' | 'favorite' | 'recommendation';
  public deviceType!: 'desktop' | 'mobile' | 'tablet';
  public timestamp!: Date;
}

PropertyView.init(
  {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true
    },
    propertyId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: 'properties',
        key: 'id'
      }
    },
    userId: {
      type: DataTypes.INTEGER,
      allowNull: true,
      references: {
        model: 'users',
        key: 'id'
      }
    },
    sessionId: {
      type: DataTypes.STRING(100),
      allowNull: false
    },
    viewDuration: {
      type: DataTypes.INTEGER,
      defaultValue: 0
    },
    source: {
      type: DataTypes.ENUM('search', 'direct', 'favorite', 'recommendation'),
      defaultValue: 'direct'
    },
    deviceType: {
      type: DataTypes.ENUM('desktop', 'mobile', 'tablet'),
      defaultValue: 'desktop'
    },
    timestamp: {
      type: DataTypes.DATE,
      defaultValue: DataTypes.NOW
    }
  },
  {
    sequelize,
    tableName: 'property_views',
    modelName: 'PropertyView',
    timestamps: false,
    indexes: [
      { name: 'property_view_property_idx', fields: ['propertyId'] },
      { name: 'property_view_session_idx', fields: ['sessionId'] },
      { name: 'property_view_timestamp_idx', fields: ['timestamp'] }
    ]
  }
);

export default PropertyView;
