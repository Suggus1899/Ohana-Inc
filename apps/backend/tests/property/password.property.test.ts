import * as fc from 'fast-check';
import bcrypt from 'bcrypt';
import { User } from '../../src/models';
import { sequelize } from '../../src/config/database';

/**
 * **Feature: auth-user-roles, Property 4: Password hashing**
 * *For any* registered user, the password stored in the database 
 * should not equal the plain text password submitted during registration.
 * **Validates: Requirements 1.4**
 */
describe('Property 4: Password hashing', () => {
  beforeAll(async () => {
    await sequelize.sync({ force: true });
  });

  afterAll(async () => {
    await sequelize.close();
  });

  beforeEach(async () => {
    await User.destroy({ where: {} });
  });

  // Generator for valid passwords (6-50 chars, alphanumeric + special)
  const passwordArbitrary = fc.string({ minLength: 6, maxLength: 50 })
    .filter(s => s.trim().length >= 6);

  // Generator for valid user data
  const userDataArbitrary = fc.record({
    name: fc.string({ minLength: 2, maxLength: 50 }).filter(s => s.trim().length >= 2),
    email: fc.emailAddress(),
    password: passwordArbitrary,
    phonePrefix: fc.constantFrom('+57', '+1', '+34'),
    phone: fc.string({ minLength: 7, maxLength: 15 }).filter(s => /^\d+$/.test(s)),
    cedulaType: fc.constantFrom('CC', 'CE'),
    cedula: fc.string({ minLength: 6, maxLength: 10 }).filter(s => /^\d+$/.test(s)),
    role: fc.constant('cliente' as const),
    isVerified: fc.constant(false)
  });

  it('should hash password so stored value differs from plain text', async () => {
    await fc.assert(
      fc.asyncProperty(userDataArbitrary, async (userData) => {
        const plainPassword = userData.password;
        
        // Create user with plain password
        const user = await User.create(userData);
        
        // Fetch user from database to get stored password
        const storedUser = await User.findByPk(user.id, { 
          attributes: { include: ['password'] } 
        });
        
        // Property: stored password should NOT equal plain text password
        expect(storedUser!.password).not.toBe(plainPassword);
        
        // Property: stored password should be a valid bcrypt hash
        expect(storedUser!.password).toMatch(/^\$2[aby]?\$\d{1,2}\$.{53}$/);
        
        // Property: bcrypt compare should return true for correct password
        const isMatch = await bcrypt.compare(plainPassword, storedUser!.password);
        expect(isMatch).toBe(true);
        
        // Cleanup
        await user.destroy();
      }),
      { numRuns: 100 }
    );
  });

  it('should produce different hashes for same password (due to salt)', async () => {
    const password = 'testPassword123';
    
    const user1 = await User.create({
      name: 'User One',
      email: 'user1@test.com',
      password,
      phonePrefix: '+57',
      phone: '3001234567',
      cedulaType: 'CC',
      cedula: '12345678',
      role: 'cliente',
      isVerified: false
    });

    const user2 = await User.create({
      name: 'User Two',
      email: 'user2@test.com',
      password,
      phonePrefix: '+57',
      phone: '3009876543',
      cedulaType: 'CC',
      cedula: '87654321',
      role: 'cliente',
      isVerified: false
    });

    // Same password should produce different hashes
    expect(user1.password).not.toBe(user2.password);
    
    // But both should validate correctly
    expect(await user1.comparePassword(password)).toBe(true);
    expect(await user2.comparePassword(password)).toBe(true);
  });
});
