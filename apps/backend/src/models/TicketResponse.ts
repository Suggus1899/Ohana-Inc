import { DataTypes, Model } from 'sequelize';
import { sequelize } from '../config/database';
import { TicketResponseAttributes, TicketResponseCreationAttributes } from '../types';

class TicketResponse extends Model<TicketResponseAttributes, TicketResponseCreationAttributes> implements TicketResponseAttributes {
  public id!: number;
  public ticketId!: number;
  public userId!: number;
  public message!: string;
  public isInternal!: boolean;
  public attachments?: string[];

  public readonly createdAt!: Date;
  public readonly updatedAt!: Date;
}

TicketResponse.init(
  {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true
    },
    ticketId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: 'tickets',
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
    message: {
      type: DataTypes.TEXT,
      allowNull: false
    },
    isInternal: {
      type: DataTypes.BOOLEAN,
      defaultValue: false
    },
    attachments: {
      type: DataTypes.JSON,
      defaultValue: []
    }
  },
  {
    sequelize,
    tableName: 'ticket_responses',
    modelName: 'TicketResponse',
    indexes: [
      { name: 'ticket_responses_ticket_idx', fields: ['ticketId'] }
    ]
  }
);

export default TicketResponse;
