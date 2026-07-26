import dotenv from 'dotenv';
dotenv.config();

import { initDatabase } from '../config/database';
import { User, Property } from '../models';
import { UserRole } from '../types';

const testUsers = [
  {
    name: 'Admin User',
    email: 'admin@ohana.com',
    password: 'Admin123!',
    role: 'admin' as UserRole,
    phonePrefix: '+57',
    phone: '3001234567',
    cedulaType: 'CC',
    cedula: '12345678',
    isVerified: true
  },
  {
    name: 'Operador Test',
    email: 'operador@ohana.com',
    password: 'Operador123!',
    role: 'operator' as UserRole,
    phonePrefix: '+57',
    phone: '3001234568',
    cedulaType: 'CC',
    cedula: '23456789',
    isVerified: true
  },
  {
    name: 'Juan Propietario',
    email: 'propietario@ohana.com',
    password: 'Propietario123!',
    role: 'propietario' as UserRole,
    phonePrefix: '+57',
    phone: '3001234569',
    cedulaType: 'CC',
    cedula: '34567890',
    isVerified: true
  },
  {
    name: 'María Cliente',
    email: 'cliente@ohana.com',
    password: 'Cliente123!',
    role: 'cliente' as UserRole,
    phonePrefix: '+57',
    phone: '3001234570',
    cedulaType: 'CC',
    cedula: '45678901',
    isVerified: true
  }
];

