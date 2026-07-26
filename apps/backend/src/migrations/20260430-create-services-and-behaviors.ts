import { QueryInterface, DataTypes } from 'sequelize';

/**
 * MIGRACIÓN: Tablas faltantes
 * - services: catálogo de servicios de propiedades
 * - property_services: tabla de unión Property <-> Service (Many-to-Many)
 * - user_behaviors: tracking de comportamiento de usuarios anónimos/autenticados
 */

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

async function indexExists(queryInterface: QueryInterface, tableName: string, indexName: string): Promise<boolean> {
  const indexes = await queryInterface.showIndex(tableName) as any[];
  return indexes.some((idx: any) => idx.name === indexName);
}

export default {
  up: async (queryInterface: QueryInterface): Promise<void> => {
    console.log('\n🚀 Migración: services, property_services, user_behaviors\n');

    // ============================================================
    // TABLA: services
    // ============================================================
    console.log('📦 Tabla: services');
    if (!(await tableExists(queryInterface, 'services'))) {
      console.log('📝 Creando tabla services...');
      await queryInterface.createTable('services', {
        id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
        name: { type: DataTypes.STRING(100), allowNull: false },
        description: { type: DataTypes.TEXT, allowNull: true },
        icon: { type: DataTypes.STRING(50), allowNull: false },
        category: {
          type: DataTypes.ENUM('basic', 'premium', 'amenity'),
          defaultValue: 'basic',
          allowNull: false
        },
        isActive: { type: DataTypes.BOOLEAN, defaultValue: true, allowNull: false },
        createdAt: { type: DataTypes.DATE, allowNull: false },
        updatedAt: { type: DataTypes.DATE, allowNull: false }
      });
      await queryInterface.addIndex('services', ['category'], { name: 'services_category_idx' });
      await queryInterface.addIndex('services', ['isActive'], { name: 'services_is_active_idx' });
      console.log('✅ Tabla services creada\n');
    } else {
      console.log('⚠️  Tabla services ya existe\n');
    }

    // ============================================================
    // TABLA: property_services (join table)
    // ============================================================
    console.log('📦 Tabla: property_services');
    if (!(await tableExists(queryInterface, 'property_services'))) {
      console.log('📝 Creando tabla property_services...');
      await queryInterface.createTable('property_services', {
        propertyId: {
          type: DataTypes.INTEGER,
          primaryKey: true,
          allowNull: false,
          references: { model: 'properties', key: 'id' },
          onDelete: 'CASCADE',
          onUpdate: 'CASCADE'
        },
        serviceId: {
          type: DataTypes.INTEGER,
          primaryKey: true,
          allowNull: false,
          references: { model: 'services', key: 'id' },
          onDelete: 'CASCADE',
          onUpdate: 'CASCADE'
        },
        createdAt: { type: DataTypes.DATE, allowNull: false },
        updatedAt: { type: DataTypes.DATE, allowNull: false }
      });
      await queryInterface.addIndex('property_services', ['propertyId'], { name: 'property_services_property_idx' });
      await queryInterface.addIndex('property_services', ['serviceId'], { name: 'property_services_service_idx' });
      console.log('✅ Tabla property_services creada\n');
    } else {
      console.log('⚠️  Tabla property_services ya existe\n');
    }

    // ============================================================
    // TABLA: user_behaviors
    // ============================================================
    console.log('📦 Tabla: user_behaviors');
    if (!(await tableExists(queryInterface, 'user_behaviors'))) {
      console.log('📝 Creando tabla user_behaviors...');
      await queryInterface.createTable('user_behaviors', {
        id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
        userId: {
          type: DataTypes.INTEGER,
          allowNull: true,
          references: { model: 'users', key: 'id' },
          onDelete: 'SET NULL',
          onUpdate: 'CASCADE'
        },
        sessionId: { type: DataTypes.STRING(100), allowNull: false },
        eventType: {
          type: DataTypes.ENUM('search', 'view', 'favorite', 'request', 'filter', 'click', 'geocode_search', 'nearby_search', 'autocomplete', 'reverse_geocode'),
          allowNull: false
        },
        eventData: { type: DataTypes.JSON, defaultValue: {} },
        timestamp: { type: DataTypes.DATE, defaultValue: DataTypes.NOW, allowNull: false }
      });
      await queryInterface.addIndex('user_behaviors', ['sessionId'], { name: 'user_behavior_session_idx' });
      await queryInterface.addIndex('user_behaviors', ['eventType'], { name: 'user_behavior_event_idx' });
      await queryInterface.addIndex('user_behaviors', ['timestamp'], { name: 'user_behavior_timestamp_idx' });
      await queryInterface.addIndex('user_behaviors', ['userId'], { name: 'user_behavior_user_idx' });
      console.log('✅ Tabla user_behaviors creada\n');
    } else {
      console.log('⚠️  Tabla user_behaviors ya existe\n');
    }

    // ── REPORTS table (Report model -> tableName: 'reports') ─────────────────
    console.log('\n📦 Tabla: reports');
    if (!(await tableExists(queryInterface, 'reports'))) {
      console.log('📝 Creando tabla reports...');
      await queryInterface.createTable('reports', {
        id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
        reportedBy: {
          type: DataTypes.INTEGER, allowNull: false,
          references: { model: 'users', key: 'id' },
        },
        reportedEntity: {
          type: DataTypes.ENUM('user', 'property', 'comment', 'message'),
          allowNull: false,
        },
        entityId: { type: DataTypes.INTEGER, allowNull: false },
        reason: {
          type: DataTypes.ENUM('spam', 'inappropriate', 'fraud', 'harassment', 'other'),
          allowNull: false,
        },
        description: { type: DataTypes.TEXT, allowNull: false },
        status: {
          type: DataTypes.ENUM('pending', 'investigating', 'resolved', 'dismissed'),
          defaultValue: 'pending',
        },
        assignedTo: {
          type: DataTypes.INTEGER, allowNull: true,
          references: { model: 'users', key: 'id' },
        },
        resolution: { type: DataTypes.TEXT, allowNull: true },
        resolvedAt: { type: DataTypes.DATE, allowNull: true },
        createdAt: { type: DataTypes.DATE, allowNull: false },
        updatedAt: { type: DataTypes.DATE, allowNull: false },
      });
      await queryInterface.addIndex('reports', ['reportedBy'], { name: 'reports_reported_by_idx' });
      await queryInterface.addIndex('reports', ['status'], { name: 'reports_status_idx' });
      console.log('✅ Tabla reports creada\n');
    } else {
      console.log('⚠️  Tabla reports ya existe\n');
    }

    // ── TICKETS: add missing columns ─────────────────────────────────────────
    console.log('\n📦 Tabla: tickets (columnas adicionales)');
    if (await tableExists(queryInterface, 'tickets')) {
      const ticketCols: [string, object][] = [
        ['description', { type: DataTypes.TEXT, allowNull: true }],
        ['assignedTo', { type: DataTypes.INTEGER, allowNull: true }],
        ['resolvedAt', { type: DataTypes.DATE, allowNull: true }],
      ];
      for (const [col, def] of ticketCols) {
        if (!(await columnExists(queryInterface, 'tickets', col))) {
          console.log(`📝 Agregando columna tickets.${col}...`);
          await queryInterface.addColumn('tickets', col, def as any);
        }
      }
      // category ENUM column
      if (!(await columnExists(queryInterface, 'tickets', 'category'))) {
        console.log('📝 Agregando columna tickets.category...');
        await queryInterface.sequelize.query(`
          DO $$ BEGIN
            CREATE TYPE "enum_tickets_category" AS ENUM('technical','billing','property','account','other');
          EXCEPTION WHEN duplicate_object THEN null; END $$;
        `);
        await queryInterface.addColumn('tickets', 'category', {
          type: DataTypes.ENUM('technical', 'billing', 'property', 'account', 'other'),
          allowNull: true,
          defaultValue: 'other',
        });
      }
      console.log('✅ Columnas de tickets verificadas\n');
    }

    console.log('🎉 Migración completada: services, property_services, user_behaviors, tickets columns\n');
  },

  down: async (queryInterface: QueryInterface): Promise<void> => {
    console.log('\n⏪ Revirtiendo migración...\n');
    for (const table of ['property_services', 'user_behaviors', 'services']) {
      if (await tableExists(queryInterface, table)) {
        console.log(`📝 Eliminando tabla ${table}...`);
        await queryInterface.dropTable(table);
      }
    }
    console.log('✅ Rollback completado\n');
  }
};
