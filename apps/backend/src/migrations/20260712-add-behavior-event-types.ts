import { QueryInterface } from 'sequelize';

const ENUM_NAME = 'enum_user_behaviors_eventType';
const NEW_VALUES = ['geocode_search', 'nearby_search', 'autocomplete', 'reverse_geocode'];

async function enumValueExists(queryInterface: QueryInterface, value: string): Promise<boolean> {
  const [rows]: any = await queryInterface.sequelize.query(`
    SELECT 1 FROM pg_enum
    JOIN pg_type ON pg_enum.enumtypid = pg_type.oid
    WHERE pg_type.typname = '${ENUM_NAME}'
      AND pg_enum.enumlabel = '${value}'
    LIMIT 1;
  `);
  return rows.length > 0;
}

export default {
  up: async (queryInterface: QueryInterface) => {
    for (const value of NEW_VALUES) {
      if (await enumValueExists(queryInterface, value)) {
        console.log(`⏭️  Enum value '${value}' already exists, skipping.`);
        continue;
      }
      await queryInterface.sequelize.query(`
        ALTER TYPE "${ENUM_NAME}" ADD VALUE '${value}';
      `);
      console.log(`✅ Added enum value '${value}' to ${ENUM_NAME}`);
    }
  },

  down: async (_queryInterface: QueryInterface) => {
    console.log('⚠️  Cannot remove enum values. Manual SQL needed if reverting.');
  },
};
