/**
 * Real-world Module Renderers (lazy-loaded)
 * Markets, Sentiment, News
 */

import { createModuleCard, detailRow } from './helpers.js';

export function renderMarkets(name, data, config, isExpanded, freshness) {
  const spxChange = data.spx?.changePercent;
  const spxDisplay = spxChange !== undefined ? `SPX ${spxChange >= 0 ? '+' : ''}${spxChange.toFixed(1)}%` : 'SPX --';
  const vix = data.vix?.value !== undefined ? `VIX:${data.vix.value.toFixed(1)}` : 'VIX:--';
  const primary = spxDisplay;
  const secondary = vix;
  const details = `
    ${detailRow('S&P 500', data.spx?.price?.toFixed(2))}
    ${detailRow('SPX Change', spxChange !== undefined ? (spxChange >= 0 ? '+' : '') + spxChange.toFixed(2) + '%' : null)}
    ${detailRow('VIX', data.vix?.value?.toFixed(2))}
    ${detailRow('Bitcoin', data.btc?.price ? '$' + data.btc.price.toLocaleString() : null)}
    ${detailRow('BTC Change', data.btc?.changePercent !== undefined ? (data.btc.changePercent >= 0 ? '+' : '') + data.btc.changePercent.toFixed(2) + '%' : null)}
    ${detailRow('Gold', data.gold?.price ? '$' + data.gold.price.toFixed(2) : null)}
    ${detailRow('Crypto F&G', data.cryptoFearGreed?.value)}
  `;
  return createModuleCard(name, config, isExpanded, primary, secondary, details, freshness);
}

export function renderSentiment(name, data, config, isExpanded, freshness) {
  const agg = data.aggregate || {};
  const comp = data.components || {};
  const score = agg.score !== undefined ? agg.score : '--';
  const label = agg.label || 'Unknown';
  const trend = agg.trend || '';
  const trendArrow = trend === 'up' ? '▲' : trend === 'down' ? '▼' : '';
  const change = agg.change24h;
  const primary = `${score} ${label}`;
  const secondary = `${trendArrow} ${change !== undefined && change !== null ? (change >= 0 ? '+' : '') + change : '--'}`;
  const details = `
    ${detailRow('Aggregate', score)}
    ${detailRow('Label', label)}
    ${detailRow('Crypto F&G', comp.cryptoFearGreed?.score)}
    ${detailRow('CNN F&G', comp.cnnFearGreed?.score)}
    ${detailRow('Trend', trend)}
  `;
  return createModuleCard(name, config, isExpanded, primary, secondary, details, freshness);
}

export function renderNews(name, data, config, isExpanded, freshness) {
  const themeCount = data.themes?.length || 0;
  const dominant = data.dominantTheme || '--';
  const primary = `Themes: ${themeCount}`;
  const secondary = dominant;
  const themesList = data.themes?.slice(0, 5).map(t =>
    detailRow(t.theme || t.name || 'Theme', t.count || t.sentiment || '')
  ).join('') || '';
  const details = `
    ${detailRow('Dominant Theme', data.dominantTheme)}
    ${detailRow('Sentiment', data.sentiment)}
    ${detailRow('Article Count', data.articleCount)}
    ${themesList}
  `;
  return createModuleCard(name, config, isExpanded, primary, secondary, details, freshness);
}
