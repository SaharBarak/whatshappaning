/**
 * Export Module
 *
 * Generates shareable content: images, PDFs, JSON, and CSV exports.
 * Per EPIC-007: Data Export & Social Sharing
 */

const { createCanvas, loadImage } = require('canvas');
const PDFDocument = require('pdfkit');
const config = require('../config');

// Share card dimensions for different formats
const CARD_FORMATS = {
  square: { width: 1080, height: 1080 },
  story: { width: 1080, height: 1920 },
  wide: { width: 1200, height: 630 },
  compact: { width: 600, height: 315 }
};

// Colors from the design system
const COLORS = {
  bgPrimary: '#0a0a0f',
  bgCard: '#12121a',
  bgPrediction: '#0d1117',
  textPrimary: '#e0e0e0',
  textSecondary: '#888888',
  textMuted: '#555555',
  barFill: '#3b82f6',
  barBg: '#1e293b',
  positive: '#4ade80',
  negative: '#f87171',
  alertBorder: '#f59e0b',
  confidenceVeryHigh: '#22c55e',
  confidenceHigh: '#4ade80',
  confidenceMedium: '#fbbf24',
  confidenceLow: '#f87171'
};

/**
 * Format date for display
 * @param {Date} date
 * @returns {string}
 */
function formatDate(date = new Date()) {
  return date.toLocaleDateString('en-US', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });
}

/**
 * Format short date
 * @param {Date} date
 * @returns {string}
 */
function formatShortDate(date = new Date()) {
  return date.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric'
  });
}

/**
 * Draw rounded rectangle
 */
function roundRect(ctx, x, y, width, height, radius) {
  ctx.beginPath();
  ctx.moveTo(x + radius, y);
  ctx.lineTo(x + width - radius, y);
  ctx.quadraticCurveTo(x + width, y, x + width, y + radius);
  ctx.lineTo(x + width, y + height - radius);
  ctx.quadraticCurveTo(x + width, y + height, x + width - radius, y + height);
  ctx.lineTo(x + radius, y + height);
  ctx.quadraticCurveTo(x, y + height, x, y + height - radius);
  ctx.lineTo(x, y + radius);
  ctx.quadraticCurveTo(x, y, x + radius, y);
  ctx.closePath();
}

/**
 * Generate share card image
 *
 * @param {Object} data - Prediction data
 * @param {string} format - Card format (square, story, wide, compact)
 * @returns {Promise<Buffer>} PNG image buffer
 */
