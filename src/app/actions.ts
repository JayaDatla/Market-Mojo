
'use server';

import type { TickerAnalysisOutput, PriceData, Ticker, IndustryAnalysis } from '@/types';
import fetch from 'node-fetch';

const PERPLEXITY_API_URL = "https://api.perplexity.ai/chat/completions";
const PERPLEXITY_MODEL = "sonar";

// In-memory cache to store recent analysis results
const analysisCache = new Map<string, { timestamp: number; data: TickerAnalysisOutput }>();
const CACHE_DURATION_MS = 15 * 60 * 1000; // 15 minutes

const generatePrompt = (companyIdentifier: string, validatedTicker?: Ticker) => `
You are a highly specialized Global Financial Sentiment Analyst. Your sole function is to assess the market-moving sentiment of news related to a specific global company.

The user has provided the following identifier: "${companyIdentifier}".
${validatedTicker ? `We have validated this refers to the following publicly traded company:
- Company Name: ${validatedTicker.companyName}
- Ticker: ${validatedTicker.ticker}
- Exchange: ${validatedTicker.exchange}
` : ''}

Focus your analysis exclusively on this company. If the identifier refers to a private company (like 'Zerodha' or 'Stripe'), state that clearly and perform the news analysis without focusing on stock market data.

First, perform a general news sentiment analysis. Search for the top 5 most recent credible news articles from the past 30 days related to the company's financial performance or material developments.

Analyze each article for its relevance to investor perception. For each article, return:
- title
- url
- one-sentence financial impact summary
- sentiment classification: "Positive", "Negative", or "Neutral"
- sentiment_score: a numeric value from -1.0 (strongly negative) to 1.0 (strongly positive)

After processing all articles (maximum 5), compute a summary of the overall sentiment, including:
- the average sentiment score
- the dominant sentiment classification
- a brief 2–3 sentence summary of the general investor outlook for the company over the past 30 days.

Finally, provide a brief, 2-3 sentence analysis of the company's position within its primary sector, key drivers, and challenges, along with its top 3-4 major competitors.

Return all information as a single valid JSON object with the exact structure:

{
  "company": "${validatedTicker ? validatedTicker.companyName : companyIdentifier}",
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
  },
  "industryAnalysis": {
      "industry": "...",
      "sectorAnalysis": "...",
      "competitors": ["...", "..."]
  }
}

Ensure the JSON is strictly valid and contains no additional text, explanations, or formatting outside of the JSON structure. If no credible information can be found for "${companyIdentifier}", return a JSON object with only an "error" field.
`;


export async function fetchAndAnalyzeNews(
  userInput: string,
  validatedTicker?: Ticker,
): Promise<TickerAnalysisOutput> {

  const cacheKey = validatedTicker ? validatedTicker.ticker : userInput.trim().toUpperCase();
  const cachedEntry = analysisCache.get(cacheKey);

  if (cachedEntry && (Date.now() - cachedEntry.timestamp < CACHE_DURATION_MS)) {
    return cachedEntry.data;
  }

  const prompt = generatePrompt(userInput, validatedTicker);
  
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
        return { error: `API request failed with status ${response.status}: ${errorText}` };
    }

    const data: any = await response.json();
    const content = data.choices[0]?.message?.content;
    
    if (!content) {
        return { error: "No content returned from the API." };
    }
    
    const jsonRegex = /```json\s*([\s\S]*?)\s*```|({[\s\S]*})/;
    const match = content.match(jsonRegex);

    if (!match || (!match[1] && !match[2])) {
        console.error("No JSON object found in the API response:", content);
        return { error: "Failed to find valid JSON in the API's response.", rawResponse: content };
    }
    
    const cleanedContent = match[1] || match[2];

    try {
      // The AI response no longer contains tickers, so we parse what it gives us
      // and merge it with the validated ticker if one was provided.
      const parsedJson: Omit<TickerAnalysisOutput, 'tickers'> = JSON.parse(cleanedContent);
      
      const result: TickerAnalysisOutput = {
        ...parsedJson,
        tickers: validatedTicker ? [validatedTicker] : [],
      };

      if (result.company) {
         analysisCache.set(cacheKey, { timestamp: Date.now(), data: result });
      }
      
      return {...result, rawResponse: data};
    } catch (e: any) {
      console.error("Failed to parse JSON from API response:", e, "Cleaned content:", cleanedContent);
      return { error: "Failed to parse the analysis from the API's response.", rawResponse: content };
    }

  } catch (e: any) {
    console.error(`Error analyzing ${userInput}:`, e);
    return {
      error: e.message || `An unexpected error occurred while analyzing ${userInput}.`,
    };
  }
}

// ------------------ Utility: Date Range ------------------

function getUnixTimestamps(daysAgo: number): {start: number; end: number} {
  const end = Math.floor(Date.now() / 1000);
  const start = end - daysAgo * 24 * 3600;
  return {start, end};
}

// ------------------ Step 1: Search Yahoo Finance ------------------

export async function searchYahooFinance(query: string): Promise<Ticker[]> {
  const url = `https://query1.finance.yahoo.com/v1/finance/search?q=${encodeURIComponent(
    query
  )}&quotesCount=5&newsCount=0`; // Fetch up to 5 potential matches

  const res = await fetch(url, {headers: {'User-Agent': 'Mozilla/5.0'}});

  if (!res.ok) throw new Error(`Search failed: ${res.statusText}`);

  const data: any = await res.json();

  if (!data.quotes || data.quotes.length === 0) {
     return []; // Return empty array if no tickers found
  }

  // Filter out non-equity results and map to our Ticker type
  const tickers: Ticker[] = data.quotes
    .filter((q: any) => q.quoteType === 'EQUITY' && q.symbol && q.longname)
    .map((q: any) => ({
      ticker: q.symbol,
      companyName: q.longname,
      exchange: q.exchange,
      currency: q.currency || 'USD', // The search API may not return currency, so default.
  }));

  return tickers;
}

// ------------------ Step 2: Fetch Chart Data ------------------

export async function fetchChartData(ticker: string, days = 30): Promise<PriceData[]> {
  const {start, end} = getUnixTimestamps(days);
  const apiUrl = `https://query1.finance.yahoo.com/v8/finance/chart/${encodeURIComponent(
    ticker
  )}?period1=${start}&period2=${end}&interval=1d`;

  const res = await fetch(apiUrl, {headers: {'User-Agent': 'Mozilla/5.0'}});
  if (!res.ok) throw new Error(`Chart fetch failed for ${ticker}: ${res.statusText}`);

  const data: any = await res.json();

  if (!data.chart?.result?.length)
    throw new Error(`No chart data available for ${ticker}`);

  const result = data.chart.result[0];
  const timestamps = result.timestamp || [];
  const quotes = result.indicators.quote?.[0] || {};
  const meta = result.meta || {};

  const historicalData: PriceData[] = timestamps.map((ts: number, i: number) => ({
    date: new Date(ts * 1000).toISOString().split('T')[0],
    open: quotes.open?.[i] ?? null,
    high: quotes.high?.[i] ?? null,
    low: quotes.low?.[i] ?? null,
    close: quotes.close?.[i] ?? null,
    volume: quotes.volume?.[i] ?? null,
    currency: meta.currency ?? 'USD',
  }));

  const validData = historicalData.filter(d => d.open !== null && d.close !== null);
  
  if (validData.length === 0) {
      throw new Error(`No valid historical price data found for ${ticker}.`);
  }

  return validData;
}
