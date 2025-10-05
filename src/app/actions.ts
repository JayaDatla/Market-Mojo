'use server';

import { persistAndDisplaySentimentData } from "@/ai/flows/persist-and-display-sentiment-data";
import { db } from "@/lib/firebase/firebase-admin";

export async function fetchAndAnalyzeNews(ticker: string): Promise<{ message?: string; error?: string }> {
  if (!ticker || typeof ticker !== 'string' || ticker.trim() === '') {
    return { error: 'A valid stock ticker is required.' };
  }

  const upperCaseTicker = ticker.trim().toUpperCase();

  try {
    const twentyFourHoursAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
    const existingData = await db
      .collectionGroup("financial_news_sentiment")
      .where("ticker", "==", upperCaseTicker)
      .where("timestamp", ">=", twentyFourHoursAgo)
      .limit(1)
      .get();

    if (!existingData.empty) {
        console.log(`Recent analysis found for ${upperCaseTicker}. Skipping new analysis.`);
        return { message: 'Recent analysis already available.' };
    }

    console.log(`Fetching new analysis for ${upperCaseTicker}.`);
    await persistAndDisplaySentimentData({ ticker: upperCaseTicker });

    return { message: 'Analysis in progress... Results will appear shortly.' };

  } catch (error) {
    console.error('Error in fetchAndAnalyzeNews:', error);
    const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred.';
    return { error: `Failed to fetch news analysis: ${errorMessage}` };
  }
}
