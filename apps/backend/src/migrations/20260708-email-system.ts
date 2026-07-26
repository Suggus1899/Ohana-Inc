import { QueryInterface, DataTypes } from 'sequelize';

async function tableExists(queryInterface: QueryInterface, tableName: string): Promise<boolean> {
  try {
    await queryInterface.describeTable(tableName);
    return true;
  } catch {
    return false;
  }
}

async function columnExists(queryInterface: QueryInterface, tableName: string, columnName: string): Promise<boolean> {
  try {
    const desc = await queryInterface.describeTable(tableName);
    return desc[columnName] !== undefined;
  } catch {
    return false;
  }
}

export async function up(queryInterface: QueryInterface): Promise<void> {
  // 1. Add email_verified column to users
  if (!(await columnExists(queryInterface, 'users', 'email_verified'))) {
    await queryInterface.addColumn('users', 'email_verified', {
      type: DataTypes.BOOLEAN,
      defaultValue: false,
      allowNull: false
    });
  }

  // 2. Create email_verification_codes table
  if (!(await tableExists(queryInterface, 'email_verification_codes'))) {
    await queryInterface.createTable('email_verification_codes', {
      id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true
      },
      userId: {
        type: DataTypes.INTEGER,
        allowNull: true,
        field: 'userId',
        references: { model: 'users', key: 'id' }
      },
      email: {
        type: DataTypes.STRING(255),
        allowNull: false
      },
      code: {
        type: DataTypes.STRING(10),
        allowNull: false
      },
      type: {
        type: DataTypes.ENUM('email_verification', 'password_reset'),
        allowNull: false
      },
      expiresAt: {
        type: DataTypes.DATE,
        allowNull: false
      },
      usedAt: {
        type: DataTypes.DATE,
        allowNull: true,
        defaultValue: null
      },
      createdAt: {
        type: DataTypes.DATE,
        defaultValue: DataTypes.NOW
      }
    });

    await queryInterface.sequelize.query('CREATE INDEX IF NOT EXISTS "evc_email_type_idx" ON "email_verification_codes" ("email", "type")');
    await queryInterface.sequelize.query('CREATE INDEX IF NOT EXISTS "evc_code_idx" ON "email_verification_codes" ("code")');
    await queryInterface.sequelize.query('CREATE INDEX IF NOT EXISTS "evc_expires_idx" ON "email_verification_codes" ("expiresAt")');
  }

  // 3. Create inbound_emails table
  if (!(await tableExists(queryInterface, 'inbound_emails'))) {
    await queryInterface.createTable('inbound_emails', {
      id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true
      },
      from: {
        type: DataTypes.STRING(255),
        allowNull: false
      },
      to: {
        type: DataTypes.STRING(255),
        allowNull: false
      },
      subject: {
        type: DataTypes.STRING(500),
        allowNull: false,
        defaultValue: '(Sin asunto)'
      },
      body: {
        type: DataTypes.TEXT,
        allowNull: false,
        defaultValue: ''
      },
      rawPayload: {
        type: DataTypes.JSON,
        allowNull: false,
        field: 'rawPayload'
      },
      receivedAt: {
        type: DataTypes.DATE,
        allowNull: false,
        defaultValue: DataTypes.NOW
      },
      createdAt: {
        type: DataTypes.DATE,
        defaultValue: DataTypes.NOW
      }
    });

    await queryInterface.sequelize.query('CREATE INDEX IF NOT EXISTS "inbound_from_idx" ON "inbound_emails" ("from")');
    await queryInterface.sequelize.query('CREATE INDEX IF NOT EXISTS "inbound_received_idx" ON "inbound_emails" ("receivedAt")');
  }
}

export async function down(queryInterface: QueryInterface): Promise<void> {
  for (const table of ['inbound_emails', 'email_verification_codes']) {
    if (await tableExists(queryInterface, table)) {
      await queryInterface.dropTable(table);
    }
  }
  if (await columnExists(queryInterface, 'users', 'email_verified')) {
    await queryInterface.removeColumn('users', 'email_verified');
  }
}