const testProperties = [
  {
    title: 'Casona Colonial Residencial',
    description: 'Hermosa casona colonial restaurada, con amplios jardines, piscina y areas sociales. Ideal para familia numerosa.',
    price: 800,
    bedrooms: 4,
    bathrooms: 3,
    area: 350,
    type: 'Residencia',
    listingType: 'Alquiler',
    furnished: true,
    location: 'Urbanización Doña Elvira, Bogotá',
    address: 'Calle Principal, Qta. Los Geranios',
    lat: 4.7120,
    lng: -74.0700,
    features: ["Piscina", "Jardín", "Estacionamiento", "Seguridad 24h", "Cocina integral", "Aire acondicionado"],
    images: ["https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?w=800"],
    mainImage: "https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?w=800",
    status: 'approved',
    isFeatured: true
  },
  {
    title: 'Apartamento Penthouse Vista Sur',
    description: 'Exclusivo penthouse con terraza panorámica, acabados de lujo y vista a la ciudad.',
    price: 500,
    bedrooms: 3,
    bathrooms: 2,
    area: 120,
    type: 'Apartamento',
    listingType: 'Alquiler',
    furnished: true,
    location: 'Centro, Bogotá',
    address: 'Av. Bolívar, Torre Cristal, Piso 12',
    lat: 4.7100,
    lng: -74.0720,
    features: ["Ascensor", "Estacionamiento", "Seguridad 24h", "Balcón", "Aire acondicionado", "Cocina integral"],
    images: ["https://images.unsplash.com/photo-1512917774080-9991f1c4c750?w=800"],
    mainImage: "https://images.unsplash.com/photo-1512917774080-9991f1c4c750?w=800",
    status: 'approved',
    isFeatured: true
  },
  {
    title: 'Casa Quinta con Piscina',
    description: 'Amplia casa quinta con piscina privada, área de parrillera y jardín exuberante.',
    price: 650,
    bedrooms: 3,
    bathrooms: 2,
    area: 280,
    type: 'Casa',
    listingType: 'Venta',
    furnished: false,
    location: 'Urbanización Los Naranjos, Bogotá',
    address: 'Calle Los Girasoles, Qta. La Paz',
    lat: 4.7150,
    lng: -74.0680,
    features: ["Piscina", "Jardín", "Estacionamiento", "Parrillera", "Cocina integral", "Tanque de agua"],
    images: ["https://images.unsplash.com/photo-1600585154340-be6161a56a0c?w=800"],
    mainImage: "https://images.unsplash.com/photo-1600585154340-be6161a56a0c?w=800",
    status: 'approved',
    isFeatured: true
  },
  {
    title: 'Local Comercial Centro',
    description: 'Local comercial esquinero en pleno centro de la ciudad, alta afluencia de público.',
    price: 400,
    bedrooms: 0,
    bathrooms: 1,
    area: 85,
    type: 'Local',
    listingType: 'Alquiler',
    furnished: false,
    location: 'Centro, Bogotá',
    address: 'Av. Principal, Cruce con Calle 5, Local 3',
    lat: 4.7095,
    lng: -74.0710,
    features: ["Baño privado", "Vitrina", "Aire acondicionado", "Seguridad"],
    images: ["https://images.unsplash.com/photo-1441986300917-64674bd600d8?w=800"],
    mainImage: "https://images.unsplash.com/photo-1441986300917-64674bd600d8?w=800",
    status: 'approved',
    isFeatured: false
  },
  {
    title: 'Habitación Amueblada Estudiantes',
    description: 'Cómoda habitación totalmente amueblada con baño privado, ideal para estudiantes universitarios.',
    price: 120,
    bedrooms: 1,
    bathrooms: 1,
    area: 20,
    type: 'Cuarto',
    listingType: 'Alquiler',
    furnished: true,
    location: 'Cerca de Universidad Nacional de Colombia, Bogotá',
    address: 'Av. Universidad, Casa Compartida, Hab. 5',
    lat: 4.6050,
    lng: -74.0700,
    features: ["Amueblado", "Baño privado", "Internet incluido", "Aire acondicionado"],
    images: ["https://images.unsplash.com/photo-1522771739844-6a9f6d5f14af?w=800"],
    mainImage: "https://images.unsplash.com/photo-1522771739844-6a9f6d5f14af?w=800",
    status: 'approved',
    isFeatured: false
  },
  {
    title: 'Finca Agropecuaria Los Llanos',
    description: 'Extensa finca con tierras fértiles, galpones, y casa principal. Ideal para ganadería o agricultura.',
    price: 250000,
    bedrooms: 3,
    bathrooms: 2,
    area: 5000,
    type: 'Finca',
    listingType: 'Venta',
    furnished: false,
    location: 'Vía Mosquera, Cundinamarca',
    address: 'Carretera Nacional, Km 35, Sector Las Mercedes',
    lat: 4.7050,
    lng: -74.2300,
    features: ["Galpón", "Tanque de agua", "Electricidad", "Cerca perimetral", "Pozo de agua"],
    images: ["https://images.unsplash.com/photo-1500382017468-9049fed747ef?w=800"],
    mainImage: "https://images.unsplash.com/photo-1500382017468-9049fed747ef?w=800",
    status: 'approved',
    isFeatured: true
  },
  {
    title: 'Terreno Urbanizable',
    description: 'Terreno plano con servicios, listo para construcción. Excelente inversión.',
    price: 45000,
    bedrooms: 0,
    bathrooms: 0,
    area: 600,
    type: 'Terreno',
    listingType: 'Venta',
    furnished: false,
    location: 'Vía Facatativá, Bogotá',
    address: 'Urb. El Samán, Lote 15',
    lat: 4.8100,
    lng: -74.3500,
    features: ["Agua", "Luz", "Cerca perimetral", "Vía principal"],
    images: ["https://images.unsplash.com/photo-1500382017468-9049fed747ef?w=800"],
    mainImage: "https://images.unsplash.com/photo-1500382017468-9049fed747ef?w=800",
    status: 'approved',
    isFeatured: false
  },
  {
    title: 'Apartamento Económico',
    description: 'Apartamento sencillo pero acogedor, ideal para pareja o estudiante.',
    price: 180,
    bedrooms: 1,
    bathrooms: 1,
    area: 40,
    type: 'Apartamento',
    listingType: 'Alquiler',
    furnished: false,
    location: 'Barrio Obrero, Bogotá',
    address: 'Calle 7, Edificio Boston, Apto 2B',
    lat: 4.7120,
    lng: -74.0650,
    features: ["Cocina integral", "Agua caliente", "Seguridad"],
    images: ["https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?w=800"],
    mainImage: "https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?w=800",
    status: 'approved',
    isFeatured: false
  },
  {
    title: 'Casa en Venta Residencial',
    description: 'Casa de 2 plantas con acabados modernos, sala de estar, comedor, cocina y jardín.',
    price: 95000,
    bedrooms: 3,
    bathrooms: 3,
    area: 180,
    type: 'Casa',
    listingType: 'Venta',
    furnished: false,
    location: 'Residencial Las Acacias, Bogotá',
    address: 'Calle Los Bucares, Casa 7',
    lat: 4.7165,
    lng: -74.0690,
    features: ["Jardín", "Estacionamiento", "Cocina integral", "Balcón", "Tanque de agua"],
    images: ["https://images.unsplash.com/photo-1568605114967-8130f3a36994?w=800"],
    mainImage: "https://images.unsplash.com/photo-1568605114967-8130f3a36994?w=800",
    status: 'approved',
    isFeatured: false
  },
  {
    title: 'Residencia Familiar Amplia',
    description: 'Gran residencia con múltiples habitaciones, ideal para familia con hijos. Amplio patio y zona de juegos.',
    price: 700,
    bedrooms: 5,
    bathrooms: 3,
    area: 400,
    type: 'Residencia',
    listingType: 'Alquiler',
    furnished: true,
    location: 'Urb. Doña Elvira, Bogotá',
    address: 'Av. Principal, Qta. Los Pinos',
    lat: 4.7145,
    lng: -74.0710,
    features: ["Piscina", "Jardín", "Estacionamiento", "Área de juegos", "Seguridad 24h", "Aire acondicionado", "Cocina integral"],
    images: ["https://images.unsplash.com/photo-1600585154526-990dced4db0d?w=800"],
    mainImage: "https://images.unsplash.com/photo-1600585154526-990dced4db0d?w=800",
    status: 'approved',
    isFeatured: true
  },
  {
    title: 'Local Comercial Galería',
    description: 'Local en centro comercial con excelente visibilidad y tráfico peatonal.',
    price: 350,
    bedrooms: 0,
    bathrooms: 1,
    area: 50,
    type: 'Local',
    listingType: 'Alquiler',
    furnished: false,
    location: 'Centro Comercial Los Llanos, Bogotá',
    address: 'Nivel PB, Local 12',
    lat: 4.7110,
    lng: -74.0680,
    features: ["Aire acondicionado", "Baño privado", "Seguridad 24h", "Estacionamiento"],
    images: ["https://images.unsplash.com/photo-1441984904996-e0b6ba687e04?w=800"],
    mainImage: "https://images.unsplash.com/photo-1441984904996-e0b6ba687e04?w=800",
    status: 'approved',
    isFeatured: false
  },
  {
    title: 'Apartamento Amueblado Lujo',
    description: 'Exclusivo apartamento completamente amueblado con diseño moderno y acabados premium.',
    price: 550,
    bedrooms: 2,
    bathrooms: 2,
    area: 90,
    type: 'Apartamento',
    listingType: 'Alquiler',
    furnished: true,
    location: 'Torres del Parque, Bogotá',
    address: 'Av. Los Próceres, Torre A, Piso 8',
    lat: 4.7130,
    lng: -74.0700,
    features: ["Ascensor", "Estacionamiento", "Seguridad 24h", "Balcón", "Aire acondicionado", "Cocina integral", "Amueblado"],
    images: ["https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?w=800"],
    mainImage: "https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?w=800",
    status: 'approved',
    isFeatured: false
  },
  {
    title: 'Finca Recreacional',
    description: 'Finca de fin de semana con piscina, áreas verdes, casa de invitados y laguna artificial.',
    price: 180000,
    bedrooms: 4,
    bathrooms: 2,
    area: 10000,
    type: 'Finca',
    listingType: 'Venta',
    furnished: true,
    location: 'Vía Bogotá - Villavicencio',
    address: 'Sector El Meta, Parcela 20',
    lat: 4.1400,
    lng: -73.6300,
    features: ["Piscina", "Casa de invitados", "Laguna", "Electricidad", "Pozo de agua", "Cerca perimetral"],
    images: ["https://images.unsplash.com/photo-1500076656116-558758c991c1?w=800"],
    mainImage: "https://images.unsplash.com/photo-1500076656116-558758c991c1?w=800",
    status: 'approved',
    isFeatured: false
  },
  {
    title: 'Terreno Industrial',
    description: 'Gran terreno con zonificación industrial, acceso a vía principal y servicios industriales.',
    price: 120000,
    bedrooms: 0,
    bathrooms: 0,
    area: 5000,
    type: 'Terreno',
    listingType: 'Venta',
    furnished: false,
    location: 'Zona Industrial, Bogotá',
    address: 'Av. Industrial, Lote 8',
    lat: 4.7200,
    lng: -74.0800,
    features: ["Agua industrial", "Electricidad trifásica", "Vía principal", "Cerca perimetral"],
    images: ["https://images.unsplash.com/photo-1500382017468-9049fed747ef?w=800"],
    mainImage: "https://images.unsplash.com/photo-1500382017468-9049fed747ef?w=800",
    status: 'approved',
    isFeatured: false
  },
  {
    title: 'Habitación Cómoda Céntrica',
    description: 'Habitación amplia con closet empotrado, ventana exterior y baño compartido.',
    price: 90,
    bedrooms: 1,
    bathrooms: 0,
    area: 15,
    type: 'Cuarto',
    listingType: 'Alquiler',
    furnished: true,
    location: 'Centro, Bogotá',
    address: 'Calle 3, Casa 45, Habitación 2',
    lat: 4.7105,
    lng: -74.0715,
    features: ["Amueblado", "Internet incluido", "Agua caliente", "Cocina compartida"],
    images: ["https://images.unsplash.com/photo-1595526114035-0d45ed16cfbf?w=800"],
    mainImage: "https://images.unsplash.com/photo-1595526114035-0d45ed16cfbf?w=800",
    status: 'approved',
    isFeatured: false
  }
];

