import { QueryInterface, DataTypes } from 'sequelize';

async function tableExists(qi: QueryInterface, name: string): Promise<boolean> {
  try { await qi.describeTable(name); return true; } catch { return false; }
}

async function indexExists(qi: QueryInterface, table: string, indexName: string): Promise<boolean> {
  const indexes = await qi.showIndex(table) as any[];
  return indexes.some((i: any) => i.name === indexName);
}

const tableDefs: [string, any][] = [
  ['chat_conversations', {
    id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
    rentRequestId: { type: DataTypes.INTEGER, allowNull: false, unique: true, references: { model: 'rental_requests', key: 'id' }, onUpdate: 'CASCADE', onDelete: 'CASCADE' },
    participant1Id: { type: DataTypes.INTEGER, allowNull: false, references: { model: 'users', key: 'id' }, onUpdate: 'CASCADE', onDelete: 'CASCADE' },
    participant2Id: { type: DataTypes.INTEGER, allowNull: false, references: { model: 'users', key: 'id' }, onUpdate: 'CASCADE', onDelete: 'CASCADE' },
    lastMessageAt: { type: DataTypes.DATE, allowNull: true, defaultValue: null },
    isActive: { type: DataTypes.BOOLEAN, allowNull: false, defaultValue: true },
    createdAt: { type: DataTypes.DATE, allowNull: false, defaultValue: DataTypes.NOW },
    updatedAt: { type: DataTypes.DATE, allowNull: false, defaultValue: DataTypes.NOW },
  }],
  ['chat_messages', {
    id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
    conversationId: { type: DataTypes.INTEGER, allowNull: false, references: { model: 'chat_conversations', key: 'id' }, onUpdate: 'CASCADE', onDelete: 'CASCADE' },
    senderId: { type: DataTypes.INTEGER, allowNull: false, references: { model: 'users', key: 'id' }, onUpdate: 'CASCADE', onDelete: 'CASCADE' },
    content: { type: DataTypes.TEXT, allowNull: false },
    isBlocked: { type: DataTypes.BOOLEAN, allowNull: false, defaultValue: false },
    readAt: { type: DataTypes.DATE, allowNull: true, defaultValue: null },
    createdAt: { type: DataTypes.DATE, allowNull: false, defaultValue: DataTypes.NOW },
    updatedAt: { type: DataTypes.DATE, allowNull: false, defaultValue: DataTypes.NOW },
  }],
];

const indexDefs: [string, string[], string][] = [
  ['chat_conversations', ['participant1Id'], 'chat_conversations_participant1_idx'],
  ['chat_conversations', ['participant2Id'], 'chat_conversations_participant2_idx'],
  ['chat_conversations', ['lastMessageAt'], 'chat_conversations_last_message_idx'],
  ['chat_messages', ['conversationId'], 'chat_messages_conversation_idx'],
  ['chat_messages', ['senderId'], 'chat_messages_sender_idx'],
  ['chat_messages', ['conversationId', 'createdAt'], 'chat_messages_conversation_created_idx'],
  ['chat_messages', ['conversationId', 'readAt'], 'chat_messages_unread_idx'],
];

export default {
  up: async (queryInterface: QueryInterface): Promise<void> => {
    const qi = queryInterface;

    for (const [tableName, attributes] of tableDefs) {
      if (!(await tableExists(qi, tableName))) {
        await qi.createTable(tableName, attributes);
        console.log(`✅ ${tableName} table created`);
      } else {
        console.log(`⏭️ ${tableName} already exists, skipping`);
      }
    }

    for (const [table, fields, indexName] of indexDefs) {
      if (!(await indexExists(qi, table, indexName))) {
        await qi.addIndex(table, fields, { name: indexName });
        console.log(`✅ Index ${indexName} created`);
      }
    }
  },

  down: async (queryInterface: QueryInterface): Promise<void> => {
    await queryInterface.dropTable('chat_messages').catch(() => {});
    await queryInterface.dropTable('chat_conversations').catch(() => {});
    console.log('✅ Chat tables dropped');
  },
};
