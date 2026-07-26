import { QueryInterface, DataTypes } from 'sequelize';

export async function up(queryInterface: QueryInterface): Promise<void> {
  const tableDesc = (await queryInterface.describeTable('users')) as Record<string, any>;

  if (!tableDesc.tutorial_completed) {
    await queryInterface.addColumn('users', 'tutorial_completed', {
      type: DataTypes.BOOLEAN,
      defaultValue: false,
      allowNull: false,
    });
  }
}

export async function down(queryInterface: QueryInterface): Promise<void> {
  const tableDesc = (await queryInterface.describeTable('users')) as Record<string, any>;

  if (tableDesc.tutorial_completed) {
    await queryInterface.removeColumn('users', 'tutorial_completed');
  }
}
