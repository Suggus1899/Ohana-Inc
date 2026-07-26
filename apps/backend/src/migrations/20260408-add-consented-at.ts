import { QueryInterface, DataTypes } from 'sequelize';

/**
 * Migración: Agregar campo consentedAt a kyc_verifications
 * 
 * Este campo registra la fecha y hora en que el usuario aceptó el consentimiento
 * para el procesamiento de datos biométricos, cumpliendo con GDPR y LOPD.
 * 
 * Requisitos: 31.5
 */

export async function up(queryInterface: QueryInterface): Promise<void> {
  try {
    console.log('\n🚀 ========================================');
    console.log('   AGREGANDO CAMPO consentedAt');
    console.log('========================================\n');

    // Verificar si la columna ya existe
    const tableDescription = await queryInterface.describeTable('kyc_verifications');
    
    if (!tableDescription.consentedAt) {
      console.log('📝 Agregando columna consentedAt...');
      await queryInterface.addColumn('kyc_verifications', 'consentedAt', {
        type: DataTypes.DATE,
        allowNull: true,
        comment: 'Fecha y hora del consentimiento para procesamiento de datos biométricos'
      });
      console.log('✅ Columna consentedAt agregada exitosamente');
    } else {
      console.log('⚠️  La columna consentedAt ya existe');
    }

    console.log('\n🎉 ========================================');
    console.log('   MIGRACIÓN COMPLETADA');
    console.log('========================================');
    console.log('\n✅ Cambios aplicados:');
    console.log('   • Campo consentedAt agregado a kyc_verifications');
    console.log('\n✨ Base de datos actualizada exitosamente\n');

  } catch (error) {
    console.error('\n❌ Error en migración:', error);
    throw error;
  }
}

export async function down(queryInterface: QueryInterface): Promise<void> {
  try {
    console.log('\n⏪ ========================================');
    console.log('   REVIRTIENDO MIGRACIÓN consentedAt');
    console.log('========================================\n');

    // Verificar si la columna existe
    const tableDescription = await queryInterface.describeTable('kyc_verifications');
    
    if (tableDescription.consentedAt) {
      console.log('📝 Eliminando columna consentedAt...');
      await queryInterface.removeColumn('kyc_verifications', 'consentedAt');
      console.log('✅ Columna consentedAt eliminada');
    } else {
      console.log('⚠️  La columna consentedAt no existe');
    }

    console.log('\n🎉 ========================================');
    console.log('   ROLLBACK COMPLETADO');
    console.log('========================================\n');

  } catch (error) {
    console.error('\n❌ Error en rollback:', error);
    throw error;
  }
}
