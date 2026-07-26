import { sequelize } from '../config/database';
import '../models'; // load all associations
import Announcement from '../models/Announcement';

async function run() {
  try {
    await sequelize.authenticate();
    console.log('✅ Conectado a la base de datos');
    await Announcement.sync({ force: false });
    console.log('✅ Tabla "announcements" creada/verificada');
  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  } finally {
    await sequelize.close();
  }
}

run();