async function generateShareImage(data, format = 'square') {
  const dimensions = CARD_FORMATS[format] || CARD_FORMATS.square;
  const canvas = createCanvas(dimensions.width, dimensions.height);
  const ctx = canvas.getContext('2d');

  const padding = Math.round(dimensions.width * 0.05);
  const isCompact = format === 'compact';
  const isStory = format === 'story';

  // Background
  ctx.fillStyle = COLORS.bgPrimary;
  ctx.fillRect(0, 0, dimensions.width, dimensions.height);

  // Header section
  const headerHeight = isCompact ? 60 : (isStory ? 180 : 120);
  ctx.fillStyle = COLORS.bgCard;
  ctx.fillRect(0, 0, dimensions.width, headerHeight);

  // Title
  const titleSize = isCompact ? 24 : (isStory ? 48 : 36);
  ctx.font = `bold ${titleSize}px Inter, -apple-system, sans-serif`;
  ctx.fillStyle = COLORS.textPrimary;
  ctx.textAlign = 'center';
  ctx.fillText("WHAT'S HAPPENING", dimensions.width / 2, headerHeight / 2 - (isCompact ? 0 : 10));

  // Date
  const dateSize = isCompact ? 14 : (isStory ? 24 : 18);
  ctx.font = `${dateSize}px Inter, -apple-system, sans-serif`;
  ctx.fillStyle = COLORS.textSecondary;
  ctx.fillText(formatDate(new Date(data.date || Date.now())), dimensions.width / 2, headerHeight / 2 + (isCompact ? 20 : 25));

  // Predictions section
  const predictions = data.predictions || [];
  const topPredictions = predictions
    .sort((a, b) => b.probability - a.probability)
    .slice(0, isCompact ? 2 : (isStory ? 6 : 4));

  const startY = headerHeight + padding;
  const cardHeight = isCompact ? 50 : (isStory ? 100 : 80);
  const cardSpacing = isCompact ? 10 : 15;

  topPredictions.forEach((prediction, index) => {
    const y = startY + index * (cardHeight + cardSpacing);

    // Card background
    ctx.fillStyle = COLORS.bgCard;
    roundRect(ctx, padding, y, dimensions.width - padding * 2, cardHeight, 8);
    ctx.fill();

    // Prediction name
    const nameSize = isCompact ? 14 : (isStory ? 22 : 18);
    ctx.font = `600 ${nameSize}px Inter, -apple-system, sans-serif`;
    ctx.fillStyle = COLORS.textPrimary;
    ctx.textAlign = 'left';

    const displayName = prediction.outcome || prediction.outcomeId;
    ctx.fillText(displayName, padding + 15, y + (isCompact ? 20 : 30));

    // Probability
    const probPercent = Math.round((prediction.probability || 0) * 100);
    const probSize = isCompact ? 18 : (isStory ? 28 : 24);
    ctx.font = `bold ${probSize}px "JetBrains Mono", monospace`;
    ctx.textAlign = 'right';

    // Color based on probability
    if (probPercent >= 70) {
      ctx.fillStyle = COLORS.confidenceVeryHigh;
    } else if (probPercent >= 50) {
      ctx.fillStyle = COLORS.confidenceHigh;
    } else if (probPercent >= 30) {
      ctx.fillStyle = COLORS.confidenceMedium;
    } else {
      ctx.fillStyle = COLORS.confidenceLow;
    }
    ctx.fillText(`${probPercent}%`, dimensions.width - padding - 15, y + (isCompact ? 20 : 30));

    // Progress bar
    const barY = y + (isCompact ? 32 : 50);
    const barHeight = isCompact ? 6 : 10;
    const barWidth = dimensions.width - padding * 2 - 30;

    // Bar background
    ctx.fillStyle = COLORS.barBg;
    roundRect(ctx, padding + 15, barY, barWidth, barHeight, barHeight / 2);
    ctx.fill();

    // Bar fill
    ctx.fillStyle = COLORS.barFill;
    const fillWidth = (probPercent / 100) * barWidth;
    if (fillWidth > 0) {
      roundRect(ctx, padding + 15, barY, fillWidth, barHeight, barHeight / 2);
      ctx.fill();
    }
  });

  // Pattern alert (if exists and space allows)
  if (!isCompact && data.patternAlerts && data.patternAlerts.length > 0) {
    const alert = data.patternAlerts[0];
    const alertY = startY + topPredictions.length * (cardHeight + cardSpacing) + padding;

    if (alertY + 80 < dimensions.height - 80) {
      // Alert box
      ctx.fillStyle = '#1c1917';
      ctx.strokeStyle = COLORS.alertBorder;
      ctx.lineWidth = 2;
      roundRect(ctx, padding, alertY, dimensions.width - padding * 2, 70, 8);
      ctx.fill();
      ctx.stroke();

      // Alert icon and text
      const alertSize = isStory ? 18 : 14;
      ctx.font = `600 ${alertSize}px Inter, -apple-system, sans-serif`;
      ctx.fillStyle = COLORS.alertBorder;
      ctx.textAlign = 'left';
      ctx.fillText('PATTERN ALERT', padding + 20, alertY + 25);

      // Match percentage
      if (alert.matchPercentage) {
        ctx.font = `500 ${alertSize}px "JetBrains Mono", monospace`;
        ctx.textAlign = 'right';
        ctx.fillText(`${alert.matchPercentage}% match`, dimensions.width - padding - 20, alertY + 25);
      }

      // Description (truncated)
      if (alert.description) {
        ctx.font = `${alertSize - 2}px Inter, -apple-system, sans-serif`;
        ctx.fillStyle = COLORS.textSecondary;
        ctx.textAlign = 'left';
        const desc = alert.description.length > 60
          ? alert.description.substring(0, 57) + '...'
          : alert.description;
        ctx.fillText(desc, padding + 20, alertY + 50);
      }
    }
  }

  // Footer / Branding
  const footerHeight = isCompact ? 40 : 60;
  const footerY = dimensions.height - footerHeight;

  ctx.fillStyle = COLORS.bgCard;
  ctx.fillRect(0, footerY, dimensions.width, footerHeight);

  const brandSize = isCompact ? 14 : 18;
  ctx.font = `600 ${brandSize}px Inter, -apple-system, sans-serif`;
  ctx.fillStyle = COLORS.textSecondary;
  ctx.textAlign = 'center';
  ctx.fillText('whatshappening.app', dimensions.width / 2, footerY + footerHeight / 2 + 5);

  return canvas.toBuffer('image/png');
}

/**
 * Generate PDF report
 *
 * @param {Object} data - Prediction data with modules
 * @returns {Promise<Buffer>} PDF buffer
 */
