import dotenv from 'dotenv';
dotenv.config();

import { User } from '../models';
import { initDatabase } from '../config/database';

async function seedPendingVerifications() {
  try {
    await initDatabase();
    console.log('🌱 Preparando usuarios pendientes para verificación...');

    const testUsers = [
      {
        name: 'Carlos Test',
        email: 'carlos.test@habitas.com',
        role: 'propietario',
        cedula: 'TEST-001',
        isVerified: false
      },
      {
        name: 'Maria Test',
        email: 'maria.test@habitas.com',
        role: 'propietario',
        cedula: 'TEST-002',
        isVerified: false
      }
    ];

    for (const userData of testUsers) {
      const [user, created] = await User.findOrCreate({
        where: { email: userData.email },
        defaults: {
          ...userData,
          password: 'password123',
          phonePrefix: '+58',
          phone: '4120000000',
          cedulaType: 'V'
        } as any
      });

      if (!created) {
        await user.update({ isVerified: false });
      }
    }

    console.log('✅ Usuarios de prueba listos para verificar.');
    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  }
}

seedPendingVerifications();
