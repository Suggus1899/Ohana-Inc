/// <reference types="jest" />
import request from 'supertest';
import express from 'express';
import { createRequest } from '../src/controllers/rent.controller';
import { RentalRequest, Property } from '../src/models';

// Simple mock implementations
const mockRentalRequestFindOne = jest.fn();
const mockRentalRequestCreate = jest.fn();
const mockPropertyFindByPk = jest.fn();

jest.mock('../src/models', () => ({
  RentalRequest: {
    findOne: (...args: any[]) => mockRentalRequestFindOne(...args),
    create: (...args: any[]) => mockRentalRequestCreate(...args),
  },
  Property: {
    findByPk: (...args: any[]) => mockPropertyFindByPk(...args),
  },
}));

const app = express();
app.use(express.json());
app.use((req, res, next) => {
  req.user = { userId: 10, id: 10, role: 'estudiante' };
  next();
});
app.post('/rent-requests', createRequest);

describe('Rent Controller - Property Status Validation', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('debe rechazar solicitud si la propiedad no está aprobada (pending)', async () => {
    mockPropertyFindByPk.mockResolvedValue({
      id: 1,
      authorId: 5,
      status: 'pending',
    } as any);

    const res = await request(app)
      .post('/rent-requests')
      .send({ propertyId: 1, message: 'Quiero alquilar' });

    expect(res.status).toBe(409);
    expect(res.body.success).toBe(false);
    expect(res.body.error.code).toBe('PROPERTY_NOT_AVAILABLE');
    expect(mockRentalRequestCreate).not.toHaveBeenCalled();
  });

  it('debe rechazar solicitud si la propiedad está alquilada (rented)', async () => {
    mockPropertyFindByPk.mockResolvedValue({
      id: 1,
      authorId: 5,
      status: 'rented',
    } as any);

    const res = await request(app)
      .post('/rent-requests')
      .send({ propertyId: 1, message: 'Quiero alquilar' });

    expect(res.status).toBe(409);
    expect(res.body.error.message).toContain('no está disponible');
  });

  it('debe rechazar solicitud si la propiedad está vendida (sold)', async () => {
    mockPropertyFindByPk.mockResolvedValue({
      id: 1,
      authorId: 5,
      status: 'sold',
    } as any);

    const res = await request(app)
      .post('/rent-requests')
      .send({ propertyId: 1, message: 'Quiero comprar' });

    expect(res.status).toBe(409);
    expect(res.body.success).toBe(false);
  });

  it('debe crear solicitud si la propiedad está aprobada (approved)', async () => {
    mockPropertyFindByPk.mockResolvedValue({
      id: 1,
      authorId: 5,
      status: 'approved',
    } as any);
    mockRentalRequestFindOne.mockResolvedValue(null);
    mockRentalRequestCreate.mockResolvedValue({
      id: 100,
      tenantId: 10,
      propertyId: 1,
      status: 'pending',
    } as any);

    const res = await request(app)
      .post('/rent-requests')
      .send({ propertyId: 1, message: 'Quiero alquilar' });

    expect(res.status).toBe(201);
    expect(res.body.success).toBe(true);
    expect(mockRentalRequestCreate).toHaveBeenCalled();
  });

  it('debe retornar 404 si la propiedad no existe', async () => {
    mockPropertyFindByPk.mockResolvedValue(null);

    const res = await request(app)
      .post('/rent-requests')
      .send({ propertyId: 999, message: 'Quiero alquilar' });

    expect(res.status).toBe(404);
    expect(res.body.error.message).toContain('no encontrada');
  });
});
