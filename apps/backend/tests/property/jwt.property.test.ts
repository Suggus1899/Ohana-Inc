import * as fc from 'fast-check';
import { generateToken, decodeToken, verifyToken, isTokenExpired } from '../../src/services/jwt.service';
import { UserRole } from '../../src/types';

/**
 * **Feature: auth-user-roles, Property 7: JWT expiration**
 * *For any* generated JWT token, decoding it should reveal an expiration claim (exp) 
 * set to a future time.
 * **Validates: Requirements 2.4**
 */
describe('Property 7: JWT expiration', () => {
  
  const roleArbitrary = fc.constantFrom<UserRole>('admin', 'operator', 'propietario', 'cliente');

  // Generator for valid token payloads
  const tokenPayloadArbitrary = fc.record({
    userId: fc.integer({ min: 1, max: 1000000 }),
    email: fc.emailAddress(),
    role: roleArbitrary
  });

  it('should generate tokens with expiration claim set to future time', async () => {
    await fc.assert(
      fc.property(tokenPayloadArbitrary, (payload) => {
        const token = generateToken(payload);
        const decoded = decodeToken(token);
        
        // Property: decoded token should exist
        expect(decoded).not.toBeNull();
        
        // Property: decoded token should have exp claim
        expect(decoded?.exp).toBeDefined();
        
        // Property: exp should be a number
        expect(typeof decoded?.exp).toBe('number');
        
        // Property: exp should be in the future
        const currentTime = Math.floor(Date.now() / 1000);
        expect(decoded!.exp!).toBeGreaterThan(currentTime);
      }),
      { numRuns: 100 }
    );
  });

  it('should generate tokens with iat (issued at) claim', async () => {
    await fc.assert(
      fc.property(tokenPayloadArbitrary, (payload) => {
        const token = generateToken(payload);
        const decoded = decodeToken(token);
        
        // Property: decoded token should have iat claim
        expect(decoded?.iat).toBeDefined();
        
        // Property: iat should be approximately current time
        const currentTime = Math.floor(Date.now() / 1000);
        expect(decoded!.iat!).toBeLessThanOrEqual(currentTime + 1);
        expect(decoded!.iat!).toBeGreaterThanOrEqual(currentTime - 1);
      }),
      { numRuns: 100 }
    );
  });

  it('should preserve payload data in generated tokens', async () => {
    await fc.assert(
      fc.property(tokenPayloadArbitrary, (payload) => {
        const token = generateToken(payload);
        const decoded = decodeToken(token);
        
        // Property: decoded token should contain original payload data
        expect(decoded?.userId).toBe(payload.userId);
        expect(decoded?.email).toBe(payload.email);
        expect(decoded?.role).toBe(payload.role);
      }),
      { numRuns: 100 }
    );
  });

  it('should verify valid tokens successfully', async () => {
    await fc.assert(
      fc.property(tokenPayloadArbitrary, (payload) => {
        const token = generateToken(payload);
        const verified = verifyToken(token);
        
        // Property: valid token should verify successfully
        expect(verified).not.toBeNull();
        expect(verified?.userId).toBe(payload.userId);
        expect(verified?.email).toBe(payload.email);
        expect(verified?.role).toBe(payload.role);
      }),
      { numRuns: 100 }
    );
  });

  it('should report newly generated tokens as not expired', async () => {
    await fc.assert(
      fc.property(tokenPayloadArbitrary, (payload) => {
        const token = generateToken(payload);
        
        // Property: newly generated token should not be expired
        expect(isTokenExpired(token)).toBe(false);
      }),
      { numRuns: 100 }
    );
  });

  it('should reject invalid tokens', () => {
    const invalidTokens = [
      'invalid-token',
      'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.invalid.signature',
      '',
      'not.a.jwt'
    ];

    invalidTokens.forEach(token => {
      const verified = verifyToken(token);
      expect(verified).toBeNull();
    });
  });

  it('should reject tampered tokens', async () => {
    await fc.assert(
      fc.property(tokenPayloadArbitrary, (payload) => {
        const token = generateToken(payload);
        
        // Tamper with the token by modifying a character
        const tamperedToken = token.slice(0, -5) + 'XXXXX';
        
        // Property: tampered token should not verify
        const verified = verifyToken(tamperedToken);
        expect(verified).toBeNull();
      }),
      { numRuns: 100 }
    );
  });
});
