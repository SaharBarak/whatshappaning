/**
 * Rule-Based Insight Engine
 * 
 * Generates human-readable cosmic insights from module data without AI.
 * Replaces Gemini dependency with deterministic, free insight generation.
 */

const logger = require('../utils/logger');

// Mood determination based on data signals
const MOOD_RULES = [
  { check: (d) => d.solar?.kpIndex >= 5 || d.geophysical?.significantQuakes > 2, mood: 'intense' },
  { check: (d) => d.astrology?.mercuryRetrograde, mood: 'reflective' },
  { check: (d) => d.moon?.phase === 'Full Moon', mood: 'expansive' },
  { check: (d) => d.moon?.phase === 'New Moon', mood: 'creative' },
  { check: (d) => d.schumann?.amplitude > 30, mood: 'energetic' },
  { check: (d) => d.markets?.vix > 25, mood: 'chaotic' },
  { check: (d) => d.moon?.phase?.includes('Waning'), mood: 'grounding' },
  { check: (d) => d.moon?.phase?.includes('Waxing'), mood: 'expansive' },
  { check: (d) => d.astrology?.majorAspects?.length > 3, mood: 'transformative' },
];

// Highlight generators
function getHighlights(modules) {
  const highlights = [];

  // Moon
  if (modules.moon) {
    const m = modules.moon;
    if (m.phase) highlights.push(`Moon: ${m.phase}${m.sign ? ` in ${m.sign}` : ''}`);
    if (m.illumination != null) highlights.push(`Lunar illumination: ${Math.round(m.illumination * 100)}%`);
  }

  // Astrology
  if (modules.astrology) {
    const a = modules.astrology;
    if (a.mercuryRetrograde) highlights.push('⚠️ Mercury Retrograde active');
    if (a.sunSign) highlights.push(`Sun in ${a.sunSign}`);
    if (a.majorAspects?.length) {
      highlights.push(`${a.majorAspects.length} major planetary aspect${a.majorAspects.length > 1 ? 's' : ''} active`);
    }
    if (a.retrogradeCount > 1) highlights.push(`${a.retrogradeCount} planets in retrograde`);
  }

  // Solar
  if (modules.solar) {
    const s = modules.solar;
    if (s.kpIndex >= 5) highlights.push(`Geomagnetic storm: Kp ${s.kpIndex}`);
    else if (s.kpIndex >= 4) highlights.push(`Elevated geomagnetic activity: Kp ${s.kpIndex}`);
    if (s.solarFlareClass && s.solarFlareClass !== 'none') highlights.push(`Solar flare: ${s.solarFlareClass}-class`);
    if (s.solarWindSpeed > 500) highlights.push(`Solar wind: ${Math.round(s.solarWindSpeed)} km/s`);
  }

  // Schumann
  if (modules.schumann) {
    const sc = modules.schumann;
    if (sc.amplitude > 30) highlights.push(`Schumann resonance spike: ${sc.amplitude.toFixed(1)} Hz`);
  }

  // Tarot
  if (modules.tarot?.card) {
    highlights.push(`Daily Tarot: ${modules.tarot.card}${modules.tarot.reversed ? ' (reversed)' : ''}`);
  }

  // I Ching
  if (modules.iching?.hexagram) {
    highlights.push(`I Ching: Hexagram ${modules.iching.hexagram}${modules.iching.name ? ` — ${modules.iching.name}` : ''}`);
  }

  // Markets
  if (modules.markets?.vix != null) {
    if (modules.markets.vix > 25) highlights.push(`VIX elevated: ${modules.markets.vix.toFixed(1)}`);
  }

  // Geophysical
  if (modules.geophysical) {
    const g = modules.geophysical;
    if (g.maxMagnitude >= 5) highlights.push(`Notable earthquake: M${g.maxMagnitude.toFixed(1)}`);
  }

  return highlights.slice(0, 6);
}

// Narrative templates
const OPENERS = {
  intense: [
    "The cosmic weather is running hot today.",
    "There's a surge of energy moving through the systems today.",
    "Buckle up — the energetic landscape is charged right now.",
  ],
  reflective: [
    "Today invites a pause — a moment to look inward before moving forward.",
    "The cosmos are in a contemplative mood today.",
    "There's a gentle pull toward introspection in the air.",
  ],
  expansive: [
    "The energy today feels open and possibility-rich.",
    "Today's cosmic alignment supports expansion and reaching outward.",
    "There's a sense of openness flowing through the energetic field.",
  ],
  creative: [
    "Fresh beginnings are in the air — the slate feels clean.",
    "Today carries the spark of new ideas and fresh starts.",
    "The creative pulse is strong in today's energetic signature.",
  ],
  energetic: [
    "There's an unmistakable buzz in the field today.",
    "Energy levels are up — the Earth and sky are both active.",
    "Today's readings show heightened activity across the board.",
  ],
  chaotic: [
    "The signals are mixed today — expect the unexpected.",
    "There's turbulence in both cosmic and earthly systems right now.",
    "Today's energy is restless — flexibility will be your friend.",
  ],
  grounding: [
    "Today calls for roots — steady, grounded, practical energy.",
    "The cosmos are encouraging stability and groundedness today.",
    "There's a calm, earthy quality to today's energetic landscape.",
  ],
  transformative: [
    "Something is shifting — today carries transformative potential.",
    "The alignment today points to deep change and evolution.",
    "Powerful energies are at work beneath the surface today.",
  ],
  calm: [
    "The energetic weather is quiet and steady today.",
    "A peaceful quality permeates today's cosmic readings.",
    "Things are settled — a good day for steady progress.",
  ],
  tender: [
    "There's a softness to today's energy — be gentle with yourself.",
    "The cosmic mood is tender and emotionally attuned today.",
    "Sensitivity is heightened — honor what you're feeling.",
  ],
};

