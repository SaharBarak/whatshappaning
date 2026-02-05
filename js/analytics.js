/**
 * Analytics Dashboard - Prediction Accuracy Visualization
 * Fetches and displays prediction accuracy metrics
 */

import { API_BASE_URL } from './config.js';

// State
let analyticsData = null;
let currentRange = 30;
let archivePage = 1;
const archivePageSize = 10;

// Chart instances
let outcomeChart = null;
let trendChart = null;
let calibrationChart = null;

// DOM Elements
const elements = {
  overallAccuracy: document.getElementById('overall-accuracy'),
  totalPredictions: document.getElementById('total-predictions'),
  vhAccuracy: document.getElementById('vh-accuracy'),
  vhCount: document.getElementById('vh-count'),
  hAccuracy: document.getElementById('h-accuracy'),
  hCount: document.getElementById('h-count'),
  mAccuracy: document.getElementById('m-accuracy'),
  mCount: document.getElementById('m-count'),
  outcomeGrid: document.getElementById('outcome-grid'),
  featureList: document.getElementById('feature-list'),
  archiveBody: document.getElementById('archive-body'),
  paginationInfo: document.getElementById('pagination-info'),
  prevPage: document.getElementById('prev-page'),
  nextPage: document.getElementById('next-page'),
  lastUpdated: document.getElementById('last-updated'),
  outcomeFilter: document.getElementById('archive-outcome-filter'),
  resultFilter: document.getElementById('archive-result-filter')
};

// Chart.js default config
const chartDefaults = {
  responsive: true,
  maintainAspectRatio: false,
  plugins: {
    legend: {
      display: false
    }
  },
  scales: {
    x: {
      grid: {
        color: 'rgba(255, 255, 255, 0.05)'
      },
      ticks: {
        color: '#888'
      }
    },
    y: {
      grid: {
        color: 'rgba(255, 255, 255, 0.05)'
      },
      ticks: {
        color: '#888'
      }
    }
  }
};

/**
 * Fetch analytics data from API
 */
async function fetchAnalytics(days = 30) {
  try {
    const response = await fetch(`${API_BASE_URL}/api/analytics?days=${days}`);
    if (!response.ok) throw new Error('Failed to fetch analytics');
    return await response.json();
  } catch (error) {
    console.error('Analytics fetch error:', error);
    // Return mock data for development/demo
    return generateMockData(days);
  }
}

/**
 * Generate mock data for development
 */
function generateMockData(days) {
  const outcomes = ['spx_up', 'btc_up', 'volatility_high', 'earthquake'];
  const confidenceLevels = ['very_high', 'high', 'medium', 'low'];
  
  const archive = [];
  const now = Date.now();
  
  for (let i = 0; i < Math.min(days, 100); i++) {
    const date = new Date(now - i * 24 * 60 * 60 * 1000);
    const outcome = outcomes[Math.floor(Math.random() * outcomes.length)];
    const confidence = confidenceLevels[Math.floor(Math.random() * confidenceLevels.length)];
    const probability = 0.5 + Math.random() * 0.4;
    const isCorrect = Math.random() < (probability * 0.9 + (confidence === 'very_high' ? 0.1 : 0));
    
    archive.push({
      date: date.toISOString().split('T')[0],
      outcome_id: outcome,
      confidence_level: confidence,
      predicted_probability: probability,
      actual_result: i < days - 3 ? isCorrect : null, // Last 3 days pending
      verified_at: i < days - 3 ? date.toISOString() : null
    });
  }
  
  // Calculate accuracy metrics
  const verified = archive.filter(p => p.actual_result !== null);
  const correct = verified.filter(p => p.actual_result === true);
  
  const byConfidence = {};
  confidenceLevels.forEach(level => {
    const levelPreds = verified.filter(p => p.confidence_level === level);
    const levelCorrect = levelPreds.filter(p => p.actual_result === true);
    byConfidence[level] = {
      accuracy: levelPreds.length ? levelCorrect.length / levelPreds.length : 0,
      count: levelPreds.length
    };
  });
  
  const byOutcome = {};
  outcomes.forEach(outcome => {
    const outcomePreds = verified.filter(p => p.outcome_id === outcome);
    const outcomeCorrect = outcomePreds.filter(p => p.actual_result === true);
    byOutcome[outcome] = {
      accuracy: outcomePreds.length ? outcomeCorrect.length / outcomePreds.length : 0,
      count: outcomePreds.length
    };
  });
  
  // Trend data (weekly averages)
  const trendData = [];
  for (let week = 0; week < Math.ceil(days / 7); week++) {
    const weekStart = week * 7;
    const weekEnd = Math.min(weekStart + 7, days);
    const weekPreds = verified.slice(weekStart, weekEnd);
    const weekCorrect = weekPreds.filter(p => p.actual_result === true);
    
    if (weekPreds.length > 0) {
      const weekDate = new Date(now - weekStart * 24 * 60 * 60 * 1000);
      trendData.push({
        date: weekDate.toISOString().split('T')[0],
        accuracy: weekCorrect.length / weekPreds.length,
        count: weekPreds.length
      });
    }
  }
  
  // Module performance (mock)
  const modules = [
    { name: 'Solar Activity', score: 0.78 },
    { name: 'Moon Phase', score: 0.72 },
    { name: 'Astrology', score: 0.68 },
    { name: 'Numerology', score: 0.65 },
    { name: 'Schumann Resonance', score: 0.62 },
    { name: 'Sentiment Analysis', score: 0.58 },
    { name: 'I Ching', score: 0.55 },
    { name: 'Tarot', score: 0.52 }
  ];
  
  // Calibration data
  const calibration = [
    { predicted: 0.5, actual: 0.48 },
    { predicted: 0.6, actual: 0.57 },
    { predicted: 0.7, actual: 0.68 },
    { predicted: 0.8, actual: 0.79 },
    { predicted: 0.9, actual: 0.85 }
  ];
  
  return {
    summary: {
      overall_accuracy: verified.length ? correct.length / verified.length : 0,
      total_predictions: verified.length,
      pending_predictions: archive.length - verified.length
    },
    by_confidence: byConfidence,
    by_outcome: byOutcome,
    trend: trendData.reverse(),
    modules: modules,
    calibration: calibration,
    archive: archive,
    last_updated: new Date().toISOString()
  };
}

