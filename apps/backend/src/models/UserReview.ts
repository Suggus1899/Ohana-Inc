import { DataTypes, Model } from 'sequelize';
import { sequelize } from '../config/database';
import { UserReviewAttributes, UserReviewCreationAttributes } from '../types';

class UserReview extends Model<UserReviewAttributes, UserReviewCreationAttributes> implements UserReviewAttributes {
  public id!: number;
  public reviewerId!: number;
  public reviewedId!: number;
  public rating!: number; // 1-5
  public comment?: string;
  public transactionId?: number | null;

  public readonly createdAt!: Date;
  public readonly updatedAt!: Date;
}

UserReview.init(
  {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true
    },
    reviewerId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: 'users',
        key: 'id'
      }
    },
    reviewedId: {
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
    transactionId: {
      type: DataTypes.INTEGER,
      allowNull: true,
      references: {
        model: 'transactions',
        key: 'id'
      }
    }
  },
  {
    sequelize,
    tableName: 'user_reviews',
    modelName: 'UserReview',
    indexes: [
      {
        name: 'user_reviews_unique_reviewer_reviewed',
        unique: true,
        fields: ['reviewerId', 'reviewedId'],
      },
      { 
        name: 'user_reviews_reviewer_idx', 
        fields: ['reviewerId'] 
      },
      { 
        name: 'user_reviews_reviewed_idx', 
        fields: ['reviewedId'] 
      },
      {
        name: 'user_reviews_transaction_idx',
        fields: ['transactionId']
      }
    ]
  }
);

export default UserReview;