import { QueryInterface } from 'sequelize';
import { sequelize } from '../config/database';

export interface Migration {
  up: (qi: QueryInterface) => Promise<void>;
  down?: (qi: QueryInterface) => Promise<void>;
}

const TRACKING_TABLE = '_migrations';

async function ensureTrackingTable(): Promise<void> {
  await sequelize.query(`
    CREATE TABLE IF NOT EXISTS "${TRACKING_TABLE}" (
      name VARCHAR(255) PRIMARY KEY,
      applied_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
    )
  `);
}

async function getApplied(): Promise<Set<string>> {
  const [rows]: any = await sequelize.query(
    `SELECT name FROM "${TRACKING_TABLE}" ORDER BY name`
  );
  return new Set(rows.map((r: any) => r.name));
}

async function markApplied(name: string): Promise<void> {
  await sequelize.query(
    `INSERT INTO "${TRACKING_TABLE}" (name) VALUES (?) ON CONFLICT DO NOTHING`,
    { replacements: [name] }
  );
}

export async function runAllMigrations(
  migrations: { name: string; migration: Migration }[],
  direction: 'up' | 'down' = 'up'
): Promise<void> {
  const action = direction;

  await sequelize.authenticate();
  console.log('✅ Database connected\n');

  console.log('📦 Sincronizando modelos (creando tablas base)...');
  await sequelize.sync();
  console.log('✅ Tablas base sincronizadas.\n');

  await ensureTrackingTable();
  const applied = await getApplied();

  if (action === 'up') {
    for (const { name, migration } of migrations) {
      if (applied.has(name)) {
        console.log(`⏭️  ${name} — already applied, skipping`);
        continue;
      }
      console.log(`🚀 ${name} — applying...`);
      await migration.up(sequelize.getQueryInterface());
      await markApplied(name);
      console.log(`✅ ${name} — done\n`);
    }
  } else {
    for (const { name, migration } of [...migrations].reverse()) {
      if (!applied.has(name)) {
        console.log(`⏭️  ${name} — not applied, skipping`);
        continue;
      }
      console.log(`⬇️  ${name} — reverting...`);
      await migration.down!(sequelize.getQueryInterface());
      await sequelize.query(
        `DELETE FROM "${TRACKING_TABLE}" WHERE name = ?`,
        { replacements: [name] }
      );
      console.log(`✅ ${name} — reverted\n`);
    }
  }
}
