'use server';
/**
 * @fileOverview This file defines a Genkit flow for analyzing the sentiment of financial news related to a specific company or stock ticker.
 *
 * - analyzeFinancialNewsSentiment - The main function that orchestrates the sentiment analysis process.
 * - AnalyzeFinancialNewsSentimentInput - The input type for the analyzeFinancialNewsSentiment function.
 * - AnalyzeFinancialNewsSentimentOutput - The output type for the analyzeFinancialNewsSentiment function, representing an array of news sentiment analysis results.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const AnalyzeFinancialNewsSentimentInputSchema = z.object({
  ticker: z
    .string()
    .describe("The stock ticker or company name to analyze news sentiment for (e.g., 'VW', 'SHELL', '700.HK')."),
});
export type AnalyzeFinancialNewsSentimentInput = z.infer<typeof AnalyzeFinancialNewsSentimentInputSchema>;

const AnalyzeFinancialNewsSentimentOutputSchema = z.array(
  z.object({
    newsTitle: z.string().describe('The title of the news article.'),
    summary: z.string().describe('A concise, one-sentence summary of the news article.'),
    sentimentScore: z
      .number()
      .min(-1)
      .max(1)
      .describe('A numerical score representing the sentiment of the news article, ranging from -1.0 (negative) to 1.0 (positive).'),
    sentimentLabel: z
      .enum(['Positive', 'Neutral', 'Negative'])
      .describe('A label representing the sentiment of the news article.'),
    sourceUri: z.string().url().describe('The URL of the news article.'),
  })
).length(5);
export type AnalyzeFinancialNewsSentimentOutput = z.infer<typeof AnalyzeFinancialNewsSentimentOutputSchema>;

export async function analyzeFinancialNewsSentiment(
  input: AnalyzeFinancialNewsSentimentInput
): Promise<AnalyzeFinancialNewsSentimentOutput> {
  return analyzeFinancialNewsSentimentFlow(input);
}

const SYSTEM_INSTRUCTION = `You are a highly specialized Global Financial Sentiment Analyst. Your sole function is to assess the market-moving sentiment of news related to major global companies. Strictly analyze the provided news snippets (found via Google Search) for their immediate impact on investor perception and stock price, ignoring all non-financial context. The user is providing a company identifier, which may be a ticker (e.g., AAPL) or a common name (e.g., SHELL). Output the analysis as a structured JSON array, ensuring the 'summary' is a single, concise sentence.`

const analyzeFinancialNewsSentimentPrompt = ai.definePrompt({
  name: 'analyzeFinancialNewsSentimentPrompt',
  input: {schema: AnalyzeFinancialNewsSentimentInputSchema},
  output: {schema: AnalyzeFinancialNewsSentimentOutputSchema},
  prompt: `{{#tool_use}}
  Analyze the following news snippets related to {{ticker}} and provide a structured JSON array with the following fields for each of the 5 news articles:\n
  - newsTitle: The title of the news article.\n  - summary: A concise, one-sentence summary of the news article.\n  - sentimentScore: A numerical score representing the sentiment of the news article, ranging from -1.0 (negative) to 1.0 (positive).\n  - sentimentLabel: A label representing the sentiment of the news article ('Positive', 'Neutral', or 'Negative').\n  - sourceUri: The URL of the news article.\n  {{/tool_use}}`,
  system: SYSTEM_INSTRUCTION,
  tools: [
    ai.defineTool({
      name: 'googleSearch',
      description: 'Use this to search for the latest news articles related to the company or stock ticker.',
      inputSchema: z.object({
        query: z.string().describe('The search query to use.  This should include the ticker symbol, and the word \'news\'.'),
      }),
      outputSchema: z.string().describe('A list of snippets from news articles found via Google Search.'),
    }),
  ],
});

const analyzeFinancialNewsSentimentFlow = ai.defineFlow(
  {
    name: 'analyzeFinancialNewsSentimentFlow',
    inputSchema: AnalyzeFinancialNewsSentimentInputSchema,
    outputSchema: AnalyzeFinancialNewsSentimentOutputSchema,
  },
  async input => {
    const searchResult = await ai.tool('googleSearch').invoke({
      query: `${input.ticker} news`,
    });

    const {output} = await analyzeFinancialNewsSentimentPrompt({
      ticker: input.ticker,
      tool_use: searchResult,
    });
    return output!;
  }
);
