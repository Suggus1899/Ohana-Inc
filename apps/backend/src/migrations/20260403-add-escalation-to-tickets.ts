import { QueryInterface, DataTypes } from 'sequelize';

export default {
  up: async (queryInterface: QueryInterface) => {
    // Add escalationReason column only if it doesn't exist
    const tableDesc = await queryInterface.describeTable('tickets');
    if (!tableDesc['escalationReason']) {
      await queryInterface.addColumn('tickets', 'escalationReason', {
        type: DataTypes.TEXT,
        allowNull: true,
      });
    }

    // Add 'escalated' value to existing enum (IF NOT EXISTS is idempotent in PG 9.6+)
    await queryInterface.sequelize.query(`
      ALTER TYPE enum_tickets_status ADD VALUE IF NOT EXISTS 'escalated';
    `);
  },

  down: async (queryInterface: QueryInterface) => {
    // Remove escalationReason column
    await queryInterface.removeColumn('tickets', 'escalationReason');

    // Note: PostgreSQL doesn't support removing enum values easily
    // You would need to recreate the enum type to remove 'escalated'
    console.log('⚠️  Warning: Cannot remove enum value "escalated" from enum_tickets_status');
    console.log('   This requires recreating the enum type, which is not done automatically.');
  },
};
