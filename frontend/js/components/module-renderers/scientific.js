/**
 * Scientific Module Renderers (lazy-loaded)
 * Solar, Schumann, Cosmic, Astrology, Geophysical
 */

import { createModuleCard, detailRow } from './helpers.js';

export function renderSolar(name, data, config, isExpanded, freshness) {
  const kp = data.kpIndex !== undefined ? `Kp:${data.kpIndex}` : 'Kp:--';
  const flare = data.flareClass || '--';
  const primary = `${kp} ${flare}`;
  const secondary = data.solarWind?.speed ? `Wind:${Math.round(data.solarWind.speed)}` : '--';
  const details = `
    ${detailRow('Kp Index', data.kpIndex)}
    ${detailRow('Ap Index', data.apIndex)}
    ${detailRow('Flare Class', data.flareClass)}
    ${detailRow('Sunspot Number', data.sunspotNumber)}
    ${detailRow('Solar Wind', data.solarWind?.speed ? Math.round(data.solarWind.speed) + ' km/s' : null)}
  `;
  return createModuleCard(name, config, isExpanded, primary, secondary, details, freshness);
}

export function renderSchumann(name, data, config, isExpanded, freshness) {
  const freq = data.baseFrequency ? `${data.baseFrequency}Hz` : '--';
  const primary = freq;
  const secondary = data.activity || 'Normal';
  const details = `
    ${detailRow('Base Frequency', data.baseFrequency ? data.baseFrequency + ' Hz' : null)}
    ${detailRow('Amplitude', data.amplitude)}
    ${detailRow('Activity', data.activity)}
    ${detailRow('Source', data.source)}
    ${detailRow('Estimated', data.isEstimated ? 'Yes' : 'No')}
  `;
  return createModuleCard(name, config, isExpanded, primary, secondary, details, freshness);
}

export function renderCosmic(name, data, config, isExpanded, freshness) {
  const level = data.cosmicRayLevel ? `${Math.round(data.cosmicRayLevel)}%` : '--';
  const primary = `Rays:${level}`;
  const showers = data.activeShowers?.length > 0 ? data.activeShowers[0].name : 'No shower';
  const secondary = showers;
  const details = `
    ${detailRow('Cosmic Ray Level', data.cosmicRayLevel ? data.cosmicRayLevel + '%' : null)}
    ${detailRow('Neutron Count', data.neutronCount)}
    ${detailRow('Active Showers', data.activeShowers?.map(s => s.name).join(', ') || 'None')}
    ${detailRow('Next Peak', data.nextPeak?.name)}
  `;
  return createModuleCard(name, config, isExpanded, primary, secondary, details, freshness);
}

export function renderAstrology(name, data, config, isExpanded, freshness) {
  const sun = data.planets?.find(p => p.name === 'Sun');
  const moon = data.planets?.find(p => p.name === 'Moon');
  const sunSign = sun?.sign || '--';
  const moonSign = moon?.sign || '--';
  const retrogrades = data.retrogrades?.length || 0;
  const primary = `☉${sunSign.substring(0, 3)}`;
  const secondary = `☽${moonSign.substring(0, 3)}${retrogrades > 0 ? ` [${retrogrades}R]` : ''}`;
  const details = `
    ${detailRow('Sun Sign', sun?.sign)}
    ${detailRow('Moon Sign', moon?.sign)}
    ${detailRow('Retrogrades', data.retrogrades?.map(r => r.planet || r).join(', ') || 'None')}
    ${detailRow('VOC Moon', data.voidOfCourseMoon ? 'Yes' : 'No')}
    ${detailRow('Aspects', data.aspects?.length || 0)}
  `;
  return createModuleCard(name, config, isExpanded, primary, secondary, details, freshness);
}

export function renderGeophysical(name, data, config, isExpanded, freshness) {
  const quakeCount = data.quakeCount !== undefined ? `Quakes:${data.quakeCount}` : 'Quakes:--';
  const maxMag = data.maxMagnitude !== undefined ? `M${data.maxMagnitude.toFixed(1)}+: ${data.significantQuakes?.length || 0}` : '--';
  const primary = quakeCount;
  const secondary = maxMag;
  const details = `
    ${detailRow('Quake Count (24h)', data.quakeCount)}
    ${detailRow('Max Magnitude', data.maxMagnitude?.toFixed(1))}
    ${detailRow('Significant', data.significantQuakes?.length)}
    ${detailRow('Activity Level', data.activityLevel)}
  `;
  return createModuleCard(name, config, isExpanded, primary, secondary, details, freshness);
}
