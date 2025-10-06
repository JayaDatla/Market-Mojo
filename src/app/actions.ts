
'use server';

import type { TickerAnalysisOutput, ArticleAnalysis } from '@/types';

const PERPLEXITY_API_URL = "https://api.perplexity.ai/chat/completions";
const PERPLEXITY_MODEL = "sonar";

const generatePrompt = (tickerOrName: string) => `
You are a highly specialized Global Financial Sentiment Analyst. Your sole function is to assess the market-moving sentiment of news related to major global companies.

The user has provided the following identifier: "${tickerOrName}". This identifier could be a company name, ticker symbol, or other public reference. First, determine the exact company name, all publicly traded ticker symbols, and their associated listing exchanges.

CRITICAL: If the company is listed on a US-based exchange (e.g., NYSE, NASDAQ) in addition to its primary international exchange, you MUST prioritize and use the US-based ticker symbol. For all other companies, use the ticker from their primary exchange.

For the selected ticker, determine the three-letter currency code corresponding to its exchange (e.g., "USD" for NASDAQ, "JPY" for Tokyo Stock Exchange, "INR" for NSE India).

After confirming the single most appropriate ticker and its currency, search the web for the top 5 most recent credible news articles related to this company’s financial performance, operations, or major market-moving developments.

Strictly analyze each article snippet for its immediate impact on investor perception and potential influence on the stock price, ignoring all non-financial or non-investor-relevant context.

For each article, provide:
- title
- url
- one-sentence financial impact summary
- sentiment classification: "Positive", "Negative", or "Neutral"
- sentiment_score from -1.0 to 1.0
- the identified ticker
- the currency code of its primary exchange

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
    
    // Regex to find JSON within ```json ... ``` or a raw array.
    const jsonRegex = /(?:```json\s*)?(\[.*\])/s;
    const match = content.match(jsonRegex);

    if (!match || !match[1]) {
        console.error("No JSON array found in the API response:", content);
        return { error: "Failed to find valid JSON in the API's response.", rawResponse: content };
    }
    
    const cleanedContent = match[1];

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
