import { sequelize } from '../config/database';

async function checkDB(): Promise<void> {
  try {
    console.log('🔄 Connecting to database...');
    await sequelize.authenticate();
    console.log('✅ Connection established.');

    console.log('\n📋 Checking all tables...');
    const [tables] = await sequelize.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public'
      ORDER BY table_name;
    `);

    console.log('Tables:', tables);

    if (Array.isArray(tables) && tables.length > 0) {
      console.log('\n📋 Sample table structure (first table)...');
      const [columns] = await sequelize.query(`
        SELECT column_name, data_type, udt_name, is_nullable, column_default
        FROM information_schema.columns
        WHERE table_name = 'users'
        ORDER BY ordinal_position;
      `);
      console.log('Users columns:', columns);
    }
  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await sequelize.close();
    process.exit(0);
  }
}

checkDB();