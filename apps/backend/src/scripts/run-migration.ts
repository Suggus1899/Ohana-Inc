import { sequelize } from '../config/database';
import * as migration from '../migrations/20260311-add-account-status';

/**
 * Script para ejecutar la migración de accountStatus
 * 
 * Uso:
 * npm run migrate:up    - Aplicar migración
 * npm run migrate:down  - Revertir migración
 */

async function runMigration() {
  const action = process.argv[2] || 'up';

  try {
    console.log('🔄 Conectando a la base de datos...');
    await sequelize.authenticate();
    console.log('✅ Conexión establecida');

    if (action === 'up') {
      console.log('\n🚀 Aplicando migración: add-account-status...');
      await migration.up(sequelize.getQueryInterface());
      console.log('✅ Migración aplicada exitosamente\n');
      
      console.log('📊 Verificando cambios...');
      const result = await sequelize.query(`
        SELECT column_name, data_type, column_default 
        FROM information_schema.columns 
        WHERE table_name = 'Users' AND column_name = 'accountStatus';
      `);
      console.log('Columna accountStatus:', result[0]);
      
    } else if (action === 'down') {
      console.log('\n⏪ Revirtiendo migración: add-account-status...');
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
