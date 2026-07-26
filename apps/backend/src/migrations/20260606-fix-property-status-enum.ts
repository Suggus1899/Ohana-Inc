import { QueryInterface } from 'sequelize';

export default {
  up: async (queryInterface: QueryInterface) => {
    // Check if 'active' value exists in the enum — if not, migration already applied
    const [[row]]: any = await queryInterface.sequelize.query(`
      SELECT 1 FROM pg_enum
      JOIN pg_type ON pg_enum.enumtypid = pg_type.oid
      WHERE pg_type.typname = 'enum_properties_status'
        AND pg_enum.enumlabel = 'active'
      LIMIT 1;
    `);

    if (!row) {
      console.log('✅ Property status enum already correct, skipping.');
      return;
    }

    // Convert column to text, update 'active' -> 'approved', rebuild enum
    await queryInterface.sequelize.query(`
      ALTER TABLE "properties" ALTER COLUMN "status" TYPE TEXT;
    `);
    await queryInterface.sequelize.query(`
      UPDATE "properties" SET "status" = 'approved' WHERE "status" = 'active';
    `);
    await queryInterface.sequelize.query(`
      DROP TYPE "enum_properties_status" CASCADE;
    `);
    await queryInterface.sequelize.query(`
      CREATE TYPE "enum_properties_status" AS ENUM ('pending', 'approved', 'rejected', 'rented', 'sold');
    `);
    await queryInterface.sequelize.query(`
      ALTER TABLE "properties" ALTER COLUMN "status" TYPE "enum_properties_status" USING "status"::"enum_properties_status";
    `);
    await queryInterface.sequelize.query(`
      ALTER TABLE "properties" ALTER COLUMN "status" SET DEFAULT 'pending';
    `);
    console.log('✅ Property status enum fixed: active -> approved');
  },

  down: async (queryInterface: QueryInterface) => {
    await queryInterface.sequelize.query(`
      ALTER TABLE "properties" ALTER COLUMN "status" TYPE TEXT;
    `);
    await queryInterface.sequelize.query(`
      UPDATE "properties" SET "status" = 'active' WHERE "status" = 'approved';
    `);
    await queryInterface.sequelize.query(`
      DROP TYPE IF EXISTS "enum_properties_status" CASCADE;
    `);
    await queryInterface.sequelize.query(`
      CREATE TYPE "enum_properties_status" AS ENUM ('pending', 'active', 'rejected', 'rented', 'sold');
    `);
    await queryInterface.sequelize.query(`
      ALTER TABLE "properties" ALTER COLUMN "status" TYPE "enum_properties_status" USING "status"::"enum_properties_status";
    `);
  },
};
