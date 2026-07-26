import { QueryInterface, DataTypes } from 'sequelize';

declare const console: any;

export default {
  up: async (queryInterface: QueryInterface): Promise<void> => {
    const tableInfo = await queryInterface.describeTable('properties');

    if (!tableInfo.availableRooms) {
      await queryInterface.addColumn('properties', 'availableRooms', {
        type: DataTypes.INTEGER,
        allowNull: true,
        defaultValue: 0,
      });
    }

    if (!tableInfo.occupiedRooms) {
      await queryInterface.addColumn('properties', 'occupiedRooms', {
        type: DataTypes.INTEGER,
        allowNull: true,
        defaultValue: 0,
      });
    }

    console.log('✓ Check completed for availableRooms and occupiedRooms in properties table');
  },

  down: async (queryInterface: QueryInterface): Promise<void> => {
    await queryInterface.removeColumn('properties', 'availableRooms');
    await queryInterface.removeColumn('properties', 'occupiedRooms');
  },
};
