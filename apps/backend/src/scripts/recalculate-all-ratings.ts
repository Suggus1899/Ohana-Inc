import { sequelize } from '../config/database';
import { User, Property } from '../models';
import { ReviewService } from '../services/review.service';

async function recalculateAll() {
  try {
    console.log('🔄 Conectando a la base de datos...');
    await sequelize.authenticate();
    console.log('✅ Conexión establecida.');

    const reviewService = new ReviewService();

    // 1. Recalcular para todos los usuarios
    console.log('\n👥 Obteniendo todos los usuarios...');
    const users = await User.findAll({ attributes: ['id', 'name', 'role'] });
    console.log(`Encontrados ${users.length} usuarios.`);

    for (const user of users) {
      console.log(`⚙️ Recalculando caché para usuario [ID: ${user.id}] ${user.name} (${user.role})...`);
      await (reviewService as any)._updateUserRatingCache(user.id);
    }
    console.log('✅ Recálculo de usuarios finalizado.');

    // 2. Recalcular para todas las propiedades
    console.log('\n🏠 Obteniendo todas las propiedades...');
    const properties = await Property.findAll({ attributes: ['id', 'title'] });
    console.log(`Encontradas ${properties.length} propiedades.`);

    for (const property of properties) {
      console.log(`⚙️ Recalculando caché para propiedad [ID: ${property.id}] ${property.title}...`);
      await (reviewService as any)._updatePropertyRatingCache(property.id);
    }
    console.log('✅ Recálculo de propiedades finalizado.');

  } catch (error) {
    console.error('❌ Error durante el recálculo:', error);
  } finally {
    await sequelize.close();
    console.log('\n🔌 Conexión cerrada.');
    process.exit(0);
  }
}

recalculateAll();