/**
 * Format percentage display
 */
function formatPercent(value) {
  if (value === null || value === undefined) return '--';
  return `${Math.round(value * 100)}%`;
}

/**
 * Get outcome display name
 */
function getOutcomeName(outcomeId) {
  const names = {
    'spx_up': 'S&P 500 ↑',
    'btc_up': 'Bitcoin ↑',
    'volatility_high': 'High Volatility',
    'earthquake': 'Earthquake Risk'
  };
  return names[outcomeId] || outcomeId;
}

/**
 * Get accuracy color class
 */
function getAccuracyColor(accuracy) {
  if (accuracy >= 0.75) return 'var(--confidence-very-high)';
  if (accuracy >= 0.65) return 'var(--confidence-high)';
  if (accuracy >= 0.55) return 'var(--confidence-medium)';
  return 'var(--confidence-low)';
}

/**
 * Update summary cards
 */
function updateSummary(data) {
  const { summary, by_confidence } = data;
  
  // Remove skeleton classes
  document.querySelectorAll('.summary-value.skeleton').forEach(el => {
    el.classList.remove('skeleton');
  });
  
  // Overall
  elements.overallAccuracy.textContent = formatPercent(summary.overall_accuracy);
  elements.overallAccuracy.style.color = getAccuracyColor(summary.overall_accuracy);
  elements.totalPredictions.textContent = `${summary.total_predictions} verified predictions`;
  
  // By confidence
  if (by_confidence.very_high) {
    elements.vhAccuracy.textContent = formatPercent(by_confidence.very_high.accuracy);
    elements.vhCount.textContent = `n=${by_confidence.very_high.count}`;
  }
  
  if (by_confidence.high) {
    elements.hAccuracy.textContent = formatPercent(by_confidence.high.accuracy);
    elements.hCount.textContent = `n=${by_confidence.high.count}`;
  }
  
  if (by_confidence.medium) {
    elements.mAccuracy.textContent = formatPercent(by_confidence.medium.accuracy);
    elements.mCount.textContent = `n=${by_confidence.medium.count}`;
  }
}

/**
 * Render outcome grid
 */
function renderOutcomeGrid(byOutcome) {
  elements.outcomeGrid.innerHTML = Object.entries(byOutcome).map(([id, data]) => `
    <div class="outcome-card">
      <div class="outcome-name">${getOutcomeName(id)}</div>
      <div class="outcome-accuracy" style="color: ${getAccuracyColor(data.accuracy)}">
        ${formatPercent(data.accuracy)}
      </div>
      <div class="outcome-count">n=${data.count}</div>
    </div>
  `).join('');
}

