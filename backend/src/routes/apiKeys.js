/**
 * API Keys Routes
 *
 * Endpoints for managing API keys (developer portal).
 *
 * POST   /api/keys          - Create a new API key
 * GET    /api/keys          - List all keys (admin)
 * GET    /api/keys/:keyId   - Get key details
 * GET    /api/keys/:keyId/usage - Get usage statistics
 * PATCH  /api/keys/:keyId   - Update key (tier, name)
 * DELETE /api/keys/:keyId   - Revoke key
 */

const express = require('express');
const router = express.Router();
const apiKeyService = require('../services/apiKeyService');

/**
 * POST /api/keys
 * Create a new API key
 *
 * Body: { name: string, tier?: 'free'|'pro'|'enterprise', email?: string }
 */
router.post('/', async (req, res) => {
  try {
    const { name, tier = 'free', email } = req.body;

    if (!name || typeof name !== 'string' || name.length < 3) {
      return res.status(400).json({
        error: 'Bad Request',
        message: 'Name is required and must be at least 3 characters.',
      });
    }

    const validTiers = ['free', 'pro', 'enterprise'];
    if (!validTiers.includes(tier)) {
      return res.status(400).json({
        error: 'Bad Request',
        message: `Invalid tier. Must be one of: ${validTiers.join(', ')}`,
      });
    }

    const key = await apiKeyService.createKey({
      name,
      tier,
      ownerEmail: email || null,
    });

    res.status(201).json({
      success: true,
      message: 'API key created successfully. Store the secret key safely - it will not be shown again!',
      key: {
        keyId: key.key_id,
        secretKey: key.secretKey, // Only shown once!
        name: key.name,
        tier: key.tier,
        dailyLimit: key.daily_limit,
        createdAt: key.created_at,
      },
    });
  } catch (error) {
    console.error('Error creating API key:', error);
    res.status(500).json({
      error: 'Internal Server Error',
      message: 'Failed to create API key.',
    });
  }
});

/**
 * GET /api/keys
 * List all API keys
 *
 * Query: { activeOnly?: boolean, tier?: string, limit?: number }
 */
router.get('/', async (req, res) => {
  try {
    const {
      activeOnly = 'true',
      tier,
      limit = 50,
    } = req.query;

    const keys = await apiKeyService.listKeys({
      activeOnly: activeOnly === 'true',
      tier: tier || null,
      limit: parseInt(limit, 10) || 50,
    });

    res.json({
      success: true,
      count: keys.length,
      keys: keys.map(key => ({
        keyId: key.key_id,
        name: key.name,
        tier: key.tier,
        dailyLimit: key.daily_limit,
        isActive: key.is_active,
        createdAt: key.created_at,
        lastUsedAt: key.last_used_at,
      })),
    });
  } catch (error) {
    console.error('Error listing API keys:', error);
    res.status(500).json({
      error: 'Internal Server Error',
      message: 'Failed to list API keys.',
    });
  }
});

/**
 * GET /api/keys/:keyId
 * Get API key details
 */
router.get('/:keyId', async (req, res) => {
  try {
    const { keyId } = req.params;

    const key = await apiKeyService.getKeyById(keyId);

    if (!key) {
      return res.status(404).json({
        error: 'Not Found',
        message: 'API key not found.',
      });
    }

    res.json({
      success: true,
      key: {
        keyId: key.key_id,
        name: key.name,
        tier: key.tier,
        dailyLimit: key.daily_limit,
        isActive: key.is_active,
        createdAt: key.created_at,
        lastUsedAt: key.last_used_at,
        revokedAt: key.revoked_at,
      },
    });
  } catch (error) {
    console.error('Error getting API key:', error);
    res.status(500).json({
      error: 'Internal Server Error',
      message: 'Failed to get API key details.',
    });
  }
});

/**
 * GET /api/keys/:keyId/usage
 * Get usage statistics for an API key
 *
 * Query: { days?: number }
 */
router.get('/:keyId/usage', async (req, res) => {
  try {
    const { keyId } = req.params;
    const { days = 30 } = req.query;

    const usage = await apiKeyService.getUsageStats(keyId, parseInt(days, 10) || 30);

    if (!usage) {
      return res.status(404).json({
        error: 'Not Found',
        message: 'API key not found.',
      });
    }

    res.json({
      success: true,
      usage,
    });
  } catch (error) {
    console.error('Error getting API key usage:', error);
    res.status(500).json({
      error: 'Internal Server Error',
      message: 'Failed to get usage statistics.',
    });
  }
});

/**
 * PATCH /api/keys/:keyId
 * Update API key (tier, name)
 *
 * Body: { tier?: string, name?: string }
 */
router.patch('/:keyId', async (req, res) => {
  try {
    const { keyId } = req.params;
    const { tier } = req.body;

    if (!tier) {
      return res.status(400).json({
        error: 'Bad Request',
        message: 'At least one field (tier) must be provided.',
      });
    }

    const validTiers = ['free', 'pro', 'enterprise'];
    if (!validTiers.includes(tier)) {
      return res.status(400).json({
        error: 'Bad Request',
        message: `Invalid tier. Must be one of: ${validTiers.join(', ')}`,
      });
    }

    const key = await apiKeyService.updateKeyTier(keyId, tier);

    if (!key) {
      return res.status(404).json({
        error: 'Not Found',
        message: 'API key not found or already revoked.',
      });
    }

    res.json({
      success: true,
      message: 'API key updated successfully.',
      key: {
        keyId: key.key_id,
        name: key.name,
        tier: key.tier,
        dailyLimit: key.daily_limit,
        isActive: key.is_active,
      },
    });
  } catch (error) {
    console.error('Error updating API key:', error);
    res.status(500).json({
      error: 'Internal Server Error',
      message: 'Failed to update API key.',
    });
  }
});

/**
 * DELETE /api/keys/:keyId
 * Revoke an API key
 */
router.delete('/:keyId', async (req, res) => {
  try {
    const { keyId } = req.params;

    const revoked = await apiKeyService.revokeKey(keyId);

    if (!revoked) {
      return res.status(404).json({
        error: 'Not Found',
        message: 'API key not found or already revoked.',
      });
    }

    res.json({
      success: true,
      message: 'API key revoked successfully.',
    });
  } catch (error) {
    console.error('Error revoking API key:', error);
    res.status(500).json({
      error: 'Internal Server Error',
      message: 'Failed to revoke API key.',
    });
  }
});

module.exports = router;