function buildNarrative(modules, mood, highlights) {
  const openers = OPENERS[mood] || OPENERS.calm;
  const opener = openers[Math.floor(Math.random() * openers.length)];

  const parts = [opener];

  // Moon paragraph
  if (modules.moon) {
    const m = modules.moon;
    let moonText = '';
    if (m.phase && m.sign) {
      moonText = `The Moon is ${m.phase.toLowerCase()} in ${m.sign}`;
      if (m.illumination != null) moonText += ` at ${Math.round(m.illumination * 100)}% illumination`;
      moonText += '.';
    }
    if (m.voidOfCourse) moonText += ' The Moon is void-of-course — not the best time for major decisions.';
    if (moonText) parts.push(moonText);
  }

  // Astrology
  if (modules.astrology) {
    const a = modules.astrology;
    let astroText = '';
    if (a.mercuryRetrograde) {
      astroText += 'Mercury retrograde is still in effect — double-check communications, travel plans, and contracts. ';
    }
    if (a.majorAspects?.length > 2) {
      astroText += `With ${a.majorAspects.length} major aspects active, the planetary conversations are busy. `;
    }
    if (a.retrogradeCount > 2) {
      astroText += `${a.retrogradeCount} planets in retrograde suggests a period of review and recalibration. `;
    }
    if (astroText) parts.push(astroText.trim());
  }

  // Solar/Schumann
  const solar = modules.solar;
  const schumann = modules.schumann;
  if (solar || schumann) {
    let geoText = '';
    if (solar?.kpIndex >= 5) {
      geoText += `Geomagnetic activity is elevated (Kp ${solar.kpIndex}) — some people report feeling restless, headachy, or emotionally stirred during geomagnetic storms. `;
    } else if (solar?.kpIndex >= 3) {
      geoText += `Solar activity is moderate (Kp ${solar.kpIndex}). `;
    }
    if (solar?.solarWindSpeed > 500) {
      geoText += `Solar wind is blowing fast at ${Math.round(solar.solarWindSpeed)} km/s. `;
    }
    if (schumann?.amplitude > 30) {
      geoText += `The Schumann resonance is spiking at ${schumann.amplitude.toFixed(1)} Hz — these spikes often correlate with feelings of heightened awareness or restlessness. `;
    }
    if (geoText) parts.push(geoText.trim());
  }

  // Markets/Sentiment
  if (modules.markets?.vix > 20 || modules.sentiment) {
    let sentText = '';
    if (modules.markets?.vix > 25) {
      sentText += `Market anxiety is elevated (VIX at ${modules.markets.vix.toFixed(1)}) — the collective mood may feel tense. `;
    }
    if (modules.sentiment?.fearGreed != null && modules.sentiment.fearGreed < 30) {
      sentText += 'Fear is dominating market sentiment — a reminder that collective psychology and cosmic cycles often mirror each other. ';
    }
    if (sentText) parts.push(sentText.trim());
  }

  return parts.join(' ');
}

function buildGuidance(modules, mood) {
  const tips = [];

  // Mood-based
  switch (mood) {
    case 'intense': case 'chaotic':
      tips.push('Take things one step at a time. Avoid impulsive decisions.');
      tips.push('Physical movement can help channel excess energy — a walk, workout, or stretch.');
      break;
    case 'reflective':
      tips.push('Journal, meditate, or revisit an old project with fresh eyes.');
      tips.push('This isn\'t a day for rushing — let things come to you.');
      break;
    case 'creative': case 'expansive':
      tips.push('Follow your curiosity today. New ideas have extra traction.');
      tips.push('Reach out to someone — collaboration is favored.');
      break;
    case 'grounding':
      tips.push('Focus on practical tasks. Organize, clean, plan.');
      tips.push('Nature connection is especially grounding today.');
      break;
    case 'energetic':
      tips.push('Channel this energy into something productive before it turns into restlessness.');
      break;
    case 'transformative':
      tips.push('Don\'t resist what\'s changing. Trust the process.');
      tips.push('Release something that\'s no longer serving you.');
      break;
    default:
      tips.push('Stay present and attentive to what the day brings.');
  }

  // Context-specific
  if (modules.astrology?.mercuryRetrograde) {
    tips.push('Back up important files. Re-read emails before sending.');
  }
  if (modules.moon?.voidOfCourse) {
    tips.push('Delay signing contracts or starting new ventures if possible.');
  }
  if (modules.solar?.kpIndex >= 5) {
    tips.push('Stay hydrated and consider extra rest — geomagnetic storms can affect sleep.');
  }
  if (modules.schumann?.amplitude > 30) {
    tips.push('Meditation may feel especially powerful during Schumann spikes.');
  }

  return tips.slice(0, 3).join(' ');
}

/**
 * Generate insight from module data (no AI required)
 */
function generateRuleBasedInsight(modules) {
  // Determine mood
  let mood = 'calm';
  for (const rule of MOOD_RULES) {
    try {
      if (rule.check(modules)) {
        mood = rule.mood;
        break;
      }
    } catch (e) { /* skip broken rules */ }
  }

  const highlights = getHighlights(modules);
  const insight = buildNarrative(modules, mood, highlights);
  const guidance = buildGuidance(modules, mood);

  return {
    insight,
    highlights,
    guidance,
    mood,
    generated_at: new Date().toISOString(),
    sources: Object.keys(modules).filter(k => modules[k] != null),
    engine: 'rule-based',
  };
}

module.exports = { generateRuleBasedInsight };
