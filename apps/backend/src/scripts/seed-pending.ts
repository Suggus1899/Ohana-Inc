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
        title: 'Apartamento de Lujo en Chapinero',
        description: 'Increíble apartamento con vista a los cerros orientales y acabados de lujo. Ideal para profesionales y estudiantes de postgrado.',
        price: 850,
        bedrooms: 2,
        bathrooms: 2,
        area: 95,
        type: 'Apartamento',
        listingType: 'Alquiler',
        furnished: true,
        location: 'Chapinero, Bogotá',
        address: 'Av. Chapinero, Edificio Chapinero Suite',
        lat: 4.650,
        lng: -74.060,
        features: ['Piscina', 'Seguridad 24/7', 'Gym', 'WIFI'],
        images: ['https://images.unsplash.com/photo-1522708323590-d24dbb6b0267'],
        status: 'pending',
        authorId: owner.id
      },
      {
        title: 'Habitación en Casa Compartida',
        description: 'Habitación individual en casa compartida cerca de la universidad. Incluye todos los servicios.',
        price: 250,
        bedrooms: 1,
        bathrooms: 1,
        area: 12,
        type: 'Residencia',
        listingType: 'Alquiler',
        furnished: true,
        location: 'La Candelaria, Bogotá',
        address: 'Calle Real de la Candelaria',
        lat: 4.598,
        lng: -74.070,
        features: ['Cocina compartida', 'Lavandería', 'Limpieza'],
        images: ['https://images.unsplash.com/photo-1555854817-5b2247a8175f'],
        status: 'pending',
        authorId: owner.id
      },
      {
        title: 'Casa Familiar en Suba',
        description: 'Casa amplia con jardín y zona de BBQ. Excelente ubicación para familias o grupos de estudiantes.',
        price: 1200,
        bedrooms: 4,
        bathrooms: 3,
        area: 250,
        type: 'Casa',
        listingType: 'Alquiler',
        furnished: false,
        location: 'Suba, Bogotá',
        address: 'Calle Los Pinos, Casa 12',
        lat: 4.740,
        lng: -74.090,
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
