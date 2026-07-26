import dotenv from 'dotenv';
dotenv.config();

import { initDatabase } from '../config/database';
import {
  User, Property, Service, PropertyService,
  Favorite, RentalRequest, Ticket, Report, Task,
  Transaction, TransactionTimeline, ChatConversation, ChatMessage,
  KYCVerification, UserBehavior
} from '../models';
import { TransactionStatus, EscrowStatus } from '../models/Transaction';
import { UserRole } from '../types';

// ─── USUARIOS ────────────────────────────────────────────────────────────────

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
    emailVerified: true,
    tutorialCompleted: true,
    isVerified: true,
    accountStatus: 'active' as const,
    verificationLevel: 3,
    status: 'active' as const,
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
    emailVerified: true,
    tutorialCompleted: true,
    isVerified: true,
    accountStatus: 'active' as const,
    verificationLevel: 2,
    status: 'active' as const,
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
    emailVerified: true,
    tutorialCompleted: true,
    isVerified: true,
    accountStatus: 'active' as const,
    verificationLevel: 2,
    status: 'active' as const,
  },
  {
    name: 'Carlos Propietario',
    email: 'carlos@ohana.com',
    password: 'Carlos123!',
    role: 'propietario' as UserRole,
    phonePrefix: '+57',
    phone: '3001234580',
    cedulaType: 'CC',
    cedula: '67890123',
    emailVerified: true,
    tutorialCompleted: true,
    isVerified: true,
    accountStatus: 'active' as const,
    verificationLevel: 2,
    status: 'active' as const,
  },
  {
    name: 'Maria Cliente',
    email: 'cliente@ohana.com',
    password: 'Cliente123!',
    role: 'cliente' as UserRole,
    phonePrefix: '+57',
    phone: '3001234570',
    cedulaType: 'CC',
    cedula: '45678901',
    emailVerified: true,
    tutorialCompleted: true,
    isVerified: true,
    accountStatus: 'active' as const,
    verificationLevel: 1,
    status: 'active' as const,
  },
  {
    name: 'Pedro Inquilino',
    email: 'inquilino@ohana.com',
    password: 'Inquilino123!',
    role: 'cliente' as UserRole,
    phonePrefix: '+57',
    phone: '3001234571',
    cedulaType: 'CC',
    cedula: '56789012',
    isVerified: false,
    accountStatus: 'pending' as const,
    verificationLevel: 0,
    status: 'active' as const,
  },
];

// ─── SEED ────────────────────────────────────────────────────────────────────

