import { sequelize } from '../config/database';

/**
 * Script para verificar la tabla kyc_verifications
 */

async function verifyTable() {
  try {
    console.log('🔄 Conectando a la base de datos...');
    await sequelize.authenticate();
    console.log('✅ Conexión establecida\n');

    // Verificar tabla
    const [tableResult] = await sequelize.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' AND table_name = 'kyc_verifications';
    `);

    if ((tableResult as any[]).length === 0) {
      console.log('❌ La tabla kyc_verifications NO existe');
      process.exit(1);
    }

    console.log('✅ Tabla kyc_verifications existe\n');

    // Verificar columnas
    const [columns] = await sequelize.query(`
      SELECT column_name, data_type, is_nullable, column_default
      FROM information_schema.columns 
      WHERE table_name = 'kyc_verifications'
      ORDER BY ordinal_position;
    `);

    console.log(`📋 Total de columnas: ${(columns as any[]).length}`);
    console.log('\n📝 Columnas principales:');
    const mainColumns = ['id', 'userId', 'status', 'verificationLevel', 'documentNumber', 
                         'faceMatchScore', 'livenessScore', 'documentValidityScore', 
                         'fraudScore', 'ocrData', 'reviewedBy'];
    
    (columns as any[])
      .filter((col: any) => mainColumns.includes(col.column_name))
      .forEach((col: any) => {
        console.log(`   • ${col.column_name}: ${col.data_type}`);
      });

    // Verificar ENUM
    const [enumValues] = await sequelize.query(`
      SELECT e.enumlabel 
      FROM pg_type t 
      JOIN pg_enum e ON t.oid = e.enumtypid 
      WHERE t.typname = 'enum_kyc_verifications_status'
      ORDER BY e.enumsortorder;
    `);

    console.log(`\n📋 Valores del ENUM status: ${(enumValues as any[]).length}`);
    (enumValues as any[]).forEach((val: any, idx: number) => {
      console.log(`   ${idx + 1}. ${val.enumlabel}`);
    });

    // Verificar índices
    const [indexes] = await sequelize.query(`
      SELECT indexname, indexdef
      FROM pg_indexes 
      WHERE tablename = 'kyc_verifications'
      ORDER BY indexname;
    `);

    console.log(`\n📋 Total de índices: ${(indexes as any[]).length}`);
    (indexes as any[]).forEach((idx: any) => {
      console.log(`   • ${idx.indexname}`);
    });

    // Verificar foreign keys
    const [foreignKeys] = await sequelize.query(`
      SELECT
        tc.constraint_name,
        kcu.column_name,
        ccu.table_name AS foreign_table_name,
        ccu.column_name AS foreign_column_name
      FROM information_schema.table_constraints AS tc
      JOIN information_schema.key_column_usage AS kcu
        ON tc.constraint_name = kcu.constraint_name
      JOIN information_schema.constraint_column_usage AS ccu
        ON ccu.constraint_name = tc.constraint_name
      WHERE tc.constraint_type = 'FOREIGN KEY'
        AND tc.table_name = 'kyc_verifications';
    `);

    console.log(`\n📋 Foreign Keys: ${(foreignKeys as any[]).length}`);
    (foreignKeys as any[]).forEach((fk: any) => {
      console.log(`   • ${fk.column_name} → ${fk.foreign_table_name}(${fk.foreign_column_name})`);
    });

    console.log('\n✅ Verificación completada exitosamente\n');
    await sequelize.close();
    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error);
    await sequelize.close();
    process.exit(1);
  }
}

verifyTable();
