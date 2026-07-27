/// <reference types="jest" />
import request from 'supertest';
import express from 'express';
import { getMyVerificationLevel } from '../src/controllers/user.controller';

const mockUserFindByPk = jest.fn();

jest.mock('../src/models', () => ({
  User: {
    findByPk: (...args: any[]) => mockUserFindByPk(...args),
  },
}));

const app = express();
app.use(express.json());
app.use((req, res, next) => {
  req.user = { userId: 10, id: 10, role: 'estudiante' };
  next();
});
app.get('/users/me/verification-level', getMyVerificationLevel);

describe('User Controller - Verification Level', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('debe retornar nivel de verificación del usuario autenticado', async () => {
    mockUserFindByPk.mockResolvedValue({
      id: 10,
      verificationLevel: 2,
      isVerified: true,
      role: 'estudiante',
      toJSON() {
        return {
          id: 10,
          verificationLevel: 2,
          isVerified: true,
          role: 'estudiante',
        };
      },
    } as any);

    const res = await request(app).get('/users/me/verification-level');

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data).toEqual({
      verificationLevel: 2,
      isVerified: true,
      canRequestProperty: true,
    });
  });

  it('debe retornar canRequestProperty: false si nivel < 2', async () => {
    mockUserFindByPk.mockResolvedValue({
      id: 10,
      verificationLevel: 1,
      isVerified: false,
      role: 'estudiante',
      toJSON() {
        return {
          id: 10,
          verificationLevel: 1,
          isVerified: false,
          role: 'estudiante',
        };
      },
    } as any);

    const res = await request(app).get('/users/me/verification-level');

    expect(res.body.data.canRequestProperty).toBe(false);
    expect(res.body.data.verificationLevel).toBe(1);
  });

  it('debe retornar valores por defecto si campos son null', async () => {
    mockUserFindByPk.mockResolvedValue({
      id: 10,
      verificationLevel: null,
      isVerified: null,
      toJSON() {
        return {
          id: 10,
          verificationLevel: null,
          isVerified: null,
        };
      },
    } as any);

    const res = await request(app).get('/users/me/verification-level');

    expect(res.body.data.verificationLevel).toBe(0);
    expect(res.body.data.isVerified).toBe(false);
    expect(res.body.data.canRequestProperty).toBe(false);
  });

  it('debe retornar 404 si usuario no existe', async () => {
    mockUserFindByPk.mockResolvedValue(null);

    const res = await request(app).get('/users/me/verification-level');

    expect(res.status).toBe(404);
    expect(res.body.success).toBe(false);
  });

  it('debe retornar 401 si no hay autenticación', async () => {
    const appNoAuth = express();
    appNoAuth.use(express.json());
    appNoAuth.get('/users/me/verification-level', getMyVerificationLevel);

    const res = await request(appNoAuth).get('/users/me/verification-level');

    expect(res.status).toBe(401);
  });
});
