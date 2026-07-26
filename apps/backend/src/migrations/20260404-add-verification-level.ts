import { QueryInterface, DataTypes } from 'sequelize';

/**
 * Migración: Agregar campo verificationLevel a la tabla Users
 * 
 * Niveles de verificación:
 * - 0: Sin verificar (usuario recién registrado)
 * - 1: Email verificado
 * - 2: Documentos enviados
 * - 3: Documentos aprobados
 * - 4: Biometría aprobada
 * - 5: Completamente verificado (aprobado por operador)
 */

export async function up(queryInterface: QueryInterface): Promise<void> {
  try {
    // 1. Verificar si la columna ya existe
    const tableDescription = await queryInterface.describeTable('users');
    const columnExists = tableDescription.verificationLevel !== undefined;

    if (columnExists) {
      console.log('⚠️  La columna verificationLevel ya existe, saltando creación...');
    } else {
      console.log('📝 Creando columna verificationLevel...');
      
      // 2. Agregar la columna verificationLevel
      await queryInterface.addColumn('users', 'verificationLevel', {
        type: DataTypes.INTEGER,
        allowNull: false,
        defaultValue: 0,
        comment: 'Nivel de verificación del usuario (0-5)',
        validate: {
          min: 0,
          max: 5
        }
      });
    }

    // 3. Verificar y crear índice si no existe
    const indexes = await queryInterface.showIndex('users') as any[];
    const verificationLevelIndexExists = indexes.some((idx: any) => idx.name === 'users_verification_level_idx');

    if (!verificationLevelIndexExists) {
      console.log('📝 Creando índice users_verification_level_idx...');
      await queryInterface.addIndex('users', ['verificationLevel'], {
        name: 'users_verification_level_idx'
      });
    } else {
      console.log('⚠️  Índice users_verification_level_idx ya existe, saltando...');
    }

    // 4. Actualizar usuarios existentes solo si la columna fue recién creada
    if (!columnExists) {
      console.log('📝 Actualizando usuarios existentes...');
      // Usuarios con email verificado obtienen nivel 1, el resto nivel 0
      await queryInterface.sequelize.query(`
        UPDATE "users" 
        SET "verificationLevel" = CASE 
          WHEN "isVerified" = true THEN 1
          ELSE 0
        END
      `);
    }

    console.log('✅ Migración completada: Campo verificationLevel configurado');
  } catch (error) {
    console.error('❌ Error en migración:', error);
    throw error;
  }
}

export async function down(queryInterface: QueryInterface): Promise<void> {
  try {
    // Verificar si el índice existe antes de eliminarlo
    const indexes = await queryInterface.showIndex('users') as any[];
    
    if (indexes.some((idx: any) => idx.name === 'users_verification_level_idx')) {
      await queryInterface.removeIndex('users', 'users_verification_level_idx');
      console.log('✅ Índice users_verification_level_idx eliminado');
    }

    // Verificar si la columna existe antes de eliminarla
    const tableDescription = await queryInterface.describeTable('users');
    if (tableDescription.verificationLevel !== undefined) {
      await queryInterface.removeColumn('users', 'verificationLevel');
      console.log('✅ Columna verificationLevel eliminada');
    }

    console.log('✅ Rollback completado: Campo verificationLevel eliminado');
  } catch (error) {
    console.error('❌ Error en rollback:', error);
    throw error;
  }
}
