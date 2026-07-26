/**
 * add-payment-info-to-users.ts  (v2)
 *
 * Migración idempotente:
 *  - Agrega 7 campos bancarios a la tabla `users`
 *  - Elimina campos obsoletos (zelleEmail, binancePayId) si existen
 *
 * Uso: npm run migrate:payment-info-v2
 */

import { sequelize } from '../config/database';
import { QueryInterface, DataTypes } from 'sequelize';

async function describeTableSafe(qi: QueryInterface, table: string) {
  try {
    return await qi.describeTable(table);
  } catch {
    return {};
  }
}

async function run() {
  await sequelize.authenticate();
  console.log('✅ Conectado a PostgreSQL\n');

  const qi = sequelize.getQueryInterface();
  const desc = await describeTableSafe(qi, 'users');

  // --- Agregar campos nuevos (idempotente) ---

  const fieldsToAdd: [string, object][] = [
    ['bankName',          { type: DataTypes.STRING, allowNull: true, defaultValue: null }],
    ['bankAccountNumber', { type: DataTypes.STRING, allowNull: true, defaultValue: null }],
    ['bankAccountHolder', { type: DataTypes.STRING, allowNull: true, defaultValue: null }],
    ['bankAccountType',   { type: DataTypes.STRING, allowNull: true, defaultValue: null }],
    ['bankPhone',         { type: DataTypes.STRING, allowNull: true, defaultValue: null }],
    ['bankPhoneId',       { type: DataTypes.STRING, allowNull: true, defaultValue: null }],
    ['bankPhoneName',     { type: DataTypes.STRING, allowNull: true, defaultValue: null }],
  ];

  console.log('🔧 Agregando campos de pago...\n');

  for (const [col, def] of fieldsToAdd) {
    if (desc[col] !== undefined) {
      console.log(`   ⏭  users.${col} ya existe`);
    } else {
      await qi.addColumn('users', col, def as any);
      console.log(`   ✅ users.${col} agregado`);
    }
  }

  // --- Eliminar campos obsoletos (idempotente) ---

  const fieldsToRemove = ['zelleEmail', 'binancePayId'];

  console.log('\n🗑️  Eliminando campos obsoletos...\n');

  for (const col of fieldsToRemove) {
    if (desc[col] !== undefined) {
      await qi.removeColumn('users', col);
      console.log(`   ✅ users.${col} eliminado`);
    } else {
      console.log(`   ⏭  users.${col} no existe, nada que eliminar`);
    }
  }

  console.log('\n🎉 Migración v2 completada — campos de pago listos\n');

  await sequelize.close();
  process.exit(0);
}

run().catch(async (err) => {
  console.error('\n❌ Error en migración:', err);
  try { await sequelize.close(); } catch {}
  process.exit(1);
});
