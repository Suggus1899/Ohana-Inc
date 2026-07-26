import * as fc from 'fast-check';
import request from 'supertest';
import jwt from 'jsonwebtoken';
import app from '../../src/app';
import { User } from '../../src/models';
import { sequelize } from '../../src/config/database';
import { generateToken } from '../../src/services/jwt.service';

/**
 * **Feature: auth-user-roles, Property 9: Protected route enforcement**
 * *For any* protected API endpoint accessed without a valid JWT token, 
 * the system should return a 401 Unauthorized error.
 * **Validates: Requirements 3.4, 4.3**
 */
describe('Property 9: Protected route enforcement', () => {
  beforeAll(async () => {
    await sequelize.sync({ force: true });
  });



  // Generator for invalid tokens
  const invalidTokenArbitrary = fc.oneof(
    fc.constant(''),
    fc.constant('invalid-token'),
    fc.constant('Bearer'),
    fc.constant('Bearer '),
    fc.string({ minLength: 10, maxLength: 100 }),
    fc.constant('eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.invalid.signature')
  );

  it('should reject requests without token', async () => {
    const response = await request(app)
      .get('/api/auth/me');

    expect(response.status).toBe(401);
    expect(response.body.success).toBe(false);
    expect(response.body.error.code).toBe('UNAUTHORIZED');
  });

  it('should reject requests with invalid tokens', async () => {
    await fc.assert(
      fc.asyncProperty(invalidTokenArbitrary, async (invalidToken) => {
        const response = await request(app)
          .get('/api/auth/me')
          .set('Authorization', `Bearer ${invalidToken}`);

        // Property: invalid token should be rejected with 401
        expect(response.status).toBe(401);
        expect(response.body.success).toBe(false);
      }),
      { numRuns: 50 }
    );
  });

  it('should reject requests with malformed Authorization header', async () => {
    const malformedHeaders = [
      'Basic token123',
      'token123',
      'Bearer',
      ''
    ];

    for (const header of malformedHeaders) {
      const response = await request(app)
        .get('/api/auth/me')
        .set('Authorization', header);

      expect(response.status).toBe(401);
      expect(response.body.success).toBe(false);
    }
  });

  it('should accept requests with valid token', async () => {
    // Create a user first
    const user = await User.create({
      name: 'Test User',
      email: 'protected@test.com',
      password: 'password123',
      phonePrefix: '+57',
      phone: '3001234567',
      cedulaType: 'CC',
      cedula: '12345678',
      role: 'cliente',
      isVerified: false
    });

    const token = generateToken({
      userId: user.id,
      email: user.email,
      role: user.role
    });

    const response = await request(app)
      .get('/api/auth/me')
      .set('Authorization', `Bearer ${token}`);

    // Property: valid token should be accepted
    expect(response.status).toBe(200);
    expect(response.body.success).toBe(true);
    expect(response.body.data.user.email).toBe('protected@test.com');
  });
});

/**
 * **Feature: auth-user-roles, Property 10: Token expiration enforcement**
 * *For any* expired JWT token used to access a protected endpoint, 
 * the system should reject the request and require re-authentication.
 * **Validates: Requirements 5.2**
 */
describe('Property 10: Token expiration enforcement', () => {
  beforeAll(async () => {
    await sequelize.sync({ force: true });
  });

  afterAll(async () => {
    await sequelize.close();
  });

  it('should reject expired tokens', async () => {
    // Create an expired token (expired 1 hour ago)
    const expiredToken = jwt.sign(
      { userId: 1, email: 'test@test.com', role: 'cliente' },
      process.env.JWT_SECRET || 'dev-secret-key-change-in-production',
      { expiresIn: '-1h' }
    );

    const response = await request(app)
      .get('/api/auth/me')
      .set('Authorization', `Bearer ${expiredToken}`);

    // Property: expired token should be rejected
    expect(response.status).toBe(401);
    expect(response.body.success).toBe(false);
    expect(response.body.error.code).toBe('UNAUTHORIZED');
  });

  it('should reject tokens with past expiration times', async () => {
    // Generator for past timestamps
    const pastTimestampArbitrary = fc.integer({ 
      min: Math.floor(Date.now() / 1000) - 86400 * 365, // Up to 1 year ago
      max: Math.floor(Date.now() / 1000) - 1 // At least 1 second ago
    });

    await fc.assert(
      fc.asyncProperty(pastTimestampArbitrary, async (expTime) => {
        const expiredToken = jwt.sign(
          { 
            userId: 1, 
            email: 'test@test.com', 
            role: 'cliente',
            exp: expTime
          },
          process.env.JWT_SECRET || 'dev-secret-key-change-in-production'
        );

        const response = await request(app)
          .get('/api/auth/me')
          .set('Authorization', `Bearer ${expiredToken}`);

        // Property: token with past exp should be rejected
        expect(response.status).toBe(401);
        expect(response.body.success).toBe(false);
      }),
      { numRuns: 50 }
    );
  });
});
