import request from 'supertest';
import app from '../src/app';

describe('Navigation API', () => {
  it('should calculate a route between two points', async () => {
    const response = await request(app)
      .post('/api/navigation/route')
      .send({
        origin: { lat: 9.4111, lng: -67.3592 },
        destination: { lat: 9.4092, lng: -67.3570 },
        mode: 'foot'
      });

    expect(response.status).toBe(200);
    expect(response.body.success).toBe(true);
    expect(response.body.data).toHaveProperty('geometry');
    expect(response.body.data).toHaveProperty('distance');
    expect(response.body.data).toHaveProperty('steps');
    expect(response.body.data.steps.length).toBeGreaterThan(0);
  });

  it('should return error for invalid coordinates', async () => {
    const response = await request(app)
      .post('/api/navigation/route')
      .send({
        origin: { lat: null, lng: -67.3592 },
        destination: { lat: 9.4092, lng: -67.3570 }
      });

    expect(response.status).toBe(400);
    expect(response.body.success).toBe(false);
    expect(response.body.error.code).toBe('INVALID_COORDINATES');
  });

  it('should return 404 for unknown routes', async () => {
    const response = await request(app).get('/api/navigation/invalid');
    expect(response.status).toBe(404);
  });
});
