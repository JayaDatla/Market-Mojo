
'use server';

import type { TickerAnalysisOutput } from '@/types';

const API_URL = "https://api.perplexity.ai/chat/completions";
const MODEL = "sonar";

const generatePrompt = (tickerOrName: string) => `
You are a highly specialized Global Financial Sentiment Analyst. Your sole function is to assess the market-moving sentiment of news related to major global companies.

The user has provided the following identifier: "${tickerOrName}". First, identify the correct stock ticker for this company. Then, search the web to find the top 5 most recent news articles for it.

Strictly analyze these news snippets for their immediate impact on investor perception and stock price, ignoring all non-financial context.
For each article, provide a one-sentence summary, determine if the sentiment is "Positive", "Negative", or "Neutral", and provide a sentiment_score from -1.0 to 1.0.

Your response MUST be a single, valid JSON array of objects, and nothing else. Do not include any introductory text, closing text, or markdown formatting. The JSON should have the following structure:
[
  {
    "title": "...",
    "url": "...",
    "summary": "...",
    "sentiment": "Positive" | "Negative" | "Neutral",
    "sentiment_score": ...,
    "ticker": "..."
  }
]
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
    "model": MODEL,
    "messages": [
      {"role": "user", "content": prompt}
    ],
  };

  try {
    const response = await fetch(API_URL, {
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
    
    // The response is often a JSON string within the content, sometimes with markdown
    const cleanedContent = content.replace(/```json\n|```/g, '').trim();

    try {
      const analysis = JSON.parse(cleanedContent);
      return { analysis, rawResponse: data };
    } catch (e: any) {
      console.error("Failed to parse JSON from API response:", e);
      return { error: "Failed to parse the analysis from the API's response.", rawResponse: content };
    }

  } catch (e: any) {
    console.error(`Error analyzing ticker ${tickerOrName}:`, e);
    return {
      error: e.message || `An unexpected error occurred while analyzing ${tickerOrName}.`,
    };
  }
}