async function generatePDFReport(data) {
  return new Promise((resolve, reject) => {
    const doc = new PDFDocument({
      size: 'LETTER',
      margin: 50,
      info: {
        Title: `What's Happening Daily Report - ${formatShortDate()}`,
        Author: "What's Happening",
        Subject: 'Daily Prediction Report'
      }
    });

    const chunks = [];
    doc.on('data', chunk => chunks.push(chunk));
    doc.on('end', () => resolve(Buffer.concat(chunks)));
    doc.on('error', reject);

    // Title
    doc.fontSize(24)
       .font('Helvetica-Bold')
       .text("WHAT'S HAPPENING", { align: 'center' });

    doc.fontSize(14)
       .font('Helvetica')
       .fillColor('#666666')
       .text(`Daily Report - ${formatDate()}`, { align: 'center' });

    doc.moveDown(2);

    // Predictions Section
    doc.fontSize(16)
       .font('Helvetica-Bold')
       .fillColor('#000000')
       .text('PREDICTIONS');

    doc.moveDown(0.5);
    doc.moveTo(50, doc.y).lineTo(562, doc.y).stroke('#dddddd');
    doc.moveDown(0.5);

    const predictions = data.predictions || [];
    predictions.forEach(prediction => {
      const prob = Math.round((prediction.probability || 0) * 100);
      const name = prediction.outcome || prediction.outcomeId;
      const confidence = prediction.confidence || 'Unknown';
      const ci = prediction.confidenceInterval
        ? `[${Math.round(prediction.confidenceInterval[0] * 100)}-${Math.round(prediction.confidenceInterval[1] * 100)}%]`
        : '';

      doc.fontSize(12)
         .font('Helvetica-Bold')
         .fillColor('#333333')
         .text(`${name}`, { continued: true })
         .font('Helvetica')
         .text(`  ${prob}% ${ci}`, { align: 'right' });

      doc.fontSize(10)
         .fillColor('#666666')
         .text(`Confidence: ${confidence} | Sample size: n=${prediction.sampleSize || '?'}`);

      doc.moveDown(0.5);
    });

    // Pattern Alerts Section
    if (data.patternAlerts && data.patternAlerts.length > 0) {
      doc.addPage();
      doc.fontSize(16)
         .font('Helvetica-Bold')
         .fillColor('#000000')
         .text('PATTERN ALERTS');

      doc.moveDown(0.5);
      doc.moveTo(50, doc.y).lineTo(562, doc.y).stroke('#f59e0b');
      doc.moveDown(0.5);

      data.patternAlerts.forEach(alert => {
        doc.fontSize(12)
           .font('Helvetica-Bold')
           .fillColor('#92400e')
           .text(alert.title || 'Pattern Match');

        if (alert.description) {
          doc.fontSize(10)
             .font('Helvetica')
             .fillColor('#666666')
             .text(alert.description);
        }

        if (alert.matchingDates && alert.matchingDates.length > 0) {
          doc.fontSize(10)
             .fillColor('#888888')
             .text(`Similar dates: ${alert.matchingDates.slice(0, 5).join(', ')}`);
        }

        doc.moveDown(0.5);
      });
    }

    // Suggestions Section
    if (data.actionSuggestions) {
      doc.addPage();
      doc.fontSize(16)
         .font('Helvetica-Bold')
         .fillColor('#000000')
         .text('SUGGESTIONS');

      doc.moveDown(0.5);
      doc.moveTo(50, doc.y).lineTo(562, doc.y).stroke('#dddddd');
      doc.moveDown(0.5);

      const suggestions = data.actionSuggestions;

      if (suggestions.favorable && suggestions.favorable.length > 0) {
        doc.fontSize(12)
           .font('Helvetica-Bold')
           .fillColor('#16a34a')
           .text('Favorable:');
        suggestions.favorable.forEach(item => {
          doc.fontSize(10)
             .font('Helvetica')
             .fillColor('#333333')
             .text(`  - ${item}`);
        });
        doc.moveDown(0.5);
      }

      if (suggestions.caution && suggestions.caution.length > 0) {
        doc.fontSize(12)
           .font('Helvetica-Bold')
           .fillColor('#dc2626')
           .text('Caution:');
        suggestions.caution.forEach(item => {
          doc.fontSize(10)
             .font('Helvetica')
             .fillColor('#333333')
             .text(`  - ${item}`);
        });
        doc.moveDown(0.5);
      }

      if (suggestions.info && suggestions.info.length > 0) {
        doc.fontSize(12)
           .font('Helvetica-Bold')
           .fillColor('#64748b')
           .text('Information:');
        suggestions.info.forEach(item => {
          doc.fontSize(10)
             .font('Helvetica')
             .fillColor('#333333')
             .text(`  - ${item}`);
        });
      }
    }

    // Disclaimer
    doc.moveDown(2);
    doc.fontSize(8)
       .font('Helvetica-Oblique')
       .fillColor('#999999')
       .text(
         'Disclaimer: Predictions based on historical correlations. Not financial, medical, or professional advice. Past patterns do not guarantee future outcomes.',
         { align: 'center' }
       );

    // Footer with generation info
    doc.moveDown(1);
    doc.fontSize(8)
       .font('Helvetica')
       .fillColor('#aaaaaa')
       .text(`Generated: ${new Date().toISOString()} | whatshappening.app`, { align: 'center' });

    doc.end();
  });
}

