
'use server';

import type { TickerAnalysisOutput, ArticleAnalysis, PriceData } from '@/types';

const PERPLEXITY_API_URL = "https://api.perplexity.ai/chat/completions";
const PERPLEXITY_MODEL = "sonar";

const generatePrompt = (tickerOrName: string) => `
You are a highly specialized Global Financial Sentiment Analyst. Your sole function is to assess the market-moving sentiment of news related to major global companies.

The user has provided the following identifier: "${tickerOrName}". This identifier could be a company name, ticker symbol, or other public reference. First, determine the exact company name, all publicly traded ticker symbols, and their associated listing exchanges. For each ticker, determine the three-letter currency code corresponding to its primary exchange (e.g., "USD" for NASDAQ, "JPY" for Tokyo Stock Exchange, "INR" for NSE India).

Begin by identifying the company's primary/listing exchange and associated currency. If the company is dual-listed (actively publicly traded on more than one exchange), provide separate analyses for each listing using the correct ticker and currency for each exchange.

After confirming the ticker(s) and currency(ies), search the web for the top 5 most recent credible news articles related to this company’s financial performance, operations, or major market-moving developments.

Strictly analyze each article snippet for its immediate impact on investor perception and potential influence on the stock price, ignoring all non-financial or non-investor-relevant context.

For each article, provide:
- title
- url
- one-sentence financial impact summary
- sentiment classification: "Positive", "Negative", or "Neutral"
- sentiment_score from -1.0 to 1.0
- the identified ticker
- the currency code of its primary exchange

If there are multiple tickers because of dual/multiple listings, separate each group of 5 articles per ticker and exchange. Ensure that each article is tagged with the correct ticker and currency for its context.

Return results strictly as a single valid JSON array of objects with the exact structure:
[
  {
    "title": "...",
    "url": "...",
    "summary": "...",
    "sentiment": "Positive" | "Negative" | "Neutral",
    "sentiment_score": ...,
    "ticker": "...",
    "currency": "..."
  }
]
Ensure no additional text, explanations, or formatting outside of the JSON is included in the final response.
`;

export async function fetchAndAnalyzeNews(
  tickerOrName: string
): Promise<TickerAnalysisOutput> {
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
        return { error: `API request failed with status ${response.status}: ${errorText}` };
    }

    const data = await response.json();
    const content = data.choices[0]?.message?.content;
    
    if (!content) {
        return { error: "No content returned from the API." };
    }
    
    // Find the start and end of the JSON array
    const jsonStart = content.indexOf('[');
    const jsonEnd = content.lastIndexOf(']');
    
    if (jsonStart === -1 || jsonEnd === -1) {
        console.error("No JSON array found in the API response:", content);
        return { error: "Failed to find valid JSON in the API's response.", rawResponse: content };
    }

    const cleanedContent = content.substring(jsonStart, jsonEnd + 1);

    try {
      const analysis: ArticleAnalysis[] = JSON.parse(cleanedContent);
      return { analysis, rawResponse: data };
    } catch (e: any) {
      console.error("Failed to parse JSON from API response:", e, "Cleaned content:", cleanedContent);
      return { error: "Failed to parse the analysis from the API's response.", rawResponse: content };
    }

  } catch (e: any) {
    console.error(`Error analyzing ticker ${tickerOrName}:`, e);
    return {
      error: e.message || `An unexpected error occurred while analyzing ${tickerOrName}.`,
    };
  }
}

export async function fetchHistoricalData(ticker: string): Promise<PriceData[]> {
  const apiKey = process.env.ALPHA_VANTAGE_API_KEY;
  if (!apiKey) {
    throw new Error("ALPHA_VANTAGE_API_KEY is not set.");
  }
  
  const aVUrl = `https://www.alphavantage.co/query?function=TIME_SERIES_DAILY&symbol=${ticker}&apikey=${apiKey}&outputsize=compact`;

  try {
    const response = await fetch(aVUrl);
    if (!response.ok) {
      throw new Error(`Alpha Vantage API request failed with status ${response.status}`);
    }
    const data = await response.json();
    
    if (data['Note']) {
      console.warn('Alpha Vantage API limit reached:', data['Note']);
      return [];
    }

    const timeSeries = data['Time Series (Daily)'];
    if (!timeSeries) {
      console.error('No time series data found for ticker:', ticker, data);
      return [];
    }
    
    const priceData: PriceData[] = Object.entries(timeSeries)
      .map(([date, values]: [string, any]) => ({
        date,
        price: parseFloat(values['4. close']),
      }))
      .slice(0, 30) // Take the last 30 days
      .reverse(); // Reverse to have oldest date first

    return priceData;
  } catch (error: any) {
    console.error(`Failed to fetch historical data for ${ticker}:`, error);
    return []; // Return empty array on error
  }
}
