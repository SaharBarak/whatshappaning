/**
 * Tests for Preferences API routes
 */

const express = require('express');
const request = require('supertest');

// Mock db
jest.mock('../db', () => ({
  query: jest.fn(),
  getLatestSnapshot: jest.fn(),
}));

const db = require('../db');
const preferencesRoutes = require('./preferences');

const app = express();
app.use(express.json());
app.use('/api/preferences', preferencesRoutes);

const VALID_CLIENT_ID = 'test-client-12345678';

describe('Preferences API', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('GET /api/preferences/:clientId', () => {
    it('returns 400 for invalid client ID', async () => {
      const res = await request(app).get('/api/preferences/bad');
      expect(res.status).toBe(400);
    });

    it('returns 404 when not found', async () => {
      db.query.mockResolvedValue({ rows: [] });
      const res = await request(app).get(`/api/preferences/${VALID_CLIENT_ID}`);
      expect(res.status).toBe(404);
    });

    it('returns preferences when found', async () => {
      db.query.mockResolvedValue({
        rows: [{ preferences: { categories: ['moon'] }, updated_at: '2026-01-01' }],
      });
      const res = await request(app).get(`/api/preferences/${VALID_CLIENT_ID}`);
      expect(res.status).toBe(200);
      expect(res.body.preferences.categories).toEqual(['moon']);
    });
  });

  describe('PUT /api/preferences/:clientId', () => {
    it('validates categories', async () => {
      const res = await request(app)
        .put(`/api/preferences/${VALID_CLIENT_ID}`)
        .send({ categories: ['invalid_cat'] });
      expect(res.status).toBe(400);
    });

    it('saves valid preferences', async () => {
      db.query.mockResolvedValue({
        rows: [{ preferences: { categories: ['moon', 'tarot'] }, updated_at: '2026-01-01' }],
      });
      const res = await request(app)
        .put(`/api/preferences/${VALID_CLIENT_ID}`)
        .send({ categories: ['moon', 'tarot'] });
      expect(res.status).toBe(200);
      expect(res.body.preferences.categories).toEqual(['moon', 'tarot']);
    });

    it('validates locationRadius range', async () => {
      const res = await request(app)
        .put(`/api/preferences/${VALID_CLIENT_ID}`)
        .send({ locationRadius: 9999 });
      expect(res.status).toBe(400);
    });

    it('accepts valid location', async () => {
      db.query.mockResolvedValue({
        rows: [{ preferences: { location: { lat: 32.0, lng: 34.8 } }, updated_at: '2026-01-01' }],
      });
      const res = await request(app)
        .put(`/api/preferences/${VALID_CLIENT_ID}`)
        .send({ location: { lat: 32.0, lng: 34.8 } });
      expect(res.status).toBe(200);
    });
  });

  describe('DELETE /api/preferences/:clientId', () => {
    it('returns 404 when not found', async () => {
      db.query.mockResolvedValue({ rowCount: 0 });
      const res = await request(app).delete(`/api/preferences/${VALID_CLIENT_ID}`);
      expect(res.status).toBe(404);
    });

    it('deletes successfully', async () => {
      db.query.mockResolvedValue({ rowCount: 1 });
      const res = await request(app).delete(`/api/preferences/${VALID_CLIENT_ID}`);
      expect(res.status).toBe(200);
    });
  });

  describe('POST /api/preferences/:clientId/feed', () => {
    it('returns 404 without preferences', async () => {
      db.query.mockResolvedValue({ rows: [] });
      const res = await request(app).post(`/api/preferences/${VALID_CLIENT_ID}/feed`);
      expect(res.status).toBe(404);
    });

    it('returns ranked feed', async () => {
      db.query.mockResolvedValue({
        rows: [{ preferences: { categories: ['moon'] } }],
      });
      db.getLatestSnapshot
        .mockResolvedValueOnce({ data: { phase: 'full' }, collected_at: '2026-01-01' }) // moon (first call matches first category alphabetically by iteration)
        .mockResolvedValue(null); // rest return null

      const res = await request(app).post(`/api/preferences/${VALID_CLIENT_ID}/feed`);
      expect(res.status).toBe(200);
      expect(res.body.feed).toBeDefined();
      expect(res.body.preferredCount).toBeGreaterThanOrEqual(0);
    });
  });
});
