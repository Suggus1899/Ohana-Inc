import { Sequelize } from 'sequelize';
import dotenv from 'dotenv';

dotenv.config();

async function setupTestDatabase() {
  // Connect to postgres database to create test database
  const sequelize = new Sequelize({
    dialect: 'postgres',
    host: process.env.DB_HOST || 'localhost',
    port: parseInt(process.env.DB_PORT || '5432'),
    database: 'postgres', // Connect to default postgres database
    username: process.env.DB_USER || 'residencias_user',
    password: process.env.DB_PASSWORD || 'residencias_password_2026',
    logging: false,
  });

  try {
    await sequelize.authenticate();
    console.log('✅ Connected to PostgreSQL');

    // Drop test database if exists
    await sequelize.query('DROP DATABASE IF EXISTS residencias_db_test;');
    console.log('🗑️  Dropped existing test database (if any)');

    // Create test database
    await sequelize.query('CREATE DATABASE residencias_db_test;');
    console.log('✅ Created test database: residencias_db_test');

    await sequelize.close();
    
    // Now connect to test database and sync models
    const testSequelize = new Sequelize({
      dialect: 'postgres',
      host: process.env.DB_HOST || 'localhost',
      port: parseInt(process.env.DB_PORT || '5432'),
      database: 'residencias_db_test',
      username: process.env.DB_USER || 'residencias_user',
      password: process.env.DB_PASSWORD || 'residencias_password_2026',
      logging: false,
    });

    // Import models to register them
    await import('../models');
    
    // Sync all models
    await testSequelize.sync({ force: true });
    console.log('✅ Synced all models to test database');

    await testSequelize.close();
    console.log('✅ Test database setup complete!');
    process.exit(0);
  } catch (error) {
    console.error('❌ Error setting up test database:', error);
    process.exit(1);
  }
}

setupTestDatabase();
