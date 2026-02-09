/**
 * Insight Route - AI-powered synthesis of all module data
 * 
 * GET /api/insight - Returns an AI-generated narrative synthesizing all current data
 * Caches results for 1 hour to avoid excessive API calls.
 */

const express = require('express');
const router = express.Router();
const { GoogleGenerativeAI } = require('@google/generative-ai');
const config = require('../config');
const db = require('../db');
const cache = require('../utils/cache');
const logger = require('../utils/logger');

const CACHE_KEY = 'api:insight';
const CACHE_TTL = 60 * 60 * 1000; // 1 hour

const VALID_MODULES = [
  'moon', 'tzolkin', 'dreamspell', 'parasha', 'gematria',
  'astrology', 'solar', 'schumann', 'tarot', 'news',
  'numerology', 'iching', 'cosmic', 'markets', 'geophysical', 'sentiment'
];

const SYSTEM_PROMPT = `You are a warm, insightful cosmic analyst. You synthesize diverse data streams — astrology, moon phases, numerology, I Ching, tarot, solar activity, Schumann resonance, market sentiment, geophysical data, and more — into a cohesive, human-readable narrative.

Your job: tell people what's happening right now in the cosmic/energetic landscape, what they might be feeling and why, and give grounded practical guidance.

Style guidelines:
- Be warm, grounded, and insightful — not too woo-woo
- Speak like a wise friend, not a fortune teller
- Back up observations with specific data points (e.g., "Mercury is in retrograde," "the moon is waning in Scorpio")
- Acknowledge uncertainty — "you might feel" rather than "you will feel"
- Be practical — concrete suggestions, not vague platitudes
- Keep the narrative flowing and readable, not a bullet-point dump

You MUST respond with valid JSON in exactly this format:
{
  "insight": "A 2-4 paragraph narrative about what's happening cosmically/energetically right now and what people might be experiencing and why. Rich, readable, warm.",
  "highlights": ["Array of 3-6 short strings highlighting the most significant current events/transits/alignments, e.g. 'Mercury enters Pisces', 'Full Moon in Leo', 'Schumann spike at 40Hz'"],
  "guidance": "A short paragraph of practical, grounded guidance for the day. What to do, what to avoid, what to pay attention to.",
  "mood": "One word describing the overall energetic mood. Choose from: calm, intense, transformative, reflective, energetic, chaotic, creative, tender, expansive, grounding"
}

Respond ONLY with the JSON object, no markdown, no code fences.`;

/**
 * Gather all current module data (mirrors /api/current logic)
 */
async function gatherModuleData() {
  const modules = {};
  
  for (const moduleName of VALID_MODULES) {
    try {
      const snapshot = await db.getLatestSnapshot(moduleName);
      if (snapshot) {
        modules[moduleName] = snapshot.data;
      }
    } catch (err) {
      // Skip failed modules
    }
  }

  // Also get daily calculated data
  try {
    const dailyData = await db.getDailyData(new Date());
    if (dailyData) {
      const dailyModules = ['tzolkin', 'dreamspell', 'gematria', 'tarot', 'numerology', 'iching', 'parasha'];
      for (const mod of dailyModules) {
        if (dailyData[mod]) {
          modules[mod] = dailyData[mod];
        }
      }
    }
  } catch (err) {
    // Continue without daily data
  }

  return modules;
}

/**
 * Generate insight using Gemini
 */
async function generateInsight(moduleData) {
  if (!config.geminiApiKey) {
    throw new Error('GEMINI_API_KEY not configured');
  }

  const genAI = new GoogleGenerativeAI(config.geminiApiKey);
  const model = genAI.getGenerativeModel({ model: 'gemini-2.0-flash' });

  const dataStr = JSON.stringify(moduleData, null, 2);
  
  const prompt = `Here is the current data from all our cosmic/esoteric/geophysical monitoring modules. Today is ${new Date().toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}.

Current module data:
${dataStr}

Synthesize all of this into a cohesive insight about what's happening right now.`;

  const result = await model.generateContent({
    contents: [{ role: 'user', parts: [{ text: prompt }] }],
    systemInstruction: { parts: [{ text: SYSTEM_PROMPT }] },
    generationConfig: {
      temperature: 0.7,
      maxOutputTokens: 2048,
    },
  });

  const text = result.response.text().trim();
  
  // Parse the JSON response
  let parsed;
  try {
    // Strip markdown code fences if present
    const cleaned = text.replace(/^```(?:json)?\s*/, '').replace(/\s*```$/, '');
    parsed = JSON.parse(cleaned);
  } catch (parseErr) {
    logger.error('Failed to parse Gemini response as JSON:', parseErr.message);
    // Fallback: use raw text as insight
    parsed = {
      insight: text,
      highlights: [],
      guidance: '',
      mood: 'reflective',
    };
  }

  const sources = Object.keys(moduleData);

  return {
    insight: parsed.insight || '',
    highlights: parsed.highlights || [],
    guidance: parsed.guidance || '',
    mood: parsed.mood || 'reflective',
    generated_at: new Date().toISOString(),
    sources,
  };
}

/**
 * GET /api/insight
 */
router.get('/', async (req, res) => {
  try {
    // Check cache
    const cached = cache.get(CACHE_KEY);
    if (cached) {
      return res.json({ ...cached, fromCache: true });
    }

    const moduleData = await gatherModuleData();
    
    if (Object.keys(moduleData).length === 0) {
      return res.status(503).json({ error: 'No module data available' });
    }

    const insight = await generateInsight(moduleData);

    // Cache for 1 hour
    cache.set(CACHE_KEY, insight, CACHE_TTL);

    return res.json(insight);
  } catch (err) {
    logger.error('Insight generation failed:', err.message);
    return res.status(500).json({ error: 'Failed to generate insight', message: err.message });
  }
});

/**
 * POST /api/insight/refresh - Force regeneration (bypasses cache)
 */
router.post('/refresh', async (req, res) => {
  try {
    cache.del(CACHE_KEY);

    const moduleData = await gatherModuleData();
    
    if (Object.keys(moduleData).length === 0) {
      return res.status(503).json({ error: 'No module data available' });
    }

    const insight = await generateInsight(moduleData);
    cache.set(CACHE_KEY, insight, CACHE_TTL);

    return res.json(insight);
  } catch (err) {
    logger.error('Insight refresh failed:', err.message);
    return res.status(500).json({ error: 'Failed to generate insight', message: err.message });
  }
});

module.exports = router;
module.exports.gatherModuleData = gatherModuleData;
module.exports.generateInsight = generateInsight;
