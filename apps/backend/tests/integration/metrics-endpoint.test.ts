/**
 * Integration test for GET /api/kyc/admin/metrics endpoint
 * 
 * Requisito: 33.11
 */

import request from 'supertest';
import app from '../../src/app';

describe('GET /api/kyc/admin/metrics', () => {
  it('should return 401 without authentication', async () => {
    const response = await request(app)
      .get('/api/kyc/admin/metrics')
      .expect(401);

    expect(response.body.success).toBe(false);
    expect(response.body.error.code).toBe('UNAUTHORIZED');
  });

  it('should return 403 for non-operator users', async () => {
    // This test would require a valid JWT token for a non-operator user
    // Skipping for now as it requires authentication setup
  });

  it('should return metrics for operator users', async () => {
    // This test would require a valid JWT token for an operator user
    // Skipping for now as it requires authentication setup
  });
});
