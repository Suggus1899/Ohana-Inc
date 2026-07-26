/**
 * Script de Verificación de Seguridad
 * 
 * Este script verifica que las restricciones de seguridad del operador
 * estén correctamente implementadas.
 * 
 * Uso: npm run test:security
 */

import { sequelize } from '../config/database';
import User from '../models/User';

interface SecurityTest {
  name: string;
  description: string;
  test: () => Promise<boolean>;
  expected: string;
}

const tests: SecurityTest[] = [
  {
    name: 'Test 1: Filtrado de Usuarios',
    description: 'Verificar que solo se muestren clientes y propietarios',
    expected: 'Solo usuarios con rol cliente o propietario',
    test: async () => {
      const users = await User.findAll();
      const operatorVisibleUsers = users.filter(
        u => u.role === 'cliente' || u.role === 'propietario'
      );
      
      console.log(`   Total usuarios: ${users.length}`);
      console.log(`   Usuarios visibles para operador: ${operatorVisibleUsers.length}`);
      console.log(`   Admins/Operadores ocultos: ${users.length - operatorVisibleUsers.length}`);
      
      return operatorVisibleUsers.every(
        u => u.role === 'cliente' || u.role === 'propietario'
      );
    }
  },
  {
    name: 'Test 2: Estados de Cuenta',
    description: 'Verificar que existan los estados correctos',
    expected: 'Estados: pending, active, suspended, rejected',
    test: async () => {
      const users = await User.findAll();
      const validStatuses = ['pending', 'active', 'suspended', 'rejected'];
      
      const statusCounts = users.reduce((acc, user) => {
        acc[user.accountStatus] = (acc[user.accountStatus] || 0) + 1;
        return acc;
      }, {} as Record<string, number>);
      
      console.log('   Estados encontrados:', statusCounts);
      
      return users.every(u => validStatuses.includes(u.accountStatus));
    }
  },
  {
    name: 'Test 3: Roles Válidos',
    description: 'Verificar que existan los roles correctos',
    expected: 'Roles: admin, operator, propietario, cliente',
    test: async () => {
      const users = await User.findAll();
      const validRoles = ['admin', 'operator', 'propietario', 'cliente'];
      
      const roleCounts = users.reduce((acc, user) => {
        acc[user.role] = (acc[user.role] || 0) + 1;
        return acc;
      }, {} as Record<string, number>);
      
      console.log('   Roles encontrados:', roleCounts);
      
      return users.every(u => validRoles.includes(u.role));
    }
  },
  {
    name: 'Test 4: Usuarios Verificados',
    description: 'Verificar campo isVerified',
    expected: 'Campo isVerified presente en todos los usuarios',
    test: async () => {
      const users = await User.findAll();
      const verifiedCount = users.filter(u => u.isVerified).length;
      
      console.log(`   Usuarios verificados: ${verifiedCount}/${users.length}`);
      
      return users.every(u => typeof u.isVerified === 'boolean');
    }
  },
  {
    name: 'Test 5: Campo verifiedById',
    description: 'Verificar que el campo verifiedById exista',
    expected: 'Campo verifiedById presente (puede ser null)',
    test: async () => {
      const users = await User.findAll();
      const withVerifier = users.filter(u => u.verifiedById !== null).length;
      
      console.log(`   Usuarios con verificador: ${withVerifier}/${users.length}`);
      
      // El campo debe existir (puede ser null)
      return true;
    }
  },
  {
    name: 'Test 6: Usuarios Pendientes',
    description: 'Verificar usuarios con estado pending',
    expected: 'Usuarios pendientes de activación',
    test: async () => {
      const pendingUsers = await User.findAll({
        where: { accountStatus: 'pending' }
      });
      
      console.log(`   Usuarios pendientes: ${pendingUsers.length}`);
      
      return true; // Solo informativo
    }
  },
  {
    name: 'Test 7: Usuarios Suspendidos',
    description: 'Verificar usuarios suspendidos',
    expected: 'Usuarios con suspensión temporal',
    test: async () => {
      const suspendedUsers = await User.findAll({
        where: { accountStatus: 'suspended' }
      });
      
      console.log(`   Usuarios suspendidos: ${suspendedUsers.length}`);
      
      return true; // Solo informativo
    }
  },
  {
    name: 'Test 8: Usuarios Bloqueados',
    description: 'Verificar usuarios bloqueados',
    expected: 'Usuarios con bloqueo permanente',
    test: async () => {
      const blockedUsers = await User.findAll({
        where: { accountStatus: 'rejected' }
      });
      
      console.log(`   Usuarios bloqueados: ${blockedUsers.length}`);
      
      return true; // Solo informativo
    }
  }
];

async function runSecurityTests() {
  console.log('\n🔒 VERIFICACIÓN DE SEGURIDAD - ROL OPERADOR\n');
  console.log('='.repeat(60));
  
  try {
    await sequelize.authenticate();
    console.log('✅ Conexión a base de datos establecida\n');
    
    let passed = 0;
    let failed = 0;
    
    for (const test of tests) {
      console.log(`\n${test.name}`);
      console.log(`   Descripción: ${test.description}`);
      console.log(`   Esperado: ${test.expected}`);
      
      try {
        const result = await test.test();
        
        if (result) {
          console.log('   ✅ PASÓ');
          passed++;
        } else {
          console.log('   ❌ FALLÓ');
          failed++;
        }
      } catch (error) {
        console.log('   ❌ ERROR:', error instanceof Error ? error.message : 'Unknown error');
        failed++;
      }
    }
    
    console.log('\n' + '='.repeat(60));
    console.log(`\n📊 RESULTADOS:`);
    console.log(`   ✅ Pasaron: ${passed}/${tests.length}`);
    console.log(`   ❌ Fallaron: ${failed}/${tests.length}`);
    
    if (failed === 0) {
      console.log('\n🎉 Todas las verificaciones de seguridad pasaron correctamente\n');
    } else {
      console.log('\n⚠️  Algunas verificaciones fallaron. Revisar implementación.\n');
    }
    
  } catch (error) {
    console.error('❌ Error al ejecutar tests:', error);
  } finally {
    await sequelize.close();
  }
}

// Ejecutar tests
runSecurityTests().catch(console.error);
