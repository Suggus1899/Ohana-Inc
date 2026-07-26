import dotenv from 'dotenv';
dotenv.config();

import { initDatabase } from '../config/database';
import { User, Property, RentalRequest, Transaction, PropertyReview, UserReview } from '../models';
import { TransactionStatus, EscrowStatus } from '../models/Transaction';

async function forceLease() {
  try {
    console.log('🔄 Iniciando configuración del entorno de pruebas de reseñas...');
    await initDatabase();

    // 1. Obtener usuarios y propiedad principales
    const tenant = await User.findOne({ where: { email: 'cliente@ohana.com' } });
    const owner = await User.findOne({ where: { email: 'propietario@ohana.com' } });
    const property = await Property.findOne({ where: { title: 'Apartamento Moderno Centro' } });

    if (!tenant || !owner || !property) {
      console.error('❌ Error: No se encontraron los datos semilla iniciales. Corre primero "pnpm run reset".');
      process.exit(1);
    }

    // 2. Limpiar reseñas previas para pruebas limpias
    console.log('🧹 Limpiando reseñas existentes y caches de reputación...');
    await PropertyReview.destroy({ where: {} });
    await UserReview.destroy({ where: {} });

    // Resetear contadores de ratings y forzar estado rented
    await property.update({ avgRating: 0, reviewCount: 0, status: 'rented' as any });
    await tenant.update({ avgRatingAsTenant: 0, reviewCountAsTenant: 0 });
    await owner.update({ avgRatingAsOwner: 0, reviewCountAsOwner: 0 });

    // 3. Forzar RentalRequest a 'completed'
    console.log('📦 Configurando RentalRequest en estado completado...');
    const [rentalRequest] = await RentalRequest.findOrCreate({
      where: {
        tenantId: tenant.id,
        propertyId: property.id,
      },
      defaults: {
        tenantId: tenant.id,
        propertyId: property.id,
        ownerId: owner.id,
        leaseDuration: 6,
        status: 'completed',
        message: 'Estoy interesado en alquilar este apartamento.',
        moveInDate: new Date(),
        phoneNumber: '+57 300-1234570',
      } as any
    });

    if (rentalRequest.status !== 'completed') {
      await rentalRequest.update({ status: 'completed' });
    }

    // 4. Forzar Transaction a 'completed'
    console.log('💳 Configurando Transaction en estado completado...');
    const [transaction] = await Transaction.findOrCreate({
      where: {
        propertyId: property.id,
        clientId: tenant.id,
        ownerId: owner.id,
      },
      defaults: {
        propertyId: property.id,
        clientId: tenant.id,
        ownerId: owner.id,
        amount: 250.00,
        currency: 'USD',
        status: TransactionStatus.COMPLETED,
        escrowStatus: EscrowStatus.RELEASED,
        paymentMethod: 'Transferencia Bancaria',
        paymentReference: 'TRF-TEST-REVIEW',
        paymentDate: new Date(),
        completedAt: new Date(),
        notes: 'Primer mes de alquiler - Test de Reseñas',
      } as any
    });

    if (transaction.status !== TransactionStatus.COMPLETED) {
      await transaction.update({ status: TransactionStatus.COMPLETED });
    }

    console.log('\n======================================================');
    console.log('✅ Entorno de prueba configurado con éxito.');
    console.log(`👤 Inquilino: ${tenant.email} (ID: ${tenant.id})`);
    console.log(`👤 Propietario: ${owner.email} (ID: ${owner.id})`);
    console.log(`🏢 Propiedad: "${property.title}" (ID: ${property.id})`);
    console.log('📂 Solicitud de Alquiler y Transacción marcadas como completadas.');
    console.log('🧼 Reseñas anteriores eliminadas y caches reiniciados.');
    console.log('======================================================\n');
    
    process.exit(0);
  } catch (error) {
    console.error('❌ Error al configurar el entorno:', error);
    process.exit(1);
  }
}

forceLease();
