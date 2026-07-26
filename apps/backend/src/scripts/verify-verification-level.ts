import { sequelize } from '../config/database';

async function verifyVerificationLevel() {
  try {
    console.log('🔄 Conectando a la base de datos...');
    await sequelize.authenticate();
    console.log('✅ Conexión establecida\n');

    console.log('📊 Consultando usuarios con verificationLevel...');
    const result = await sequelize.query(`
      SELECT id, name, email, "isVerified", "verificationLevel" 
      FROM users 
      LIMIT 5
    `);
    
    console.log('Usuarios encontrados:');
    console.log(JSON.stringify(result[0], null, 2));

    console.log('\n📊 Estadísticas de verificationLevel...');
    const stats = await sequelize.query(`
      SELECT "verificationLevel", COUNT(*) as count
      FROM users
      GROUP BY "verificationLevel"
      ORDER BY "verificationLevel"
    `);
    
    console.log('Distribución de niveles:');
    console.log(JSON.stringify(stats[0], null, 2));

    console.log('\n✨ Verificación completada');
    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  }
}

verifyVerificationLevel();
