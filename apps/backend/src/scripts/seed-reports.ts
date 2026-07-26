import { Report, User } from '../models';
import { initDatabase } from '../config/database';
import { ReportCreationAttributes } from '../types';

async function seedReports() {
  await initDatabase();

  let users = await User.findAll({ where: { role: 'cliente' } });

  if (users.length < 2) {
    console.log('Not enough users. Creating test users...');
    
    const count = users.length;
    for (let i = count; i < 3; i++) {
        const email = `cliente${i}@residencias.com`;
        const exists = await User.findOne({ where: { email } });
        if (!exists) {
            const newUser = await User.create({
                name: `Test Cliente ${i}`,
                email,
                password: 'Password123!',
                role: 'cliente',
                phonePrefix: '+58',
                phone: `424000000${i}`,
                cedulaType: 'V',
                cedula: `9900000${i}`,
                isVerified: true
            });
            console.log(`Created user: ${email}`);
        }
    }
    users = await User.findAll({ where: { role: 'cliente' } });
  }

  const mockReports: ReportCreationAttributes[] = [
    {
      reportedBy: users[0].id,
      reportedEntity: 'user',
      entityId: users[1].id,
      reason: 'scam',
      description: 'El usuario intentó pedirme un pago por fuera de la plataforma para asegurar la habitación.',
      status: 'pending'
    },
    {
      reportedBy: users[1].id,
      reportedEntity: 'user',
      entityId: users[0].id,
      reason: 'inappropriate_content',
      description: 'Tiene fotos de perfil que no corresponden a una persona y parecen ofensivas.',
      status: 'pending'
    },
    {
      reportedBy: users[0].id,
      reportedEntity: 'user',
      entityId: users[1].id,
      reason: 'spam',
      description: 'Me envía mensajes constantemente ofreciendo otros servicios no relacionados.',
      status: 'pending'
    }
  ];

  for (const rData of mockReports) {
    await Report.create(rData);
  }

  console.log('✅ User reports seeded successfully.');
  process.exit(0);
}

seedReports();
