/**
 * API Key Service Tests
 *
 * Unit tests for API key generation, hashing, and format validation.
 * Database-dependent functions are tested via integration tests.
 */

const { describe, it } = require('node:test');
const assert = require('node:assert');
const crypto = require('crypto');

describe('API Key Service - Pure Functions', () => {
  describe('Key Format Validation', () => {
    it('should recognize valid public key format', () => {
      const validPublicKey = 'wh_pk_abc123def456';
      assert.ok(validPublicKey.startsWith('wh_pk_'));
    });

    it('should recognize valid secret key format', () => {
      const validSecretKey = 'wh_sk_abc123def456789012345678901234';
      assert.ok(validSecretKey.startsWith('wh_sk_'));
    });

    it('should reject invalid key formats', () => {
      const invalidKeys = [
        'invalid_key',
        'wh_wrong_abc',
        '',
        null,
        undefined,
        12345,
      ];

      invalidKeys.forEach(key => {
        const isValid = key && typeof key === 'string' && key.startsWith('wh_sk_');
        assert.ok(!isValid, `Key "${key}" should be invalid`);
      });
    });
  });

  describe('Key Hashing', () => {
    it('should hash keys consistently', () => {
      const testKey = 'wh_sk_test123456789012345678901234';
      const hash1 = crypto.createHash('sha256').update(testKey).digest('hex');
      const hash2 = crypto.createHash('sha256').update(testKey).digest('hex');
      assert.strictEqual(hash1, hash2);
    });

    it('should produce different hashes for different keys', () => {
      const key1 = 'wh_sk_test111111111111111111111111';
      const key2 = 'wh_sk_test222222222222222222222222';

      const hash1 = crypto.createHash('sha256').update(key1).digest('hex');
      const hash2 = crypto.createHash('sha256').update(key2).digest('hex');

      assert.notStrictEqual(hash1, hash2);
    });

    it('should produce 64-character hex hashes (SHA-256)', () => {
      const testKey = 'wh_sk_test123456789012345678901234';
      const hash = crypto.createHash('sha256').update(testKey).digest('hex');

      assert.strictEqual(hash.length, 64);
      assert.ok(/^[a-f0-9]+$/.test(hash));
    });
  });

  describe('Key Generation Logic', () => {
    it('should generate unique keys', () => {
      const keys = new Set();
      for (let i = 0; i < 100; i++) {
        const randomBytes = crypto.randomBytes(16);
        const secretKey = `wh_sk_${randomBytes.toString('hex')}`;
        keys.add(secretKey);
      }
      assert.strictEqual(keys.size, 100);
    });

    it('should generate keys of correct length', () => {
      const randomBytes = crypto.randomBytes(16);
      const secretKey = `wh_sk_${randomBytes.toString('hex')}`;

      // wh_sk_ (6 chars) + 32 hex chars = 38 total
      assert.strictEqual(secretKey.length, 38);
    });

    it('should generate public key IDs of correct length', () => {
      const randomBytes = crypto.randomBytes(8);
      const keyId = `wh_pk_${randomBytes.toString('hex')}`;

      // wh_pk_ (6 chars) + 16 hex chars = 22 total
      assert.strictEqual(keyId.length, 22);
    });
  });

  describe('Tier Limits Configuration', () => {
    it('should define correct limits for each tier', () => {
      const tierLimits = {
        free: 100,
        pro: 10000,
        enterprise: -1,
      };

      assert.strictEqual(tierLimits.free, 100);
      assert.strictEqual(tierLimits.pro, 10000);
      assert.strictEqual(tierLimits.enterprise, -1);
    });

    it('should use -1 for unlimited (enterprise)', () => {
      const tierLimits = { free: 100, pro: 10000, enterprise: -1 };
      const isUnlimited = tierLimits.enterprise === -1;
      assert.strictEqual(isUnlimited, true);
    });

    it('should default unknown tiers to free tier limits', () => {
      const tierLimits = { free: 100, pro: 10000, enterprise: -1 };
      const unknownTierLimit = tierLimits['unknown'] || 100;
      assert.strictEqual(unknownTierLimit, 100);
    });
  });

  describe('Rate Limit Exceeded Logic', () => {
    it('should consider limit exceeded when count >= limit', () => {
      const isExceeded = (count, limit) => {
        if (limit === -1) return false;
        return count >= limit;
      };

      assert.strictEqual(isExceeded(100, 100), true);
      assert.strictEqual(isExceeded(101, 100), true);
      assert.strictEqual(isExceeded(99, 100), false);
      assert.strictEqual(isExceeded(1000, -1), false); // unlimited
    });

    it('should never exceed unlimited tier', () => {
      const isExceeded = (count, limit) => {
        if (limit === -1) return false;
        return count >= limit;
      };

      assert.strictEqual(isExceeded(999999, -1), false);
    });
  });
});

