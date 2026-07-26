import { QueryInterface, DataTypes } from 'sequelize';

async function tableExists(queryInterface: QueryInterface, tableName: string): Promise<boolean> {
  try {
    await queryInterface.describeTable(tableName);
    return true;
  } catch {
    return false;
  }
}

export default {
  up: async (queryInterface: QueryInterface): Promise<void> => {
    if (!(await tableExists(queryInterface, 'auditorias'))) {
      await queryInterface.createTable('auditorias', {
        id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
        ip_address: { type: DataTypes.STRING(45), allowNull: false },
        origin: { type: DataTypes.STRING(500), allowNull: true },
        host: { type: DataTypes.STRING(255), allowNull: true },
        user_agent: { type: DataTypes.STRING(500), allowNull: true },
        method: { type: DataTypes.STRING(10), allowNull: false },
        path: { type: DataTypes.STRING(500), allowNull: false },
        status_code: { type: DataTypes.INTEGER, allowNull: true },
        created_at: { type: DataTypes.DATE, allowNull: false, defaultValue: DataTypes.NOW },
      });
    }
    await queryInterface.addIndex('auditorias', ['ip_address'], { name: 'auditorias_ip_idx' }).catch(() => {});
    await queryInterface.addIndex('auditorias', ['created_at'], { name: 'auditorias_created_idx' }).catch(() => {});
  },
  down: async (queryInterface: QueryInterface): Promise<void> => {
    await queryInterface.dropTable('auditorias').catch(() => {});
  },
};