async function seed() {
  try {
    console.log('🌱 Iniciando seeding de base de datos...');
    
    // Initialize database
    await initDatabase();
    
    // Create test users
    for (const userData of testUsers) {
      const existingUser = await User.findOne({ where: { email: userData.email } });
      
      if (existingUser) {
        console.log(`⚠️  Usuario ${userData.email} ya existe, saltando...`);
        continue;
      }
      
      await User.create(userData);
      console.log(`✅ Usuario creado: ${userData.email} (${userData.role})`);
    }

    // Create test properties
    const propietario = await User.findOne({ where: { role: 'propietario' } });
    if (propietario) {
      for (const propData of testProperties) {
        const existingProp = await Property.findOne({ where: { title: propData.title } });
        if (existingProp) {
          console.log(`⚠️  Propiedad ${propData.title} ya existe, actualizando status a 'approved'...`);
          await existingProp.update({ status: 'approved' });
          continue;
        }
        await Property.create({ ...propData as any, authorId: propietario.id });
        console.log(`✅ Propiedad creada: ${propData.title}`);
      }
    }
    
    console.log('\n🎉 Seeding completado exitosamente!\n');
    console.log('📋 Credenciales de prueba:');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    testUsers.forEach(user => {
      console.log(`\n${user.role.toUpperCase()}:`);
      console.log(`  Email:    ${user.email}`);
      console.log(`  Password: ${user.password}`);
    });
    console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
    
    process.exit(0);
  } catch (error) {
    console.error('❌ Error durante el seeding:', error);
    process.exit(1);
  }
}

seed();
