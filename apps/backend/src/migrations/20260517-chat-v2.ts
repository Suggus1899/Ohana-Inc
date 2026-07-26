import { QueryInterface, DataTypes } from 'sequelize';

/**
 * 20260517-chat-v2.ts
 *
 * Migración incremental chat v2:
 *  - chat_conversations: status, deletedForP1, deletedForP2, type
 *  - chat_messages: deletedAt, originalContent, isBlocked extras, blockReason, riskScore, violations
 *  - Nueva tabla: chat_user_blocks
 *
 * Idempotente: seguro de ejecutar múltiples veces.
 */

async function tableExists(qi: QueryInterface, name: string): Promise<boolean> {
  try { await qi.describeTable(name); return true; } catch { return false; }
}

async function columnExists(qi: QueryInterface, table: string, col: string): Promise<boolean> {
  try { const d = await qi.describeTable(table); return d[col] !== undefined; } catch { return false; }
}

async function indexExists(qi: QueryInterface, table: string, indexName: string): Promise<boolean> {
  const indexes = await qi.showIndex(table) as any[];
  return indexes.some((i: any) => i.name === indexName);
}

export default {
  up: async (queryInterface: QueryInterface): Promise<void> => {
    const qi = queryInterface;
    const seq = (qi as any).sequelize;

    console.log('\n🚀 [chat-v2] Iniciando migración...\n');

    // ─────────────────────────────────────────────────────────────
    // 1. chat_conversations — columnas nuevas
    // ─────────────────────────────────────────────────────────────
    console.log('🔧 [1] chat_conversations...');

    if (await tableExists(qi, 'chat_conversations')) {

      // 1a. type
      if (!(await columnExists(qi, 'chat_conversations', 'type'))) {
        await seq.query(`
          DO $$ BEGIN
            CREATE TYPE "enum_chat_conversations_type" AS ENUM('rent_request','direct');
          EXCEPTION WHEN duplicate_object THEN null; END $$;
        `);
        await qi.addColumn('chat_conversations', 'type', {
          type: DataTypes.ENUM('rent_request', 'direct'),
          allowNull: false,
          defaultValue: 'rent_request',
        });
        await seq.query(`UPDATE "chat_conversations" SET "type" = 'rent_request' WHERE "type" IS NULL`);
        console.log('   ✅ chat_conversations.type');
      } else {
        console.log('   ⚠️  chat_conversations.type ya existe');
      }

      // 1b. status (solicitud)
      if (!(await columnExists(qi, 'chat_conversations', 'status'))) {
        await seq.query(`
          DO $$ BEGIN
            CREATE TYPE "enum_chat_conversations_status" AS ENUM('accepted','pending','rejected');
          EXCEPTION WHEN duplicate_object THEN null; END $$;
        `);
        await qi.addColumn('chat_conversations', 'status', {
          type: DataTypes.ENUM('accepted', 'pending', 'rejected'),
          allowNull: false,
          defaultValue: 'accepted',
        });
        await seq.query(`UPDATE "chat_conversations" SET "status" = 'accepted' WHERE "status" IS NULL`);
        console.log('   ✅ chat_conversations.status');
      } else {
        console.log('   ⚠️  chat_conversations.status ya existe');
      }

      // 1c. deletedForP1
      if (!(await columnExists(qi, 'chat_conversations', 'deletedForP1'))) {
        await qi.addColumn('chat_conversations', 'deletedForP1', {
          type: DataTypes.BOOLEAN,
          allowNull: false,
          defaultValue: false,
        });
        console.log('   ✅ chat_conversations.deletedForP1');
      } else {
        console.log('   ⚠️  chat_conversations.deletedForP1 ya existe');
      }

      // 1d. deletedForP2
      if (!(await columnExists(qi, 'chat_conversations', 'deletedForP2'))) {
        await qi.addColumn('chat_conversations', 'deletedForP2', {
          type: DataTypes.BOOLEAN,
          allowNull: false,
          defaultValue: false,
        });
        console.log('   ✅ chat_conversations.deletedForP2');
      } else {
        console.log('   ⚠️  chat_conversations.deletedForP2 ya existe');
      }

      // 1e2. clearedForP1At — timestamp de cuando P1 borró el historial
      if (!(await columnExists(qi, 'chat_conversations', 'clearedForP1At'))) {
        await qi.addColumn('chat_conversations', 'clearedForP1At', {
          type: DataTypes.DATE,
          allowNull: true,
          defaultValue: null,
        });
        console.log('   ✅ chat_conversations.clearedForP1At');
      } else {
        console.log('   ⚠️  chat_conversations.clearedForP1At ya existe');
      }

      // 1e3. clearedForP2At — timestamp de cuando P2 borró el historial
      if (!(await columnExists(qi, 'chat_conversations', 'clearedForP2At'))) {
        await qi.addColumn('chat_conversations', 'clearedForP2At', {
          type: DataTypes.DATE,
          allowNull: true,
          defaultValue: null,
        });
        console.log('   ✅ chat_conversations.clearedForP2At');
      } else {
        console.log('   ⚠️  chat_conversations.clearedForP2At ya existe');
      }

      // 1e. rentRequestId — hacer nullable (direct chats no tienen rentRequest)
      await seq.query(`
        ALTER TABLE "chat_conversations" ALTER COLUMN "rentRequestId" DROP NOT NULL;
      `).catch(() => {/* ya es nullable */});

      // 1f. Índice para status
      if (!(await indexExists(qi, 'chat_conversations', 'chat_conversations_status_idx'))) {
        await qi.addIndex('chat_conversations', ['status'], { name: 'chat_conversations_status_idx' });
        console.log('   ✅ índice chat_conversations_status_idx');
      }

    } else {
      console.log('   ⚠️  Tabla chat_conversations no existe, saltando...');
    }

    // ─────────────────────────────────────────────────────────────
    // 2. chat_messages — columnas nuevas
    // ─────────────────────────────────────────────────────────────
    console.log('\n🔧 [2] chat_messages...');

    if (await tableExists(qi, 'chat_messages')) {

      // 2a. deletedAt (soft-delete)
      if (!(await columnExists(qi, 'chat_messages', 'deletedAt'))) {
        await qi.addColumn('chat_messages', 'deletedAt', {
          type: DataTypes.DATE,
          allowNull: true,
          defaultValue: null,
        });
        console.log('   ✅ chat_messages.deletedAt');
      } else {
        console.log('   ⚠️  chat_messages.deletedAt ya existe');
      }

      // 2b. originalContent
      if (!(await columnExists(qi, 'chat_messages', 'originalContent'))) {
        await qi.addColumn('chat_messages', 'originalContent', {
          type: DataTypes.TEXT,
          allowNull: true,
          defaultValue: null,
        });
        console.log('   ✅ chat_messages.originalContent');
      } else {
        console.log('   ⚠️  chat_messages.originalContent ya existe');
      }

      // 2c. blockReason
      if (!(await columnExists(qi, 'chat_messages', 'blockReason'))) {
        await qi.addColumn('chat_messages', 'blockReason', {
          type: DataTypes.TEXT,
          allowNull: true,
          defaultValue: null,
        });
        console.log('   ✅ chat_messages.blockReason');
      } else {
        console.log('   ⚠️  chat_messages.blockReason ya existe');
      }

      // 2d. riskScore
      if (!(await columnExists(qi, 'chat_messages', 'riskScore'))) {
        await qi.addColumn('chat_messages', 'riskScore', {
          type: DataTypes.INTEGER,
          allowNull: false,
          defaultValue: 0,
        });
        console.log('   ✅ chat_messages.riskScore');
      } else {
        console.log('   ⚠️  chat_messages.riskScore ya existe');
      }

      // 2e. violations
      if (!(await columnExists(qi, 'chat_messages', 'violations'))) {
        await qi.addColumn('chat_messages', 'violations', {
          type: DataTypes.JSONB,
          allowNull: false,
          defaultValue: [],
        });
        console.log('   ✅ chat_messages.violations');
      } else {
        console.log('   ⚠️  chat_messages.violations ya existe');
      }

    } else {
      console.log('   ⚠️  Tabla chat_messages no existe, saltando...');
    }

    // ─────────────────────────────────────────────────────────────
    // 3. chat_user_blocks — tabla nueva
    // ─────────────────────────────────────────────────────────────
    console.log('\n🔧 [3] chat_user_blocks...');

    if (!(await tableExists(qi, 'chat_user_blocks'))) {
      await qi.createTable('chat_user_blocks', {
        id: {
          type: DataTypes.INTEGER,
          primaryKey: true,
          autoIncrement: true,
        },
        blockerId: {
          type: DataTypes.INTEGER,
          allowNull: false,
          references: { model: 'users', key: 'id' },
          onUpdate: 'CASCADE',
          onDelete: 'CASCADE',
        },
        blockedId: {
          type: DataTypes.INTEGER,
          allowNull: false,
          references: { model: 'users', key: 'id' },
          onUpdate: 'CASCADE',
          onDelete: 'CASCADE',
        },
        createdAt: {
          type: DataTypes.DATE,
          allowNull: false,
          defaultValue: DataTypes.NOW,
        },
      });

      await qi.addIndex('chat_user_blocks', ['blockerId', 'blockedId'], {
        unique: true,
        name: 'chat_user_blocks_unique_idx',
      });
      await qi.addIndex('chat_user_blocks', ['blockedId'], {
        name: 'chat_user_blocks_blocked_idx',
      });

      console.log('   ✅ Tabla chat_user_blocks creada');
    } else {
      console.log('   ⚠️  Tabla chat_user_blocks ya existe');
    }

    // ─────────────────────────────────────────────────────────────
    // 3.5. Asegurar que las tablas base chat_conversations y chat_messages existan
    // ─────────────────────────────────────────────────────────────
    if (!(await tableExists(qi, 'chat_conversations'))) {
      console.log('\n🔧 [3.5] Tablas base de chat no existen, creándolas...');
      await qi.createTable('chat_conversations', {
        id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
        rentRequestId: { type: DataTypes.INTEGER, allowNull: true, unique: true,
          references: { model: 'rental_requests', key: 'id' }, onUpdate: 'CASCADE', onDelete: 'CASCADE' },
        participant1Id: { type: DataTypes.INTEGER, allowNull: false,
          references: { model: 'users', key: 'id' }, onUpdate: 'CASCADE', onDelete: 'CASCADE' },
        participant2Id: { type: DataTypes.INTEGER, allowNull: false,
          references: { model: 'users', key: 'id' }, onUpdate: 'CASCADE', onDelete: 'CASCADE' },
        lastMessageAt: { type: DataTypes.DATE, allowNull: true, defaultValue: null },
        isActive: { type: DataTypes.BOOLEAN, allowNull: false, defaultValue: true },
        type: { type: DataTypes.ENUM('rent_request', 'direct'), allowNull: false, defaultValue: 'rent_request' },
        status: { type: DataTypes.ENUM('accepted', 'pending', 'rejected'), allowNull: false, defaultValue: 'accepted' },
        deletedForP1: { type: DataTypes.BOOLEAN, allowNull: false, defaultValue: false },
        deletedForP2: { type: DataTypes.BOOLEAN, allowNull: false, defaultValue: false },
        clearedForP1At: { type: DataTypes.DATE, allowNull: true, defaultValue: null },
        clearedForP2At: { type: DataTypes.DATE, allowNull: true, defaultValue: null },
        createdAt: { type: DataTypes.DATE, allowNull: false, defaultValue: DataTypes.NOW },
        updatedAt: { type: DataTypes.DATE, allowNull: false, defaultValue: DataTypes.NOW },
      });
      console.log('   ✅ chat_conversations creada');
    }

    if (!(await tableExists(qi, 'chat_messages'))) {
      await qi.createTable('chat_messages', {
        id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
        conversationId: { type: DataTypes.INTEGER, allowNull: false,
          references: { model: 'chat_conversations', key: 'id' }, onUpdate: 'CASCADE', onDelete: 'CASCADE' },
        senderId: { type: DataTypes.INTEGER, allowNull: false,
          references: { model: 'users', key: 'id' }, onUpdate: 'CASCADE', onDelete: 'CASCADE' },
        content: { type: DataTypes.TEXT, allowNull: false },
        isBlocked: { type: DataTypes.BOOLEAN, allowNull: false, defaultValue: false },
        readAt: { type: DataTypes.DATE, allowNull: true, defaultValue: null },
        deletedAt: { type: DataTypes.DATE, allowNull: true, defaultValue: null },
        originalContent: { type: DataTypes.TEXT, allowNull: true, defaultValue: null },
        blockReason: { type: DataTypes.TEXT, allowNull: true, defaultValue: null },
        riskScore: { type: DataTypes.INTEGER, allowNull: false, defaultValue: 0 },
        violations: { type: DataTypes.JSONB, allowNull: false, defaultValue: [] },
        createdAt: { type: DataTypes.DATE, allowNull: false, defaultValue: DataTypes.NOW },
        updatedAt: { type: DataTypes.DATE, allowNull: false, defaultValue: DataTypes.NOW },
      });
      console.log('   ✅ chat_messages creada');
    }

    // Añadir índices si se crearon tablas nuevas
    if (!(await indexExists(qi, 'chat_conversations', 'chat_conversations_participant1_idx'))) {
      await qi.addIndex('chat_conversations', ['participant1Id'], { name: 'chat_conversations_participant1_idx' });
    }
    if (!(await indexExists(qi, 'chat_conversations', 'chat_conversations_participant2_idx'))) {
      await qi.addIndex('chat_conversations', ['participant2Id'], { name: 'chat_conversations_participant2_idx' });
    }
    if (!(await indexExists(qi, 'chat_conversations', 'chat_conversations_last_message_idx'))) {
      await qi.addIndex('chat_conversations', ['lastMessageAt'], { name: 'chat_conversations_last_message_idx' });
    }
    if (!(await indexExists(qi, 'chat_messages', 'chat_messages_conversation_idx'))) {
      await qi.addIndex('chat_messages', ['conversationId'], { name: 'chat_messages_conversation_idx' });
    }
    if (!(await indexExists(qi, 'chat_messages', 'chat_messages_sender_idx'))) {
      await qi.addIndex('chat_messages', ['senderId'], { name: 'chat_messages_sender_idx' });
    }
    if (!(await indexExists(qi, 'chat_messages', 'chat_messages_conversation_created_idx'))) {
      await qi.addIndex('chat_messages', ['conversationId', 'createdAt'], { name: 'chat_messages_conversation_created_idx' });
    }
    if (!(await indexExists(qi, 'chat_messages', 'chat_messages_unread_idx'))) {
      await qi.addIndex('chat_messages', ['conversationId', 'readAt'], { name: 'chat_messages_unread_idx' });
    }

    // ─────────────────────────────────────────────────────────────
    // 4. chat_message_deletions — borrado per-user
    // ─────────────────────────────────────────────────────────────
    console.log('\n🔧 [4] chat_message_deletions...');

    if (!(await tableExists(qi, 'chat_message_deletions'))) {
      await qi.createTable('chat_message_deletions', {
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
      await qi.addIndex('chat_message_deletions', ['messageId', 'userId'], {
        unique: true,
        name: 'chat_message_deletions_unique',
      });
      await qi.addIndex('chat_message_deletions', ['userId'], {
        name: 'chat_message_deletions_user_idx',
      });
      console.log('   ✅ Tabla chat_message_deletions creada');
    } else {
      console.log('   ⚠️  Tabla chat_message_deletions ya existe');
    }

    console.log('\n🎉 [chat-v2] Migración completada\n');
  },

  down: async (queryInterface: QueryInterface): Promise<void> => {
    const qi = queryInterface;

    console.log('\n⏪ [chat-v2] Revirtiendo...\n');

    if (await (async () => { try { await qi.describeTable('chat_user_blocks'); return true; } catch { return false; } })()) {
      await qi.dropTable('chat_user_blocks');
      console.log('   ✅ chat_user_blocks eliminada');
    }

    const convCols = ['deletedForP2', 'deletedForP1', 'status', 'type'];
    for (const col of convCols) {
      try { await qi.removeColumn('chat_conversations', col); } catch { /* no existe */ }
    }

    const msgCols = ['violations', 'riskScore', 'blockReason', 'originalContent', 'deletedAt'];
    for (const col of msgCols) {
      try { await qi.removeColumn('chat_messages', col); } catch { /* no existe */ }
    }

    console.log('   ✅ Columnas revertidas\n');
  },
};
