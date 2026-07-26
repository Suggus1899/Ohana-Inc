import { sequelize } from '../config/database';

async function verifyCurrentLevelColumn() {
  try {
    console.log('🔌 Conectando a la base de datos...');
    await sequelize.authenticate();
    console.log('✅ Conexión establecida\n');

    // Query to check if currentLevel column exists
    const [results] = await sequelize.query(`
      SELECT 
        column_name,
        data_type,
        column_default,
        is_nullable
      FROM information_schema.columns
      WHERE table_name = 'kyc_verifications'
        AND column_name = 'currentLevel';
    `);

    if (results.length === 0) {
      console.log('❌ ERROR: La columna currentLevel NO existe en kyc_verifications');
      process.exit(1);
    }

    console.log('✅ La columna currentLevel existe en kyc_verifications');
    console.log('\nDetalles de la columna:');
    console.log(JSON.stringify(results[0], null, 2));

    // Check if index exists
    const [indexResults] = await sequelize.query(`
      SELECT indexname, indexdef
      FROM pg_indexes
      WHERE tablename = 'kyc_verifications'
        AND indexname = 'kyc_verifications_current_level_idx';
    `);

    if (indexResults.length > 0) {
      console.log('\n✅ El índice kyc_verifications_current_level_idx existe');
      console.log('Definición:', (indexResults[0] as any).indexdef);
    } else {
      console.log('\n⚠️  El índice kyc_verifications_current_level_idx NO existe');
    }

    await sequelize.close();
    console.log('\n✅ Verificación completada exitosamente');
  } catch (error) {
    console.error('❌ Error durante la verificación:', error);
    process.exit(1);
  }
}

verifyCurrentLevelColumn();
