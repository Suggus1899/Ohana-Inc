import { sequelize } from '../config/database';
import * as migration from '../migrations/20260407-create-kyc-attempts';

/**
 * Script para ejecutar la migración de kyc_attempts
 * 
 * Uso:
 * ts-node src/scripts/run-kyc-attempts-migration.ts up    - Aplicar migración
 * ts-node src/scripts/run-kyc-attempts-migration.ts down  - Revertir migración
 */

async function runMigration() {
  const action = process.argv[2] || 'up';

  try {
    console.log('🔄 Conectando a la base de datos...');
    await sequelize.authenticate();
    console.log('✅ Conexión establecida');

    if (action === 'up') {
      await migration.up(sequelize.getQueryInterface());
      
      console.log('\n📊 Verificando tabla creada...');
      const result = await sequelize.query(`
        SELECT table_name 
        FROM information_schema.tables 
        WHERE table_schema = 'public' AND table_name = 'kyc_attempts';
      `);
      
      if (result[0].length > 0) {
        console.log('✅ Tabla kyc_attempts existe');
        
        // Verificar columnas
        const columns = await sequelize.query(`
          SELECT column_name, data_type, is_nullable, column_default
          FROM information_schema.columns 
          WHERE table_name = 'kyc_attempts'
          ORDER BY ordinal_position;
        `);
        console.log(`\n📋 Columnas creadas: ${(columns[0] as any[]).length}`);
        
        // Verificar índices
        const indexes = await sequelize.query(`
          SELECT indexname 
          FROM pg_indexes 
          WHERE tablename = 'kyc_attempts';
        `);
        console.log(`📋 Índices creados: ${(indexes[0] as any[]).length}`);
      }
      
    } else if (action === 'down') {
      await migration.down(sequelize.getQueryInterface());
      
      console.log('\n📊 Verificando tabla eliminada...');
      const result = await sequelize.query(`
        SELECT table_name 
        FROM information_schema.tables 
        WHERE table_schema = 'public' AND table_name = 'kyc_attempts';
      `);
      
      if (result[0].length === 0) {
        console.log('✅ Tabla kyc_attempts eliminada correctamente');
      }
      
    } else {
      console.error('❌ Acción inválida. Use "up" o "down"');
      process.exit(1);
    }

    console.log('\n✨ Proceso completado');
    await sequelize.close();
    process.exit(0);
  } catch (error) {
    console.error('❌ Error ejecutando migración:', error);
    await sequelize.close();
    process.exit(1);
  }
}

runMigration();
