import * as fc from 'fast-check';
import request from 'supertest';
import app from '../../src/app';
import { User } from '../../src/models';
import { sequelize } from '../../src/config/database';
import { decodeToken } from '../../src/services/jwt.service';

/**
 * **Feature: auth-user-roles, Property 5: Valid login returns JWT with role**
 * *For any* user with valid credentials, logging in should return a JWT token 
 * containing the user's role and user data.
 * **Validates: Requirements 2.1, 2.3**
 */
describe('Property 5: Valid login returns JWT with role', () => {
  beforeAll(async () => {
    await sequelize.sync({ force: true });
  });

  afterAll(async () => {
    await sequelize.close();
  });

  beforeEach(async () => {
    await User.destroy({ where: {} });
  });

  // Generator for valid credentials
  const credentialsArbitrary = fc.record({
    email: fc.emailAddress(),
    password: fc.string({ minLength: 6, maxLength: 50 }).filter(s => s.trim().length >= 6)
  });

  it('should return JWT with role for valid credentials', async () => {
    let counter = 0;
    
    await fc.assert(
      fc.asyncProperty(credentialsArbitrary, async (credentials) => {
        const uniqueEmail = `login_test_${counter++}_${Date.now()}@example.com`;
        const password = credentials.password;
        
        // First create a user
        const registerResponse = await request(app)
          .post('/api/auth/register')
          .send({
            name: 'Test User',
            email: uniqueEmail,
            password,
            phonePrefix: '+57',
            phone: '3001234567',
            cedulaType: 'CC',
            cedula: '12345678'
          });
        expect(registerResponse.status).toBe(201);

        // Then login with same credentials
        const loginResponse = await request(app)
          .post('/api/auth/login')
          .send({
            email: uniqueEmail,
            password
          });

        // Property: login should succeed
        expect(loginResponse.status).toBe(200);
        expect(loginResponse.body.success).toBe(true);
        
        // Property: response should contain user data with role
        expect(loginResponse.body.data.user).toBeDefined();
        expect(loginResponse.body.data.user.role).toBeDefined();
        expect(['admin', 'operator', 'propietario', 'cliente']).toContain(loginResponse.body.data.user.role);
        
        // Property: response should contain valid JWT token
        expect(loginResponse.body.data.token).toBeDefined();
        const decoded = decodeToken(loginResponse.body.data.token);
        expect(decoded).not.toBeNull();
        
        // Property: JWT should contain role
        expect(decoded?.role).toBe(loginResponse.body.data.user.role);
        expect(decoded?.email).toBe(uniqueEmail);
        expect(decoded?.userId).toBe(loginResponse.body.data.user.id);
        
        // Property: password should not be in response
        expect(loginResponse.body.data.user.password).toBeUndefined();
      }),
      { numRuns: 20 }
    );
  });

  it('should return correct role for users with different roles', async () => {
    const roles = ['cliente', 'propietario', 'admin', 'operator'] as const;
    
    for (const role of roles) {
      // Create user directly in database with specific role
      const user = await User.create({
        name: `${role} User`,
        email: `${role}@test.com`,
        password: 'password123',
        phonePrefix: '+57',
        phone: '3001234567',
        cedulaType: 'CC',
        cedula: '12345678',
        role,
        isVerified: false
      });

      // Login
      const loginResponse = await request(app)
        .post('/api/auth/login')
        .send({
          email: `${role}@test.com`,
          password: 'password123'
        });

      // Property: JWT should contain correct role
      expect(loginResponse.status).toBe(200);
      expect(loginResponse.body.data.user.role).toBe(role);
      
      const decoded = decodeToken(loginResponse.body.data.token);
      expect(decoded?.role).toBe(role);
    }
  });
});

/**
 * **Feature: auth-user-roles, Property 6: Invalid credentials rejection**
 * *For any* login attempt with incorrect email or password, the system should 
 * reject the request with an authentication error.
 * **Validates: Requirements 2.2**
 */
describe('Property 6: Invalid credentials rejection', () => {
  beforeAll(async () => {
    await sequelize.sync({ force: true });
  });

  afterAll(async () => {
    await sequelize.close();
  });

  beforeEach(async () => {
    await User.destroy({ where: {} });
    // Create a known user for testing
    await User.create({
      name: 'Known User',
      email: 'known@test.com',
      password: 'correctPassword123',
      phonePrefix: '+57',
      phone: '3001234567',
      cedulaType: 'CC',
      cedula: '12345678',
      role: 'cliente',
      isVerified: false
    });
  });

  // Generator for wrong passwords
  const wrongPasswordArbitrary = fc.string({ minLength: 6, maxLength: 50 })
    .filter(s => s.trim().length >= 6 && s !== 'correctPassword123');

  it('should reject login with wrong password', async () => {
    await fc.assert(
      fc.asyncProperty(wrongPasswordArbitrary, async (wrongPassword) => {
        const response = await request(app)
          .post('/api/auth/login')
          .send({
            email: 'known@test.com',
            password: wrongPassword
          });

        // Property: wrong password should be rejected
        expect(response.status).toBe(401);
        expect(response.body.success).toBe(false);
        expect(response.body.error.code).toBe('INVALID_CREDENTIALS');
      }),
      { numRuns: 50 }
    );
  });

  // Generator for non-existent emails
  const nonExistentEmailArbitrary = fc.emailAddress()
    .filter(email => email !== 'known@test.com');

  it('should reject login with non-existent email', async () => {
    await fc.assert(
      fc.asyncProperty(nonExistentEmailArbitrary, async (email) => {
        const response = await request(app)
          .post('/api/auth/login')
          .send({
            email,
            password: 'anyPassword123'
          });

        // Property: non-existent email should be rejected
        expect(response.status).toBe(401);
        expect(response.body.success).toBe(false);
        expect(response.body.error.code).toBe('INVALID_CREDENTIALS');
      }),
      { numRuns: 50 }
    );
  });
});
