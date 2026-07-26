import { QueryInterface, DataTypes } from 'sequelize';

async function columnExists(qi: QueryInterface, table: string, col: string): Promise<boolean> {
  try { const d = await qi.describeTable(table); return d[col] !== undefined; } catch { return false; }
}

export default {
  up: async (queryInterface: QueryInterface): Promise<void> => {
    const qi = queryInterface;

    if (!(await columnExists(qi, 'users', 'verifiedById'))) {
      await qi.addColumn('users', 'verifiedById', {
        type: DataTypes.INTEGER,
        allowNull: true,
        references: {
          model: 'users',
          key: 'id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'SET NULL'
      });
      console.log('✓ Column verifiedById added to users table');
    }

    const indexes = await qi.showIndex('users') as any[];
    if (!indexes.some((i: any) => i.name === 'users_verified_by_idx')) {
      await qi.addIndex('users', ['verifiedById'], {
        name: 'users_verified_by_idx'
      });
      console.log('✓ Index users_verified_by_idx created');
    }
  },

  down: async (queryInterface: QueryInterface): Promise<void> => {
    await queryInterface.removeIndex('users', 'users_verified_by_idx').catch(() => {});
    await queryInterface.removeColumn('users', 'verifiedById').catch(() => {});
    console.log('✓ Column verifiedById removed from users table');
  }
};
