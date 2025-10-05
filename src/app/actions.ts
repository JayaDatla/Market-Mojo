'use server';

import { persistAndDisplaySentimentData } from "@/ai/flows/persist-and-display-sentiment-data";

export async function fetchAndAnalyzeNews(ticker: string): Promise<{ message?: string; error?: string }> {
  if (!ticker || typeof ticker !== 'string' || ticker.trim() === '') {
    return { error: 'A valid stock ticker is required.' };
  }

  const upperCaseTicker = ticker.trim().toUpperCase();

  try {
    console.log(`Fetching new analysis for ${upperCaseTicker}.`);
    const result = await persistAndDisplaySentimentData({ ticker: upperCaseTicker });

    if (result.results.length === 0) {
      return { message: 'Recent analysis already available. Displaying cached results.' };
    }

    return { message: 'Analysis in progress... Results will appear shortly.' };

  } catch (error) {
    console.error('Error in fetchAndAnalyzeNews:', error);
    const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred.';
    return { error: `Failed to fetch news analysis: ${errorMessage}` };
  }
}
