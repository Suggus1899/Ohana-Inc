import { DataTypes, Model, Optional } from 'sequelize';
import { sequelize } from '../config/database';

export interface AuditoriaAttributes {
  id: number;
  ip_address: string;
  origin: string | null;
  host: string | null;
  user_agent: string | null;
  method: string;
  path: string;
  status_code: number | null;
  created_at: Date;
}

type AuditoriaCreationAttributes = Optional<AuditoriaAttributes, 'id' | 'created_at' | 'status_code'>;

class Auditoria extends Model<AuditoriaAttributes, AuditoriaCreationAttributes> implements AuditoriaAttributes {
  public id!: number;
  public ip_address!: string;
  public origin!: string | null;
  public host!: string | null;
  public user_agent!: string | null;
  public method!: string;
  public path!: string;
  public status_code!: number | null;
  public created_at!: Date;
}

Auditoria.init(
  {
    id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
    ip_address: { type: DataTypes.STRING(45), allowNull: false },
    origin: { type: DataTypes.STRING(500), allowNull: true },
    host: { type: DataTypes.STRING(255), allowNull: true },
    user_agent: { type: DataTypes.STRING(500), allowNull: true },
    method: { type: DataTypes.STRING(10), allowNull: false },
    path: { type: DataTypes.STRING(500), allowNull: false },
    status_code: { type: DataTypes.INTEGER, allowNull: true },
    created_at: { type: DataTypes.DATE, allowNull: false, defaultValue: DataTypes.NOW },
  },
  {
    sequelize,
    tableName: 'auditorias',
    modelName: 'Auditoria',
    timestamps: false,
    indexes: [
      { name: 'auditorias_ip_idx', fields: ['ip_address'] },
      { name: 'auditorias_created_idx', fields: ['created_at'] },
    ],
  }
);

export default Auditoria;
