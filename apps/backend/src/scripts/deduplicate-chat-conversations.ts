import { sequelize } from '../config/database';
import { ChatConversation, ChatMessage } from '../models';
import { Op } from 'sequelize';

async function deduplicateChatConversations() {
  console.log('🔍 Buscando conversaciones duplicadas...');

  const all = await ChatConversation.findAll({
    order: [['createdAt', 'ASC']],
  });

  const seen = new Map<string, ChatConversation>();
  const toDelete: number[] = [];

  for (const conv of all) {
    const p1 = Math.min(conv.participant1Id, conv.participant2Id);
    const p2 = Math.max(conv.participant1Id, conv.participant2Id);
    const key = `${p1}-${p2}`;

    if (seen.has(key)) {
      const keep = seen.get(key)!;
      // Move messages from duplicate to the kept conversation
      await ChatMessage.update(
        { conversationId: keep.id },
        { where: { conversationId: conv.id } }
      );
      toDelete.push(conv.id);
      console.log(`  → Fusionando conversación #${conv.id} en #${keep.id} (usuarios ${p1} y ${p2})`);
    } else {
      seen.set(key, conv);
    }
  }

  if (toDelete.length > 0) {
    await ChatConversation.destroy({ where: { id: { [Op.in]: toDelete } } });
    console.log(`✅ Eliminadas ${toDelete.length} conversaciones duplicadas`);
  } else {
    console.log('✅ No se encontraron duplicados');
  }

  // Agregar índice único sobre (participant1Id, participant2Id)
  try {
    await sequelize.query(`
      CREATE UNIQUE INDEX CONCURRENTLY IF NOT EXISTS chat_conversations_pair_unique
      ON chat_conversations (LEAST(participant1Id, participant2Id), GREATEST(participant1Id, participant2Id))
    `);
    console.log('✅ Índice único creado');
  } catch (err: any) {
    // Fallback: crear sin CONCURRENTLY (requiere transacción fuera)
    try {
      await sequelize.query(`
        CREATE UNIQUE INDEX IF NOT EXISTS chat_conversations_pair_unique
        ON chat_conversations (LEAST(participant1Id, participant2Id), GREATEST(participant1Id, participant2Id))
      `);
      console.log('✅ Índice único creado (sin CONCURRENTLY)');
    } catch (err2: any) {
      console.warn('⚠️ No se pudo crear el índice único:', err2.message);
    }
  }

  await sequelize.close();
  console.log('🏁 Proceso completado');
}

deduplicateChatConversations().catch((err) => {
  console.error('❌ Error:', err);
  process.exit(1);
});
