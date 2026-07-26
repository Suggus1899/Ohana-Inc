import { QueryInterface, DataTypes } from 'sequelize';

export async function up(queryInterface: QueryInterface): Promise<void> {
  const tableDesc = await queryInterface.describeTable('users') as any;

  if (!tableDesc.auth_provider) {
    await queryInterface.addColumn('users', 'auth_provider', {
      type: DataTypes.ENUM('local', 'google'),
      defaultValue: 'local',
      allowNull: false,
    });
  }

  if (!tableDesc.google_id) {
    await queryInterface.addColumn('users', 'google_id', {
      type: DataTypes.STRING(255),
      allowNull: true,
      unique: true,
    });
  }

  if (tableDesc.password && tableDesc.password.allowNull === false) {
    await queryInterface.changeColumn('users', 'password', {
      type: DataTypes.STRING(255),
      allowNull: true,
    });
  }

  const indexes = await queryInterface.showIndex('users') as any[];
  const hasGoogleIdIdx = indexes.some((idx: any) => idx.name === 'users_google_id_idx');
  if (!hasGoogleIdIdx) {
    await queryInterface.addIndex('users', ['google_id'], {
      name: 'users_google_id_idx',
      unique: true,
    });
  }
}

export async function down(queryInterface: QueryInterface): Promise<void> {
  const tableDesc = await queryInterface.describeTable('users') as any;

  if (tableDesc.google_id) {
    await queryInterface.removeIndex('users', 'users_google_id_idx');
    await queryInterface.removeColumn('users', 'google_id');
  }

  if (tableDesc.auth_provider) {
    await queryInterface.removeColumn('users', 'auth_provider');
  }
}
