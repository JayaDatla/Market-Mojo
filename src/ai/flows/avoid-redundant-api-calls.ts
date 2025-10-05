'use server';

/**
 * @fileOverview This flow checks for recent sentiment analysis records in Firestore before making a new API call.
 *
 * - checkRecentAnalysis - Checks if sentiment analysis data for a ticker exists within the last 24 hours.
 * - CheckRecentAnalysisInput - The input type for the checkRecentAnalysis function.
 * - CheckRecentAnalysisOutput - The return type for the checkRecentAnalysis function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';
import {firestore} from 'firebase-admin';
import { db } from '@/lib/firebase/firebase-admin';

const CheckRecentAnalysisInputSchema = z.object({
  ticker: z.string().describe('The stock ticker to check.'),
  appId: z.string().describe('The application ID.'),
});
export type CheckRecentAnalysisInput = z.infer<typeof CheckRecentAnalysisInputSchema>;

const CheckRecentAnalysisOutputSchema = z.object({
  hasRecentData: z.boolean().describe('Whether there is recent data for the ticker.'),
});
export type CheckRecentAnalysisOutput = z.infer<typeof CheckRecentAnalysisOutputSchema>;

export async function checkRecentAnalysis(
  input: CheckRecentAnalysisInput
): Promise<CheckRecentAnalysisOutput> {
  return checkRecentAnalysisFlow(input);
}

const checkRecentAnalysisFlow = ai.defineFlow(
  {
    name: 'checkRecentAnalysisFlow',
    inputSchema: CheckRecentAnalysisInputSchema,
    outputSchema: CheckRecentAnalysisOutputSchema,
  },
  async input => {
    const {ticker, appId} = input;
    const now = firestore.Timestamp.now();
    const twentyFourHoursAgo = new firestore.Timestamp(now.seconds - 24 * 60 * 60, now.nanoseconds);

    const collectionPath = `/artifacts/${appId}/public/data/financial_news_sentiment`;

    const snapshot = await db
      .collection(collectionPath)
      .where('ticker', '==', ticker)
      .where('serverTimestamp', '>=', twentyFourHoursAgo)
      .limit(1)
      .get();

    const hasRecentData = !snapshot.empty;

    return {hasRecentData};
  }
);
