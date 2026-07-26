import { Ticket, User } from '../models';
import { initDatabase } from '../config/database';
import { TicketCreationAttributes } from '../types';

async function seedTickets() {
  await initDatabase();

  const users = await User.findAll({ where: { role: 'cliente' } });
  const moderators = await User.findAll({ where: { role: 'operator' } });

  if (users.length === 0) {
    console.log('No clientes found. Run user seed first.');
    process.exit(1);
  }

  const mockTickets: TicketCreationAttributes[] = [
    {
      userId: users[0].id,
      subject: 'Problemas con las fotos',
      message: 'Cuando intento subir las fotos de mi perfil se queda cargando eternamente.',
      status: 'open',
      priority: 'medium'
    },
    {
      userId: users[1]?.id || users[0].id,
      subject: 'Mi cuenta está bloqueada',
      message: 'Recibí un aviso de que mi cuenta fue suspendida pero no entiendo por qué.',
      status: 'open',
      priority: 'high'
    },
    {
      userId: users[2]?.id || users[0].id,
      subject: 'Duda sobre el pago',
      message: '¿Cuáles son los métodos de pago aceptados para la reserva?',
      status: 'in_progress',
      priority: 'low',
      moderatorId: moderators[0]?.id || null
    }
  ];

  for (const tData of mockTickets) {
    await Ticket.create(tData);
  }

  console.log('✅ Tickets seeded successfully.');
  process.exit(0);
}

seedTickets();
