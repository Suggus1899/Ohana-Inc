import { QueryInterface, DataTypes } from 'sequelize';

// Declaración para evitar error de TypeScript si los tipos de Node no se cargan correctamente
declare const console: any;

export default {
  up: async (queryInterface: QueryInterface): Promise<void> => {
    const tableInfo = await queryInterface.describeTable('properties');

    // Agregar columna roomsWithBathroom a la tabla properties si no existe
    if (!tableInfo.roomsWithBathroom) {
      await queryInterface.addColumn('properties', 'roomsWithBathroom', {
        type: DataTypes.INTEGER,
        allowNull: true,
        defaultValue: 0
      });
    }

    // Agregar columna outsideBathrooms a la tabla properties si no existe
    if (!tableInfo.outsideBathrooms) {
      await queryInterface.addColumn('properties', 'outsideBathrooms', {
        type: DataTypes.INTEGER,
        allowNull: true,
        defaultValue: 0
      });
    }

    console.log('✓ Check completed for roomsWithBathroom and outsideBathrooms in properties table');
  },

  down: async (queryInterface: QueryInterface): Promise<void> => {
    // Eliminar columnas
    await queryInterface.removeColumn('properties', 'roomsWithBathroom');
    await queryInterface.removeColumn('properties', 'outsideBathrooms');
    
    console.log('✓ Columns roomsWithBathroom and outsideBathrooms removed from properties table');
  }
};
