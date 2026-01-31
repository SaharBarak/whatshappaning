# Frontend UI Specification

## Overview
Static single-page application. Vanilla HTML/CSS/JS. No framework.

## Layout Structure

```
┌─────────────────────────────────────────────────────────────┐
│  WHAT'S HAPPENING                         ● Live · 2m ago  │
├─────────────────────────────────────────────────────────────┤
│  Solar-Geo: 4.2  │  Astro Events: 3  │  Calendar Sync: 2   │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  ┌────────────────────────────────────────────────────────┐ │
│  │ 📊 PREDICTIONS                                         │ │
│  │                                                         │ │
│  │ Market Volatility    ████████████████████░░░  73%      │ │
│  │                      [58-84%] n=47  HIGH               │ │
│  │ ├─ VIX > 20           +35%                             │ │
│  │ ├─ Mercury Rx         +18%                             │ │
│  │ ├─ Full Moon ±2d      +12%                             │ │
│  │ └─ Kp > 4             +8%                              │ │
│  │                                                         │ │
│  │ Major Quake (M6+)    █████░░░░░░░░░░░░░░░░░  18%       │ │
│  │                      [12-26%] n=89  MEDIUM             │ │
│  │                                                         │ │
│  │ Sentiment Drop       ██████████████░░░░░░░░  52%       │ │
│  │                      [41-63%] n=67  MEDIUM             │ │
│  └────────────────────────────────────────────────────────┘ │
│                                                             │
│  ┌────────────────────────────────────────────────────────┐ │
│  │ ⚠️ PATTERN ALERT                         Match: 87%    │ │
│  │                                                         │ │
│  │ Conditions match: Mar 2020, Sep 2008, Oct 1987         │ │
│  │ Outcome: 6/7 (86%) high volatility within 5 days       │ │
│  └────────────────────────────────────────────────────────┘ │
│                                                             │
├─────────────────────────────────────────────────────────────┤
│                        DATA MODULES                         │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  ┌─────────┐ ┌─────────┐ ┌─────────┐ ┌─────────┐          │
│  │🌙 MOON  │ │🔆 TZOLK │ │🌈 DREAM │ │📜 PARA  │          │
│  │Waxing   │ │4 Ahau   │ │Kin 138  │ │Bo בֹּא  │          │
│  │67% Leo  │ │Self-Ext │ │Mirror   │ │Ex 10-13 │          │
│  └─────────┘ └─────────┘ └─────────┘ └─────────┘          │
│                                                             │
│  ┌─────────┐ ┌─────────┐ ┌─────────┐ ┌─────────┐          │
│  │🔢 GEMAT │ │🔮 NUMERO│ │☯️ ICHING│ │🎴 TAROT │          │
│  │787 → 4  │ │Day: 5   │ │29 坎    │ │XVI      │          │
│  │Para: 3  │ │♃ Jupiter│ │Abysmal  │ │Tower    │          │
│  └─────────┘ └─────────┘ └─────────┘ └─────────┘          │
│                                                             │
│  ┌─────────┐ ┌─────────┐ ┌─────────┐ ┌─────────┐          │
│  │☀️ SOLAR │ │🌍 SCHUM │ │☄️ COSMIC│ │♈ ASTRO │          │
│  │Kp:3 C2.1│ │7.83Hz   │ │Rays:103%│ │☉Aqua   │          │
│  │Wind:423 │ │Normal   │ │No shower│ │☽Leo [+]│          │
│  └─────────┘ └─────────┘ └─────────┘ └─────────┘          │
│                                                             │
│  ┌─────────┐ ┌─────────┐ ┌─────────┐ ┌─────────┐          │
│  │📈 MARKET│ │🌍 GEO   │ │😰 SENTIM│ │📰 NEWS │          │
│  │SPX -1.2%│ │Quakes:89│ │38 Fear  │ │Themes: │          │
│  │VIX:18.5 │ │M5+: 2   │ │▼ -5     │ │4 topics│          │
│  └─────────┘ └─────────┘ └─────────┘ └─────────┘          │
│                                                             │
├─────────────────────────────────────────────────────────────┤
│  💡 SUGGESTIONS                                             │
│  Favorable: Introspection, review, planning                │
│  Caution: Major financial decisions, new contracts         │
│  ℹ️ Based on statistical correlations. Not advice.         │
└─────────────────────────────────────────────────────────────┘
```

## Sections

### 1. Header
- Title: "WHAT'S HAPPENING"
- Live indicator (green dot + time since update)

