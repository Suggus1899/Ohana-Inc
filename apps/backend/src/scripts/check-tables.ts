import { sequelize } from '../config/database';

async function checkTables(): Promise<void> {
  try {
    console.log('🔄 Connecting to database...');
    await sequelize.authenticate();
    console.log('✅ Connection established.');

    console.log('\n📋 DB Name:', sequelize.getDatabaseName());

    console.log('\n📋 Checking all tables...');
    const [tables] = await sequelize.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public'
      AND table_type = 'BASE TABLE'
      ORDER BY table_name;
    `);

    console.log('Tables:', JSON.stringify(tables, null, 2));

    console.log('\n📋 Checking users table...');
    const [usersTable] = await sequelize.query(`
      SELECT column_name, data_type, udt_name
      FROM information_schema.columns
      WHERE table_name = 'users'
      ORDER BY ordinal_position;
    `);

    console.log('Users columns:', JSON.stringify(usersTable, null, 2));
  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await sequelize.close();
    process.exit(0);
  }
}

checkTables();