import { QueryInterface, DataTypes } from 'sequelize';

/**
 * Migración: Agregar campo accountStatus a la tabla Users
 * 
 * Estados posibles:
 * - pending: Usuario registrado pero pendiente de verificación
 * - active: Usuario activo y verificado
 * - suspended: Usuario suspendido temporalmente
 * - rejected: Usuario rechazado (no aprobado)
 */

export async function up(queryInterface: QueryInterface): Promise<void> {
  try {
    // 1. Verificar si la columna ya existe
    const tableDescription = await queryInterface.describeTable('users');
    const columnExists = tableDescription.accountStatus !== undefined;

    if (columnExists) {
      console.log('⚠️  La columna accountStatus ya existe, saltando creación...');
    } else {
      console.log('📝 Creando columna accountStatus...');
      
      // 2. Crear el tipo ENUM si no existe
      await queryInterface.sequelize.query(`
        DO $$ BEGIN
          CREATE TYPE "enum_users_accountStatus" AS ENUM('pending', 'active', 'suspended', 'rejected');
        EXCEPTION
          WHEN duplicate_object THEN null;
        END $$;
      `);

      // 3. Agregar la columna accountStatus
      await queryInterface.addColumn('users', 'accountStatus', {
        type: DataTypes.ENUM('pending', 'active', 'suspended', 'rejected'),
        allowNull: false,
        defaultValue: 'pending',
        comment: 'Estado de la cuenta del usuario'
      });
    }

    // 4. Verificar y crear índices si no existen
    const indexes = await queryInterface.showIndex('users') as any[];
    const statusIndexExists = indexes.some((idx: any) => idx.name === 'users_account_status_idx');
    const statusRoleIndexExists = indexes.some((idx: any) => idx.name === 'users_status_role_idx');

    if (!statusIndexExists) {
      console.log('📝 Creando índice users_account_status_idx...');
      await queryInterface.addIndex('users', ['accountStatus'], {
        name: 'users_account_status_idx'
      });
    } else {
      console.log('⚠️  Índice users_account_status_idx ya existe, saltando...');
    }

    if (!statusRoleIndexExists) {
      console.log('📝 Creando índice users_status_role_idx...');
      await queryInterface.addIndex('users', ['accountStatus', 'role'], {
        name: 'users_status_role_idx'
      });
    } else {
      console.log('⚠️  Índice users_status_role_idx ya existe, saltando...');
    }

    // 5. Actualizar usuarios existentes solo si la columna fue recién creada
    if (!columnExists) {
      console.log('📝 Actualizando usuarios existentes...');
      await queryInterface.sequelize.query(`
        UPDATE "users" 
        SET "accountStatus" = CASE 
          WHEN "isVerified" = true THEN 'active'::"enum_users_accountStatus"
          ELSE 'pending'::"enum_users_accountStatus"
        END
      `);
    }

    console.log('✅ Migración completada: Campo accountStatus configurado');
  } catch (error) {
    console.error('❌ Error en migración:', error);
    throw error;
  }
}

export async function down(queryInterface: QueryInterface): Promise<void> {
  try {
    // Verificar si los índices existen antes de eliminarlos
    const indexes = await queryInterface.showIndex('users') as any[];
    
    if (indexes.some((idx: any) => idx.name === 'users_status_role_idx')) {
      await queryInterface.removeIndex('users', 'users_status_role_idx');
      console.log('✅ Índice users_status_role_idx eliminado');
    }
    
    if (indexes.some((idx: any) => idx.name === 'users_account_status_idx')) {
      await queryInterface.removeIndex('users', 'users_account_status_idx');
      console.log('✅ Índice users_account_status_idx eliminado');
    }

    // Verificar si la columna existe antes de eliminarla
    const tableDescription = await queryInterface.describeTable('users');
    if (tableDescription.accountStatus !== undefined) {
      await queryInterface.removeColumn('users', 'accountStatus');
      console.log('✅ Columna accountStatus eliminada');
    }

    // Eliminar el tipo ENUM
    await queryInterface.sequelize.query(`
      DROP TYPE IF EXISTS "enum_users_accountStatus";
    `);
    console.log('✅ Tipo ENUM eliminado');

    console.log('✅ Rollback completado: Campo accountStatus eliminado');
  } catch (error) {
    console.error('❌ Error en rollback:', error);
    throw error;
  }
}