/**
 * Tests for Preferences API routes
 * Uses node:test runner (project standard) with lightweight HTTP testing
 */

const test = require('node:test');
const assert = require('node:assert');
const http = require('node:http');
const express = require('express');

// Build a mock db before requiring the route
const mockDb = {
  query: async () => ({ rows: [], rowCount: 0 }),
  getLatestSnapshot: async () => null,
};

// Patch require cache so ../db resolves to our mock
const path = require('node:path');
const dbPath = require.resolve('../db');
require.cache[dbPath] = { id: dbPath, filename: dbPath, loaded: true, exports: mockDb };

const preferencesRoutes = require('./preferences');

const VALID_CLIENT_ID = 'test-client-12345678';

function createApp() {
  const app = express();
  app.use(express.json());
  app.use('/api/preferences', preferencesRoutes);
  return app;
}

/**
 * Helper: make an HTTP request to a short-lived Express server
 */
function request(app, { method = 'GET', path: urlPath = '/', body } = {}) {
  return new Promise((resolve, reject) => {
    const server = app.listen(0, '127.0.0.1', () => {
      const { port } = server.address();
      const options = {
        hostname: '127.0.0.1',
        port,
        path: urlPath,
        method,
        headers: { 'Content-Type': 'application/json' },
      };
      const req = http.request(options, (res) => {
        let data = '';
        res.on('data', (c) => (data += c));
        res.on('end', () => {
          server.close();
          try {
            resolve({ status: res.statusCode, body: data ? JSON.parse(data) : null });
          } catch {
            resolve({ status: res.statusCode, body: data });
          }
        });
      });
      req.on('error', (e) => { server.close(); reject(e); });
      if (body) req.write(JSON.stringify(body));
      req.end();
    });
  });
}

test('Preferences API', async (t) => {
  const app = createApp();

  await t.test('GET /:clientId — returns 400 for invalid client ID', async () => {
    const res = await request(app, { path: '/api/preferences/bad' });
    assert.strictEqual(res.status, 400);
  });

  await t.test('GET /:clientId — returns 404 when not found', async () => {
    mockDb.query = async () => ({ rows: [] });
    const res = await request(app, { path: `/api/preferences/${VALID_CLIENT_ID}` });
    assert.strictEqual(res.status, 404);
  });

  await t.test('GET /:clientId — returns preferences when found', async () => {
    mockDb.query = async () => ({
      rows: [{ preferences: { categories: ['moon'] }, updated_at: '2026-01-01' }],
    });
    const res = await request(app, { path: `/api/preferences/${VALID_CLIENT_ID}` });
    assert.strictEqual(res.status, 200);
    assert.deepStrictEqual(res.body.preferences.categories, ['moon']);
  });

  await t.test('PUT /:clientId — validates categories', async () => {
    const res = await request(app, {
      method: 'PUT',
      path: `/api/preferences/${VALID_CLIENT_ID}`,
      body: { categories: ['invalid_cat'] },
    });
    assert.strictEqual(res.status, 400);
  });

  await t.test('PUT /:clientId — saves valid preferences', async () => {
    mockDb.query = async () => ({
      rows: [{ preferences: { categories: ['moon', 'tarot'] }, updated_at: '2026-01-01' }],
    });
    const res = await request(app, {
      method: 'PUT',
      path: `/api/preferences/${VALID_CLIENT_ID}`,
      body: { categories: ['moon', 'tarot'] },
    });
    assert.strictEqual(res.status, 200);
    assert.deepStrictEqual(res.body.preferences.categories, ['moon', 'tarot']);
  });

  await t.test('PUT /:clientId — validates locationRadius range', async () => {
    const res = await request(app, {
      method: 'PUT',
      path: `/api/preferences/${VALID_CLIENT_ID}`,
      body: { locationRadius: 9999 },
    });
    assert.strictEqual(res.status, 400);
  });

  await t.test('PUT /:clientId — accepts valid location', async () => {
    mockDb.query = async () => ({
      rows: [{ preferences: { location: { lat: 32.0, lng: 34.8 } }, updated_at: '2026-01-01' }],
    });
    const res = await request(app, {
      method: 'PUT',
      path: `/api/preferences/${VALID_CLIENT_ID}`,
      body: { location: { lat: 32.0, lng: 34.8 } },
    });
    assert.strictEqual(res.status, 200);
  });

  await t.test('DELETE /:clientId — returns 404 when not found', async () => {
    mockDb.query = async () => ({ rowCount: 0 });
    const res = await request(app, {
      method: 'DELETE',
      path: `/api/preferences/${VALID_CLIENT_ID}`,
    });
    assert.strictEqual(res.status, 404);
  });

  await t.test('DELETE /:clientId — deletes successfully', async () => {
    mockDb.query = async () => ({ rowCount: 1 });
    const res = await request(app, {
      method: 'DELETE',
      path: `/api/preferences/${VALID_CLIENT_ID}`,
    });
    assert.strictEqual(res.status, 200);
  });

  await t.test('POST /:clientId/feed — returns 404 without preferences', async () => {
    mockDb.query = async () => ({ rows: [] });
    const res = await request(app, {
      method: 'POST',
      path: `/api/preferences/${VALID_CLIENT_ID}/feed`,
    });
    assert.strictEqual(res.status, 404);
  });

  await t.test('POST /:clientId/feed — returns ranked feed', async () => {
    mockDb.query = async () => ({
      rows: [{ preferences: { categories: ['moon'] } }],
    });
    let snapshotCallCount = 0;
    mockDb.getLatestSnapshot = async (cat) => {
      snapshotCallCount++;
      if (cat === 'moon') return { data: { phase: 'full' }, collected_at: '2026-01-01' };
      return null;
    };
    const res = await request(app, {
      method: 'POST',
      path: `/api/preferences/${VALID_CLIENT_ID}/feed`,
    });
    assert.strictEqual(res.status, 200);
    assert.ok(res.body.feed);
    assert.ok(res.body.preferredCount >= 0);
  });
});
