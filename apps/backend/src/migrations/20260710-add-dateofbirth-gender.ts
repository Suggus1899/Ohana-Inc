import { QueryInterface, DataTypes } from 'sequelize';

export async function up(queryInterface: QueryInterface): Promise<void> {
  const tableDesc = await queryInterface.describeTable('users') as any;

  if (!tableDesc.dateOfBirth) {
    await queryInterface.addColumn('users', 'dateOfBirth', {
      type: DataTypes.DATEONLY,
      allowNull: true,
    });
  }

  if (!tableDesc.gender) {
    await queryInterface.addColumn('users', 'gender', {
      type: DataTypes.STRING(20),
      allowNull: true,
    });
  }
}

export async function down(queryInterface: QueryInterface): Promise<void> {
  const tableDesc = await queryInterface.describeTable('users') as any;

  if (tableDesc.dateOfBirth) {
    await queryInterface.removeColumn('users', 'dateOfBirth');
  }

  if (tableDesc.gender) {
    await queryInterface.removeColumn('users', 'gender');
  }
}
