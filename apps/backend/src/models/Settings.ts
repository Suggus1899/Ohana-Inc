import { DataTypes, Model } from 'sequelize';
import { sequelize } from '../config/database';

export interface SettingsAttributes {
  id: number;
  key: string;
  value: string;
  type: 'string' | 'number' | 'boolean' | 'json';
  description?: string;
  createdAt?: Date;
  updatedAt?: Date;
}

export interface SettingsCreationAttributes extends Omit<SettingsAttributes, 'id' | 'createdAt' | 'updatedAt'> {}

class Settings extends Model<SettingsAttributes, SettingsCreationAttributes> implements SettingsAttributes {
  public id!: number;
  public key!: string;
  public value!: string;
  public type!: 'string' | 'number' | 'boolean' | 'json';
  public description!: string | undefined;

  public readonly createdAt!: Date;
  public readonly updatedAt!: Date;
}

Settings.init(
  {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
    },
    key: {
      type: DataTypes.STRING(100),
      allowNull: false,
      unique: true,
    },
    value: {
      type: DataTypes.TEXT,
      allowNull: false,
    },
    type: {
      type: DataTypes.ENUM('string', 'number', 'boolean', 'json'),
      defaultValue: 'string',
    },
    description: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
  },
  {
    sequelize,
    tableName: 'settings',
    modelName: 'Settings',
    timestamps: true,
    indexes: [
      { name: 'settings_key_idx', fields: ['key'], unique: true },
    ],
  }
);

export default Settings;
