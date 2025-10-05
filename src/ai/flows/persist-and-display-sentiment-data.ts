'use server';
/**
 * @fileOverview A sentiment analysis flow that fetches news and analyzes sentiment.
 *
 * - persistAndDisplaySentimentData - A function that triggers the sentiment analysis.
 * - SentimentDataInput - The input type for the persistAndDisplaySentimentData function.
 * - SentimentDataOutput - The return type for the persistAndDisplaySentimentData function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';
import { googleAI } from '@genkit-ai/google-genai';

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
You MUST find 5 recent news articles for the given ticker by using the available search tool.
Strictly analyze the news for its immediate impact on investor perception and stock price, ignoring all non-financial context. 
The user is providing a company identifier, which may be a ticker (e.g., AAPL) or a common name (e.g., SHELL). 
Output the analysis as a structured JSON array, ensuring the 'summary' is a single, concise sentence.`;

const sentimentAnalysisPrompt = ai.definePrompt({
  name: 'sentimentAnalysisPrompt',
  input: { schema: SentimentDataInputSchema },
  output: { schema: SentimentDataOutputSchema },
  system: SYSTEM_INSTRUCTION,
  prompt: `Analyze the news for {{ticker}} and determine the sentiment.`,
  tools: [googleAI.googleSearch],
  model: 'gemini-pro',
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
      
      if (output) {
        return output;
      } else {
        return { results: [] }; 
      }
    } catch (error: any) {
      console.error("Error in persistAndDisplaySentimentDataFlow:", error);
      throw new Error("Failed to analyze sentiment data: " + error.message);
    }
  }
);
