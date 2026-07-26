import { DataTypes, Model } from 'sequelize';
import { sequelize } from '../config/database';
import { PropertyReviewAttributes, PropertyReviewCreationAttributes } from '../types';

class PropertyReview extends Model<PropertyReviewAttributes, PropertyReviewCreationAttributes> implements PropertyReviewAttributes {
  public id!: number;
  public propertyId!: number;
  public userId!: number;
  public rating!: number; // 1-5
  public comment?: string;
  public rentRequestId?: number | null;

  public readonly createdAt!: Date;
  public readonly updatedAt!: Date;
}

PropertyReview.init(
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
      allowNull: false,
      references: {
        model: 'users',
        key: 'id'
      }
    },
    rating: {
      type: DataTypes.INTEGER,
      allowNull: false,
      validate: {
        min: 1,
        max: 5
      }
    },
    comment: {
      type: DataTypes.TEXT,
      allowNull: true
    },
    rentRequestId: {
      type: DataTypes.INTEGER,
      allowNull: true,
      references: {
        model: 'rental_requests',
        key: 'id'
      }
    }
  },
  {
    sequelize,
    tableName: 'property_reviews',
    modelName: 'PropertyReview',
    indexes: [
      {
        name: 'property_reviews_unique_user_property',
        unique: true,
        fields: ['propertyId', 'userId'],
      },
      { 
        name: 'property_reviews_property_idx', 
        fields: ['propertyId'] 
      },
      { 
        name: 'property_reviews_user_idx', 
        fields: ['userId'] 
      },
      {
        name: 'property_reviews_rent_request_idx',
        fields: ['rentRequestId']
      }
    ]
  }
);

export default PropertyReview;