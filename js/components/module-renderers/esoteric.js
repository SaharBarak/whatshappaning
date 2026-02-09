/**
 * Esoteric Module Renderers (lazy-loaded)
 * Moon, Tzolkin, Dreamspell, Parasha, Gematria, Numerology, I Ching, Tarot
 */

import { createModuleCard, detailRow } from './helpers.js';

export function renderMoon(name, data, config, isExpanded, freshness) {
  const primary = `${data.phaseName || data.phase || '--'}`;
  const secondary = `${data.illumination ? Math.round(data.illumination) + '%' : '--'} ${data.sign || ''}`;
  const details = `
    ${detailRow('Phase', data.phaseName || data.phase)}
    ${detailRow('Illumination', data.illumination ? Math.round(data.illumination) + '%' : null)}
    ${detailRow('Sign', data.sign)}
    ${detailRow('Age', data.age ? data.age.toFixed(1) + ' days' : null)}
    ${detailRow('VOC', data.voidOfCourse ? 'Yes' : 'No')}
    ${detailRow('Next Phase', data.nextPhase?.phase)}
  `;
  return createModuleCard(name, config, isExpanded, primary, secondary, details, freshness);
}

export function renderTzolkin(name, data, config, isExpanded, freshness) {
  const primary = `${data.tone || '--'} ${data.daySignName || data.daySign || ''}`;
  const secondary = data.meaning || '--';
  const details = `
    ${detailRow('Tone', data.tone)}
    ${detailRow('Tone Name', data.toneName)}
    ${detailRow('Day Sign', data.daySignName || data.daySign)}
    ${detailRow('Meaning', data.meaning)}
  `;
  return createModuleCard(name, config, isExpanded, primary, secondary, details, freshness);
}

export function renderDreamspell(name, data, config, isExpanded, freshness) {
  const primary = `Kin ${data.kin || '--'}`;
  const toneName = data.toneName || data.tone || '';
  const sealName = data.sealName || data.seal || '--';
  const secondary = toneName ? `${toneName} ${sealName}` : sealName;
  const details = `
    ${detailRow('Kin', data.kin)}
    ${detailRow('Seal', data.sealName || data.seal)}
    ${detailRow('Tone', data.toneName || data.tone)}
    ${detailRow('Wavespell', data.wavespell)}
    ${detailRow('GAP Day', data.isGAP ? 'Yes' : 'No')}
    ${detailRow('Guide', data.guidePower)}
  `;
  return createModuleCard(name, config, isExpanded, primary, secondary, details, freshness);
}

export function renderParasha(name, data, config, isExpanded, freshness) {
  const primary = data.name || '--';
  const secondary = data.hebrewName || '--';
  const details = `
    ${detailRow('Name', data.name)}
    ${detailRow('Hebrew', data.hebrewName)}
    ${detailRow('Book', data.book)}
    ${detailRow('Chapters', data.chapters)}
    ${detailRow('Hebrew Date', data.hebrewDate)}
  `;
  return createModuleCard(name, config, isExpanded, primary, secondary, details, freshness);
}

export function renderGematria(name, data, config, isExpanded, freshness) {
  const primary = `${data.dateStandard || data.dateGematria || '--'} → ${data.dateReduced || data.reducedValue || '--'}`;
  const secondary = data.hebrewDate || '--';
  const details = `
    ${detailRow('Hebrew Date', data.hebrewDate)}
    ${detailRow('Date Gematria', data.dateStandard || data.dateGematria)}
    ${detailRow('Reduced', data.dateReduced || data.reducedValue)}
    ${detailRow('Parasha', data.parashaEnglish)}
    ${detailRow('Parasha Gematria', data.parashaStandard || data.parashaGematria)}
  `;
  return createModuleCard(name, config, isExpanded, primary, secondary, details, freshness);
}

export function renderNumerology(name, data, config, isExpanded, freshness) {
  const num = data.numerology || data;
  const hour = data.planetaryHour || {};
  const primary = `Day: ${num.universalDay || '--'}`;
  const secondary = hour.current ? `${hour.symbol || '♃'} ${hour.current}` : (hour.dayRuler || '--');
  const details = `
    ${detailRow('Universal Day', num.universalDay)}
    ${detailRow('Meaning', num.meaning)}
    ${detailRow('Vibration', num.vibration)}
    ${detailRow('Day Ruler', hour.dayRuler)}
    ${detailRow('Current Hour', hour.current)}
  `;
  return createModuleCard(name, config, isExpanded, primary, secondary, details, freshness);
}

export function renderIching(name, data, config, isExpanded, freshness) {
  const hex = data.hexagram || data;
  const primary = `${hex.number || '--'} ${hex.chinese || ''}`;
  const secondary = hex.name || '--';
  const details = `
    ${detailRow('Hexagram', hex.number)}
    ${detailRow('Name', hex.name)}
    ${detailRow('Chinese', hex.chinese)}
    ${detailRow('Upper Trigram', typeof hex.upperTrigram === 'object' ? hex.upperTrigram?.name : hex.upperTrigram)}
    ${detailRow('Lower Trigram', typeof hex.lowerTrigram === 'object' ? hex.lowerTrigram?.name : hex.lowerTrigram)}
    ${detailRow('Keywords', Array.isArray(hex.keywords) ? hex.keywords.join(', ') : hex.keywords)}
  `;
  return createModuleCard(name, config, isExpanded, primary, secondary, details, freshness);
}

export function renderTarot(name, data, config, isExpanded, freshness) {
  const card = data.card || data;
  const cardNum = card.number !== undefined ? card.number : null;
  const primary = card.name || '--';
  const secondary = data.meaning || (Array.isArray(card.keywords) ? card.keywords.slice(0, 2).join(', ') : '--');
  const details = `
    ${detailRow('Card', card.name)}
    ${detailRow('Arcana', card.arcana)}
    ${detailRow('Suit', card.suit)}
    ${detailRow('Element', card.element)}
    ${detailRow('Keywords', Array.isArray(card.keywords) ? card.keywords.join(', ') : card.keywords)}
    ${detailRow('Meaning', data.meaning)}
  `;
  return createModuleCard(name, config, isExpanded, primary, secondary, details, freshness);
}
