/**
 * Export Routes - Data export and sharing endpoints
 *
 * Endpoints:
 * - GET /api/export/image - Generate shareable image
 * - GET /api/export/pdf - Generate PDF report
 * - GET /api/export/json - Export data as JSON
 * - GET /api/export/csv - Export data as CSV
 * - GET /api/export/og - Get Open Graph metadata
 * - GET /api/export/share-text - Get share text for social
 */

const express = require('express');
const router = express.Router();
const cache = require('../utils/cache');
const prediction = require('../prediction');
const db = require('../db');

// Lazy load export module (canvas/pdfkit may not be available)
let exportModule = null;
function getExportModule() {
  if (!exportModule) {
    try {
      exportModule = require('../export');
    } catch (err) {
      console.warn('Export module not available:', err.message);
      return null;
    }
  }
  return exportModule;
}

// Valid modules for data gathering
const VALID_MODULES = [
  'moon', 'tzolkin', 'dreamspell', 'parasha', 'gematria',
  'astrology', 'solar', 'schumann', 'tarot', 'news',
  'numerology', 'iching', 'cosmic', 'markets', 'geophysical', 'sentiment'
];

/**
 * Get current predictions data for export
 */
async function getPredictionData() {
  // Try cache first
  const cached = cache.get('api:predictions');
  if (cached) {
    return cached;
  }

  // Gather current module data
  const moduleDataMap = {};
  for (const moduleName of VALID_MODULES) {
    const snapshot = await db.getLatestSnapshot(moduleName);
    if (snapshot && snapshot.data) {
      moduleDataMap[moduleName] = snapshot.data;
    }
  }

  // Generate predictions
  const data = await prediction.generatePredictions(moduleDataMap);

  // Cache for 3 hours
  cache.set('api:predictions', data, 3 * 60 * 60 * 1000);

  return data;
}

/**
 * GET /api/export/image
 * Generate shareable image card
 *
 * Query params:
 * - format: square (default), story, wide, compact
 * - date: specific date (optional)
 */
router.get('/image', async (req, res) => {
  try {
    const exp = getExportModule();
    if (!exp) {
      return res.status(503).json({
        error: 'Image export not available',
        message: 'Canvas dependencies not installed'
      });
    }

    const format = req.query.format || 'square';
    if (!exp.CARD_FORMATS[format]) {
      return res.status(400).json({
        error: 'Invalid format',
        validFormats: Object.keys(exp.CARD_FORMATS)
      });
    }

    // Check cache
    const cacheKey = `export:image:${format}`;
    const cached = cache.get(cacheKey);
    if (cached) {
      res.set('Content-Type', 'image/png');
      res.set('Cache-Control', 'public, max-age=3600');
      return res.send(cached);
    }

    // Get prediction data
    const data = await getPredictionData();

    // Generate image
    const imageBuffer = await exp.generateShareImage(data, format);

    // Cache for 1 hour
    cache.set(cacheKey, imageBuffer, 60 * 60 * 1000);

    res.set('Content-Type', 'image/png');
    res.set('Content-Disposition', `inline; filename="whatshappening-${data.date || 'today'}-${format}.png"`);
    res.set('Cache-Control', 'public, max-age=3600');
    res.send(imageBuffer);
  } catch (err) {
    console.error('Error generating image:', err);
    res.status(500).json({ error: 'Failed to generate image', message: err.message });
  }
});

/**
 * GET /api/export/pdf
 * Generate PDF report
 */
router.get('/pdf', async (req, res) => {
  try {
    const exp = getExportModule();
    if (!exp) {
      return res.status(503).json({
        error: 'PDF export not available',
        message: 'PDFKit dependencies not installed'
      });
    }

    // Get prediction data
    const data = await getPredictionData();

    // Generate PDF
    const pdfBuffer = await exp.generatePDFReport(data);

    res.set('Content-Type', 'application/pdf');
    res.set('Content-Disposition', `attachment; filename="whatshappening-report-${data.date || 'today'}.pdf"`);
    res.set('Cache-Control', 'public, max-age=3600');
    res.send(pdfBuffer);
  } catch (err) {
    console.error('Error generating PDF:', err);
    res.status(500).json({ error: 'Failed to generate PDF', message: err.message });
  }
});

