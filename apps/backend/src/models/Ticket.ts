import { DataTypes, Model } from 'sequelize';
import { sequelize } from '../config/database';
import { TicketAttributes, TicketCreationAttributes } from '../types';

class Ticket extends Model<TicketAttributes, TicketCreationAttributes> implements TicketAttributes {
  public id!: number;
  public userId!: number;
  public category!: 'technical' | 'billing' | 'property' | 'account' | 'other';
  public priority!: 'low' | 'medium' | 'high' | 'urgent';
  public status!: 'open' | 'assigned' | 'in_progress' | 'waiting_user' | 'resolved' | 'closed' | 'escalated';
  public escalationReason?: string;
  public subject!: string;
  public description?: string;
  public message?: string;
  public assignedTo?: number;
  public moderatorId?: number | null;
  public resolvedAt?: Date;
  public readonly createdAt!: Date;
  public readonly updatedAt!: Date;
}

Ticket.init(
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
    category: {
      type: DataTypes.ENUM('technical', 'billing', 'property', 'account', 'other'),
      defaultValue: 'other',
      allowNull: true
    },
    priority: {
      type: DataTypes.ENUM('low', 'medium', 'high', 'urgent'),
      defaultValue: 'medium'
    },
    status: {
      type: DataTypes.ENUM('open', 'assigned', 'in_progress', 'waiting_user', 'resolved', 'closed', 'escalated'),
      defaultValue: 'open'
    },
    escalationReason: {
      type: DataTypes.TEXT,
      allowNull: true
    },
    subject: {
      type: DataTypes.STRING(255),
      allowNull: false
    },
    description: {
      type: DataTypes.TEXT,
      allowNull: true
    },
    message: {
      type: DataTypes.TEXT,
      allowNull: true
    },
    assignedTo: {
      type: DataTypes.INTEGER,
      allowNull: true,
      references: {
        model: 'users',
        key: 'id'
      }
    },
    moderatorId: {
      type: DataTypes.INTEGER,
      allowNull: true,
      references: {
        model: 'users',
        key: 'id'
      }
    },
    resolvedAt: {
      type: DataTypes.DATE,
      allowNull: true
    }
  },
  {
    sequelize,
    tableName: 'tickets',
    modelName: 'Ticket',
    indexes: [
      { name: 'tickets_user_idx', fields: ['userId'] },
      { name: 'tickets_assigned_idx', fields: ['assignedTo'] },
      { name: 'tickets_status_idx', fields: ['status'] },
      { name: 'tickets_priority_idx', fields: ['priority'] }
    ]
  }
);

export default Ticket;
