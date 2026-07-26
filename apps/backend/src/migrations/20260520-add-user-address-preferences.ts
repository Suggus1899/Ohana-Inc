import { QueryInterface, DataTypes } from 'sequelize';

export default {
  up: async (queryInterface: QueryInterface): Promise<void> => {
    try {
      await queryInterface.addColumn('users', 'address', {
        type: DataTypes.STRING(255),
        allowNull: true
      });
    } catch {
      console.log('⚠️ Column address already exists in users table');
    }

    try {
      await queryInterface.addColumn('users', 'preferences', {
        type: DataTypes.JSON,
        allowNull: true,
        defaultValue: {
          emailNotifications: true,
          whatsappNotifications: false
        }
      });
    } catch {
      console.log('⚠️ Column preferences already exists in users table');
    }

    console.log('✓ Columns address and preferences added to users table');
  },

  down: async (queryInterface: QueryInterface): Promise<void> => {
    // Eliminar columnas
    await queryInterface.removeColumn('users', 'preferences');
    await queryInterface.removeColumn('users', 'address');

    console.log('✓ Columns address and preferences removed from users table');
  }
};