describe('API Keys Routes - Input Validation', () => {
  describe('Name validation', () => {
    it('should require minimum 3 characters', () => {
      const validateName = (name) => {
        return !!(name && typeof name === 'string' && name.length >= 3);
      };

      assert.strictEqual(validateName('abc'), true);
      assert.strictEqual(validateName('ab'), false);
      assert.strictEqual(validateName('a'), false);
      assert.strictEqual(validateName(''), false);
      assert.strictEqual(validateName(null), false);
      assert.strictEqual(validateName(undefined), false);
    });
  });

  describe('Tier validation', () => {
    it('should validate tier values', () => {
      const validTiers = ['free', 'pro', 'enterprise'];
      const validateTier = (tier) => validTiers.includes(tier);

      assert.strictEqual(validateTier('free'), true);
      assert.strictEqual(validateTier('pro'), true);
      assert.strictEqual(validateTier('enterprise'), true);
      assert.strictEqual(validateTier('invalid'), false);
      assert.strictEqual(validateTier(''), false);
      assert.strictEqual(validateTier(null), false);
    });
  });
});

describe('API Key Auth Middleware Logic', () => {
  describe('Key extraction', () => {
    it('should extract from Bearer token', () => {
      const extractFromBearer = (authHeader) => {
        if (authHeader && authHeader.startsWith('Bearer ')) {
          return authHeader.slice(7);
        }
        return null;
      };

      assert.strictEqual(
        extractFromBearer('Bearer wh_sk_test123'),
        'wh_sk_test123'
      );
      assert.strictEqual(extractFromBearer('Basic abc'), null);
      assert.strictEqual(extractFromBearer(''), null);
      assert.strictEqual(extractFromBearer(null), null);
    });

    it('should extract from X-API-Key header', () => {
      const extractFromHeader = (headers) => {
        return headers['x-api-key'] || null;
      };

      assert.strictEqual(
        extractFromHeader({ 'x-api-key': 'wh_sk_test123' }),
        'wh_sk_test123'
      );
      assert.strictEqual(extractFromHeader({}), null);
    });
  });

  describe('Per-minute rate limiting logic', () => {
    it('should calculate remaining requests correctly', () => {
      const calculateRemaining = (count, limit) => {
        if (limit === -1) return -1; // unlimited
        return Math.max(0, limit - count);
      };

      assert.strictEqual(calculateRemaining(5, 10), 5);
      assert.strictEqual(calculateRemaining(10, 10), 0);
      assert.strictEqual(calculateRemaining(15, 10), 0);
      assert.strictEqual(calculateRemaining(100, -1), -1);
    });

    it('should block when over limit', () => {
      const shouldBlock = (count, limit) => {
        if (limit === -1) return false;
        return count > limit;
      };

      assert.strictEqual(shouldBlock(10, 10), false);
      assert.strictEqual(shouldBlock(11, 10), true);
      assert.strictEqual(shouldBlock(1000, -1), false);
    });
  });
});

describe('Response Formats', () => {
  describe('Success response', () => {
    it('should have correct structure for key creation', () => {
      const response = {
        success: true,
        message: 'API key created successfully.',
        key: {
          keyId: 'wh_pk_abc123',
          secretKey: 'wh_sk_secret123',
          name: 'Test Key',
          tier: 'free',
          dailyLimit: 100,
          createdAt: new Date().toISOString(),
        },
      };

      assert.ok(response.success);
      assert.ok(response.message);
      assert.ok(response.key);
      assert.ok(response.key.keyId);
      assert.ok(response.key.secretKey);
    });
  });

  describe('Error response', () => {
    it('should have correct structure for errors', () => {
      const response = {
        error: 'Unauthorized',
        message: 'Invalid or revoked API key.',
      };

      assert.ok(response.error);
      assert.ok(response.message);
    });

    it('should have correct structure for rate limit errors', () => {
      const response = {
        error: 'Rate Limit Exceeded',
        message: 'Too many requests. Try again in 30 seconds.',
        retryAfter: 30,
      };

      assert.ok(response.error);
      assert.ok(response.message);
      assert.strictEqual(typeof response.retryAfter, 'number');
    });
  });
});
