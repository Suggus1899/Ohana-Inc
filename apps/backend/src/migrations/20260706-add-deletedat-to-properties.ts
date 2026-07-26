import { QueryInterface, DataTypes } from 'sequelize';

declare const console: any;

export default {
  up: async (queryInterface: QueryInterface): Promise<void> => {
    const tableInfo = await queryInterface.describeTable('properties');

    if (!tableInfo.deletedAt) {
      await queryInterface.addColumn('properties', 'deletedAt', {
        type: DataTypes.DATE,
        allowNull: true,
      });
    }

    console.log('✓ Added deletedAt column to properties table');
  },

  down: async (queryInterface: QueryInterface): Promise<void> => {
    await queryInterface.removeColumn('properties', 'deletedAt');
  },
};