/**
 * GET /api/export/json
 * Export data as JSON
 */
router.get('/json', async (req, res) => {
  try {
    const exp = getExportModule();

    // Get prediction data
    const data = await getPredictionData();

    // Format for export
    const exportData = exp
      ? exp.generateJSONExport(data)
      : {
          exportedAt: new Date().toISOString(),
          ...data
        };

    res.set('Content-Type', 'application/json');
    res.set('Content-Disposition', `attachment; filename="whatshappening-${data.date || 'today'}.json"`);
    res.json(exportData);
  } catch (err) {
    console.error('Error generating JSON export:', err);
    res.status(500).json({ error: 'Failed to generate JSON export', message: err.message });
  }
});

/**
 * GET /api/export/csv
 * Export data as CSV
 */
router.get('/csv', async (req, res) => {
  try {
    const exp = getExportModule();

    // Get prediction data
    const data = await getPredictionData();

    // Generate CSV
    let csvContent;
    if (exp) {
      csvContent = exp.generateCSVExport(data);
    } else {
      // Fallback simple CSV
      const lines = ['Outcome,Probability,Confidence'];
      (data.predictions || []).forEach(p => {
        lines.push(`"${p.outcome || p.outcomeId}",${p.probability || ''},${p.confidence || ''}`);
      });
      csvContent = lines.join('\n');
    }

    res.set('Content-Type', 'text/csv');
    res.set('Content-Disposition', `attachment; filename="whatshappening-${data.date || 'today'}.csv"`);
    res.send(csvContent);
  } catch (err) {
    console.error('Error generating CSV export:', err);
    res.status(500).json({ error: 'Failed to generate CSV export', message: err.message });
  }
});

/**
 * GET /api/export/og
 * Get Open Graph metadata for sharing
 */
router.get('/og', async (req, res) => {
  try {
    const exp = getExportModule();

    // Get prediction data
    const data = await getPredictionData();

    // Determine base URL
    const protocol = req.protocol;
    const host = req.get('host');
    const baseUrl = `${protocol}://${host}`;

    // Generate OG metadata
    const ogMeta = exp
      ? exp.generateOpenGraphMeta(data, baseUrl)
      : {
          title: `What's Happening - ${data.date || 'Today'}`,
          description: 'Data-driven predictions',
          image: `${baseUrl}/api/export/image?format=wide`,
          url: baseUrl,
          type: 'website'
        };

    res.json(ogMeta);
  } catch (err) {
    console.error('Error generating OG metadata:', err);
    res.status(500).json({ error: 'Failed to generate OG metadata', message: err.message });
  }
});

/**
 * GET /api/export/share-text
 * Get formatted share text for social platforms
 *
 * Query params:
 * - platform: twitter (default), facebook, whatsapp, generic
 */
router.get('/share-text', async (req, res) => {
  try {
    const exp = getExportModule();
    const platform = req.query.platform || 'twitter';

    // Get prediction data
    const data = await getPredictionData();

    // Generate share text
    let shareText;
    if (exp) {
      shareText = exp.generateShareText(data, platform);
    } else {
      // Fallback
      const topPred = (data.predictions || [])[0];
      shareText = topPred
        ? `What's Happening: ${topPred.outcome || topPred.outcomeId} at ${Math.round(topPred.probability * 100)}%`
        : "Check out What's Happening - data-driven predictions";
    }

    res.json({
      platform,
      text: shareText,
      url: 'https://whatshappening.app'
    });
  } catch (err) {
    console.error('Error generating share text:', err);
    res.status(500).json({ error: 'Failed to generate share text', message: err.message });
  }
});

module.exports = router;