/**
 * Generate JSON export
 *
 * @param {Object} data - Full prediction data
 * @returns {Object} Formatted JSON data
 */
function generateJSONExport(data) {
  return {
    exportedAt: new Date().toISOString(),
    date: data.date || new Date().toISOString().split('T')[0],
    predictions: data.predictions || [],
    patternAlerts: data.patternAlerts || [],
    actionSuggestions: data.actionSuggestions || {},
    summary: data.summary || {},
    meta: {
      source: 'whatshappening.app',
      version: '1.0',
      disclaimer: data.disclaimer || 'Predictions based on historical correlations. Not financial, medical, or professional advice.'
    }
  };
}

/**
 * Generate CSV export
 *
 * @param {Object} data - Prediction data
 * @returns {string} CSV content
 */
function generateCSVExport(data) {
  const lines = [];

  // Header
  lines.push('Outcome,Probability,Confidence Interval Low,Confidence Interval High,Sample Size,Base Rate,Lift,Confidence Level');

  // Data rows
  const predictions = data.predictions || [];
  predictions.forEach(p => {
    const ciLow = p.confidenceInterval ? p.confidenceInterval[0] : '';
    const ciHigh = p.confidenceInterval ? p.confidenceInterval[1] : '';
    lines.push([
      `"${p.outcome || p.outcomeId}"`,
      p.probability || '',
      ciLow,
      ciHigh,
      p.sampleSize || '',
      p.baseRate || '',
      p.lift || '',
      `"${p.confidence || ''}"`
    ].join(','));
  });

  // Add metadata
  lines.push('');
  lines.push('# Metadata');
  lines.push(`# Export Date,${new Date().toISOString()}`);
  lines.push(`# Data Date,${data.date || new Date().toISOString().split('T')[0]}`);
  lines.push('# Source,whatshappening.app');

  return lines.join('\n');
}

/**
 * Generate Open Graph metadata for a given date
 *
 * @param {Object} data - Prediction data
 * @param {string} baseUrl - Base URL for the site
 * @returns {Object} OG metadata
 */
function generateOpenGraphMeta(data, baseUrl = 'https://whatshappening.app') {
  const date = data.date || new Date().toISOString().split('T')[0];
  const predictions = data.predictions || [];

  // Build description from top predictions
  const topPreds = predictions
    .sort((a, b) => b.probability - a.probability)
    .slice(0, 3);

  const descParts = topPreds.map(p => {
    const prob = Math.round((p.probability || 0) * 100);
    return `${p.outcome || p.outcomeId}: ${prob}%`;
  });

  const description = descParts.length > 0
    ? descParts.join(' | ')
    : 'Data-driven predictions correlating cosmic and esoteric data with real-world outcomes';

  return {
    title: `What's Happening - ${formatShortDate(new Date(date))}`,
    description,
    image: `${baseUrl}/api/export/image?date=${date}&format=wide`,
    url: baseUrl,
    type: 'website',
    siteName: "What's Happening"
  };
}

/**
 * Generate shareable text for social platforms
 *
 * @param {Object} data - Prediction data
 * @param {string} platform - Target platform (twitter, facebook, etc)
 * @returns {string} Share text
 */
function generateShareText(data, platform = 'twitter') {
  const date = formatShortDate(new Date(data.date || Date.now()));
  const predictions = data.predictions || [];

  const topPred = predictions
    .sort((a, b) => b.probability - a.probability)[0];

  let text = `What's Happening - ${date}\n\n`;

  if (topPred) {
    const prob = Math.round((topPred.probability || 0) * 100);
    text += `Top prediction: ${topPred.outcome || topPred.outcomeId} at ${prob}%\n\n`;
  }

  if (platform === 'twitter') {
    // Twitter has 280 char limit
    text += 'whatshappening.app';
    if (text.length > 280) {
      text = text.substring(0, 277) + '...';
    }
  } else {
    text += 'Check out today\'s predictions at whatshappening.app';
  }

  return text;
}

module.exports = {
  generateShareImage,
  generatePDFReport,
  generateJSONExport,
  generateCSVExport,
  generateOpenGraphMeta,
  generateShareText,
  CARD_FORMATS
};
