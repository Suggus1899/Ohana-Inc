import { QueryInterface, DataTypes } from 'sequelize';

export async function up(queryInterface: QueryInterface): Promise<void> {
  // 1. Add rentalRequestId column to transactions (guard: skip if already exists)
  const desc = await queryInterface.describeTable('transactions').catch(() => ({}));
  if (!(desc as any)['rentalRequestId']) {
    await queryInterface.addColumn('transactions', 'rentalRequestId', {
      type: DataTypes.INTEGER,
      allowNull: true,
      references: {
        model: 'rental_requests',
        key: 'id',
      },
      onUpdate: 'CASCADE',
      onDelete: 'SET NULL',
    });
  }

  // 2. Extend rental_requests status ENUM with new values
  await queryInterface.sequelize.query(`
    ALTER TYPE "enum_rental_requests_status"
    ADD VALUE IF NOT EXISTS 'payment_submitted';
  `);

  await queryInterface.sequelize.query(`
    ALTER TYPE "enum_rental_requests_status"
    ADD VALUE IF NOT EXISTS 'completed';
  `);
}

export async function down(queryInterface: QueryInterface): Promise<void> {
  // Remove rentalRequestId column
  await queryInterface.removeColumn('transactions', 'rentalRequestId');

  // Note: PostgreSQL does not support removing values from an ENUM.
  // The 'payment_submitted' and 'completed' values will remain in the type.
}
