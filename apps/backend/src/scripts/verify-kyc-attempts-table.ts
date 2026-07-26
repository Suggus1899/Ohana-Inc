import { sequelize } from '../config/database';

/**
 * Script para verificar la estructura de la tabla kyc_attempts
 * 
 * Verifica:
 * - Existencia de la tabla
 * - Columnas y tipos de datos
 * - Índices
 * - Foreign keys
 * - ENUM values
 */

async function verifyTable() {
  try {
    console.log('🔄 Conectando a la base de datos...');
    await sequelize.authenticate();
    console.log('✅ Conexión establecida\n');

    // 1. Verificar existencia de la tabla
    console.log('📊 Verificando tabla kyc_attempts...');
    const tableExists = await sequelize.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' AND table_name = 'kyc_attempts';
    `);

    if ((tableExists[0] as any[]).length === 0) {
      console.error('❌ La tabla kyc_attempts no existe');
      process.exit(1);
    }
    console.log('✅ Tabla kyc_attempts existe\n');

    // 2. Verificar columnas
    console.log('📋 Columnas de la tabla:');
    const columns = await sequelize.query(`
      SELECT 
        column_name, 
        data_type, 
        is_nullable, 
        column_default,
        (SELECT pgd.description 
         FROM pg_catalog.pg_statio_all_tables AS st 
         INNER JOIN pg_catalog.pg_description pgd ON (pgd.objoid=st.relid) 
         WHERE c.ordinal_position=pgd.objsubid AND c.table_name=st.relname) AS comment
      FROM information_schema.columns c
      WHERE table_name = 'kyc_attempts'
      ORDER BY ordinal_position;
    `);

    (columns[0] as any[]).forEach((col: any) => {
      console.log(`  • ${col.column_name}: ${col.data_type} ${col.is_nullable === 'NO' ? 'NOT NULL' : 'NULL'}`);
      if (col.column_default) {
        console.log(`    Default: ${col.column_default}`);
      }
      if (col.comment) {
        console.log(`    Comment: ${col.comment}`);
      }
    });

    // 3. Verificar ENUM
    console.log('\n📋 Valores del ENUM step:');
    const enumValues = await sequelize.query(`
      SELECT enumlabel 
      FROM pg_enum 
      WHERE enumtypid = (SELECT oid FROM pg_type WHERE typname = 'enum_kyc_attempts_step')
      ORDER BY enumsortorder;
    `);

    (enumValues[0] as any[]).forEach((val: any) => {
      console.log(`  • ${val.enumlabel}`);
    });

    // 4. Verificar índices
    console.log('\n📋 Índices:');
    const indexes = await sequelize.query(`
      SELECT indexname, indexdef 
      FROM pg_indexes 
      WHERE tablename = 'kyc_attempts'
      ORDER BY indexname;
    `);

    (indexes[0] as any[]).forEach((idx: any) => {
      console.log(`  • ${idx.indexname}`);
    });

    // 5. Verificar foreign keys
    console.log('\n📋 Foreign Keys:');
    const fks = await sequelize.query(`
      SELECT conname, pg_get_constraintdef(oid) as definition 
      FROM pg_constraint 
      WHERE conrelid = 'kyc_attempts'::regclass AND contype = 'f';
    `);

    (fks[0] as any[]).forEach((fk: any) => {
      console.log(`  • ${fk.conname}: ${fk.definition}`);
    });

    // 6. Resumen
    console.log('\n✅ ========================================');
    console.log('   VERIFICACIÓN COMPLETADA');
    console.log('========================================');
    console.log(`\n✅ Columnas: ${(columns[0] as any[]).length}`);
    console.log(`✅ ENUM values: ${(enumValues[0] as any[]).length}`);
    console.log(`✅ Índices: ${(indexes[0] as any[]).length}`);
    console.log(`✅ Foreign Keys: ${(fks[0] as any[]).length}`);
    console.log('\n✨ Tabla kyc_attempts verificada exitosamente\n');

    await sequelize.close();
    process.exit(0);
  } catch (error) {
    console.error('❌ Error verificando tabla:', error);
    await sequelize.close();
    process.exit(1);
  }
}

verifyTable();
