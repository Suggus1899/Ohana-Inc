import { QueryInterface, DataTypes } from 'sequelize';

export async function up(queryInterface: QueryInterface): Promise<void> {
  const tables = await queryInterface.showAllTables();
  if (tables.includes('chat_message_deletions')) return;

  await queryInterface.createTable('chat_message_deletions', {
    id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true, allowNull: false },
    messageId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: { model: 'chat_messages', key: 'id' },
      onDelete: 'CASCADE',
    },
    userId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: { model: 'users', key: 'id' },
      onDelete: 'CASCADE',
    },
    createdAt: { type: DataTypes.DATE, allowNull: false, defaultValue: DataTypes.NOW },
  });

  await queryInterface.addIndex('chat_message_deletions', ['messageId', 'userId'], {
    unique: true,
    name: 'chat_message_deletions_unique',
  });
  await queryInterface.addIndex('chat_message_deletions', ['userId'], {
    name: 'chat_message_deletions_user_idx',
  });
}

export async function down(queryInterface: QueryInterface): Promise<void> {
  await queryInterface.dropTable('chat_message_deletions');
}
