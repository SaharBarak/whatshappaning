/**
 * Email Routes - Newsletter subscription and notifications
 *
 * Placeholder for email functionality.
 */

const express = require('express');
const router = express.Router();

/**
 * POST /api/email/subscribe
 * Subscribe to newsletter (stub)
 */
router.post('/subscribe', async (req, res) => {
  res.status(501).json({
    error: 'Not Implemented',
    message: 'Email subscriptions are coming soon.',
  });
});

/**
 * POST /api/email/unsubscribe
 * Unsubscribe from newsletter (stub)
 */
router.post('/unsubscribe', async (req, res) => {
  res.status(501).json({
    error: 'Not Implemented',
    message: 'Email subscriptions are coming soon.',
  });
});

module.exports = router;
