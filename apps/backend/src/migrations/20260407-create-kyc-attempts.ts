import { QueryInterface, DataTypes } from 'sequelize';

/**
 * Migración: Crear tabla kyc_attempts
 * 
 * Esta tabla registra cada intento de verificación y sus errores para auditoría
 * y análisis de problemas. Incluye el paso específico del proceso, resultado,
 * mensajes de error y metadata adicional.
 * 
 * Requisitos: 18.1-18.10
 */

export async function up(queryInterface: QueryInterface): Promise<void> {
  try {
    console.log('\n🚀 ========================================');
    console.log('   CREANDO TABLA kyc_attempts');
    console.log('========================================\n');

    // 1. Verificar si la tabla ya existe
    let tableExists = false;
    try {
      await queryInterface.describeTable('kyc_attempts');
      tableExists = true;
      console.log('⚠️  La tabla kyc_attempts ya existe, saltando creación...');
    } catch (error) {
      console.log('📝 La tabla kyc_attempts no existe, procediendo a crear...');
    }

    if (!tableExists) {
      // 2. Crear ENUM para step
      console.log('📝 Creando tipo ENUM para step...');
      await queryInterface.sequelize.query(`
        DO $$ BEGIN
          CREATE TYPE "enum_kyc_attempts_step" AS ENUM(
            'document_capture',
            'selfie',
            'liveness',
            'ocr',
            'face_match',
            'document_validation',
            'manual_review'
          );
        EXCEPTION
          WHEN duplicate_object THEN null;
        END $$;
      `);

      // 3. Crear la tabla kyc_attempts
      console.log('📝 Creando tabla kyc_attempts...');
      await queryInterface.createTable('kyc_attempts', {
        id: {
          type: DataTypes.INTEGER,
          primaryKey: true,
          autoIncrement: true,
          allowNull: false
        },
        verificationId: {
          type: DataTypes.INTEGER,
          allowNull: false,
          references: {
            model: 'kyc_verifications',
            key: 'id'
          },
          onUpdate: 'CASCADE',
          onDelete: 'CASCADE',
          comment: 'ID de la verificación asociada'
        },
        attemptNumber: {
          type: DataTypes.INTEGER,
          allowNull: false,
          comment: 'Número de intento secuencial'
        },
        step: {
          type: DataTypes.ENUM(
            'document_capture',
            'selfie',
            'liveness',
            'ocr',
            'face_match',
            'document_validation',
            'manual_review'
          ),
          allowNull: false,
          comment: 'Paso del proceso de verificación'
        },
        success: {
          type: DataTypes.BOOLEAN,
          allowNull: false,
          defaultValue: false,
          comment: 'Indica si el intento fue exitoso'
        },
        errorMessage: {
          type: DataTypes.TEXT,
          allowNull: true,
          comment: 'Mensaje de error si el intento falló'
        },
        metadata: {
          type: DataTypes.JSONB,
          allowNull: false,
          defaultValue: {},
          comment: 'Información adicional del intento'
        },
        createdAt: {
          type: DataTypes.DATE,
          allowNull: false,
          defaultValue: DataTypes.NOW,
          comment: 'Fecha y hora del intento'
        }
      });

      console.log('✅ Tabla kyc_attempts creada exitosamente');
    }

    // 4. Crear índices
    console.log('📝 Creando índices...');
    const indexes = await queryInterface.showIndex('kyc_attempts') as any[];

    // Índice en verificationId
    if (!indexes.some((idx: any) => idx.name === 'kyc_attempts_verification_id_idx')) {
      console.log('📝 Creando índice kyc_attempts_verification_id_idx...');
      await queryInterface.addIndex('kyc_attempts', ['verificationId'], {
        name: 'kyc_attempts_verification_id_idx'
      });
    } else {
      console.log('⚠️  Índice kyc_attempts_verification_id_idx ya existe');
    }

    // Índice en step
    if (!indexes.some((idx: any) => idx.name === 'kyc_attempts_step_idx')) {
      console.log('📝 Creando índice kyc_attempts_step_idx...');
      await queryInterface.addIndex('kyc_attempts', ['step'], {
        name: 'kyc_attempts_step_idx'
      });
    } else {
      console.log('⚠️  Índice kyc_attempts_step_idx ya existe');
    }

    // Índice en createdAt
    if (!indexes.some((idx: any) => idx.name === 'kyc_attempts_created_at_idx')) {
      console.log('📝 Creando índice kyc_attempts_created_at_idx...');
      await queryInterface.addIndex('kyc_attempts', ['createdAt'], {
        name: 'kyc_attempts_created_at_idx'
      });
    } else {
      console.log('⚠️  Índice kyc_attempts_created_at_idx ya existe');
    }

    console.log('\n🎉 ========================================');
    console.log('   MIGRACIÓN COMPLETADA');
    console.log('========================================');
    console.log('\n✅ Cambios aplicados:');
    console.log('   • Tabla kyc_attempts creada');
    console.log('   • ENUM step con 7 valores');
    console.log('   • verificationId con FK a kyc_verifications(id) ON DELETE CASCADE');
    console.log('   • Campo success BOOLEAN con default false');
    console.log('   • Campo metadata JSONB para datos adicionales');
    console.log('   • Solo createdAt (sin updatedAt)');
    console.log('   • 3 índices creados');
    console.log('\n✨ Base de datos actualizada exitosamente\n');

  } catch (error) {
    console.error('\n❌ Error en migración:', error);
    throw error;
  }
}

export async function down(queryInterface: QueryInterface): Promise<void> {
  try {
    console.log('\n⏪ ========================================');
    console.log('   REVIRTIENDO MIGRACIÓN kyc_attempts');
    console.log('========================================\n');

    // 1. Verificar si la tabla existe
    let tableExists = false;
    try {
      await queryInterface.describeTable('kyc_attempts');
      tableExists = true;
    } catch (error) {
      console.log('⚠️  La tabla kyc_attempts no existe');
    }

    if (tableExists) {
      // 2. Eliminar índices
      console.log('📝 Eliminando índices...');
      const indexes = await queryInterface.showIndex('kyc_attempts') as any[];

      const indexesToRemove = [
        'kyc_attempts_verification_id_idx',
        'kyc_attempts_step_idx',
        'kyc_attempts_created_at_idx'
      ];

      for (const indexName of indexesToRemove) {
        if (indexes.some((idx: any) => idx.name === indexName)) {
          console.log(`📝 Eliminando índice ${indexName}...`);
          await queryInterface.removeIndex('kyc_attempts', indexName);
        }
      }

      // 3. Eliminar la tabla
      console.log('📝 Eliminando tabla kyc_attempts...');
      await queryInterface.dropTable('kyc_attempts');
      console.log('✅ Tabla kyc_attempts eliminada');

      // 4. Eliminar ENUM
      console.log('📝 Eliminando tipo ENUM...');
      await queryInterface.sequelize.query(`
        DROP TYPE IF EXISTS "enum_kyc_attempts_step";
      `);
      console.log('✅ Tipo ENUM eliminado');
    }

    console.log('\n🎉 ========================================');
    console.log('   ROLLBACK COMPLETADO');
    console.log('========================================\n');

  } catch (error) {
    console.error('\n❌ Error en rollback:', error);
    throw error;
  }
}
