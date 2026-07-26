import { sequelize } from '../config/database';
import * as migration from '../migrations/20260404-add-verification-level';

/**
 * Script para ejecutar la migración de verificationLevel
 * 
 * Uso:
 * npx ts-node src/scripts/run-verification-level-migration.ts up    - Aplicar migración
 * npx ts-node src/scripts/run-verification-level-migration.ts down  - Revertir migración
 */

async function runMigration() {
  const action = process.argv[2] || 'up';

  try {
    console.log('🔄 Conectando a la base de datos...');
    await sequelize.authenticate();
    console.log('✅ Conexión establecida');

    if (action === 'up') {
      console.log('\n🚀 Aplicando migración: add-verification-level...');
      await migration.up(sequelize.getQueryInterface());
      console.log('✅ Migración aplicada exitosamente\n');
      
      console.log('📊 Verificando cambios...');
      const result = await sequelize.query(`
        SELECT column_name, data_type, column_default 
        FROM information_schema.columns 
        WHERE table_name = 'users' AND column_name = 'verificationLevel';
      `);
      console.log('Columna verificationLevel:', result[0]);
      
      const indexResult = await sequelize.query(`
        SELECT indexname, indexdef
        FROM pg_indexes
        WHERE tablename = 'users' AND indexname = 'users_verification_level_idx';
      `);
      console.log('Índice users_verification_level_idx:', indexResult[0]);
      
    } else if (action === 'down') {
      console.log('\n⏪ Revirtiendo migración: add-verification-level...');
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
