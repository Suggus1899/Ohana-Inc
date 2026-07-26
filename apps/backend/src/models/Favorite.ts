import { DataTypes, Model } from 'sequelize';
import { sequelize } from '../config/database';
import { FavoriteAttributes, FavoriteCreationAttributes } from '../types';

class Favorite extends Model<FavoriteAttributes, FavoriteCreationAttributes> implements FavoriteAttributes {
  public id!: number;
  public userId!: number;
  public propertyId!: number;

  public readonly createdAt!: Date;
  public readonly updatedAt!: Date;
}

Favorite.init(
  {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true
    },
    userId: {
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
    }
  },
  {
    sequelize,
    tableName: 'favorites',
    modelName: 'Favorite',
    indexes: [
      {
        unique: true,
        fields: ['userId', 'propertyId']
      }
    ]
  }
);

export default Favorite;