### 2. Indices Bar
- Three indices, inline
- No labels, just values

### 3. Predictions Panel (NEW - Primary)
- Most important section
- Each prediction shows:
  - Outcome name
  - Probability bar (visual)
  - Percentage + confidence interval
  - Sample size + confidence level
  - Contributing factors (expandable)
  - Contribution bars for each factor

### 4. Pattern Alert (Conditional)
- Only shows when pattern match >80%
- Matching dates
- Historical outcome rate
- Match score

### 5. Data Modules Grid
- 4 columns desktop, 2 tablet, 1 mobile
- 16 modules total
- Click to expand details

### 6. Suggestions Footer
- Brief action suggestions
- Always includes disclaimer

## Design System

### Colors
```css
:root {
  --bg-primary: #0a0a0f;
  --bg-card: #12121a;
  --bg-prediction: #0d1117;
  --text-primary: #e0e0e0;
  --text-secondary: #888;
  --text-muted: #555;

  /* Confidence colors */
  --confidence-high: #4ade80;
  --confidence-medium: #fbbf24;
  --confidence-low: #f87171;

  /* Probability bar */
  --bar-fill: #3b82f6;
  --bar-bg: #1e293b;

  /* Alert */
  --alert-bg: #1c1917;
  --alert-border: #f59e0b;
}
```

### Typography
```css
body {
  font-family: 'Inter', -apple-system, sans-serif;
  font-size: 14px;
}

.value, .probability, .percentage {
  font-family: 'JetBrains Mono', monospace;
}

.factor-contribution {
  font-size: 12px;
  font-family: 'JetBrains Mono', monospace;
}
```

### Probability Bar
```css
.probability-bar {
  height: 8px;
  background: var(--bar-bg);
  border-radius: 4px;
  overflow: hidden;
}

.probability-fill {
  height: 100%;
  background: var(--bar-fill);
  transition: width 0.3s ease;
}
```

### Confidence Badge
```css
.confidence-badge {
  padding: 2px 6px;
  border-radius: 3px;
  font-size: 10px;
  font-weight: 600;
  text-transform: uppercase;
}

.confidence-high { background: #166534; color: #4ade80; }
.confidence-medium { background: #713f12; color: #fbbf24; }
.confidence-low { background: #7f1d1d; color: #f87171; }
```

## Responsive Grid

```css
.data-grid {
  display: grid;
  gap: 8px;
}

@media (max-width: 640px) {
  .data-grid { grid-template-columns: repeat(2, 1fr); }
}

@media (min-width: 641px) {
  .data-grid { grid-template-columns: repeat(4, 1fr); }
}

@media (min-width: 1200px) {
  .data-grid { grid-template-columns: repeat(4, 1fr); }
}
```

## Expandable Details

### Prediction Factor Expansion
Click prediction to expand and show:
- Full factor breakdown
- Historical context
- Methodology notes

```html
<div class="prediction collapsed" onclick="toggleExpand(this)">
  <div class="prediction-summary">
    <!-- Always visible -->
  </div>
  <div class="prediction-details">
    <!-- Visible when expanded -->
    <div class="factors-list">...</div>
    <div class="historical-context">...</div>
    <div class="methodology-note">...</div>
  </div>
</div>
```

### Module Card Expansion
Click module card for full data:
- Moon: VOC times, next phase, sign meaning
- Astrology: Full planetary table, aspects
- Markets: All indices, volume, trends
- etc.

## Data Freshness Indicators

```
● Live (< 5 min)     - Green
● Recent (< 1 hour)  - Yellow
● Stale (> 1 hour)   - Red
```

## Loading States

```css
.skeleton {
  background: linear-gradient(
    90deg,
    var(--bg-card) 0%,
    #1a1a25 50%,
    var(--bg-card) 100%
  );
  background-size: 200% 100%;
  animation: shimmer 1.5s infinite;
}

@keyframes shimmer {
  0% { background-position: 200% 0; }
  100% { background-position: -200% 0; }
}
```

## Error States

- API error: Show cached data with "stale" badge
- Module error: Show "Data unavailable" in card
- Critical error: Red banner at top

## Required Disclaimer

Always visible in footer:
```html
<footer class="disclaimer">
  Predictions based on historical correlations. Not financial, medical,
  or professional advice. Past patterns ≠ future outcomes.
</footer>
```

## Update Frequency
- Auto-refresh: Every 30 minutes
- Manual refresh: Pull-to-refresh on mobile
- Predictions: Highlighted when changed
