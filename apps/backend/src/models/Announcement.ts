import { DataTypes, Model } from 'sequelize';
import { sequelize } from '../config/database';

class Announcement extends Model {
  public id!: number;
  public title!: string;
  public content!: string;
  public targetAudience!: 'all' | 'clients' | 'operators' | 'owners';
  public status!: 'active' | 'draft' | 'expired';
  public createdById!: number;
  public expiresAt?: Date;

  public readonly createdAt!: Date;
  public readonly updatedAt!: Date;
}

Announcement.init(
  {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
    },
    title: {
      type: DataTypes.STRING(255),
      allowNull: false,
    },
    content: {
      type: DataTypes.TEXT,
      allowNull: false,
    },
    targetAudience: {
      type: DataTypes.ENUM('all', 'clients', 'operators', 'owners'),
      defaultValue: 'all',
      allowNull: false,
    },
    status: {
      type: DataTypes.ENUM('active', 'draft', 'expired'),
      defaultValue: 'draft',
      allowNull: false,
    },
    createdById: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: { model: 'users', key: 'id' },
    },
    expiresAt: {
      type: DataTypes.DATE,
      allowNull: true,
    },
  },
  {
    sequelize,
    tableName: 'announcements',
    modelName: 'Announcement',
    indexes: [
      { name: 'announcements_status_idx', fields: ['status'] },
      { name: 'announcements_creator_idx', fields: ['createdById'] },
    ],
  }
);

export default Announcement;
