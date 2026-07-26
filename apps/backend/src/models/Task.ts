import { DataTypes, Model } from 'sequelize';
import { sequelize } from '../config/database';

class Task extends Model {
  public id!: number;
  public title!: string;
  public description?: string;
  public priority!: 'low' | 'medium' | 'high' | 'urgent';
  public status!: 'pending' | 'in_progress' | 'completed' | 'cancelled';
  public type!: string;
  public relatedId?: number;
  public dueDate?: Date;
  public completedAt?: Date;
  public assignedToId!: number;
  public assignedById?: number;

  public readonly createdAt!: Date;
  public readonly updatedAt!: Date;
}

Task.init(
  {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true
    },
    title: {
      type: DataTypes.STRING(255),
      allowNull: false
    },
    description: {
      type: DataTypes.TEXT,
      allowNull: true
    },
    priority: {
      type: DataTypes.ENUM('low', 'medium', 'high', 'urgent'),
      defaultValue: 'medium',
      allowNull: false
    },
    status: {
      type: DataTypes.ENUM('pending', 'in_progress', 'completed', 'cancelled'),
      defaultValue: 'pending',
      allowNull: false
    },
    type: {
      type: DataTypes.STRING(50),
      defaultValue: 'manual',
      allowNull: false
    },
    relatedId: {
      type: DataTypes.INTEGER,
      allowNull: true
    },
    dueDate: {
      type: DataTypes.DATE,
      allowNull: true
    },
    completedAt: {
      type: DataTypes.DATE,
      allowNull: true
    },
    assignedToId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: 'users',
        key: 'id'
      }
    },
    assignedById: {
      type: DataTypes.INTEGER,
      allowNull: true,
      references: {
        model: 'users',
        key: 'id'
      }
    }
  },
  {
    sequelize,
    tableName: 'tasks',
    modelName: 'Task',
    indexes: [
      { name: 'tasks_assigned_to_idx', fields: ['assignedToId'] },
      { name: 'tasks_status_idx', fields: ['status'] }
    ]
  }
);

export default Task;
