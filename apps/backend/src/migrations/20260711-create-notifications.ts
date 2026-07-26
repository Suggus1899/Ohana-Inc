import { QueryInterface, DataTypes } from 'sequelize';

async function tableExists(queryInterface: QueryInterface, tableName: string): Promise<boolean> {
  try {
    await queryInterface.describeTable(tableName);
    return true;
  } catch {
    return false;
  }
}

export async function up(queryInterface: QueryInterface): Promise<void> {
  if (!(await tableExists(queryInterface, 'notifications'))) {
    await queryInterface.createTable('notifications', {
      id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true
      },
      userId: {
        type: DataTypes.INTEGER,
        allowNull: false,
        references: { model: 'users', key: 'id' }
      },
      type: {
        type: DataTypes.ENUM('transaction', 'message', 'kyc', 'system', 'property', 'review'),
        allowNull: false
      },
      title: {
        type: DataTypes.STRING(255),
        allowNull: false
      },
      message: {
        type: DataTypes.TEXT,
        allowNull: false
      },
      data: {
        type: DataTypes.JSON,
        allowNull: true,
        defaultValue: null
      },
      isRead: {
        type: DataTypes.BOOLEAN,
        allowNull: false,
        defaultValue: false
      },
      createdAt: {
        type: DataTypes.DATE,
        allowNull: false
      },
      updatedAt: {
        type: DataTypes.DATE,
        allowNull: false
      }
    });

    await queryInterface.sequelize.query('CREATE INDEX IF NOT EXISTS "notifications_user_idx" ON "notifications" ("userId")');
    await queryInterface.sequelize.query('CREATE INDEX IF NOT EXISTS "notifications_user_read_idx" ON "notifications" ("userId", "isRead")');
  }
}

export async function down(queryInterface: QueryInterface): Promise<void> {
  if (await tableExists(queryInterface, 'notifications')) {
    await queryInterface.dropTable('notifications');
  }
}
