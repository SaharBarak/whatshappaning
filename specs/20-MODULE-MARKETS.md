# Markets Module

## Overview
Real-time and historical market data for correlation analysis and predictions.

## Data Points

### Indices & Assets
| Symbol | Name | Source | Update |
|--------|------|--------|--------|
| SPX | S&P 500 | Yahoo Finance | 15min |
| BTC | Bitcoin | CoinGecko | 5min |
| XAU | Gold | Yahoo Finance | 15min |
| DXY | US Dollar Index | Yahoo Finance | 15min |
| VIX | Volatility Index | Yahoo Finance | 15min |

### Sentiment Indicators
| Indicator | Source | Range |
|-----------|--------|-------|
| CNN Fear & Greed | CNN API/scrape | 0-100 |
| Crypto Fear & Greed | alternative.me | 0-100 |
| Put/Call Ratio | CBOE | 0.5-1.5 typical |
| VIX Term Structure | CBOE | Contango/Backwardation |

### Derived Metrics
| Metric | Calculation |
|--------|-------------|
| dailyReturn | (close - prevClose) / prevClose |
| volatility5d | StdDev of last 5 daily returns |
| volumeAnomaly | volume / avg20dVolume |
| drawdown | (price - 52wHigh) / 52wHigh |

## Data Sources (Free)

### Yahoo Finance (yfinance)
```javascript
// npm install yahoo-finance2
const yahooFinance = require('yahoo-finance2').default;

async function getQuote(symbol) {
  const quote = await yahooFinance.quote(symbol);
  return {
    price: quote.regularMarketPrice,
    change: quote.regularMarketChangePercent,
    volume: quote.regularMarketVolume,
    high52w: quote.fiftyTwoWeekHigh,
    low52w: quote.fiftyTwoWeekLow
  };
}

async function getHistory(symbol, days = 365) {
  const endDate = new Date();
  const startDate = new Date();
  startDate.setDate(startDate.getDate() - days);

  return await yahooFinance.historical(symbol, {
    period1: startDate,
    period2: endDate
  });
}
```

### CoinGecko (Free, no auth)
```
https://api.coingecko.com/api/v3/simple/price?ids=bitcoin&vs_currencies=usd&include_24hr_change=true
```

### Crypto Fear & Greed (Free)
```
https://api.alternative.me/fng/?limit=1
```

### CNN Fear & Greed
No official API - scrape from:
```
https://production.dataviz.cnn.io/index/fearandgreed/graphdata
```

## Historical Data Storage

### Table: market_daily
```sql
CREATE TABLE market_daily (
  date DATE NOT NULL,
  symbol VARCHAR(20) NOT NULL,
  open DECIMAL(20,8),
  high DECIMAL(20,8),
  low DECIMAL(20,8),
  close DECIMAL(20,8),
  volume BIGINT,
  PRIMARY KEY (date, symbol)
);

CREATE INDEX idx_market_symbol_date ON market_daily (symbol, date DESC);
```

### Table: market_sentiment
```sql
CREATE TABLE market_sentiment (
  date DATE NOT NULL,
  cnn_fear_greed INTEGER,
  crypto_fear_greed INTEGER,
  vix_close DECIMAL(10,2),
  put_call_ratio DECIMAL(5,3),
  PRIMARY KEY (date)
);
```

## Output Example

```json
{
  "timestamp": "2025-01-31T15:30:00Z",
  "indices": {
    "SPX": {
      "price": 4890.23,
      "dailyChange": -1.2,
      "volatility5d": 1.8,
      "volumeAnomaly": 1.4,
      "trend": "down"
    },
    "BTC": {
      "price": 43250,
      "dailyChange": 2.3,
      "volatility5d": 4.2,
      "trend": "up"
    },
    "GOLD": {
      "price": 2035.50,
      "dailyChange": 0.3,
      "trend": "flat"
    },
    "DXY": {
      "price": 103.45,
      "dailyChange": -0.2,
      "trend": "down"
    }
  },
  "sentiment": {
    "vix": 18.5,
    "vixTrend": "rising",
    "fearGreedCNN": 42,
    "fearGreedCrypto": 38,
    "putCallRatio": 0.87,
    "overallSentiment": "Fear"
  },
  "anomalies": [
    {
      "type": "volumeSpike",
      "symbol": "SPX",
      "value": 1.8,
      "description": "Volume 80% above 20d average"
    }
  ]
}
```

## Display

```
📈 MARKETS
─────────────
SPX: 4890 ▼1.2%
BTC: 43.2K ▲2.3%
Gold: 2035 ─
DXY: 103.4 ▼

VIX: 18.5 (rising)
Fear/Greed: 42 (Fear)

⚠️ SPX volume +80%
```

## Historical Depth

For backtesting:
- S&P 500: 1950+ (Yahoo)
- BTC: 2014+ (CoinGecko)
- Gold: 1970+ (Yahoo)
- VIX: 1990+ (Yahoo)
- Fear/Greed: 2018+ (need to build)

## Update Frequency
- Prices: Every 15 minutes during market hours
- Sentiment: Every hour
- Historical: Daily batch at market close
