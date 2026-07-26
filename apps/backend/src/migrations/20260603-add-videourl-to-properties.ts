import { QueryInterface, DataTypes } from 'sequelize';

// Declaración para evitar error de TypeScript si los tipos de Node no se cargan correctamente
declare const console: any;

export default {
  up: async (queryInterface: QueryInterface): Promise<void> => {
    const tableInfo = await queryInterface.describeTable('properties');

    // Agregar columna videoUrl a la tabla properties si no existe
    if (!tableInfo.videoUrl) {
      await queryInterface.addColumn('properties', 'videoUrl', {
        type: DataTypes.STRING(500),
        allowNull: true,
      });
      console.log('✓ Columna videoUrl agregada a la tabla properties');
    } else {
      console.log('✓ Columna videoUrl ya existe en la tabla properties');
    }
  },

  down: async (queryInterface: QueryInterface): Promise<void> => {
    // Eliminar columna videoUrl si existe
    const tableInfo = await queryInterface.describeTable('properties');
    
    if (tableInfo.videoUrl) {
      await queryInterface.removeColumn('properties', 'videoUrl');
      console.log('✓ Columna videoUrl eliminada de la tabla properties');
    } else {
      console.log('✓ Columna videoUrl no existe en la tabla properties');
    }
  }
};