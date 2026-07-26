import { sequelize } from '../config/database';
import { User, Task } from '../models';

async function seedTasks() {
  try {
    await sequelize.authenticate();
    console.log('Database connected.');

    const operator = await User.findOne({ where: { role: 'operator' } });
    const admin = await User.findOne({ where: { role: 'admin' } });

    if (!operator) {
      console.log('No operator found to assign tasks.');
      return;
    }

    const tasks = [
      {
        title: 'Verificar propiedad Apartamento Centro #234',
        description: 'Revisar fotos y dirección oficial del apartamento subido por Juan Pérez.',
        priority: 'high',
        status: 'pending',
        type: 'property_review',
        assignedToId: operator.id,
        assignedById: admin?.id || operator.id,
        dueDate: new Date(Date.now() + 86400000) // Tomorrow
      },
      {
        title: 'Revisar documentos KYC de usuario',
        description: 'Validar cédula de identidad subida por María García para ser Anfitrión.',
        priority: 'medium',
        status: 'pending',
        type: 'kyc_verification',
        assignedToId: operator.id,
        assignedById: admin?.id || operator.id,
        dueDate: new Date(Date.now() + 172800000) // 2 days
      },
      {
        title: 'Responder consulta sobre alquiler #889',
        description: 'El usuario reporta que no puede enviar el mensaje de solicitud.',
        priority: 'urgent',
        status: 'pending',
        type: 'support_ticket',
        assignedToId: operator.id,
        assignedById: admin?.id || operator.id,
        dueDate: new Date()
      },
      {
        title: 'Verificar propiedad Casa Las Palmas',
        description: 'Revisión técnica de la publicación.',
        priority: 'medium',
        status: 'in_progress',
        type: 'property_review',
        assignedToId: operator.id,
        assignedById: admin?.id || operator.id,
        dueDate: new Date(Date.now() - 86400000) // Yesterday
      },
      {
        title: 'Aprobación de publicación #123',
        description: 'Habitación cerca de la ULA.',
        priority: 'low',
        status: 'completed',
        type: 'property_review',
        assignedToId: operator.id,
        assignedById: admin?.id || operator.id,
        completedAt: new Date()
      }
    ];

    await Task.bulkCreate(tasks);
    console.log('Tasks seeded successfully!');

    process.exit(0);
  } catch (error) {
    console.error('Error seeding tasks:', error);
    process.exit(1);
  }
}

seedTasks();
