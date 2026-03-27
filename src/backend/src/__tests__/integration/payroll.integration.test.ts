import request from 'supertest';
import app from '../../index';

/**
 * Integration tests for the payroll endpoint.
 * REQ 8.8 — POST /api/nominee/calculate-payroll requires auth token.
 *
 * These tests verify the HTTP layer behavior without hitting the real DB.
 * They confirm auth middleware, route wiring, and response shape.
 */
describe('POST /api/nominee/calculate-payroll — integration', () => {
  it('returns 401 when no token is provided', async () => {
    const res = await request(app)
      .post('/api/nominee/calculate-payroll')
      .send({ payroll_id: 1 });

    expect(res.status).toBe(401);
    expect(res.body).toHaveProperty('success', false);
  });

  it('returns 401 when an invalid token is provided', async () => {
    const res = await request(app)
      .post('/api/nominee/calculate-payroll')
      .set('Authorization', 'Bearer invalid-token-xyz')
      .send({ payroll_id: 1 });

    expect(res.status).toBe(401);
    expect(res.body).toHaveProperty('success', false);
  });

  it('returns 401 for deprecated POST /api/nominee/calculate route (REQ 5.1 — auth blocks before routing)', async () => {
    const res = await request(app)
      .post('/api/nominee/calculate')
      .send({});

    // AuthMiddleware fires before route resolution — 401 confirms route is protected
    // The route handler itself was removed in Phase 5 (calculateNominee method deleted)
    expect(res.status).toBe(401);
    expect(res.body).toHaveProperty('success', false);
  });
});
