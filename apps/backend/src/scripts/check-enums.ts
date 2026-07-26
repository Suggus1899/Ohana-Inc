import { sequelize } from '../config/database';

async function checkEnums(): Promise<void> {
  try {
    console.log('🔄 Connecting to database...');
    await sequelize.authenticate();
    console.log('✅ Connection established.');

    console.log('\n📋 Checking existing ENUM types...');
    const [results] = await sequelize.query(`
      SELECT typname, typnamespace, nsp.nspname as schema
      FROM pg_type typ
      JOIN pg_namespace nsp ON typ.typnamespace = nsp.oid
      WHERE typname LIKE 'enum%'
      ORDER BY typname;
    `);

    console.log('Existing ENUM types:', results);
    
    // Also check the users table structure
    console.log('\n📋 Checking users table columns...');
    const [columns] = await sequelize.query(`
      SELECT column_name, data_type, udt_name
      FROM information_schema.columns
      WHERE table_name = 'users'
      AND column_name = 'role';
    `);
    
    console.log('Role column:', columns);
  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await sequelize.close();
    process.exit(0);
  }
}

checkEnums();