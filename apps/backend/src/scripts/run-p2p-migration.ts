import { sequelize } from '../config/database';
import * as migration from '../migrations/20260507-add-rental-request-id-to-transactions';

async function runMigration() {
  const action = process.argv[2] || 'up';

  try {
    console.log('🔄 Conectando a la base de datos...');
    await sequelize.authenticate();
    console.log('✅ Conexión establecida');

    if (action === 'up') {
      console.log('\n🚀 Aplicando migración: add-rental-request-id-to-transactions...');
      await migration.up(sequelize.getQueryInterface());
      console.log('✅ Migración aplicada exitosamente\n');

      const [rows] = await sequelize.query(`
        SELECT column_name, data_type
        FROM information_schema.columns
        WHERE table_name = 'transactions' AND column_name = 'rentalRequestId';
      `);
      console.log('Columna rentalRequestId:', rows);

      const [enumRows] = await sequelize.query(`
        SELECT enumlabel
        FROM pg_enum
        JOIN pg_type ON pg_enum.enumtypid = pg_type.oid
        WHERE pg_type.typname = 'enum_rental_requests_status'
        ORDER BY enumlabel;
      `);
      console.log('Enum rental_requests status values:', enumRows);

    } else if (action === 'down') {
      console.log('\n⏪ Revirtiendo migración...');
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
