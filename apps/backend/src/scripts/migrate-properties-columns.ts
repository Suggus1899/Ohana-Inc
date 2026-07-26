/**
 * migrate-properties-columns.ts
 * Agrega las columnas faltantes a la tabla properties para alinearla con el modelo.
 */
import { sequelize } from '../config/database';
import { QueryInterface, DataTypes } from 'sequelize';

async function columnExists(qi: QueryInterface, table: string, col: string): Promise<boolean> {
  try { const d = await qi.describeTable(table); return d[col] !== undefined; } catch { return false; }
}

async function run() {
  await sequelize.authenticate();
  console.log('✅ Conectado\n');
  const qi = sequelize.getQueryInterface();

  const cols: [string, object][] = [
    ['priceType',    { type: DataTypes.ENUM('monthly', 'daily'), defaultValue: 'monthly', allowNull: false }],
    ['city',         { type: DataTypes.STRING(100), allowNull: false, defaultValue: '' }],
    ['state',        { type: DataTypes.STRING(100), allowNull: false, defaultValue: '' }],
    ['zipCode',      { type: DataTypes.STRING(20),  allowNull: false, defaultValue: '' }],
    ['neighborhood', { type: DataTypes.STRING(100), allowNull: true }],
    ['floor',        { type: DataTypes.INTEGER, allowNull: true }],
    ['totalFloors',  { type: DataTypes.INTEGER, allowNull: true }],
    ['isVerified',   { type: DataTypes.BOOLEAN, defaultValue: false, allowNull: false }],
    ['verifiedBy',   { type: DataTypes.INTEGER, allowNull: true }],
    ['verifiedAt',   { type: DataTypes.DATE, allowNull: true }],
    ['mainImage',    { type: DataTypes.STRING(255), allowNull: false, defaultValue: '' }],
    ['videoUrl',     { type: DataTypes.STRING(500), allowNull: true }],
  ];

  for (const [col, def] of cols) {
    if (await columnExists(qi, 'properties', col)) {
      console.log(`   ⏭  properties.${col} ya existe`);
    } else {
      // priceType needs ENUM type created first
      if (col === 'priceType') {
        await sequelize.query(`
          DO $$ BEGIN
            CREATE TYPE "enum_properties_priceType" AS ENUM('monthly','daily');
          EXCEPTION WHEN duplicate_object THEN null; END $$;
        `);
      }
      await qi.addColumn('properties', col, def as any);
      console.log(`   ✅ properties.${col} agregado`);
    }
  }

  // Add missing indexes if not present
  const indexes = await qi.showIndex('properties') as any[];
  const indexNames = indexes.map((i: any) => i.name);

  if (!indexNames.includes('properties_featured_idx')) {
    await qi.addIndex('properties', ['isFeatured'], { name: 'properties_featured_idx' });
    console.log('   ✅ índice properties_featured_idx agregado');
  }
  if (!indexNames.includes('properties_geo_idx')) {
    await qi.addIndex('properties', ['lat', 'lng'], { name: 'properties_geo_idx' });
    console.log('   ✅ índice properties_geo_idx agregado');
  }
  if (!indexNames.includes('properties_location_idx')) {
    await qi.addIndex('properties', ['city', 'state', 'neighborhood'], { name: 'properties_location_idx' });
    console.log('   ✅ índice properties_location_idx agregado');
  }

  console.log('\n🎉 Migración de properties completada\n');
  await sequelize.close();
  process.exit(0);
}

run().catch(async (err) => {
  console.error('\n❌ Error:', err);
  try { await sequelize.close(); } catch {}
  process.exit(1);
});
