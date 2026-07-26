import { QueryInterface, DataTypes } from 'sequelize';

/**
 * Migración: Crear tablas del sistema de puntuación y comentarios (reviews)
 * 
 * Tablas creadas:
 * - property_reviews: Reseñas de propiedades por usuarios
 * - user_reviews: Reseñas entre usuarios (cliente ↔ propietario)
 * 
 * Columnas agregadas a tablas existentes:
 * - properties: avg_rating, review_count
 * - users: avg_rating_as_owner, review_count_as_owner, avg_rating_as_tenant, review_count_as_tenant
 */

export async function up(queryInterface: QueryInterface): Promise<void> {
  try {
    console.log('\n🚀 ========================================');
    console.log('   CREANDO TABLAS DE REVIEWS');
    console.log('========================================\n');

    // 1. Crear tabla property_reviews
    let tableExists = false;
    try {
      await queryInterface.describeTable('property_reviews');
      tableExists = true;
      console.log('⚠️  La tabla property_reviews ya existe, saltando creación...');
    } catch (error) {
      console.log('📝 Creando tabla property_reviews...');
    }

    if (!tableExists) {
      await queryInterface.createTable('property_reviews', {
        id: {
          type: DataTypes.INTEGER,
          primaryKey: true,
          autoIncrement: true,
        },
        propertyId: {
          type: DataTypes.INTEGER,
          allowNull: false,
          references: { model: 'properties', key: 'id' },
          onUpdate: 'CASCADE',
          onDelete: 'CASCADE',
        },
        userId: {
          type: DataTypes.INTEGER,
          allowNull: false,
          references: { model: 'users', key: 'id' },
          onUpdate: 'CASCADE',
          onDelete: 'CASCADE',
        },
        rating: {
          type: DataTypes.INTEGER,
          allowNull: false,
        },
        comment: {
          type: DataTypes.TEXT,
          allowNull: true,
        },
        rentRequestId: {
          type: DataTypes.INTEGER,
          allowNull: true,
          references: { model: 'rental_requests', key: 'id' },
          onUpdate: 'CASCADE',
          onDelete: 'SET NULL',
        },
        createdAt: {
          type: DataTypes.DATE,
          allowNull: false,
          defaultValue: DataTypes.NOW,
        },
        updatedAt: {
          type: DataTypes.DATE,
          allowNull: false,
          defaultValue: DataTypes.NOW,
        },
      });

      // Crear índices para property_reviews
      await queryInterface.addIndex('property_reviews', ['propertyId'], { name: 'property_reviews_property_idx' });
      await queryInterface.addIndex('property_reviews', ['userId'], { name: 'property_reviews_user_idx' });
      
      // Crear constraint única compuesta (propiedad + usuario)
      await queryInterface.addConstraint('property_reviews', {
        type: 'unique',
        name: 'property_reviews_unique_user_property',
        fields: ['propertyId', 'userId'],
      });

      // Crear check constraint para rating (1-5)
      await queryInterface.sequelize.query(`
        ALTER TABLE property_reviews 
        ADD CONSTRAINT property_reviews_rating_check 
        CHECK (rating >= 1 AND rating <= 5)
      `);

      console.log('✅ Tabla property_reviews creada con índices y constraints');
    }

    // 2. Crear tabla user_reviews
    tableExists = false;
    try {
      await queryInterface.describeTable('user_reviews');
      tableExists = true;
      console.log('⚠️  La tabla user_reviews ya existe, saltando creación...');
    } catch (error) {
      console.log('📝 Creando tabla user_reviews...');
    }

    if (!tableExists) {
      await queryInterface.createTable('user_reviews', {
        id: {
          type: DataTypes.INTEGER,
          primaryKey: true,
          autoIncrement: true,
        },
        reviewerId: {
          type: DataTypes.INTEGER,
          allowNull: false,
          references: { model: 'users', key: 'id' },
          onUpdate: 'CASCADE',
          onDelete: 'CASCADE',
        },
        reviewedId: {
          type: DataTypes.INTEGER,
          allowNull: false,
          references: { model: 'users', key: 'id' },
          onUpdate: 'CASCADE',
          onDelete: 'CASCADE',
        },
        rating: {
          type: DataTypes.INTEGER,
          allowNull: false,
        },
        comment: {
          type: DataTypes.TEXT,
          allowNull: true,
        },
        transactionId: {
          type: DataTypes.INTEGER,
          allowNull: true,
          references: { model: 'transactions', key: 'id' },
          onUpdate: 'CASCADE',
          onDelete: 'SET NULL',
        },
        createdAt: {
          type: DataTypes.DATE,
          allowNull: false,
          defaultValue: DataTypes.NOW,
        },
        updatedAt: {
          type: DataTypes.DATE,
          allowNull: false,
          defaultValue: DataTypes.NOW,
        },
      });

      // Crear índices para user_reviews
      await queryInterface.addIndex('user_reviews', ['reviewerId'], { name: 'user_reviews_reviewer_idx' });
      await queryInterface.addIndex('user_reviews', ['reviewedId'], { name: 'user_reviews_reviewed_idx' });
      await queryInterface.addIndex('user_reviews', ['transactionId'], { name: 'user_reviews_transaction_idx' });
      
      // Crear constraint única compuesta (reviewer + reviewed)
      await queryInterface.addConstraint('user_reviews', {
        type: 'unique',
        name: 'user_reviews_unique_reviewer_reviewed',
        fields: ['reviewerId', 'reviewedId'],
      });

      // Crear check constraints
      await queryInterface.sequelize.query(`
        ALTER TABLE user_reviews 
        ADD CONSTRAINT user_reviews_rating_check 
        CHECK (rating >= 1 AND rating <= 5)
      `);

      await queryInterface.sequelize.query(`
        ALTER TABLE user_reviews 
        ADD CONSTRAINT user_reviews_no_self_review 
        CHECK ("reviewerId" <> "reviewedId")
      `);

      console.log('✅ Tabla user_reviews creada con índices y constraints');
    }

    // 3. Agregar columnas cache a tabla properties
    console.log('📝 Agregando columnas cache a tabla properties...');

    const propertiesCols: [string, any][] = [
      ['avg_rating', { type: DataTypes.DECIMAL(3, 2), defaultValue: 0 }],
      ['review_count', { type: DataTypes.INTEGER, defaultValue: 0 }],
    ];
    for (const [col, def] of propertiesCols) {
      const desc = await queryInterface.describeTable('properties');
      if (!(desc as any)[col]) {
        await queryInterface.addColumn('properties', col, def);
        console.log(`✅ Columna properties.${col} agregada`);
      }
    }

    // 4. Agregar columnas cache a tabla users
    console.log('📝 Agregando columnas cache a tabla users...');

    const usersCacheCols: [string, any][] = [
      ['avg_rating_as_owner', { type: DataTypes.DECIMAL(3, 2), defaultValue: 0 }],
      ['review_count_as_owner', { type: DataTypes.INTEGER, defaultValue: 0 }],
      ['avg_rating_as_tenant', { type: DataTypes.DECIMAL(3, 2), defaultValue: 0 }],
      ['review_count_as_tenant', { type: DataTypes.INTEGER, defaultValue: 0 }],
    ];
    for (const [col, def] of usersCacheCols) {
      const desc = await queryInterface.describeTable('users');
      if (!(desc as any)[col]) {
        await queryInterface.addColumn('users', col, def);
        console.log(`✅ Columna users.${col} agregada`);
      }
    }

    console.log('\n✅ ========================================');
    console.log('   MIGRACIÓN REVIEWS COMPLETADA');
    console.log('========================================\n');

  } catch (error) {
    console.error('\n❌ Error en la migración de Reviews:', error);
    throw error;
  }
}

