import * as fc from 'fast-check';
import { 
  validateRegisterInput, 
  validateLoginInput,
  validateEmail,
  validatePassword 
} from '../../src/utils/validation';

/**
 * **Feature: auth-user-roles, Property 3: Invalid registration data rejection**
 * *For any* registration data with invalid format (empty required fields, malformed email),
 * the system should reject the request with specific validation errors.
 * **Validates: Requirements 1.3**
 */
describe('Property 3: Invalid registration data rejection', () => {
  
  // Generator for empty or whitespace-only strings
  const emptyStringArbitrary = fc.constantFrom('', '   ', '\t', '\n', '  \t  ');

  // Generator for invalid emails
  const invalidEmailArbitrary = fc.oneof(
    emptyStringArbitrary,
    fc.constant('notanemail'),
    fc.constant('missing@domain'),
    fc.constant('@nodomain.com'),
    fc.constant('spaces in@email.com'),
    fc.string({ minLength: 1, maxLength: 20 }).filter(s => !s.includes('@'))
  );

  // Generator for short passwords (less than 6 chars)
  const shortPasswordArbitrary = fc.string({ minLength: 1, maxLength: 5 });

  // Generator for invalid cedula types
  const invalidCedulaTypeArbitrary = fc.string({ minLength: 1, maxLength: 5 })
    .filter(s => !['V', 'E', 'J'].includes(s));

  describe('Email validation', () => {
    it('should reject empty emails', async () => {
      await fc.assert(
        fc.property(emptyStringArbitrary, (email) => {
          const result = validateEmail(email);
          expect(result).not.toBeNull();
          expect(result?.field).toBe('email');
        }),
        { numRuns: 100 }
      );
    });

    it('should reject invalid email formats', async () => {
      await fc.assert(
        fc.property(invalidEmailArbitrary, (email) => {
          const result = validateEmail(email);
          expect(result).not.toBeNull();
          expect(result?.field).toBe('email');
        }),
        { numRuns: 20 }
      );
    });

    it('should accept valid emails', async () => {
      await fc.assert(
        fc.property(fc.emailAddress(), (email) => {
          const result = validateEmail(email);
          expect(result).toBeNull();
        }),
        { numRuns: 20 }
      );
    });
  });

  describe('Password validation', () => {
    it('should reject empty passwords', async () => {
      await fc.assert(
        fc.property(emptyStringArbitrary, (password) => {
          const result = validatePassword(password);
          expect(result).not.toBeNull();
          expect(result?.field).toBe('password');
        }),
        { numRuns: 20 }
      );
    });

    it('should reject short passwords', async () => {
      await fc.assert(
        fc.property(shortPasswordArbitrary, (password) => {
          const result = validatePassword(password);
          expect(result).not.toBeNull();
          expect(result?.field).toBe('password');
          expect(result?.message).toContain('at least 6 characters');
        }),
        { numRuns: 20 }
      );
    });

    it('should accept valid passwords', async () => {
      await fc.assert(
        fc.property(
          fc.string({ minLength: 6, maxLength: 50 }).filter(s => s.trim().length >= 6),
          (password) => {
            const result = validatePassword(password);
            expect(result).toBeNull();
          }
        ),
        { numRuns: 20 }
      );
    });
  });

  describe('Registration input validation', () => {
    it('should reject registration with missing required fields', async () => {
      // Test with completely empty input
      const result = validateRegisterInput({});
      expect(result.isValid).toBe(false);
      expect(result.errors.length).toBeGreaterThan(0);
      
      // Should have errors for all required fields
      const errorFields = result.errors.map(e => e.field);
      expect(errorFields).toContain('name');
      expect(errorFields).toContain('email');
      expect(errorFields).toContain('password');
      expect(errorFields).toContain('phonePrefix');
      expect(errorFields).toContain('phone');
      expect(errorFields).toContain('cedulaType');
      expect(errorFields).toContain('cedula');
    });

    it('should reject registration with invalid email', async () => {
      await fc.assert(
        fc.property(invalidEmailArbitrary, (email) => {
          const result = validateRegisterInput({
            name: 'Valid Name',
            email,
            password: 'validPassword123',
            phonePrefix: '+58',
            phone: '1234567890',
            cedulaType: 'V',
            cedula: '12345678'
          });
          expect(result.isValid).toBe(false);
          expect(result.errors.some(e => e.field === 'email')).toBe(true);
        }),
        { numRuns: 20 }
      );
    });

    it('should reject registration with invalid cedula type', async () => {
      await fc.assert(
        fc.property(invalidCedulaTypeArbitrary, (cedulaType) => {
          const result = validateRegisterInput({
            name: 'Valid Name',
            email: 'valid@email.com',
            password: 'validPassword123',
            phonePrefix: '+58',
            phone: '1234567890',
            cedulaType,
            cedula: '12345678'
          });
          expect(result.isValid).toBe(false);
          expect(result.errors.some(e => e.field === 'cedulaType')).toBe(true);
        }),
        { numRuns: 20 }
      );
    });

    it('should accept valid registration data', async () => {
      const validDataArbitrary = fc.record({
        name: fc.string({ minLength: 2, maxLength: 50 }).filter(s => s.trim().length >= 2),
        email: fc.emailAddress(),
        password: fc.string({ minLength: 6, maxLength: 50 }).filter(s => s.trim().length >= 6),
        phonePrefix: fc.constantFrom('+58', '+1', '+34', '+57', '+52', '+54', '+56', '+51'),
        phone: fc.string({ minLength: 7, maxLength: 15 }).filter(s => /^\d+$/.test(s)),
        cedulaType: fc.constantFrom('V', 'E', 'J'),
        cedula: fc.string({ minLength: 6, maxLength: 10 }).filter(s => /^\d+$/.test(s))
      });

      await fc.assert(
        fc.property(validDataArbitrary, (data) => {
          const result = validateRegisterInput(data);
          expect(result.isValid).toBe(true);
          expect(result.errors).toHaveLength(0);
        }),
        { numRuns: 20 }
      );
    });
  });

  describe('Login input validation', () => {
    it('should reject login with missing credentials', () => {
      const result = validateLoginInput({});
      expect(result.isValid).toBe(false);
      expect(result.errors.some(e => e.field === 'email')).toBe(true);
      expect(result.errors.some(e => e.field === 'password')).toBe(true);
    });

    it('should accept valid login credentials', async () => {
      await fc.assert(
        fc.property(
          fc.emailAddress(),
          fc.string({ minLength: 6, maxLength: 50 }).filter(s => s.trim().length >= 6),
          (email, password) => {
            const result = validateLoginInput({ email, password });
            expect(result.isValid).toBe(true);
          }
        ),
        { numRuns: 20 }
      );
    });
  });
});
