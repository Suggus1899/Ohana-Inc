import { sequelize } from '../config/database';
import migration from '../migrations/20260402-add-verifiedById-column';

/**
 * Script para ejecutar la migración de verifiedById
 * 
 * Uso:
 * npx ts-node src/scripts/add-verifiedById.ts
 */

async function runMigration() {
  try {
    console.log('🔄 Conectando a la base de datos...');
    await sequelize.authenticate();
    console.log('✅ Conexión establecida\n');

    console.log('🚀 Aplicando migración: add-verifiedById-column...');
    await migration.up(sequelize.getQueryInterface());
    console.log('✅ Migración aplicada exitosamente\n');
    
    console.log('📊 Verificando cambios...');
    const result = await sequelize.query(`
      SELECT column_name, data_type, is_nullable 
      FROM information_schema.columns 
      WHERE table_name = 'users' AND column_name = 'verifiedById';
    `);
    console.log('Columna verifiedById:', result[0]);
    
    console.log('\n✨ Proceso completado');
    process.exit(0);
  } catch (error) {
    console.error('❌ Error ejecutando migración:', error);
    process.exit(1);
  }
}

runMigration();
