'use server';

import { ai } from '@/ai/genkit';
import { z } from 'zod';
import { googleAI } from '@genkit-ai/google-genai';

const TickerAnalysisInputSchema = z.object({
  ticker: z.string().describe('The stock ticker symbol to analyze.'),
});

const ArticleAnalysisSchema = z.object({
  title: z.string().describe('The title of the news article.'),
  url: z.string().describe('The URL of the news article.'),
  summary: z
    .string()
    .describe('A concise, one-sentence summary of the article.'),
  sentiment: z
    .enum(['Positive', 'Negative', 'Neutral'])
    .describe('The overall sentiment of the article.'),
  sentiment_score: z
    .number()
    .min(-1)
    .max(1)
    .describe(
      'A score from -1 (very negative) to 1 (very positive) representing the sentiment.'
    ),
});

const TickerAnalysisOutputSchema = z.object({
  analysis: z
    .array(ArticleAnalysisSchema)
    .describe(
      'An array of sentiment analysis results for recent news articles.'
    ),
});

export async function analyzeTicker(
  input: z.infer<typeof TickerAnalysisInputSchema>
): Promise<z.infer<typeof TickerAnalysisOutputSchema>> {
  return await sentimentAnalysisFlow(input);
}

const sentimentAnalysisPrompt = ai.definePrompt({
  name: 'sentimentAnalysisPrompt',
  input: {
    schema: z.object({
      ticker: z.string(),
    }),
  },
  output: {
    schema: TickerAnalysisOutputSchema,
  },
  model: 'gemini-1.5-pro-latest',
  tools: [googleAI.googleSearch],
  prompt: `
        You are a highly specialized Global Financial Sentiment Analyst. Your sole function is to assess the market-moving sentiment of news related to major global companies.
        
        Use the googleSearch tool to find the top 5 recent news articles for the company identified by the user as "{{ticker}}".
        
        Strictly analyze these news snippets for their immediate impact on investor perception and stock price, ignoring all non-financial context.
        For each article, provide a one-sentence summary, determine if the sentiment is "Positive", "Negative", or "Neutral", and provide a sentiment_score from -1.0 to 1.0.
        
        Output the analysis as a structured JSON array.
      `,
});

const sentimentAnalysisFlow = ai.defineFlow(
  {
    name: 'sentimentAnalysisFlow',
    inputSchema: TickerAnalysisInputSchema,
    outputSchema: TickerAnalysisOutputSchema,
  },
  async ({ ticker }) => {
    const searchResult = await sentimentAnalysisPrompt({ ticker });
    const articles = searchResult.output?.analysis;

    if (!articles || articles.length === 0) {
      return { analysis: [] };
    }

    return { analysis: articles };
  }
);
