'use server';

import { persistAndDisplaySentimentData, type SentimentDataOutput } from "@/ai/flows/persist-and-display-sentiment-data";

export async function fetchAndAnalyzeNews(ticker: string): Promise<{ data?: SentimentDataOutput; message?: string; error?: string }> {
  if (!ticker || typeof ticker !== 'string' || ticker.trim() === '') {
    return { error: 'A valid stock ticker is required.' };
  }

  const upperCaseTicker = ticker.trim().toUpperCase();

  try {
    console.log(`Fetching new analysis for ${upperCaseTicker}.`);
    const result = await persistAndDisplaySentimentData({ ticker: upperCaseTicker });

    if (result.results.length === 0) {
      return { message: 'Analysis could not be completed at this time.' };
    }
    
    // The results are returned to the client to be written.
    return { data: result, message: 'Analysis complete. Saving results...' };

  } catch (error) {
    console.error('Error in fetchAndAnalyzeNews:', error);
    const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred.';
    return { error: `Failed to fetch news analysis: ${errorMessage}` };
  }
}
