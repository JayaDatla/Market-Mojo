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


const sentimentAnalysisFlow = ai.defineFlow(
  {
    name: 'sentimentAnalysisFlow',
    inputSchema: TickerAnalysisInputSchema,
    outputSchema: TickerAnalysisOutputSchema,
  },
  async ({ ticker }) => {
    
    const sentimentAnalysisPrompt = ai.definePrompt(
        {
            name: 'sentimentAnalysisPrompt',
            input: {
                schema: z.object({
                    ticker: z.string(),
                }),
            },
            output: {
                schema: TickerAnalysisOutputSchema,
            },
            tools: [googleAI.googleSearch],
            model: googleAI('gemini-1.5-flash'), // Using a standard model for tool use support
            prompt: `
                You are an expert financial sentiment analyst. 
                Find the top 5 recent news articles about the company with the stock ticker "{{ticker}}".
                For each of the articles, provide a one-sentence summary, determine if the sentiment is Positive, Negative, or Neutral, and provide a sentiment-score from -1.0 to 1.0.
            `
        },
    )

    const searchResult = await sentimentAnalysisPrompt({ticker});
    const articles = searchResult.output?.analysis;

    if (!articles || articles.length === 0) {
      return { analysis: [] };
    }
    
    return { analysis: articles };
  }
);
