import * as fc from 'fast-check';
import request from 'supertest';
import app from '../../src/app';
import { User } from '../../src/models';
import { sequelize } from '../../src/config/database';
import { decodeToken } from '../../src/services/jwt.service';

/**
 * **Feature: auth-user-roles, Property 1: Registration creates user with default role**
 * *For any* valid registration data, when submitted to the registration endpoint,
 * the system should create a user in the database with role "tenant" and return a valid JWT token.
 * **Validates: Requirements 1.1, 1.5**
 */
describe('Property 1: Registration creates user with default role', () => {
  beforeAll(async () => {
    await sequelize.sync({ force: true });
  });

  afterAll(async () => {
    await sequelize.close();
  });

  beforeEach(async () => {
    await User.destroy({ where: {} });
  });

  // Generator for valid registration data
  const validRegistrationArbitrary = fc.record({
    name: fc.string({ minLength: 2, maxLength: 50 }).filter(s => s.trim().length >= 2),
    email: fc.emailAddress(),
    password: fc.string({ minLength: 6, maxLength: 50 }).filter(s => s.trim().length >= 6),
    phonePrefix: fc.constantFrom('+57', '+1', '+34', '+52', '+54', '+56', '+51'),
    phone: fc.string({ minLength: 7, maxLength: 15 }).filter(s => /^\d+$/.test(s)),
    cedulaType: fc.constantFrom('CC', 'CE'),
    cedula: fc.string({ minLength: 6, maxLength: 10 }).filter(s => /^\d+$/.test(s)),
    dateOfBirth: fc.option(fc.date({ min: new Date('1950-01-01'), max: new Date('2005-01-01') })
      .map(d => d.toISOString().split('T')[0]), { nil: undefined }),
    city: fc.option(fc.string({ minLength: 2, maxLength: 50 }).filter(s => s.trim().length >= 2), { nil: undefined })
  });

  it('should create user with tenant role and return JWT token', async () => {
    let emailCounter = 0;
    
    await fc.assert(
      fc.asyncProperty(validRegistrationArbitrary, async (userData) => {
        // Make email unique for each test
        const uniqueEmail = `test${emailCounter++}_${Date.now()}@example.com`;
        const testData = { ...userData, email: uniqueEmail };
        
        const response = await request(app)
          .post('/api/auth/register')
          .send(testData);

        // Property: registration should succeed
        expect(response.status).toBe(201);
        expect(response.body.success).toBe(true);
        
        // Property: response should contain user data
        expect(response.body.data.user).toBeDefined();
        expect(response.body.data.user.email).toBe(uniqueEmail);
        expect(response.body.data.user.name).toBe(testData.name);
        
        // Property: user should have default role 'cliente'
        expect(response.body.data.user.role).toBe('cliente');
        
        // Property: response should contain valid JWT token
        expect(response.body.data.token).toBeDefined();
        const decoded = decodeToken(response.body.data.token);
        expect(decoded).not.toBeNull();
        expect(decoded?.role).toBe('cliente');
        expect(decoded?.email).toBe(uniqueEmail);
        
        // Property: user should be persisted in database
        const dbUser = await User.findOne({ where: { email: uniqueEmail } });
        expect(dbUser).not.toBeNull();
        expect(dbUser?.role).toBe('cliente');
        
        // Property: password should not be in response
        expect(response.body.data.user.password).toBeUndefined();
      }),
      { numRuns: 20 } // Reduced for API tests
    );
  });
});

/**
 * **Feature: auth-user-roles, Property 2: Duplicate email rejection**
 * *For any* email that already exists in the database, attempting to register 
 * with that email should be rejected with an appropriate error.
 * **Validates: Requirements 1.2**
 */
describe('Property 2: Duplicate email rejection', () => {
  beforeAll(async () => {
    await sequelize.sync({ force: true });
  });

  afterAll(async () => {
    await sequelize.close();
  });

  beforeEach(async () => {
    await User.destroy({ where: {} });
  });

  it('should reject registration with duplicate email', async () => {
    const existingUser = {
      name: 'Existing User',
      email: 'existing@test.com',
      password: 'password123',
      phonePrefix: '+57',
      phone: '3001234567',
      cedulaType: 'CC',
      cedula: '12345678'
    };

    // First registration should succeed
    const firstResponse = await request(app)
      .post('/api/auth/register')
      .send(existingUser);
    expect(firstResponse.status).toBe(201);

    // Generator for different user data but same email
    const duplicateEmailArbitrary = fc.record({
      name: fc.string({ minLength: 2, maxLength: 50 }).filter(s => s.trim().length >= 2),
      email: fc.constant(existingUser.email), // Same email
      password: fc.string({ minLength: 6, maxLength: 50 }).filter(s => s.trim().length >= 6),
      phonePrefix: fc.constantFrom('+57', '+1', '+34'),
      phone: fc.string({ minLength: 7, maxLength: 15 }).filter(s => /^\d+$/.test(s)),
      cedulaType: fc.constantFrom('CC', 'CE'),
      cedula: fc.string({ minLength: 6, maxLength: 10 }).filter(s => /^\d+$/.test(s))
    });

    await fc.assert(
      fc.asyncProperty(duplicateEmailArbitrary, async (userData) => {
        const response = await request(app)
          .post('/api/auth/register')
          .send(userData);

        // Property: duplicate email should be rejected
        expect(response.status).toBe(409);
        expect(response.body.success).toBe(false);
        expect(response.body.error.code).toBe('DUPLICATE_EMAIL');
      }),
      { numRuns: 20 }
    );
  });
});
