'use server';
/**
 * @fileOverview A sentiment analysis flow that fetches news, analyzes sentiment, and stores the results.
 *
 * - persistAndDisplaySentimentData - A function that triggers the sentiment analysis and data persistence process.
 * - SentimentDataInput - The input type for the persistAndDisplaySentimentData function.
 * - SentimentDataOutput - The return type for the persistAndDisplaySentimentData function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';
import { serverTimestamp } from 'firebase-admin/firestore';
import { db } from '@/lib/firebase/firebase-admin';
import { googleSearchTool } from '@genkit-ai/google-genai';

const NewsArticleSchema = z.object({
  newsTitle: z.string().describe('The title of the news article.'),
  summary: z.string().describe('A concise, single-sentence summary of the article.'),
  sentimentScore: z.number().describe('The sentiment score, ranging from -1.0 (negative) to 1.0 (positive).'),
  sentimentLabel: z.enum(['Positive', 'Neutral', 'Negative']).describe('The sentiment label.'),
  sourceUri: z.string().url().describe('The URL of the news source.'),
});

const SentimentDataInputSchema = z.object({
  ticker: z.string().describe('The stock ticker or company identifier (e.g., VW, SHELL, 700.HK).'),
});
export type SentimentDataInput = z.infer<typeof SentimentDataInputSchema>;

const SentimentDataOutputSchema = z.object({
  results: z.array(NewsArticleSchema).length(5).describe('An array of 5 news analysis objects.'),
});
export type SentimentDataOutput = z.infer<typeof SentimentDataOutputSchema>;

export async function persistAndDisplaySentimentData(input: SentimentDataInput): Promise<SentimentDataOutput> {
  return persistAndDisplaySentimentDataFlow(input);
}

const SYSTEM_INSTRUCTION = `You are a highly specialized Global Financial Sentiment Analyst. Your sole function is to assess the market-moving sentiment of news related to major global companies. 
You MUST use the provided Google Search tool to find 5 recent news articles for the given ticker.
Strictly analyze the news for its immediate impact on investor perception and stock price, ignoring all non-financial context. 
The user is providing a company identifier, which may be a ticker (e.g., AAPL) or a common name (e.g., SHELL). 
Output the analysis as a structured JSON array, ensuring the 'summary' is a single, concise sentence.`;

const sentimentAnalysisPrompt = ai.definePrompt({
  name: 'sentimentAnalysisPrompt',
  input: { schema: SentimentDataInputSchema },
  output: { schema: SentimentDataOutputSchema },
  system: SYSTEM_INSTRUCTION,
  tools: [googleSearchTool],
  prompt: `Analyze the news for {{ticker}} and determine the sentiment.`
});

const persistAndDisplaySentimentDataFlow = ai.defineFlow(
  {
    name: 'persistAndDisplaySentimentDataFlow',
    inputSchema: SentimentDataInputSchema,
    outputSchema: SentimentDataOutputSchema,
  },
  async input => {
    try {
      const { output } = await sentimentAnalysisPrompt(input);

      if (output && output.results) {
        const appId = process.env.NEXT_PUBLIC_APP_ID || '__app_id';
        const collectionPath = `artifacts/${appId}/public/data/financial_news_sentiment`;

        // Save the sentiment analysis results to Firestore
        const batch = db.batch();
        output.results.forEach((result) => {
          const docRef = db.collection(collectionPath).doc(); // Auto-generate ID
          batch.set(docRef, {
            ...result,
            ticker: input.ticker,
            timestamp: serverTimestamp(),
          });
        });
        await batch.commit();

        return output;
      } else {
        console.error("No output from sentimentAnalysisPrompt");
        return { results: [] }; // Return an empty array if there's no output.
      }
    } catch (error: any) {
      console.error("Error in persistAndDisplaySentimentDataFlow:", error);
      throw new Error("Failed to analyze and store sentiment data: " + error.message);
    }
  }
);
