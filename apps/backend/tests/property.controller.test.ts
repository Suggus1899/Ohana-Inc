/// <reference types="jest" />
import request from 'supertest';
import express from 'express';
import jwt from 'jsonwebtoken';
import { propertyService } from '../src/services/property.service';
import {
  getMyProperties,
  publishProperty,
  createProperty,
} from '../src/controllers/property.controller';
import { authenticate, requireRole } from '../src/middleware/auth.middleware';

jest.mock('../src/services/property.service', () => ({
  propertyService: {
    createProperty: jest.fn(),
    publishProperty: jest.fn(),
    getOwnerProperties: jest.fn(),
    getPropertyById: jest.fn(),
  },
}));

jest.mock('../src/services/media-processing.service', () => ({
  mediaProcessingService: {
    processImages: jest.fn().mockResolvedValue({ processedPaths: [], thumbnailPaths: [] }),
    processVideo: jest.fn().mockResolvedValue({ videoPath: 'vid.mp4', thumbnailPath: 'thumb.jpg' }),
    toPublicUrl: jest.fn((p: string) => '/' + p),
  },
}));

const MockPropertyService = propertyService as jest.Mocked<typeof propertyService>;

const JWT_SECRET = process.env.JWT_SECRET ?? 'test-secret-key';

const makeToken = (role: string, userId = 10) =>
  jwt.sign({ userId, id: userId, email: 'test@test.com', role }, JWT_SECRET);

const ownerToken = makeToken('propietario');
const clienteToken = makeToken('cliente', 20);

const buildApp = () => {
  const app = express();
  app.use(express.json());

  app.get('/properties/my', authenticate, requireRole(['propietario', 'admin']), getMyProperties);
  app.post('/properties/:id/publish', authenticate, requireRole(['propietario', 'admin']), publishProperty);
  app.post('/properties', authenticate, createProperty);

  return app;
};

describe('PropertyController', () => {
  let app: express.Express;

  beforeAll(() => { app = buildApp(); });
  afterEach(() => jest.clearAllMocks());

  // ─── GET /properties/my ────────────────────────────────────────────────

  describe('GET /properties/my', () => {
    it('devuelve propiedades del propietario autenticado', async () => {
      MockPropertyService.getOwnerProperties.mockResolvedValue({
        rows: [{ id: 1, title: 'Casa', status: 'pending' } as any],
        count: 1,
      });

      const res = await request(app)
        .get('/properties/my')
        .set('Authorization', `Bearer ${ownerToken}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.properties).toHaveLength(1);
      expect(res.body.data.total).toBe(1);
    });

    it('rechaza sin token (401)', async () => {
      const res = await request(app).get('/properties/my');
      expect(res.status).toBe(401);
    });

    it('rechaza rol cliente (403)', async () => {
      const res = await request(app)
        .get('/properties/my')
        .set('Authorization', `Bearer ${clienteToken}`);
      expect(res.status).toBe(403);
    });
  });

  // ─── POST /properties/:id/publish ─────────────────────────────────────

  describe('POST /properties/:id/publish', () => {
    it('publica exitosamente (200)', async () => {
      MockPropertyService.publishProperty.mockResolvedValue({ id: 1, status: 'approved' } as any);

      const res = await request(app)
        .post('/properties/1/publish')
        .set('Authorization', `Bearer ${ownerToken}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(MockPropertyService.publishProperty).toHaveBeenCalledWith(1, 10);
    });

    it('devuelve 404 si la propiedad no existe', async () => {
      MockPropertyService.publishProperty.mockRejectedValue(new Error('Propiedad no encontrada'));

      const res = await request(app)
        .post('/properties/999/publish')
        .set('Authorization', `Bearer ${ownerToken}`);

      expect(res.status).toBe(404);
      expect(res.body.success).toBe(false);
    });

    it('devuelve 400 si faltan imágenes', async () => {
      MockPropertyService.publishProperty.mockRejectedValue(
        new Error('Se requieren mínimo 5 imágenes para publicar (tienes 2)')
      );

      const res = await request(app)
        .post('/properties/1/publish')
        .set('Authorization', `Bearer ${ownerToken}`);

      expect(res.status).toBe(400);
      expect(res.body.error.message).toMatch(/imágenes/);
    });

    it('devuelve 403 si no es el propietario', async () => {
      MockPropertyService.publishProperty.mockRejectedValue(new Error('No autorizado'));

      const res = await request(app)
        .post('/properties/1/publish')
        .set('Authorization', `Bearer ${ownerToken}`);

      expect(res.status).toBe(403);
    });

    it('rechaza si no está autenticado (401)', async () => {
      const res = await request(app).post('/properties/1/publish');
      expect(res.status).toBe(401);
    });
  });

  // ─── POST /properties (crear) ─────────────────────────────────────────

  describe('POST /properties', () => {
    it('crea propiedad correctamente', async () => {
      MockPropertyService.createProperty.mockResolvedValue({ id: 5, title: 'Nueva' } as any);

      const res = await request(app)
        .post('/properties')
        .set('Authorization', `Bearer ${ownerToken}`)
        .send({
          title: 'Apartamento centro',
          description: 'Desc',
          type: 'Apartamento',
          listingType: 'Alquiler',
          price: '800',
          priceType: 'monthly',
          lat: '10.48', lng: '-66.90',
          address: 'Av Principal', location: 'Caracas',
          city: 'Caracas', state: 'Distrito Capital', zipCode: '1010',
          bedrooms: '2', bathrooms: '1', area: '65',
          furnished: 'false', features: '[]',
        });

      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
    });

    it('falla con error de servicio (500)', async () => {
      MockPropertyService.createProperty.mockRejectedValue(new Error('DB error'));

      const res = await request(app)
        .post('/properties')
        .set('Authorization', `Bearer ${ownerToken}`)
        .send({ title: 'X' });

      expect(res.status).toBe(500);
      expect(res.body.success).toBe(false);
    });
  });
});
