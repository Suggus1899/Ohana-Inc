import { sequelize } from '../config/database';
import { User } from '../models';

/**
 * Script de diagnóstico para verificar usuarios en la base de datos
 */

async function checkUsers() {
  try {
    console.log('🔌 Conectando a la base de datos...');
    await sequelize.authenticate();
    console.log('✅ Conexión establecida\n');

    console.log('📊 Consultando usuarios...\n');
    
    const allUsers = await User.findAll({
      attributes: ['id', 'name', 'email', 'role', 'accountStatus', 'isVerified'],
      order: [['role', 'ASC'], ['id', 'ASC']]
    });

    console.log(`📈 Total de usuarios en la base de datos: ${allUsers.length}\n`);

    // Agrupar por rol
    const byRole = allUsers.reduce((acc: any, user: any) => {
      if (!acc[user.role]) acc[user.role] = [];
      acc[user.role].push(user);
      return acc;
    }, {});

    console.log('👥 Usuarios por rol:');
    console.log('─────────────────────────────────────────────────────');
    
    Object.keys(byRole).forEach(role => {
      console.log(`\n${role.toUpperCase()}: ${byRole[role].length} usuario(s)`);
      byRole[role].forEach((user: any) => {
        console.log(`  • ${user.name} (${user.email}) - Estado: ${user.accountStatus}`);
      });
    });

    console.log('\n─────────────────────────────────────────────────────');
    console.log('\n📊 Resumen:');
    console.log(`  • Admin: ${byRole.admin?.length || 0}`);
    console.log(`  • Operador: ${byRole.operator?.length || 0}`);
    console.log(`  • Propietario: ${byRole.propietario?.length || 0}`);
    console.log(`  • Cliente: ${byRole.cliente?.length || 0}`);
    
    const propietariosYClientes = (byRole.propietario?.length || 0) + (byRole.cliente?.length || 0);
    console.log(`\n✨ Total Propietarios + Clientes: ${propietariosYClientes}`);

    if (propietariosYClientes === 0) {
      console.log('\n⚠️  ADVERTENCIA: No hay usuarios propietarios ni clientes en la base de datos');
      console.log('   Ejecuta: npm run seed:complete');
    }

    await sequelize.close();
    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  }
}

checkUsers();
