
'use server';

import type { TickerAnalysisOutput, PriceData } from '@/types';
import fetch from 'node-fetch';

const PERPLEXITY_API_URL = "https://api.perplexity.ai/chat/completions";
const PERPLEXITY_MODEL = "sonar";

// In-memory cache to store recent analysis results
const analysisCache = new Map<string, { timestamp: number; data: TickerAnalysisOutput }>();
const CACHE_DURATION_MS = 15 * 60 * 1000; // 15 minutes

const generatePrompt = (companyIdentifier: string) => `
You are a highly specialized Global Financial Sentiment Analyst. Your sole function is to assess the market-moving sentiment of news related to major global companies.

The user has provided the following identifier: "${companyIdentifier}". This identifier could be a company name, ticker symbol, or other public reference.

First, determine:
1. The exact company name.
2. The primary industry or sector the company operates in.
3. The top 3-4 major competitors.
4. A brief, 2-3 sentence analysis of the company's position within its sector, key drivers, and challenges.
5. All publicly traded ticker symbols and their associated listing exchanges.
6. The three-letter currency code corresponding to each exchange (e.g., "USD" for NASDAQ, "JPY" for Tokyo Stock Exchange).

If the company is dual-listed (actively traded on more than one exchange), generate separate analyses for each listing using the correct ticker and currency.

Next, search for the top 5 most recent credible financial news articles from the past 30 days related to the company's financial performance, operations, or other material developments that could affect investor sentiment or stock price.

Analyze each article snippet solely for its relevance to investor perception and share price influence, ignoring non-financial or unrelated context.

For each article, return:
- title
- url
- one-sentence financial impact summary
- sentiment classification: "Positive", "Negative", or "Neutral"
- sentiment_score: a numeric value from -1.0 (strongly negative) to 1.0 (strongly positive)
- ticker
- currency

After processing all articles (maximum 5 per ticker), compute a summary of the overall sentiment across the most relevant articles, including:
- the average sentiment score
- the dominant sentiment classification (based on majority or average polarity)
- a brief 2–3 sentence summary of the general investor outlook for the company over the past 30 days.

Return all information as a single valid JSON object with the exact structure:

{
  "company": "Exact Company Name",
  "industryAnalysis": {
      "industry": "...",
      "sectorAnalysis": "...",
      "competitors": ["...", "..."]
  },
  "tickers": [
    {
      "ticker": "...",
      "exchange": "...",
      "currency": "...",
      "articles": [
        {
          "title": "...",
          "url": "...",
          "summary": "...",
          "sentiment": "Positive" | "Negative" | "Neutral",
          "sentiment_score": ...
        }
      ],
      "analysis_summary": {
        "average_sentiment_score": ...,
        "dominant_sentiment": "Positive" | "Negative" | "Neutral",
        "investor_outlook": "..."
      }
    }
  ]
}

Ensure the JSON is strictly valid and contains no additional text, explanations, or formatting outside of the JSON structure.
`;


