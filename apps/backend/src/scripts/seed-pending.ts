import dotenv from 'dotenv';
dotenv.config();

import { Property, User } from '../models';
import { initDatabase } from '../config/database';

async function seedPendingProperties() {
  try {
    await initDatabase();
    console.log('🌱 Creando propiedades pendientes de prueba...');

    const owner = await User.findOne({ where: { role: 'propietario' } });
    if (!owner) {
      console.error('❌ No se encontró un usuario propietario. Por favor corre npm run seed primero.');
      process.exit(1);
    }

    const pendingProperties = [
      {
        title: 'Apartamento de Lujo en Altamira',
        description: 'Increíble apartamento con vista al Ávila y acabados de lujo. Ideal para estudiantes de postgrado.',
        price: 850,
        bedrooms: 2,
        bathrooms: 2,
        area: 95,
        type: 'Apartamento',
        listingType: 'Alquiler',
        furnished: true,
        location: 'Altamira, Caracas',
        address: 'Av. San Juan Bosco, Edf. Altamira Suite',
        lat: 10.495,
        lng: -66.850,
        features: ['Piscina', 'Seguridad 24/7', 'Gym', 'WIFI'],
        images: ['https://images.unsplash.com/photo-1522708323590-d24dbb6b0267'],
        status: 'pending',
        authorId: owner.id
      },
      {
        title: 'Habitación en Residencia Estudiantil',
        description: 'Habitación individual en casa compartida cerca de la universidad. Incluye todos los servicios.',
        price: 250,
        bedrooms: 1,
        bathrooms: 1,
        area: 12,
        type: 'Residencia',
        listingType: 'Alquiler',
        furnished: true,
        location: 'La Candelaria, Caracas',
        address: 'Calle Real de la Candelaria',
        lat: 10.505,
        lng: -66.900,
        features: ['Cocina compartida', 'Lavandería', 'Limpieza'],
        images: ['https://images.unsplash.com/photo-1555854817-5b2247a8175f'],
        status: 'pending',
        authorId: owner.id
      },
      {
        title: 'Casa Familiar en Santa Fé',
        description: 'Casa amplia con jardín y parrillera. Excelente ubicación para familias o grupos de estudiantes.',
        price: 1200,
        bedrooms: 4,
        bathrooms: 3,
        area: 250,
        type: 'Casa',
        listingType: 'Alquiler',
        furnished: false,
        location: 'Santa Fé, Caracas',
        address: 'Calle Los Pinos, Casa 12',
        lat: 10.460,
        lng: -66.865,
        features: ['Jardín', 'Parrillera', 'Tanque de agua'],
        images: ['https://images.unsplash.com/photo-1580587771525-78b9dba3b914'],
        status: 'pending',
        authorId: owner.id
      }
    ];

    await Property.bulkCreate(pendingProperties as any);
    console.log('✅ 3 propiedades pendientes creadas exitosamente.');
    process.exit(0);
  } catch (error) {
    console.error('❌ Error creating pending properties:', error);
    process.exit(1);
  }
}

seedPendingProperties();
