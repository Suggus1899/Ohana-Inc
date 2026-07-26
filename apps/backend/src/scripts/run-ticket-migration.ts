import { sequelize } from '../config/database';
import migration from '../migrations/20260403-add-escalation-to-tickets';

/**
 * Script para ejecutar la migración de escalación de tickets
 * 
 * Uso:
 * ts-node src/scripts/run-ticket-migration.ts up    - Aplicar migración
 * ts-node src/scripts/run-ticket-migration.ts down  - Revertir migración
 */

async function runMigration() {
  const action = process.argv[2] || 'up';

  try {
    console.log('🔄 Conectando a la base de datos...');
    await sequelize.authenticate();
    console.log('✅ Conexión establecida');

    if (action === 'up') {
      console.log('\n🚀 Aplicando migración: add-escalation-to-tickets...');
      await migration.up(sequelize.getQueryInterface());
      console.log('✅ Migración aplicada exitosamente\n');
      
      console.log('📊 Verificando cambios...');
      const result = await sequelize.query(`
        SELECT column_name, data_type, column_default 
        FROM information_schema.columns 
        WHERE table_name = 'tickets' AND column_name = 'escalationReason';
      `);
      console.log('Columna escalationReason:', result[0]);
      
    } else if (action === 'down') {
      console.log('\n⏪ Revirtiendo migración: add-escalation-to-tickets...');
      await migration.down(sequelize.getQueryInterface());
      console.log('✅ Migración revertida exitosamente\n');
      
    } else {
      console.error('❌ Acción inválida. Use "up" o "down"');
      process.exit(1);
    }

    console.log('✨ Proceso completado');
    process.exit(0);
  } catch (error) {
    console.error('❌ Error ejecutando migración:', error);
    process.exit(1);
  }
}

runMigration();