export async function fetchAndAnalyzeNews(
  tickerOrName: string
): Promise<TickerAnalysisOutput> {
  const normalizedInput = tickerOrName.trim().toUpperCase();
  const cachedEntry = analysisCache.get(normalizedInput);

  // Check if a valid, recent entry exists in the cache
  if (cachedEntry && (Date.now() - cachedEntry.timestamp < CACHE_DURATION_MS)) {
    return cachedEntry.data;
  }

  const prompt = generatePrompt(tickerOrName);
  
  if (!process.env.PERPLEXITY_API_KEY) {
    throw new Error("PERPLEXITY_API_KEY is not set in the environment variables.");
  }

  const headers = {
    "Content-Type": "application/json",
    "Authorization": `Bearer ${process.env.PERPLEXITY_API_KEY}`
  };

  const body = {
    "model": PERPLEXITY_MODEL,
    "messages": [
      {"role": "user", "content": prompt}
    ],
  };

  try {
    const response = await fetch(PERPLEXITY_API_URL, {
      method: 'POST',
      headers: headers,
      body: JSON.stringify(body)
    });

    if (!response.ok) {
        const errorText = await response.text();
        console.error(`API request failed with status ${response.status}:`, errorText);
        const result: TickerAnalysisOutput = { error: `API request failed with status ${response.status}: ${errorText}` };
        return result;
    }

    const data: any = await response.json();
    const content = data.choices[0]?.message?.content;
    
    if (!content) {
        const result: TickerAnalysisOutput = { error: "No content returned from the API." };
        return result;
    }
    
    const jsonRegex = /```json\s*([\s\S]*?)\s*```|({[\s\S]*})/;
    const match = content.match(jsonRegex);

    if (!match || (!match[1] && !match[2])) {
        console.error("No JSON object found in the API response:", content);
        const result: TickerAnalysisOutput = { error: "Failed to find valid JSON in the API's response.", rawResponse: content };
        return result;
    }
    
    const cleanedContent = match[1] || match[2];

    try {
      const parsedJson: TickerAnalysisOutput = JSON.parse(cleanedContent);
      
      // If analysis is successful and contains data, cache it.
      if (parsedJson.company && parsedJson.tickers && parsedJson.tickers.length > 0) {
        const finalTicker = parsedJson.tickers[0].ticker.toUpperCase();
        analysisCache.set(finalTicker, { timestamp: Date.now(), data: parsedJson });
        analysisCache.set(normalizedInput, { timestamp: Date.now(), data: parsedJson });
      }
      
      return {...parsedJson, rawResponse: data};
    } catch (e: any) {
      console.error("Failed to parse JSON from API response:", e, "Cleaned content:", cleanedContent);
      const result: TickerAnalysisOutput = { error: "Failed to parse the analysis from the API's response.", rawResponse: content };
      return result;
    }

  } catch (e: any) {
    console.error(`Error analyzing ticker ${tickerOrName}:`, e);
    const result: TickerAnalysisOutput = {
      error: e.message || `An unexpected error occurred while analyzing ${tickerOrName}.`,
    };
    return result;
  }
}

// ------------------ Utility: Date Range ------------------

function getUnixTimestamps(daysAgo: number): {start: number; end: number} {
  const end = Math.floor(Date.now() / 1000);
  const start = end - daysAgo * 24 * 3600;
  return {start, end};
}

// ------------------ Step 1: Search Yahoo Finance ------------------

async function searchYahooFinance(query: string) {
  const url = `https://query1.finance.yahoo.com/v1/finance/search?q=${encodeURIComponent(
    query
  )}&quotesCount=1&newsCount=0`;

  const res = await fetch(url, {headers: {'User-Agent': 'Mozilla/5.0'}});

  if (!res.ok) throw new Error(`Search failed: ${res.statusText}`);

  const data: any = await res.json();

  if (!data.quotes || data.quotes.length === 0)
    throw new Error(`No ticker found for "${query}"`);

  const info = data.quotes[0];
  return {
    shortname: info.shortname || query,
    symbol: info.symbol,
    exchange: info.exchange,
    type: info.quoteType,
    country: info.exchangeDisp || 'Unknown',
  };
}

// ------------------ Step 2: Fetch Chart Data ------------------

async function fetchChartData(ticker: string, days = 30) {
  const {start, end} = getUnixTimestamps(days);
  const apiUrl = `https://query1.finance.yahoo.com/v8/finance/chart/${encodeURIComponent(
    ticker
  )}?period1=${start}&period2=${end}&interval=1d`;

  const res = await fetch(apiUrl, {headers: {'User-Agent': 'Mozilla/5.0'}});
  if (!res.ok) throw new Error(`Chart fetch failed: ${res.statusText}`);

  const data: any = await res.json();

  if (!data.chart?.result?.length)
    throw new Error(`No chart data available for ${ticker}`);

  const result = data.chart.result[0];
  const timestamps = result.timestamp || [];
  const quotes = result.indicators.quote?.[0] || {};

  const historicalData: PriceData[] = timestamps.map((ts: number, i: number) => ({
    date: new Date(ts * 1000).toISOString().split('T')[0],
    open: quotes.open?.[i] ?? null,
    high: quotes.high?.[i] ?? null,
    low: quotes.low?.[i] ?? null,
    close: quotes.close?.[i] ?? null,
    volume: quotes.volume?.[i] ?? null,
    currency: result.meta?.currency ?? 'USD',
  }));

  return historicalData.filter(d => d.open !== null && d.close !== null);
}

// ------------------ Step 3: Main Auto Function ------------------

export async function fetchHistoricalDataAuto(
  companyNameOrTicker: string,
  days = 30
) {
  const searchResult = await searchYahooFinance(companyNameOrTicker);
  const history = await fetchChartData(searchResult.symbol, days);

  return {
    company: searchResult.shortname,
    ticker: searchResult.symbol,
    exchange: searchResult.exchange,
    country: searchResult.country,
    data: history,
  };
}
