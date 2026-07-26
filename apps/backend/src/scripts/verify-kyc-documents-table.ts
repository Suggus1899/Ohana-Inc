import { sequelize } from '../config/database';

/**
 * Script para verificar la tabla kyc_documents
 */

async function verifyTable() {
  try {
    console.log('🔄 Conectando a la base de datos...');
    await sequelize.authenticate();
    console.log('✅ Conexión establecida\n');

    // Verificar que la tabla existe
    const tableResult = await sequelize.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' AND table_name = 'kyc_documents';
    `);

    if ((tableResult[0] as any[]).length === 0) {
      console.log('❌ La tabla kyc_documents NO existe');
      await sequelize.close();
      process.exit(1);
    }

    console.log('✅ Tabla kyc_documents existe\n');

    // Verificar columnas
    const columnsResult = await sequelize.query(`
      SELECT column_name, data_type, is_nullable, column_default
      FROM information_schema.columns 
      WHERE table_name = 'kyc_documents'
      ORDER BY ordinal_position;
    `);

    console.log('📋 Columnas de la tabla kyc_documents:');
    console.log('─────────────────────────────────────────────────────────');
    (columnsResult[0] as any[]).forEach((col: any) => {
      console.log(`  • ${col.column_name.padEnd(20)} | ${col.data_type.padEnd(25)} | Nullable: ${col.is_nullable}`);
    });

    // Verificar ENUM
    const enumResult = await sequelize.query(`
      SELECT e.enumlabel
      FROM pg_type t 
      JOIN pg_enum e ON t.oid = e.enumtypid  
      WHERE t.typname = 'enum_kyc_documents_document_type'
      ORDER BY e.enumsortorder;
    `);

    console.log('\n📋 Valores del ENUM documentType:');
    console.log('─────────────────────────────────────────────────────────');
    (enumResult[0] as any[]).forEach((val: any) => {
      console.log(`  • ${val.enumlabel}`);
    });

    // Verificar índices
    const indexesResult = await sequelize.query(`
      SELECT indexname, indexdef
      FROM pg_indexes 
      WHERE tablename = 'kyc_documents';
    `);

    console.log('\n📋 Índices de la tabla kyc_documents:');
    console.log('─────────────────────────────────────────────────────────');
    (indexesResult[0] as any[]).forEach((idx: any) => {
      console.log(`  • ${idx.indexname}`);
    });

    // Verificar foreign key
    const fkResult = await sequelize.query(`
      SELECT
        tc.constraint_name,
        tc.table_name,
        kcu.column_name,
        ccu.table_name AS foreign_table_name,
        ccu.column_name AS foreign_column_name,
        rc.delete_rule,
        rc.update_rule
      FROM information_schema.table_constraints AS tc
      JOIN information_schema.key_column_usage AS kcu
        ON tc.constraint_name = kcu.constraint_name
        AND tc.table_schema = kcu.table_schema
      JOIN information_schema.constraint_column_usage AS ccu
        ON ccu.constraint_name = tc.constraint_name
        AND ccu.table_schema = tc.table_schema
      JOIN information_schema.referential_constraints AS rc
        ON tc.constraint_name = rc.constraint_name
      WHERE tc.constraint_type = 'FOREIGN KEY'
        AND tc.table_name = 'kyc_documents';
    `);

    console.log('\n📋 Foreign Keys:');
    console.log('─────────────────────────────────────────────────────────');
    (fkResult[0] as any[]).forEach((fk: any) => {
      console.log(`  • ${fk.column_name} -> ${fk.foreign_table_name}(${fk.foreign_column_name})`);
      console.log(`    ON DELETE ${fk.delete_rule} | ON UPDATE ${fk.update_rule}`);
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
