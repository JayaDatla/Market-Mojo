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
import { googleAI } from '@genkit-ai/google-genai';
import { FieldValue, serverTimestamp } from 'firebase-admin/firestore';
import { db } from '@/lib/firebase/firebase-admin';

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
  results: z.array(NewsArticleSchema).describe('An array of news analysis objects.'),
});
export type SentimentDataOutput = z.infer<typeof SentimentDataOutputSchema>;

export async function persistAndDisplaySentimentData(input: SentimentDataInput): Promise<SentimentDataOutput> {
  return persistAndDisplaySentimentDataFlow(input);
}

const SYSTEM_INSTRUCTION = `You are a highly specialized Global Financial Sentiment Analyst. Your sole function is to assess the market-moving sentiment of news related to major global companies. Strictly analyze the provided news snippets (found via Google Search) for their immediate impact on investor perception and stock price, ignoring all non-financial context. The user is providing a company identifier, which may be a ticker (e.g., AAPL) or a common name (e.g., SHELL). Output the analysis as a structured JSON array, ensuring the 'summary' is a single, concise sentence.`

const sentimentAnalysisPrompt = ai.definePrompt({
  name: 'sentimentAnalysisPrompt',
  input: {schema: SentimentDataInputSchema},
  output: {schema: SentimentDataOutputSchema},
  prompt: 
  `{{#tool_use}}
  Analyze the news snippets for {{ticker}} and determine the sentiment.
  {{~/tool_use}}
  `,
  system: SYSTEM_INSTRUCTION,
  tools: [{
    name: 'googleSearch',
    description: 'The user is asking for the latest news for the given company, so you MUST use this tool to find the latest news.',
    inputSchema: z.object({
        ticker: z.string().describe('the company ticker to use when searching google.'),
    }),
    outputSchema: z.string(),
    async call(input) {
        const news = await ai.generate({
            model: googleAI.model('gemini-2.5-flash-preview-05-20'),
            prompt: `find 5 of the latest news snippets for ${input.ticker}`,
        });

        return news.text ?? '';
    }
  }]
});

const persistAndDisplaySentimentDataFlow = ai.defineFlow(
  {
    name: 'persistAndDisplaySentimentDataFlow',
    inputSchema: SentimentDataInputSchema,
    outputSchema: SentimentDataOutputSchema,
  },
  async input => {
    try {
        const existingData = await db
            .collection("artifacts")
            .doc("__app_id")
            .collection("public")
            .doc("data")
            .collection("financial_news_sentiment")
            .where("ticker", "==", input.ticker)
            .where("timestamp", ">=", FieldValue.serverTimestamp())
            .limit(5)
            .get();

        if (!existingData.empty) {
            const results = existingData.docs.map((doc) => doc.data()) as any[];
            console.log("Existing data found, skipping API call");
            return { results };
        }

        const { output } = await sentimentAnalysisPrompt(input);

        if (output && output.results) {
          // Save the sentiment analysis results to Firestore
          await Promise.all(
            output.results.map(async (result) => {
              await db
                .collection("artifacts")
                .doc("__app_id")
                .collection("public")
                .doc("data")
                .collection("financial_news_sentiment")
                .add({
                  ...result,
                  ticker: input.ticker,
                  timestamp: serverTimestamp(),
                });
            })
          );

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
