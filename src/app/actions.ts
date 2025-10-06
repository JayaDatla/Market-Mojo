
'use server';

import type { TickerAnalysisOutput, ArticleAnalysis } from '@/types';

const PERPLEXITY_API_URL = "https://api.perplexity.ai/chat/completions";
const PERPLEXITY_MODEL = "sonar";

// In-memory cache to store recent analysis results
const analysisCache = new Map<string, { timestamp: number; data: TickerAnalysisOutput }>();
const CACHE_DURATION_MS = 15 * 60 * 1000; // 15 minutes

const generatePrompt = (tickerOrName: string) => `
You are a highly specialized Global Financial Sentiment Analyst. Your sole function is to assess the market-moving sentiment of news related to a specific company and its primary stock ticker.

The user has provided the following identifier: "${tickerOrName}".

Your tasks are:
1.  **Analyze the Input**: Determine if the input string is a stock ticker symbol (e.g., "AAPL", "TATAMOTORS.NS") or a company name (e.g., "Apple", "Tata Motors"). Set the 'isTicker' boolean field in your response accordingly.
2.  **Identify the Company, Ticker, and Country**: From the input, identify the precise company name, its primary stock ticker symbol, and its country of origin. You MUST prioritize the ticker symbol for the company's main listing exchange based on its country of origin. For example, for a company from India, prioritize the NSE or BSE ticker. For a US company, use the NYSE or NASDAQ ticker.
3.  **Determine Currency**: Find the three-letter currency code for that primary exchange (e.g., "INR" for NSE, "USD" for NASDAQ).
4.  **Analyze News**: Search the web for the top 5 most recent, credible news articles about the company's financial performance, product launches, or market-moving events.
5.  **Extract Financial Sentiment**: For each article, provide a one-sentence summary of its financial impact, a sentiment classification ("Positive", "Negative", or "Neutral"), and a sentiment score from -1.0 to 1.0.

**Output Format**: You MUST return the data as a single, valid JSON array of objects. Do not include any text, explanations, or markdown formatting outside of the JSON array. The structure must be exactly as follows:

[
  {
    "title": "...",
    "url": "...",
    "summary": "...",
    "sentiment": "Positive" | "Negative" | "Neutral",
    "sentiment_score": ...,
    "ticker": "...",
    "currency": "...",
    "companyCountry": "...",
    "isTicker": true | false
  }
]
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

    const data = await response.json();
    const content = data.choices[0]?.message?.content;
    
    if (!content) {
        const result: TickerAnalysisOutput = { error: "No content returned from the API." };
        return result;
    }
    
    const jsonRegex = /(?:```json\s*)?(\[.*\])/s;
    const match = content.match(jsonRegex);

    if (!match || !match[1]) {
        console.error("No JSON array found in the API response:", content);
        const result: TickerAnalysisOutput = { error: "Failed to find valid JSON in the API's response.", rawResponse: content };
        return result;
    }
    
    const cleanedContent = match[1];

    try {
      const analysis: ArticleAnalysis[] = JSON.parse(cleanedContent);
      const result: TickerAnalysisOutput = { analysis, rawResponse: data };
      
      // If analysis is successful and contains data, cache it.
      if (analysis.length > 0 && analysis[0].ticker) {
        // Use the identified ticker from the response for caching consistency.
        const finalTicker = analysis[0].ticker.toUpperCase();
        analysisCache.set(finalTicker, { timestamp: Date.now(), data: result });
        // Also cache under the original user input.
        analysisCache.set(normalizedInput, { timestamp: Date.now(), data: result });
      }
      
      return result;
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
