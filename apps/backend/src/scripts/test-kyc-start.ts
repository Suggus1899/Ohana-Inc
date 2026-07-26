import { sequelize } from '../config/database';
import KYCVerification from '../models/KYCVerification';

async function testKYCStart() {
  try {
    console.log('🔌 Conectando a la base de datos...');
    await sequelize.authenticate();
    console.log('✅ Conexión establecida\n');

    console.log('🧪 Intentando crear una nueva verificación KYC con currentLevel...\n');

    // Try to create a KYC verification with currentLevel
    // Using a test userId that should exist (userId: 1)
    const verification = await KYCVerification.create({
      userId: 1,
      status: 'not_started',
      verificationLevel: 0,
      currentLevel: 0,
      attempts: 0,
      consentedAt: new Date()
    });

    console.log('✅ Verificación KYC creada exitosamente!');
    console.log('\nDetalles de la verificación:');
    console.log(`  - ID: ${verification.id}`);
    console.log(`  - userId: ${verification.userId}`);
    console.log(`  - status: ${verification.status}`);
    console.log(`  - verificationLevel: ${verification.verificationLevel}`);
    console.log(`  - currentLevel: ${verification.currentLevel}`);
    console.log(`  - attempts: ${verification.attempts}`);
    console.log(`  - consentedAt: ${verification.consentedAt}`);

    // Verify the record was actually saved with currentLevel
    const savedVerification = await KYCVerification.findByPk(verification.id);
    if (savedVerification && savedVerification.currentLevel === 0) {
      console.log('\n✅ ÉXITO: La columna currentLevel se guardó correctamente con valor 0');
    } else {
      console.log('\n❌ ERROR: La columna currentLevel no se guardó correctamente');
      process.exit(1);
    }

    // Clean up test data
    await verification.destroy();
    console.log('\n🧹 Datos de prueba eliminados');

    await sequelize.close();
    console.log('\n✅ Prueba completada exitosamente - Bug 1.1 está CORREGIDO');
  } catch (error: any) {
    console.error('\n❌ ERROR durante la prueba:', error.message);
    if (error.message.includes('column "currentLevel" does not exist')) {
      console.error('\n🐛 BUG 1.1 CONFIRMADO: La columna currentLevel no existe');
    }
    process.exit(1);
  }
}

testKYCStart();
