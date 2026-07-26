import * as fc from 'fast-check';
import request from 'supertest';
import app from '../../src/app';
import { User } from '../../src/models';
import { sequelize } from '../../src/config/database';
import { generateToken } from '../../src/services/jwt.service';
import { UserRole } from '../../src/types';

/**
 * **Feature: auth-user-roles, Property 12: Admin role update persistence**
 * *For any* role update performed by an admin user, the change should be 
 * persisted in the database and reflected in subsequent queries.
 * **Validates: Requirements 6.1**
 */
describe('Property 12: Admin role update persistence', () => {
  let adminToken: string;
  let adminUser: any;

  beforeAll(async () => {
    await sequelize.sync({ force: true });
  });



  beforeEach(async () => {
    await User.destroy({ where: {} });
    
    // Create admin user
    adminUser = await User.create({
      name: 'Admin User',
      email: 'admin@test.com',
      password: 'adminPassword123',
      phonePrefix: '+58',
      phone: '1234567890',
      cedulaType: 'V',
      cedula: '12345678',
      role: 'admin',
      isVerified: true
    });

    adminToken = generateToken({
      userId: adminUser.id,
      email: adminUser.email,
      role: adminUser.role
    });
  });

  // Generator for valid roles
  const roleArbitrary = fc.constantFrom<UserRole>('admin', 'operator', 'propietario', 'cliente');

  it('should persist role changes made by admin', async () => {
    // Create a target user
    const targetUser = await User.create({
      name: 'Target User',
      email: 'target@test.com',
      password: 'password123',
      phonePrefix: '+58',
      phone: '0987654321',
      cedulaType: 'V',
      cedula: '87654321',
      role: 'cliente',
      isVerified: false
    });

    await fc.assert(
      fc.asyncProperty(roleArbitrary, async (newRole) => {
        // Admin updates user role
        const updateResponse = await request(app)
          .patch(`/api/users/${targetUser.id}/role`)
          .set('Authorization', `Bearer ${adminToken}`)
          .send({ role: newRole });

        // Property: update should succeed
        expect(updateResponse.status).toBe(200);
        expect(updateResponse.body.success).toBe(true);
        expect(updateResponse.body.data.user.role).toBe(newRole);

        // Property: change should be persisted in database
        const dbUser = await User.findByPk(targetUser.id);
        expect(dbUser?.role).toBe(newRole);

        // Property: subsequent queries should reflect the change
        const getResponse = await request(app)
          .get(`/api/users/${targetUser.id}`)
          .set('Authorization', `Bearer ${adminToken}`);

        expect(getResponse.status).toBe(200);
        expect(getResponse.body.data.user.role).toBe(newRole);
      }),
      { numRuns: 20 }
    );
  });

  it('should update role for multiple users correctly', async () => {
    const users = await Promise.all([
      User.create({
        name: 'User 1',
        email: 'user1@test.com',
        password: 'password123',
        phonePrefix: '+58',
        phone: '1111111111',
        cedulaType: 'V',
        cedula: '11111111',
        role: 'cliente',
        isVerified: false
      }),
      User.create({
        name: 'User 2',
        email: 'user2@test.com',
        password: 'password123',
        phonePrefix: '+58',
        phone: '2222222222',
        cedulaType: 'V',
        cedula: '22222222',
        role: 'cliente',
        isVerified: false
      })
    ]);

    // Update first user to propietario
    await request(app)
      .patch(`/api/users/${users[0].id}/role`)
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ role: 'propietario' });

    // Update second user to admin
    await request(app)
      .patch(`/api/users/${users[1].id}/role`)
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ role: 'admin' });

    // Verify both changes persisted correctly
    const user1 = await User.findByPk(users[0].id);
    const user2 = await User.findByPk(users[1].id);

    expect(user1?.role).toBe('propietario');
    expect(user2?.role).toBe('admin');
  });
});

/**
 * **Feature: auth-user-roles, Property 13: Non-admin role update rejection**
 * *For any* role update attempt by a non-admin user, the system should 
 * reject the request with a 403 Forbidden error.
 * **Validates: Requirements 6.2**
 */
describe('Property 13: Non-admin role update rejection', () => {
  beforeAll(async () => {
    await sequelize.sync({ force: true });
  });

  afterAll(async () => {
    await sequelize.close();
  });

  beforeEach(async () => {
    await User.destroy({ where: {} });
  });

  let userCounter = 0;

  // Generator for non-admin roles
  const nonAdminRoleArbitrary = fc.constantFrom<UserRole>('operator', 'propietario', 'cliente');

  it('should reject role updates from non-admin users', async () => {
    await fc.assert(
      fc.asyncProperty(nonAdminRoleArbitrary, async (userRole) => {
        const id1 = ++userCounter;
        // Create non-admin user
        const nonAdminUser = await User.create({
          name: 'Non Admin',
          email: `nonadmin_${userRole}_${id1}_${Math.random().toString(36).substring(2)}@test.com`,
          password: 'password123',
          phonePrefix: '+58',
          phone: `123456${String(id1).padStart(4, '0')}`,
          cedulaType: 'V',
          cedula: `1234${String(id1).padStart(4, '0')}`,
          role: userRole,
          isVerified: false
        });

        const nonAdminToken = generateToken({
          userId: nonAdminUser.id,
          email: nonAdminUser.email,
          role: nonAdminUser.role
        });

        const id2 = ++userCounter;
        // Create target user
        const targetUser = await User.create({
          name: 'Target',
          email: `target_${id2}_${Math.random().toString(36).substring(2)}@test.com`,
          password: 'password123',
          phonePrefix: '+58',
          phone: `098765${String(id2).padStart(4, '0')}`,
          cedulaType: 'V',
          cedula: `8765${String(id2).padStart(4, '0')}`,
          role: 'cliente',
          isVerified: false
        });

        // Attempt to update role
        const response = await request(app)
          .patch(`/api/users/${targetUser.id}/role`)
          .set('Authorization', `Bearer ${nonAdminToken}`)
          .send({ role: 'admin' });

        // Property: non-admin should be rejected with 403
        expect(response.status).toBe(403);
        expect(response.body.success).toBe(false);
        expect(response.body.error.code).toBe('FORBIDDEN');

        // Property: target user role should remain unchanged
        const dbUser = await User.findByPk(targetUser.id);
        expect(dbUser?.role).toBe('cliente');
      }),
      { numRuns: 10 }
    );
  });

  it('should reject role updates from unauthenticated users', async () => {
    const id3 = ++userCounter;
    const targetUser = await User.create({
      name: 'Target',
      email: `target_unauth_${id3}@test.com`,
      password: 'password123',
      phonePrefix: '+58',
      phone: `098766${String(id3).padStart(4, '0')}`,
      cedulaType: 'V',
      cedula: `8766${String(id3).padStart(4, '0')}`,
      role: 'cliente',
      isVerified: false
    });

    const response = await request(app)
      .patch(`/api/users/${targetUser.id}/role`)
      .send({ role: 'admin' });

    // Property: unauthenticated should be rejected with 401
    expect(response.status).toBe(401);
    expect(response.body.success).toBe(false);
  });
});
