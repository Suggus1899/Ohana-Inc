import { DataTypes, Model } from 'sequelize';
import { sequelize } from '../config/database';

interface InboundEmailAttributes {
  id: number;
  from: string;
  to: string;
  subject: string;
  body: string;
  rawPayload: object;
  receivedAt: Date;
  createdAt?: Date;
}

interface InboundEmailCreationAttributes {
  from: string;
  to: string;
  subject: string;
  body: string;
  rawPayload: object;
  receivedAt: Date;
}

class InboundEmail extends Model<InboundEmailAttributes, InboundEmailCreationAttributes>
  implements InboundEmailAttributes {
  public id!: number;
  public from!: string;
  public to!: string;
  public subject!: string;
  public body!: string;
  public rawPayload!: object;
  public receivedAt!: Date;
  public createdAt!: Date;
}

InboundEmail.init(
  {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true
    },
    from: {
      type: DataTypes.STRING(255),
      allowNull: false
    },
    to: {
      type: DataTypes.STRING(255),
      allowNull: false
    },
    subject: {
      type: DataTypes.STRING(500),
      allowNull: false,
      defaultValue: '(Sin asunto)'
    },
    body: {
      type: DataTypes.TEXT,
      allowNull: false,
      defaultValue: ''
    },
    rawPayload: {
      type: DataTypes.JSON,
      allowNull: false
    },
    receivedAt: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: DataTypes.NOW
    }
  },
  {
    sequelize,
    tableName: 'inbound_emails',
    modelName: 'InboundEmail',
    timestamps: true,
    updatedAt: false,
    indexes: [
      { name: 'inbound_from_idx', fields: ['from'] },
      { name: 'inbound_received_idx', fields: ['receivedAt'] }
    ]
  }
);

export default InboundEmail;
