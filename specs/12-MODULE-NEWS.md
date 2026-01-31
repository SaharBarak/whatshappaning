# News Themes Module

## Overview
Scrape major news headlines, send to Gemini for theme extraction. Show patterns, not individual articles.

## Data Points

| Field | Type | Description |
|-------|------|-------------|
| themes | array | Extracted themes with article counts |
| sources | array | News sources scraped |
| articleCount | number | Total articles analyzed |
| timestamp | string | When analysis was performed |
| dominantTheme | string | Most prevalent theme |
| sentiment | string | Overall sentiment (neutral/tense/positive) |

## Theme Structure

```json
{
  "theme": "Economic Uncertainty",
  "articleCount": 4,
  "keywords": ["inflation", "markets", "recession"],
  "sentiment": "negative",
  "sources": ["Reuters", "AP"]
}
```

## News Sources

### Primary (Wire Services)
- **Reuters**: https://www.reuters.com/
- **AP News**: https://apnews.com/
- **BBC World**: https://www.bbc.com/news/world

### RSS Feeds (easier to scrape)
```
Reuters World: https://www.reutersagency.com/feed/
AP Top: https://rsshub.app/apnews/topics/apf-topnews
BBC World: http://feeds.bbci.co.uk/news/world/rss.xml
```

## Scraping Strategy

1. Fetch RSS feeds (XML parsing, less fragile than HTML)
2. Extract headlines + brief descriptions
3. Deduplicate similar stories
4. Send batch to Gemini for theme analysis

```javascript
async function scrapeNews() {
  const feeds = [
    'http://feeds.bbci.co.uk/news/world/rss.xml',
    'https://rsshub.app/apnews/topics/apf-topnews',
    // Add more
  ];

  const articles = [];
  for (const feed of feeds) {
    const items = await parseRSS(feed);
    articles.push(...items.slice(0, 10)); // Top 10 from each
  }

  return articles;
}
```

## Gemini Analysis

### Prompt Template
```
Analyze these news headlines and extract 3-5 major themes.
For each theme, provide:
- Theme name (2-4 words)
- Number of articles related
- Key keywords
- Overall sentiment (positive/negative/neutral)

Headlines:
{headlines}

Respond in JSON format:
{
  "themes": [
    {
      "theme": "string",
      "articleCount": number,
      "keywords": ["string"],
      "sentiment": "string"
    }
  ],
  "dominantTheme": "string",
  "overallSentiment": "string"
}
```

### Gemini API Call
```javascript
const { GoogleGenerativeAI } = require('@google/generative-ai');

async function analyzeWithGemini(headlines) {
  const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
  const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });

  const prompt = buildPrompt(headlines);
  const result = await model.generateContent(prompt);
  const response = await result.response;

  return JSON.parse(response.text());
}
```

### Rate Limits (Free Tier)
- 15 requests per minute
- 1 million tokens per minute
- 1500 requests per day

Our usage: ~8 requests/day (every 3 hours) = well within limits.

## Output Example

```json
{
  "timestamp": "2025-01-31T12:00:00Z",
  "articleCount": 30,
  "sources": ["BBC", "Reuters", "AP"],
  "themes": [
    {
      "theme": "Middle East Tensions",
      "articleCount": 7,
      "keywords": ["conflict", "diplomacy", "ceasefire"],
      "sentiment": "negative"
    },
    {
      "theme": "Climate Events",
      "articleCount": 5,
      "keywords": ["storms", "flooding", "temperature"],
      "sentiment": "negative"
    },
    {
      "theme": "Tech Developments",
      "articleCount": 4,
      "keywords": ["AI", "regulation", "investment"],
      "sentiment": "neutral"
    },
    {
      "theme": "Economic Policy",
      "articleCount": 3,
      "keywords": ["rates", "inflation", "growth"],
      "sentiment": "neutral"
    }
  ],
  "dominantTheme": "Middle East Tensions",
  "overallSentiment": "tense"
}
```

## Display

```
📰 NEWS THEMES
─────────────
30 articles analyzed
Sources: BBC, Reuters, AP

• Middle East Tensions (7)
  conflict • diplomacy • ceasefire

• Climate Events (5)
  storms • flooding • temperature

• Tech Developments (4)
  AI • regulation • investment

• Economic Policy (3)
  rates • inflation • growth

Overall: Tense
```

## Error Handling

1. If RSS fetch fails → use cached headlines
2. If Gemini fails → show "Analysis unavailable"
3. If all sources fail → show last successful analysis with timestamp

## Privacy Note

We don't store or display individual articles. Only aggregated themes. This is:
- More useful (patterns over noise)
- Less liability (not republishing content)
- Aligned with "data-driven" philosophy

## Update Frequency
Every 3 hours
