import { QueryInterface, DataTypes } from 'sequelize';

async function columnExists(qi: QueryInterface, table: string, col: string): Promise<boolean> {
  try { const d = await qi.describeTable(table); return d[col] !== undefined; } catch { return false; }
}

export async function up(queryInterface: QueryInterface): Promise<void> {
  const qi = queryInterface;

  // Agregar nuevos estados al ENUM status
  await qi.sequelize.query(`
    ALTER TYPE "enum_kyc_verifications_status" ADD VALUE IF NOT EXISTS 'level_1_in_progress';
    ALTER TYPE "enum_kyc_verifications_status" ADD VALUE IF NOT EXISTS 'level_1_completed';
    ALTER TYPE "enum_kyc_verifications_status" ADD VALUE IF NOT EXISTS 'level_2_in_progress';
    ALTER TYPE "enum_kyc_verifications_status" ADD VALUE IF NOT EXISTS 'level_2_completed';
    ALTER TYPE "enum_kyc_verifications_status" ADD VALUE IF NOT EXISTS 'level_3_in_progress';
    ALTER TYPE "enum_kyc_verifications_status" ADD VALUE IF NOT EXISTS 'level_3_completed';
  `);

  const columns: [string, any][] = [
    ['currentLevel', { type: DataTypes.INTEGER, defaultValue: 0, allowNull: false }],
    ['level1Data', { type: DataTypes.JSONB, allowNull: true }],
    ['level2Data', { type: DataTypes.JSONB, allowNull: true }],
    ['level3Data', { type: DataTypes.JSONB, allowNull: true }],
    ['level1CompletedAt', { type: DataTypes.DATE, allowNull: true }],
    ['level2CompletedAt', { type: DataTypes.DATE, allowNull: true }],
    ['level3CompletedAt', { type: DataTypes.DATE, allowNull: true }],
  ];

  for (const [col, def] of columns) {
    if (!(await columnExists(qi, 'kyc_verifications', col))) {
      await qi.addColumn('kyc_verifications', col, def);
      console.log(`✓ Column ${col} added to kyc_verifications`);
    }
  }

  const indexes = await qi.showIndex('kyc_verifications') as any[];
  if (!indexes.some((i: any) => i.name === 'kyc_verifications_current_level_idx')) {
    await qi.addIndex('kyc_verifications', ['currentLevel'], {
      name: 'kyc_verifications_current_level_idx'
    });
    console.log('✓ Index kyc_verifications_current_level_idx created');
  }
}

export async function down(queryInterface: QueryInterface): Promise<void> {
  await queryInterface.removeIndex('kyc_verifications', 'kyc_verifications_current_level_idx').catch(() => {});
  await queryInterface.removeColumn('kyc_verifications', 'level3CompletedAt').catch(() => {});
  await queryInterface.removeColumn('kyc_verifications', 'level2CompletedAt').catch(() => {});
  await queryInterface.removeColumn('kyc_verifications', 'level1CompletedAt').catch(() => {});
  await queryInterface.removeColumn('kyc_verifications', 'level3Data').catch(() => {});
  await queryInterface.removeColumn('kyc_verifications', 'level2Data').catch(() => {});
  await queryInterface.removeColumn('kyc_verifications', 'level1Data').catch(() => {});
  await queryInterface.removeColumn('kyc_verifications', 'currentLevel').catch(() => {});

  // Nota: No se pueden eliminar valores de ENUM en PostgreSQL sin recrear el tipo
  // Se recomienda crear una nueva migración si es necesario revertir los valores del ENUM
}