/**
 * Create outcome bar chart
 */
function createOutcomeChart(byOutcome) {
  const ctx = document.getElementById('outcome-chart').getContext('2d');
  
  if (outcomeChart) outcomeChart.destroy();
  
  const labels = Object.keys(byOutcome).map(getOutcomeName);
  const accuracies = Object.values(byOutcome).map(d => d.accuracy * 100);
  const colors = Object.values(byOutcome).map(d => getAccuracyColor(d.accuracy));
  
  outcomeChart = new Chart(ctx, {
    type: 'bar',
    data: {
      labels,
      datasets: [{
        data: accuracies,
        backgroundColor: colors,
        borderRadius: 4,
        barThickness: 40
      }]
    },
    options: {
      ...chartDefaults,
      scales: {
        ...chartDefaults.scales,
        y: {
          ...chartDefaults.scales.y,
          beginAtZero: true,
          max: 100,
          ticks: {
            ...chartDefaults.scales.y.ticks,
            callback: value => `${value}%`
          }
        }
      },
      plugins: {
        tooltip: {
          callbacks: {
            label: ctx => `Accuracy: ${ctx.raw.toFixed(1)}%`
          }
        }
      }
    }
  });
}

/**
 * Create trend line chart
 */
function createTrendChart(trendData) {
  const ctx = document.getElementById('trend-chart').getContext('2d');
  
  if (trendChart) trendChart.destroy();
  
  const labels = trendData.map(d => {
    const date = new Date(d.date);
    return `${date.getMonth() + 1}/${date.getDate()}`;
  });
  const accuracies = trendData.map(d => d.accuracy * 100);
  
  trendChart = new Chart(ctx, {
    type: 'line',
    data: {
      labels,
      datasets: [{
        data: accuracies,
        borderColor: '#3b82f6',
        backgroundColor: 'rgba(59, 130, 246, 0.1)',
        fill: true,
        tension: 0.3,
        pointRadius: 4,
        pointBackgroundColor: '#3b82f6'
      }]
    },
    options: {
      ...chartDefaults,
      scales: {
        ...chartDefaults.scales,
        y: {
          ...chartDefaults.scales.y,
          min: 40,
          max: 100,
          ticks: {
            ...chartDefaults.scales.y.ticks,
            callback: value => `${value}%`
          }
        }
      },
      plugins: {
        tooltip: {
          callbacks: {
            label: ctx => `Accuracy: ${ctx.raw.toFixed(1)}%`
          }
        }
      }
    }
  });
}

/**
 * Create calibration scatter chart
 */
function createCalibrationChart(calibrationData) {
  const ctx = document.getElementById('calibration-chart').getContext('2d');
  
  if (calibrationChart) calibrationChart.destroy();
  
  // Perfect calibration line
  const perfectLine = [
    { x: 50, y: 50 },
    { x: 60, y: 60 },
    { x: 70, y: 70 },
    { x: 80, y: 80 },
    { x: 90, y: 90 }
  ];
  
  const actualPoints = calibrationData.map(d => ({
    x: d.predicted * 100,
    y: d.actual * 100
  }));
  
  calibrationChart = new Chart(ctx, {
    type: 'scatter',
    data: {
      datasets: [
        {
          label: 'Perfect Calibration',
          data: perfectLine,
          borderColor: 'rgba(148, 163, 184, 0.5)',
          borderDash: [5, 5],
          showLine: true,
          pointRadius: 0
        },
        {
          label: 'Our Predictions',
          data: actualPoints,
          borderColor: '#3b82f6',
          backgroundColor: '#3b82f6',
          showLine: true,
          pointRadius: 6,
          tension: 0.2
        }
      ]
    },
    options: {
      ...chartDefaults,
      scales: {
        x: {
          ...chartDefaults.scales.x,
          min: 45,
          max: 95,
          title: {
            display: true,
            text: 'Predicted Probability',
            color: '#888'
          },
          ticks: {
            ...chartDefaults.scales.x.ticks,
            callback: value => `${value}%`
          }
        },
        y: {
          ...chartDefaults.scales.y,
          min: 45,
          max: 95,
          title: {
            display: true,
            text: 'Actual Outcome Rate',
            color: '#888'
          },
          ticks: {
            ...chartDefaults.scales.y.ticks,
            callback: value => `${value}%`
          }
        }
      },
      plugins: {
        legend: {
          display: false
        },
        tooltip: {
          callbacks: {
            label: ctx => `Predicted: ${ctx.raw.x}%, Actual: ${ctx.raw.y}%`
          }
        }
      }
    }
  });
}