async function seedComplete() {
  try {
    console.log('Iniciando seeding completo de base de datos...\n');
    await initDatabase();

    // 1. USUARIOS
    console.log('[1/10] Creando usuarios...');
    const createdUsers: any[] = [];
    for (const userData of testUsers) {
      const [user, created] = await User.findOrCreate({
        where: { email: userData.email },
        defaults: userData as any,
      });
      createdUsers.push(user);
      console.log(`  ${created ? 'creado' : 'existe'}: ${userData.email} (${userData.role})`);
    }
    const [admin, operator, propietario, cliente, inquilino] = createdUsers;

    // 2. SERVICIOS
    console.log('\n[2/10] Creando catalogo de servicios...');
    const servicesData = [
      { name: 'WiFi', description: 'Internet inalambrico incluido', icon: 'wifi', category: 'basic' as const },
      { name: 'Agua caliente', description: 'Servicio de agua caliente 24h', icon: 'droplets', category: 'basic' as const },
      { name: 'Electricidad', description: 'Servicio electrico incluido', icon: 'zap', category: 'basic' as const },
      { name: 'Aire acondicionado', description: 'Unidades de A/C en habitaciones', icon: 'wind', category: 'premium' as const },
      { name: 'Estacionamiento', description: 'Puesto de estacionamiento privado', icon: 'car', category: 'premium' as const },
      { name: 'Seguridad 24h', description: 'Vigilancia y control de acceso', icon: 'shield', category: 'premium' as const },
      { name: 'Piscina', description: 'Acceso a piscina comunitaria', icon: 'waves', category: 'amenity' as const },
      { name: 'Gimnasio', description: 'Acceso a gimnasio equipado', icon: 'dumbbell', category: 'amenity' as const },
      { name: 'Lavanderia', description: 'Area de lavanderia compartida', icon: 'shirt', category: 'basic' as const },
      { name: 'Comedor', description: 'Comedor comunitario con servicio', icon: 'utensils', category: 'amenity' as const },
    ];
    const createdServices: any[] = [];
    for (const svcData of servicesData) {
      const [svc, created] = await Service.findOrCreate({
        where: { name: svcData.name },
        defaults: svcData as any,
      });
      createdServices.push(svc);
      console.log(`  ${created ? 'creado' : 'existe'}: ${svcData.name}`);
    }
    const svcByName = (name: string) => createdServices.find((s: any) => s.name === name);

    // 3. PROPIEDADES
    console.log('\n[3/10] Creando propiedades...');
    const propertiesData = [
      {
        title: 'Apartamento Moderno Centro',
        description: 'Espacioso apartamento con excelente ubicacion cerca de la universidad.',
        price: 250, priceType: 'monthly' as const,
        bedrooms: 2, bathrooms: 1, area: 65, floor: 5, totalFloors: 10,
        type: 'Apartamento', listingType: 'Alquiler', furnished: true,
        location: 'Centro, Bogotá',
        address: 'Av. Bolivar, Edificio Plaza Central, Piso 5',
        city: 'Bogotá', state: 'Cundinamarca', zipCode: '2301', neighborhood: 'Centro',
        lat: 4.7110, lng: -74.0721,
        features: ['Aire acondicionado', 'Cocina integral', 'WiFi incluido'],
        images: ['https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?w=800'],
        mainImage: 'https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?w=800',
        status: 'approved', isVerified: true, isFeatured: true, views: 45,
      },
      {
        title: 'Habitacion Amueblada Estudiantes',
        description: 'Comoda habitacion totalmente amueblada con bano privado.',
        price: 120, priceType: 'monthly' as const,
        bedrooms: 1, bathrooms: 1, area: 20,
        type: 'Cuarto', listingType: 'Alquiler', furnished: true,
        location: 'Cerca de Universidad Nacional de Colombia, Bogotá',
        address: 'Av. Universidad, Casa Compartida',
        city: 'Bogotá', state: 'Cundinamarca', zipCode: '2301', neighborhood: 'Universitaria',
        lat: 4.6050, lng: -74.0700,
        features: ['Amueblado', 'Bano privado', 'Internet incluido'],
        images: ['https://images.unsplash.com/photo-1522771739844-6a9f6d5f14af?w=800'],
        mainImage: 'https://images.unsplash.com/photo-1522771739844-6a9f6d5f14af?w=800',
        status: 'approved', isVerified: true, isFeatured: false, views: 23,
      },
      {
        title: 'Casa Familiar con Jardin',
        description: 'Hermosa casa de 3 habitaciones con amplio jardin y garaje.',
        price: 450, priceType: 'monthly' as const,
        bedrooms: 3, bathrooms: 2, area: 150,
        type: 'Casa', listingType: 'Alquiler', furnished: false,
        location: 'Urb. Los Samanes, Bogotá',
        address: 'Calle Principal, Casa 25',
        city: 'Bogotá', state: 'Cundinamarca', zipCode: '2301', neighborhood: 'Los Samanes',
        lat: 4.7200, lng: -74.0500,
        features: ['Jardin', 'Garaje', 'Terraza'],
        images: ['https://images.unsplash.com/photo-1568605114967-8130f3a36994?w=800'],
        mainImage: 'https://images.unsplash.com/photo-1568605114967-8130f3a36994?w=800',
        status: 'pending', isVerified: false, isFeatured: false, views: 12,
      },
      {
        title: 'Casa Compartida Premium',
        description: 'Casa compartida con habitaciones individuales, areas comunes y comedor.',
        price: 180, priceType: 'monthly' as const,
        bedrooms: 1, bathrooms: 1, area: 25,
        type: 'Residencia', listingType: 'Alquiler', furnished: true,
        location: 'Zona Universitaria, Bogotá',
        address: 'Calle 5, Casa Compartida El Estudiante',
        city: 'Bogotá', state: 'Cundinamarca', zipCode: '2301', neighborhood: 'Universitaria',
        lat: 4.6010, lng: -74.0650,
        features: ['Comedor', 'Lavanderia', 'WiFi', 'Seguridad 24h'],
        images: ['https://images.unsplash.com/photo-1555854877-bab0e564b8d5?w=800'],
        mainImage: 'https://images.unsplash.com/photo-1555854877-bab0e564b8d5?w=800',
        status: 'approved', isVerified: true, isFeatured: true, views: 67,
      },
    ];
    const createdProperties: any[] = [];
    for (const propData of propertiesData) {
      const [property, created] = await Property.findOrCreate({
        where: { title: propData.title, authorId: propietario.id },
        defaults: {
          ...(propData as any),
          authorId: propietario.id,
          moderatorId: propData.status === 'approved' ? operator.id : null,
          verifiedBy: propData.isVerified ? operator.id : null,
          verifiedAt: propData.isVerified ? new Date() : null,
        },
      });
      createdProperties.push(property);
      console.log(`  ${created ? 'creada' : 'existe'}: ${propData.title}`);
    }
    const [apt, room, house, residence] = createdProperties;

    // 4. PROPERTY_SERVICES
    console.log('\n[4/10] Asociando servicios a propiedades...');
    const psLinks = [
      { propertyId: apt.id, serviceId: svcByName('WiFi')?.id },
      { propertyId: apt.id, serviceId: svcByName('Aire acondicionado')?.id },
      { propertyId: apt.id, serviceId: svcByName('Seguridad 24h')?.id },
      { propertyId: apt.id, serviceId: svcByName('Estacionamiento')?.id },
      { propertyId: apt.id, serviceId: svcByName('Agua caliente')?.id },
      { propertyId: room.id, serviceId: svcByName('WiFi')?.id },
      { propertyId: room.id, serviceId: svcByName('Agua caliente')?.id },
      { propertyId: room.id, serviceId: svcByName('Electricidad')?.id },
      { propertyId: house.id, serviceId: svcByName('Estacionamiento')?.id },
      { propertyId: house.id, serviceId: svcByName('Agua caliente')?.id },
      { propertyId: house.id, serviceId: svcByName('Electricidad')?.id },
      { propertyId: residence.id, serviceId: svcByName('WiFi')?.id },
      { propertyId: residence.id, serviceId: svcByName('Seguridad 24h')?.id },
      { propertyId: residence.id, serviceId: svcByName('Lavanderia')?.id },
      { propertyId: residence.id, serviceId: svcByName('Comedor')?.id },
      { propertyId: residence.id, serviceId: svcByName('Agua caliente')?.id },
    ].filter((l): l is { propertyId: number; serviceId: number } => !!l.propertyId && !!l.serviceId);

    for (const link of psLinks) {
      await PropertyService.findOrCreate({ where: link });
    }
    console.log(`  ${psLinks.length} asociaciones creadas`);

    // 5. FAVORITOS
    console.log('\n[5/10] Creando favoritos...');
    const favLinks = [
      { userId: cliente.id, propertyId: apt.id },
      { userId: cliente.id, propertyId: room.id },
      { userId: inquilino.id, propertyId: apt.id },
      { userId: inquilino.id, propertyId: residence.id },
    ];
    for (const fav of favLinks) {
      await Favorite.findOrCreate({ where: fav });
    }
    console.log(`  ${favLinks.length} favoritos creados`);

    // 6. SOLICITUDES DE RENTA
    // RentRequest -> tabla rental_requests (sin ownerId, sin leaseDuration)
    console.log('\n[6/10] Creando solicitudes de renta...');
    const rentReqsData = [
      {
        tenantId: cliente.id, propertyId: apt.id,
        ownerId: propietario.id, leaseDuration: 6,
        status: 'completed' as const,
        message: 'Estoy interesado en alquilar este apartamento.',
        moveInDate: new Date('2026-06-01'),
        phoneNumber: '+57 300-1234570',
      },
      {
        tenantId: inquilino.id, propertyId: room.id,
        ownerId: propietario.id, leaseDuration: 3,
        status: 'pending' as const,
        message: 'Me gustaria alquilar esta habitacion para el proximo semestre.',
        moveInDate: new Date('2026-05-15'),
        phoneNumber: '+57 300-1234571',
      },
      {
        tenantId: cliente.id, propertyId: residence.id,
        ownerId: propietario.id, leaseDuration: 12,
        status: 'accepted' as const,
        message: 'Necesito una habitacion en la residencia para el ano academico.',
        moveInDate: new Date('2026-05-01'),
        phoneNumber: '+57 300-1234570',
      },
    ];
    const createdRentReqs: any[] = [];
    for (const rr of rentReqsData) {
      const [req, created] = await RentalRequest.findOrCreate({
        where: { tenantId: rr.tenantId, propertyId: rr.propertyId },
        defaults: rr as any,
      });
      createdRentReqs.push(req);
      console.log(`  ${created ? 'creada' : 'existe'}: tenant=${rr.tenantId} -> property=${rr.propertyId} (${rr.status})`);
    }

    // 7. CHAT
    console.log('\n[7/10] Creando conversaciones de chat...');
    const approvedReq = createdRentReqs[2];
    const [conv, convCreated] = await ChatConversation.findOrCreate({
      where: { rentRequestId: approvedReq.id },
      defaults: {
        rentRequestId: approvedReq.id,
        participant1Id: cliente.id,
        participant2Id: propietario.id,
        isActive: true,
      },
    });
    console.log(`  ${convCreated ? 'conversacion creada' : 'existe'}: id=${conv.id}`);
    if (convCreated) {
      const msgs = [
        { conversationId: conv.id, senderId: cliente.id, content: 'Hola, sigue disponible la habitacion?' },
        { conversationId: conv.id, senderId: propietario.id, content: 'Si, esta disponible. Cuando quieres visitarla?' },
        { conversationId: conv.id, senderId: cliente.id, content: 'Perfecto, puedo ir el sabado a las 10am?' },
        { conversationId: conv.id, senderId: propietario.id, content: 'Claro, te espero. La direccion es Calle 5, Casa Compartida El Estudiante.' },
      ];
      for (const msg of msgs) {
        await ChatMessage.create(msg as any);
      }
      await conv.update({ lastMessageAt: new Date() });
      console.log(`  ${msgs.length} mensajes creados`);
    }

    // 8. TRANSACCIONES P2P
    console.log('\n[8/10] Creando transacciones P2P...');
    const txsData = [
      {
        propertyId: apt.id, ownerId: propietario.id, clientId: cliente.id,
        amount: 250.00, currency: 'USD',
        status: TransactionStatus.COMPLETED, escrowStatus: EscrowStatus.RELEASED,
        paymentMethod: 'Transferencia Bancaria', paymentReference: 'TRF-2026-001',
        paymentDate: new Date('2026-04-01'),
        clientConfirmedAt: new Date('2026-04-02'), ownerConfirmedAt: new Date('2026-04-02'),
        completedAt: new Date('2026-04-02'),
        notes: 'Primer mes de alquiler - Apartamento Moderno Centro',
        metadata: { month: 'Abril 2026', type: 'rent' },
      },
      {
        propertyId: residence.id, ownerId: propietario.id, clientId: cliente.id,
        amount: 180.00, currency: 'USD',
        status: TransactionStatus.PAYMENT_SUBMITTED, escrowStatus: EscrowStatus.HOLDING,
        paymentMethod: 'PSE', paymentReference: 'PSE-2026-042',
        paymentDate: new Date('2026-04-30'),
        expiresAt: new Date('2026-05-07'),
        notes: 'Primer mes - Casa Compartida Premium',
        metadata: { month: 'Mayo 2026', type: 'rent' },
      },
    ];
    const createdTxs: any[] = [];
    for (const tx of txsData) {
      const created = await Transaction.create(tx as any);
      createdTxs.push(created);
      console.log(`  transaccion: $${tx.amount} (${tx.status})`);
    }
    await TransactionTimeline.create({
      transactionId: createdTxs[0].id, action: 'created', actor: 'client', actorId: cliente.id,
      previousStatus: null, newStatus: TransactionStatus.PENDING_OWNER_APPROVAL,
      description: 'Transaccion iniciada por el cliente',
    } as any);
    await TransactionTimeline.create({
      transactionId: createdTxs[0].id, action: 'completed', actor: 'owner', actorId: propietario.id,
      previousStatus: TransactionStatus.PAYMENT_CONFIRMED, newStatus: TransactionStatus.COMPLETED,
      description: 'Propietario confirmo recepcion del pago',
    } as any);
    console.log('  2 entradas de timeline creadas');

    // 9. KYC VERIFICATIONS
    console.log('\n[9/10] Creando verificaciones KYC...');
    const kycData = [
      {
        userId: propietario.id, status: 'approved' as const,
        verificationLevel: 2, currentLevel: 2,
        fullName: 'Juan Propietario', documentNumber: '34567890', documentType: 'cedula',
        nationality: 'Colombiana', faceMatchScore: 96.5, livenessScore: 98.2,
        documentValidityScore: 99.0, attempts: 1,
        verifiedAt: new Date('2026-03-15'), expiresAt: new Date('2027-03-15'),
        consentedAt: new Date('2026-03-14'), reviewedBy: operator.id,
        reviewedAt: new Date('2026-03-15'), reviewNotes: 'Documentos validos.',
        level1Data: { phone: '+57 300-1234569', verified: true },
        level2Data: { documentType: 'cedula', documentNumber: '34567890', verified: true },
      },
      {
        userId: cliente.id, status: 'level_1_completed' as const,
        verificationLevel: 1, currentLevel: 1,
        fullName: 'Maria Cliente', documentNumber: '45678901', documentType: 'cedula',
        nationality: 'Colombiana', attempts: 1, consentedAt: new Date('2026-04-10'),
        level1Data: { phone: '+57 300-1234570', verified: true },
      },
      {
        userId: inquilino.id, status: 'not_started' as const,
        verificationLevel: 0, currentLevel: 0, attempts: 0,
      },
    ];
    for (const kyc of kycData) {
      const [, created] = await KYCVerification.findOrCreate({
        where: { userId: kyc.userId },
        defaults: kyc as any,
      });
      console.log(`  ${created ? 'creado' : 'existe'}: userId=${kyc.userId} (${kyc.status})`);
    }

    // 10. TICKETS, REPORTES, TAREAS, BEHAVIORS
    console.log('\n[10/10] Creando tickets, reportes, tareas y behaviors...');

    await Ticket.create({
      userId: cliente.id, subject: 'Problema con el pago de transaccion',
      description: 'No puedo completar el pago. El sistema muestra un error.',
      message: 'No puedo completar el pago. Pueden ayudarme?',
      status: 'open', priority: 'high', category: 'billing',
    } as any);
    await Ticket.create({
      userId: inquilino.id, subject: 'Consulta sobre verificacion de identidad',
      description: 'Cuanto tiempo tarda el proceso de verificacion KYC?',
      message: 'Cuanto tiempo tarda el proceso de verificacion?',
      status: 'in_progress', priority: 'medium', category: 'account',
      assignedTo: operator.id, moderatorId: operator.id,
    } as any);
    console.log('  2 tickets creados');

    await Report.create({
      reportedBy: cliente.id, reportedEntity: 'user', entityId: inquilino.id,
      reason: 'spam', description: 'Este usuario me ha enviado mensajes no solicitados.',
      status: 'pending',
    } as any);
    await Report.create({
      reportedBy: inquilino.id, reportedEntity: 'property', entityId: house.id,
      reason: 'fraud', description: 'Las fotos de la propiedad no corresponden a la realidad.',
      status: 'investigating', assignedTo: operator.id,
    } as any);
    console.log('  2 reportes creados');

    await Task.create({
      title: 'Verificar documentos KYC de Juan Propietario',
      description: 'Revisar y aprobar los documentos de identidad.',
      status: 'completed', priority: 'high', type: 'kyc_review',
      assignedToId: operator.id, assignedById: admin.id,
      completedAt: new Date('2026-03-15'),
    } as any);
    await Task.create({
      title: 'Moderar propiedad: Casa Familiar con Jardin',
      description: 'Revisar y aprobar la publicacion de la casa familiar.',
      status: 'in_progress', priority: 'medium', type: 'property_moderation',
      assignedToId: operator.id, assignedById: admin.id,
    } as any);
    await Task.create({
      title: 'Resolver ticket de pago',
      description: 'Ayudar al cliente con el problema de pago reportado.',
      status: 'pending', priority: 'high', type: 'support',
      assignedToId: operator.id, assignedById: admin.id,
      dueDate: new Date('2026-05-05'),
    } as any);
    console.log('  3 tareas creadas');

    await UserBehavior.create({
      userId: cliente.id, sessionId: 'seed-session-cliente-001',
      eventType: 'search', eventData: { query: 'apartamento centro', filters: { minPrice: 100, maxPrice: 300 } },
      timestamp: new Date(),
    } as any);
    await UserBehavior.create({
      userId: cliente.id, sessionId: 'seed-session-cliente-001',
      eventType: 'view', eventData: { propertyId: apt.id, duration: 45 },
      timestamp: new Date(),
    } as any);
    await UserBehavior.create({
      userId: null, sessionId: 'seed-session-anon-001',
      eventType: 'search', eventData: { query: 'habitacion estudiantes', filters: {} },
      timestamp: new Date(),
    } as any);
    console.log('  3 user behaviors creados');

    // RESUMEN
    console.log('\n Seeding completo exitoso!\n');
    console.log('Resumen:');
    console.log('----------------------------------------------------------');
    console.log(`  Usuarios:              ${createdUsers.length}`);
    console.log(`  Servicios:             ${createdServices.length}`);
    console.log(`  Propiedades:           ${createdProperties.length}`);
    console.log(`  Property-Services:     ${psLinks.length}`);
    console.log(`  Favoritos:             ${favLinks.length}`);
    console.log(`  Solicitudes de renta:  ${rentReqsData.length}`);
    console.log(`  Conversaciones chat:   1`);
    console.log(`  Transacciones P2P:     ${txsData.length}`);
    console.log(`  KYC Verifications:     ${kycData.length}`);
    console.log(`  Tickets:               2`);
    console.log(`  Reportes:              2`);
    console.log(`  Tareas:                3`);
    console.log(`  User Behaviors:        3`);
    console.log('----------------------------------------------------------\n');

    console.log('Credenciales de prueba:');
    console.log('----------------------------------------------------------');
    testUsers.forEach(user => {
      console.log(`\n  ${user.role.toUpperCase()} (KYC nivel ${user.verificationLevel}):`);
      console.log(`    Email:    ${user.email}`);
      console.log(`    Password: ${user.password}`);
      console.log(`    Estado:   ${user.accountStatus}`);
    });
    console.log('\n----------------------------------------------------------\n');

    process.exit(0);
  } catch (error) {
    console.error('Error durante el seeding:', error);
    process.exit(1);
  }
}

seedComplete();
