import 'package:flutter_test/flutter_test.dart';

import 'package:ohana_mobile/data/services/demo_data.dart';

/// Tests for demo data — the mock dataset that powers Demo Mode.
///
/// These verify that every role has a demo user, that toMap()
/// produces the expected shape, and that demoUserByRole handles
/// unknown roles gracefully.
void main() {
  group('demoUsers', () {
    test('contains all 5 roles', () {
      final roles = demoUsers.map((u) => u.role).toSet();
      expect(roles, containsAll([
        'admin',
        'operator',
        'propietario',
        'cliente',
        'estudiante',
      ]));
      expect(roles.length, 5);
    });

    test('every user has required fields', () {
      for (final u in demoUsers) {
        expect(u.id, greaterThan(0), reason: 'User ${u.role} has invalid id');
        expect(u.name, isNotEmpty, reason: 'User ${u.role} has empty name');
        expect(u.email, contains('@'), reason: 'User ${u.role} has invalid email');
        expect(u.phonePrefix, isNotEmpty, reason: 'User ${u.role} has empty phonePrefix');
        expect(u.phone, isNotEmpty, reason: 'User ${u.role} has empty phone');
        expect(u.cedulaType, isNotEmpty, reason: 'User ${u.role} has empty cedulaType');
        expect(u.cedula, isNotEmpty, reason: 'User ${u.role} has empty cedula');
      }
    });
  });

  group('demoUserByRole', () {
    test('returns correct user for each known role', () {
      final admin = demoUserByRole('admin');
      expect(admin, isNotNull);
      expect(admin!.role, 'admin');

      final operator = demoUserByRole('operator');
      expect(operator, isNotNull);
      expect(operator!.role, 'operator');

      final owner = demoUserByRole('propietario');
      expect(owner, isNotNull);
      expect(owner!.role, 'propietario');

      final client = demoUserByRole('cliente');
      expect(client, isNotNull);
      expect(client!.role, 'cliente');

      final student = demoUserByRole('estudiante');
      expect(student, isNotNull);
      expect(student!.role, 'estudiante');
    });

    test('returns null for unknown role', () {
      expect(demoUserByRole('superadmin'), isNull);
      expect(demoUserByRole(''), isNull);
      expect(demoUserByRole('unknown'), isNull);
    });
  });

  group('DemoUser.toMap', () {
    test('produces map with all expected keys', () {
      final user = demoUserByRole('admin')!;
      final map = user.toMap();

      expect(map.keys, containsAll([
        'id',
        'name',
        'email',
        'role',
        'isVerified',
        'profilePhotoUrl',
        'phonePrefix',
        'phone',
        'cedulaType',
        'cedula',
        'accountStatus',
        'verificationLevel',
        'authProvider',
        'hasPassword',
        'tutorialCompleted',
        'createdAt',
        'updatedAt',
      ]));
    });

    test('map values match user fields', () {
      final user = demoUserByRole('cliente')!;
      final map = user.toMap();

      expect(map['id'], user.id);
      expect(map['name'], user.name);
      expect(map['email'], user.email);
      expect(map['role'], user.role);
      expect(map['isVerified'], user.isVerified);
      expect(map['phone'], user.phone);
      expect(map['cedula'], user.cedula);
      expect(map['accountStatus'], user.accountStatus);
      expect(map['verificationLevel'], user.verificationLevel);
    });

    test('defaults to active accountStatus and verificationLevel 2', () {
      const user = DemoUser(
        id: 99,
        name: 'Test',
        email: 'test@test.com',
        role: 'cliente',
        isVerified: true,
        phonePrefix: '+57',
        phone: '3000000000',
        cedulaType: 'V',
        cedula: '12345678',
      );
      final map = user.toMap();
      expect(map['accountStatus'], 'active');
      expect(map['verificationLevel'], 2);
    });
  });

  group('demoRoles', () {
    test('maps all roles to display names', () {
      expect(demoRoles['admin'], 'Administrador');
      expect(demoRoles['operator'], 'Operador');
      expect(demoRoles['propietario'], 'Propietario');
      expect(demoRoles['cliente'], 'Cliente');
      expect(demoRoles['estudiante'], 'Estudiante');
    });
  });
}