export async function down(queryInterface: QueryInterface): Promise<void> {
  try {
    console.log('\n🔄 Revirtiendo migración de Reviews...');

    // Eliminar columnas cache de users
    console.log('📝 Eliminando columnas cache de users...');
    try {
      await queryInterface.removeColumn('users', 'avg_rating_as_tenant');
      await queryInterface.removeColumn('users', 'review_count_as_tenant');
      await queryInterface.removeColumn('users', 'avg_rating_as_owner');
      await queryInterface.removeColumn('users', 'review_count_as_owner');
      console.log('✅ Columnas cache de users eliminadas');
    } catch (error: any) {
      console.log('⚠️  Error eliminando columnas de users:', error.message);
    }

    // Eliminar columnas cache de properties
    console.log('📝 Eliminando columnas cache de properties...');
    try {
      await queryInterface.removeColumn('properties', 'review_count');
      await queryInterface.removeColumn('properties', 'avg_rating');
      console.log('✅ Columnas cache de properties eliminadas');
    } catch (error: any) {
      console.log('⚠️  Error eliminando columnas de properties:', error.message);
    }

    // Eliminar constraints y tablas
    console.log('📝 Eliminando constraints...');
    try {
      await queryInterface.sequelize.query(`
        ALTER TABLE user_reviews 
        DROP CONSTRAINT IF EXISTS user_reviews_no_self_review
      `);
      await queryInterface.sequelize.query(`
        ALTER TABLE user_reviews 
        DROP CONSTRAINT IF EXISTS user_reviews_rating_check
      `);
      await queryInterface.sequelize.query(`
        ALTER TABLE property_reviews 
        DROP CONSTRAINT IF EXISTS property_reviews_rating_check
      `);
      console.log('✅ Constraints eliminadas');
    } catch (error: any) {
      console.log('⚠️  Error eliminando constraints:', error.message);
    }

    // Eliminar tablas
    console.log('📝 Eliminando tablas...');
    await queryInterface.dropTable('user_reviews');
    console.log('✅ Tabla user_reviews eliminada');
    await queryInterface.dropTable('property_reviews');
    console.log('✅ Tabla property_reviews eliminada');

    console.log('✅ Migración de Reviews revertida');
  } catch (error) {
    console.error('❌ Error revirtiendo migración de Reviews:', error);
    throw error;
  }
}