/**
 * Render feature/module performance list
 */
function renderFeatureList(modules) {
  elements.featureList.innerHTML = modules.map((module, index) => `
    <div class="feature-item">
      <span class="feature-rank">#${index + 1}</span>
      <span class="feature-name">${module.name}</span>
      <div class="feature-bar-container">
        <div class="feature-bar" style="width: ${module.score * 100}%"></div>
      </div>
      <span class="feature-score">${formatPercent(module.score)}</span>
    </div>
  `).join('');
}

/**
 * Render archive table
 */
function renderArchive(archive, page = 1) {
  const outcomeFilter = elements.outcomeFilter.value;
  const resultFilter = elements.resultFilter.value;
  
  // Apply filters
  let filtered = archive;
  
  if (outcomeFilter !== 'all') {
    filtered = filtered.filter(p => p.outcome_id === outcomeFilter);
  }
  
  if (resultFilter !== 'all') {
    if (resultFilter === 'pending') {
      filtered = filtered.filter(p => p.actual_result === null);
    } else if (resultFilter === 'correct') {
      filtered = filtered.filter(p => p.actual_result === true);
    } else if (resultFilter === 'incorrect') {
      filtered = filtered.filter(p => p.actual_result === false);
    }
  }
  
  // Pagination
  const totalPages = Math.ceil(filtered.length / archivePageSize);
  const start = (page - 1) * archivePageSize;
  const pageData = filtered.slice(start, start + archivePageSize);
  
  // Render rows
  elements.archiveBody.innerHTML = pageData.map(p => {
    const resultClass = p.actual_result === null ? 'pending' : 
                        p.actual_result ? 'correct' : 'incorrect';
    const resultText = p.actual_result === null ? 'Pending' :
                       p.actual_result ? '✓ Correct' : '✗ Incorrect';
    
    return `
      <tr>
        <td>${p.date}</td>
        <td>${getOutcomeName(p.outcome_id)}</td>
        <td>${p.confidence_level.replace('_', ' ')}</td>
        <td>${formatPercent(p.predicted_probability)}</td>
        <td><span class="result-badge ${resultClass}">${resultText}</span></td>
      </tr>
    `;
  }).join('');
  
  // Update pagination
  elements.paginationInfo.textContent = `Page ${page} of ${totalPages || 1}`;
  elements.prevPage.disabled = page <= 1;
  elements.nextPage.disabled = page >= totalPages;
  
  archivePage = page;
}

/**
 * Initialize dashboard
 */
async function init() {
  // Set up time range buttons
  document.querySelectorAll('.time-btn').forEach(btn => {
    btn.addEventListener('click', async () => {
      document.querySelectorAll('.time-btn').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      
      currentRange = btn.dataset.range === 'all' ? 365 : parseInt(btn.dataset.range);
      await loadData();
    });
  });
  
  // Set up archive filters
  elements.outcomeFilter.addEventListener('change', () => {
    renderArchive(analyticsData.archive, 1);
  });
  
  elements.resultFilter.addEventListener('change', () => {
    renderArchive(analyticsData.archive, 1);
  });
  
  // Set up pagination
  elements.prevPage.addEventListener('click', () => {
    if (archivePage > 1) {
      renderArchive(analyticsData.archive, archivePage - 1);
    }
  });
  
  elements.nextPage.addEventListener('click', () => {
    renderArchive(analyticsData.archive, archivePage + 1);
  });
  
  // Load initial data
  await loadData();
}

/**
 * Load and render analytics data
 */
async function loadData() {
  analyticsData = await fetchAnalytics(currentRange);
  
  // Update all components
  updateSummary(analyticsData);
  renderOutcomeGrid(analyticsData.by_outcome);
  createOutcomeChart(analyticsData.by_outcome);
  createTrendChart(analyticsData.trend);
  createCalibrationChart(analyticsData.calibration);
  renderFeatureList(analyticsData.modules);
  renderArchive(analyticsData.archive, 1);
  
  // Update timestamp
  const lastUpdate = new Date(analyticsData.last_updated);
  elements.lastUpdated.textContent = `Last updated: ${lastUpdate.toLocaleString()}`;
}

// Initialize on DOM ready
document.addEventListener('DOMContentLoaded', init);
