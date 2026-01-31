# Sentiment Module

## Overview
Aggregate social and search sentiment from multiple sources to gauge collective mood.

## Data Points

| Field | Type | Description |
|-------|------|-------------|
| aggregateSentiment | number | 0-100 combined score |
| sentimentLabel | string | "Extreme Fear" to "Extreme Greed" |
| googleTrends | object | Search trend data |
| socialMood | object | Social media sentiment |
| fearGreedIndices | object | Market fear/greed |
| newssentiment | object | News tone analysis |

## Data Sources

### Google Trends (pytrends or scrape)
Track search interest for key terms:

**Fear/Anxiety Terms:**
- "recession"
- "market crash"
- "anxiety"
- "end of world"
- "war"

**Optimism Terms:**
- "bull market"
- "investment opportunity"
- "hope"
- "recovery"

```javascript
// Using unofficial Google Trends API
// npm install google-trends-api
const googleTrends = require('google-trends-api');

async function getTrendScore(keyword) {
  const results = await googleTrends.interestOverTime({
    keyword: keyword,
    startTime: new Date(Date.now() - 7 * 24 * 3600000),
    geo: 'US'
  });

  const data = JSON.parse(results);
  const values = data.default.timelineData.map(d => d.value[0]);
  return values[values.length - 1]; // Latest value
}
```

### Reddit Sentiment (Optional)
```
https://www.reddit.com/r/wallstreetbets.json?limit=100
```
Analyze post titles for sentiment using simple keyword matching or Gemini.

### Twitter/X Sentiment
Requires API access ($100/mo minimum). Alternative: use pre-aggregated sentiment from:
- StockTwits API (free tier)
- Social Sentiment APIs

### Fear & Greed Indices

**CNN Fear & Greed:**
```javascript
async function getCNNFearGreed() {
  const url = 'https://production.dataviz.cnn.io/index/fearandgreed/graphdata';
  const response = await fetch(url);
  const data = await response.json();
  return {
    score: data.fear_and_greed.score,
    label: data.fear_and_greed.rating,
    previous: data.fear_and_greed.previous_close
  };
}
```

**Crypto Fear & Greed:**
```javascript
async function getCryptoFearGreed() {
  const url = 'https://api.alternative.me/fng/?limit=1';
  const response = await fetch(url);
  const data = await response.json();
  return {
    score: parseInt(data.data[0].value),
    label: data.data[0].value_classification
  };
}
```

## Sentiment Aggregation

Weighted average of available signals:

```javascript
function calculateAggregateSentiment(data) {
  const weights = {
    cnnFearGreed: 0.25,
    cryptoFearGreed: 0.15,
    googleTrendsFear: 0.20,  // Inverted (high fear search = low sentiment)
    newssentiment: 0.20,
    socialMood: 0.20
  };

  let score = 0;
  let totalWeight = 0;

  for (const [key, weight] of Object.entries(weights)) {
    if (data[key] !== null) {
      score += data[key] * weight;
      totalWeight += weight;
    }
  }

  return Math.round(score / totalWeight);
}
```

## Sentiment Labels

| Score | Label |
|-------|-------|
| 0-20 | Extreme Fear |
| 21-40 | Fear |
| 41-60 | Neutral |
| 61-80 | Greed |
| 81-100 | Extreme Greed |

## Google Trends Ratio

Calculate fear/optimism ratio:
```javascript
function calculateTrendsRatio(fearTerms, optimismTerms) {
  const fearAvg = average(fearTerms);
  const optimismAvg = average(optimismTerms);

  // Convert to 0-100 scale
  // ratio > 1 means more fear, ratio < 1 means more optimism
  const ratio = fearAvg / (optimismAvg + 1);
  const normalized = 50 - (Math.log(ratio) * 20);

  return Math.max(0, Math.min(100, normalized));
}
```

## Historical Data Storage

### Table: sentiment_daily
```sql
CREATE TABLE sentiment_daily (
  date DATE PRIMARY KEY,
  aggregate_score INTEGER,
  cnn_fear_greed INTEGER,
  crypto_fear_greed INTEGER,
  google_fear_score INTEGER,
  google_optimism_score INTEGER,
  news_sentiment INTEGER,
  social_sentiment INTEGER
);
```

## Output Example

```json
{
  "timestamp": "2025-01-31T12:00:00Z",
  "aggregate": {
    "score": 38,
    "label": "Fear",
    "trend": "declining",
    "change24h": -5
  },
  "components": {
    "cnnFearGreed": {
      "score": 42,
      "label": "Fear",
      "change": -3
    },
    "cryptoFearGreed": {
      "score": 35,
      "label": "Fear",
      "change": -8
    },
    "googleTrends": {
      "fearIndex": 65,
      "optimismIndex": 42,
      "ratio": "fear-dominant",
      "topFearTerm": "recession",
      "topOptimismTerm": "recovery"
    },
    "newsSentiment": {
      "score": 40,
      "dominantTone": "cautious"
    }
  }
}
```

## Display

```
😰 SENTIMENT
─────────────
Aggregate: 38 (Fear)
Trend: ▼ declining

CNN F&G: 42 (Fear)
Crypto F&G: 35 (Fear)

Google Trends:
Fear terms ▲ (recession)
Optimism ▼

24h Change: -5 pts
```

## Historical Depth

- CNN Fear & Greed: 2018+
- Crypto Fear & Greed: 2018+
- Google Trends: 2004+ (but API limited to 5 years easily)
- Build our own aggregate history from collection date

## Update Frequency
- Fear/Greed indices: Every hour
- Google Trends: Every 6 hours (rate limited)
- Aggregate: Every hour
