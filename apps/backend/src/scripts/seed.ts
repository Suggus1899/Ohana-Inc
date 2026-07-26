import dotenv from 'dotenv';
dotenv.config();

import { initDatabase } from '../config/database';
import { User, Property } from '../models';
import { UserRole } from '../types';

const testUsers = [
  {
    name: 'Admin User',
    email: 'admin@residencias.com',
    password: 'Admin123!',
    role: 'admin' as UserRole,
    phonePrefix: '+58',
    phone: '4241234567',
    cedulaType: 'V',
    cedula: '12345678',
    isVerified: true
  },
  {
    name: 'Operador Test',
    email: 'operador@residencias.com',
    password: 'Operador123!',
    role: 'operator' as UserRole,
    phonePrefix: '+58',
    phone: '4241234568',
    cedulaType: 'V',
    cedula: '23456789',
    isVerified: true
  },
  {
    name: 'Juan Propietario',
    email: 'propietario@residencias.com',
    password: 'Propietario123!',
    role: 'propietario' as UserRole,
    phonePrefix: '+58',
    phone: '4241234569',
    cedulaType: 'V',
    cedula: '34567890',
    isVerified: true
  },
  {
    name: 'María Cliente',
    email: 'cliente@residencias.com',
    password: 'Cliente123!',
    role: 'cliente' as UserRole,
    phonePrefix: '+58',
    phone: '4241234570',
    cedulaType: 'V',
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
    location: 'Urbanización Doña Elvira, San Juan de los Morros',
    address: 'Calle Principal, Qta. Los Geranios',
    lat: 9.9135,
    lng: -67.3583,
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
    location: 'Centro, San Juan de los Morros',
    address: 'Av. Bolívar, Torre Cristal, Piso 12',
    lat: 9.9100,
    lng: -67.3555,
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
    location: 'Urbanización Los Naranjos, San Juan de los Morros',
    address: 'Calle Los Girasoles, Qta. La Paz',
    lat: 9.9150,
    lng: -67.3600,
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
    location: 'Centro, San Juan de los Morros',
    address: 'Av. Principal, Cruce con Calle 5, Local 3',
    lat: 9.9095,
    lng: -67.3570,
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
    location: 'Cerca de UNERG, San Juan de los Morros',
    address: 'Av. Universidad, Residencia Estudiantil, Hab. 5',
    lat: 9.9080,
    lng: -67.3540,
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
    location: 'Vía El Sombrero, Estado Guárico',
    address: 'Carretera Nacional, Km 35, Sector Las Mercedes',
    lat: 9.5000,
    lng: -67.2000,
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
    location: 'Vía Calabozo, San Juan de los Morros',
    address: 'Urb. El Samán, Lote 15',
    lat: 9.8800,
    lng: -67.3800,
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
    location: 'Barrio Obrero, San Juan de los Morros',
    address: 'Calle 7, Edificio Boston, Apto 2B',
    lat: 9.9120,
    lng: -67.3620,
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
    location: 'Residencial Las Acacias, San Juan de los Morros',
    address: 'Calle Los Bucares, Casa 7',
    lat: 9.9165,
    lng: -67.3550,
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
    location: 'Urb. Doña Elvira, San Juan de los Morros',
    address: 'Av. Principal, Qta. Los Pinos',
    lat: 9.9145,
    lng: -67.3595,
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
    location: 'Centro Comercial Los Llanos, San Juan de los Morros',
    address: 'Nivel PB, Local 12',
    lat: 9.9110,
    lng: -67.3580,
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
    location: 'Torres del Parque, San Juan de los Morros',
    address: 'Av. Los Próceres, Torre A, Piso 8',
    lat: 9.9130,
    lng: -67.3560,
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
    location: 'Vía San Juan - Valle de la Pascua',
    address: 'Sector El Guárico, Parcela 20',
    lat: 9.4000,
    lng: -67.1000,
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
    location: 'Zona Industrial, San Juan de los Morros',
    address: 'Av. Industrial, Lote 8',
    lat: 9.9200,
    lng: -67.3700,
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
    location: 'Centro, San Juan de los Morros',
    address: 'Calle 3, Casa 45, Habitación 2',
    lat: 9.9105,
    lng: -67.3575,
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
