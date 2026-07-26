/**
 * Migration: Add 'estudiante' value to enum_users_role
 *
 * PostgreSQL does not allow removing ENUM values, but adding one is safe.
 * Run with: npm run migrate:estudiante
 */

import { sequelize } from '../config/database';

async function addEstudianteRole(): Promise<void> {
  try {
    console.log('🔄 Connecting to database...');
    await sequelize.authenticate();
    console.log('✅ Connection established.');

    console.log("🔄 Adding 'estudiante' to enum_users_role...");
    await sequelize.query(
      `ALTER TYPE "enum_users_role" ADD VALUE IF NOT EXISTS 'estudiante';`
    );
    console.log("✅ 'estudiante' added to enum_users_role successfully.");
  } catch (error) {
    console.error('❌ Migration failed:', error);
    process.exit(1);
  } finally {
    await sequelize.close();
    console.log('🔒 Database connection closed.');
    process.exit(0);
  }
}

addEstudianteRole();
