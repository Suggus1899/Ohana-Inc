import { QueryInterface } from 'sequelize';

export default {
  up: async (queryInterface: QueryInterface) => {
    // Check if column already exists
    const [[row]]: any = await queryInterface.sequelize.query(`
      SELECT 1 FROM information_schema.columns
      WHERE table_name = 'properties'
        AND column_name = 'price_rate'
      LIMIT 1;
    `);

    if (row) {
      console.log('✅ Column price_rate already exists, skipping.');
      return;
    }

    await queryInterface.sequelize.query(`
      ALTER TABLE "properties"
      ADD COLUMN "price_rate" VARCHAR(20) NOT NULL DEFAULT 'paralelo';
    `);
    console.log('✅ Column price_rate added to properties table');
  },

  down: async (queryInterface: QueryInterface) => {
    await queryInterface.sequelize.query(`
      ALTER TABLE "properties" DROP COLUMN "price_rate";
    `);
    console.log('✅ Column price_rate removed from properties table');
  },
};
