import { sequelize } from '../config/database';
import '../models'; // Import all models to register associations

async function syncModels() {
  try {
    console.log('🔄 Sincronizando modelos con la base de datos...');
    console.log('⚠️  ADVERTENCIA: Esto eliminará TODOS los datos existentes');
    
    // Force sync - drops all tables and recreates them
    await sequelize.sync({ force: true });
    
    console.log('✅ Todos los modelos han sido sincronizados correctamente');
    console.log('📋 Tablas creadas:');
    console.log('   - users');
    console.log('   - properties');
    console.log('   - favorites');
    console.log('   - rental_requests');
    console.log('   - tickets');
    console.log('   - user_reports');
    console.log('   - tasks');
    console.log('\n💡 Ahora ejecuta: npm run seed');
    
    process.exit(0);
  } catch (error) {
    console.error('❌ Error al sincronizar modelos:', error);
    process.exit(1);
  }
}

syncModels();
