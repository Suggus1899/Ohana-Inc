import { QueryInterface, DataTypes } from 'sequelize';

declare const console: any;

export default {
  up: async (queryInterface: QueryInterface): Promise<void> => {
    const tableInfo = await queryInterface.describeTable('rental_requests');

    if (tableInfo.leaseDuration && tableInfo.leaseDuration.allowNull === false) {
      await queryInterface.changeColumn('rental_requests', 'leaseDuration', {
        type: DataTypes.INTEGER,
        allowNull: true,
      });
      console.log('✓ leaseDuration column changed to allow null in rental_requests table');
    } else {
      console.log('⚠️ leaseDuration column already allows null or does not exist');
    }
  },

  down: async (queryInterface: QueryInterface): Promise<void> => {
    await queryInterface.changeColumn('rental_requests', 'leaseDuration', {
      type: DataTypes.INTEGER,
      allowNull: false,
    });
  },
};
