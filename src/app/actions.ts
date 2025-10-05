'use server';

import { persistAndDisplaySentimentData, type SentimentDataOutput } from "@/ai/flows/persist-and-display-sentiment-data";
import { db } from "@/lib/firebase/firebase-admin";
import { collection, getDocs, query, where, Timestamp, writeBatch } from "firebase/firestore";


export async function fetchAndAnalyzeNews(ticker: string): Promise<{ data?: SentimentDataOutput; message?: string; error?: string }> {
  if (!ticker || typeof ticker !== 'string' || ticker.trim() === '') {
    return { error: 'A valid stock ticker is required.' };
  }

  const upperCaseTicker = ticker.trim().toUpperCase();
  const appId = process.env.NEXT_PUBLIC_APP_ID || '__app_id';
  const collectionPath = `artifacts/${appId}/public/data/financial_news_sentiment`;

  try {
    // This check runs on the server using the Admin SDK
    const twentyFourHoursAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
    const q = query(
        collection(db, collectionPath),
        where('ticker', '==', upperCaseTicker),
        where('timestamp', '>=', twentyFourHoursAgo)
    );
    const existingData = await getDocs(q);

    if (!existingData.empty) {
        return { message: 'Recent analysis already available. Displaying cached results.' };
    }

    console.log(`Fetching new analysis for ${upperCaseTicker}.`);
    const result = await persistAndDisplaySentimentData({ ticker: upperCaseTicker });

    if (result.results.length === 0) {
      return { message: 'Analysis could not be completed at this time.' };
    }
    
    // The results are returned to the client to be written, to avoid credential conflicts on the server.
    return { data: result, message: 'Analysis complete. Saving results...' };

  } catch (error) {
    console.error('Error in fetchAndAnalyzeNews:', error);
    const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred.';
    return { error: `Failed to fetch news analysis: ${errorMessage}` };
  }
}

// This is a new server action that will be called from the client to save data.
export async function saveAnalysisResults(ticker: string, results: SentimentDataOutput['results']): Promise<{ success?: boolean; error?: string }> {
    if (!ticker || !results || results.length === 0) {
        return { error: 'Invalid data provided for saving.' };
    }

    const appId = process.env.NEXT_PUBLIC_APP_ID || '__app_id';
    const collectionPath = `artifacts/${appId}/public/data/financial_news_sentiment`;

    try {
        const batch = writeBatch(db);
        results.forEach((result) => {
            const docRef = collection(db, collectionPath).doc(); // Auto-generate ID
            batch.set(docRef, {
                ...result,
                ticker: ticker.toUpperCase(),
                timestamp: Timestamp.now(), // Use server-side timestamp
            });
        });
        await batch.commit();
        return { success: true };
    } catch (error) {
        console.error('Error saving analysis results to Firestore:', error);
        const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred.';
        return { error: `Failed to save results: ${errorMessage}` };
    }
}
