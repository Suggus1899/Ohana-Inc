import { Sequelize } from 'sequelize';
import dotenv from 'dotenv';

dotenv.config();

const isTest = process.env.NODE_ENV === 'test';

// Usar PostgreSQL tanto para desarrollo como para tests
export const sequelize = new Sequelize({
  dialect: 'postgres',
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT || '5432'),
  database: isTest 
    ? (process.env.DB_NAME_TEST || 'residencias_db_test')
    : (process.env.DB_NAME || 'residencias_db'),
  username: process.env.DB_USER || 'residencias_user',
  password: process.env.DB_PASSWORD || 'residencias_password_2026',
  logging: (msg: string) => {
    if (msg.startsWith('Executing')) return;
    console.log('[Sequelize]', msg);
  },
  define: {
    timestamps: true,
    underscored: false,
  },
  pool: {
    max: 20,
    min: 5,
    acquire: 30000,
    idle: 15000,
  },
});

export const initDatabase = async (): Promise<void> => {
  try {
    await sequelize.authenticate();
    console.log('✅ Database connection established successfully.');
    
    // No sync in development since we use migrations
    if (process.env.NODE_ENV !== 'development') {
      await sequelize.sync({ alter: false });
      console.log('✅ Database synchronized.');
    } else {
      // Sync only new models (force: false, alter: false = create if not exists)
      await sequelize.sync();
      console.log('✅ Database ready.');
    }
  } catch (error) {
    console.error('❌ Unable to connect to the database:', error);
    throw error;
  }
};