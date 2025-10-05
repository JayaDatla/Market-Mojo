'use server';

import { persistAndDisplaySentimentData } from "@/ai/flows/persist-and-display-sentiment-data";
import { db } from "@/lib/firebase/firebase-admin";
import { Timestamp } from "firebase-admin/firestore";

export async function fetchAndAnalyzeNews(ticker: string): Promise<{ message?: string; error?: string }> {
  if (!ticker || typeof ticker !== 'string' || ticker.trim() === '') {
    return { error: 'A valid stock ticker is required.' };
  }

  const upperCaseTicker = ticker.trim().toUpperCase();
  const appId = process.env.NEXT_PUBLIC_APP_ID || '__app_id';
  const collectionPath = `artifacts/${appId}/public/data/financial_news_sentiment`;
  const twentyFourHoursAgo = Timestamp.fromMillis(Date.now() - 24 * 60 * 60 * 1000);

  try {
    const snapshot = await db.collection(collectionPath)
      .where('ticker', '==', upperCaseTicker)
      .where('timestamp', '>=', twentyFourHoursAgo)
      .limit(1)
      .get();

    if (!snapshot.empty) {
      console.log(`Recent data found for ${upperCaseTicker}, skipping API call.`);
      return { message: 'Displaying recent analysis. A new analysis can be requested after 24 hours.' };
    }

    console.log(`No recent data for ${upperCaseTicker}. Fetching new analysis.`);
    await persistAndDisplaySentimentData({ ticker: upperCaseTicker });

    return { message: 'Analysis in progress... Results will appear shortly.' };

  } catch (error) {
    console.error('Error in fetchAndAnalyzeNews:', error);
    const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred.';
    return { error: `Failed to fetch news analysis: ${errorMessage}` };
  }
}
