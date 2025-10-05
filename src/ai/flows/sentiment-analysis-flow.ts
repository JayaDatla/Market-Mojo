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
    const searchResult = await ai.runTool(googleAI.googleSearch, {
        q: `financial news about ${ticker}`,
        num: 5, // Look at the top 5 recent articles
    });

    if (!searchResult.results || searchResult.results.length === 0) {
      return { analysis: [] };
    }
    
    const articlesToAnalyze = searchResult.results.map(r => ({
        title: r.title,
        url: r.url,
        content: r.snippet,
    }));
    
    const prompt = `
        You are an expert financial sentiment analyst. For each of the following news articles, provide a one-sentence summary, determine if the sentiment is Positive, Negative, or Neutral, and provide a sentiment score from -1.0 to 1.0.

        Analyze these articles for the ticker "${ticker}":
        
        ${articlesToAnalyze.map(a => `Article Title: ${a.title}\nURL: ${a.url}\nContent Snippet: ${a.content}`).join('\n\n')}

        Respond with only a JSON object that conforms to the following Zod schema:
        ${JSON.stringify(TickerAnalysisOutputSchema.describe('Your analysis results').jsonSchema())}
      `;

    const response = await fetch(process.env.PERPLEXITY_API_URL!, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${process.env.PERPLEXITY_API_KEY}`,
        },
        body: JSON.stringify({
            model: 'perplexity/llama-3-sonar-large-32k-online',
            messages: [{ role: 'user', content: prompt }],
            response_format: { type: 'json_object' },
        }),
    });

    if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Perplexity API Error: ${response.status} ${errorText}`);
    }

    const jsonResponse = await response.json();
    const content = jsonResponse.choices[0]?.message?.content;
    
    if (!content) {
        throw new Error('No content in Perplexity API response');
    }

    try {
        const parsedOutput = JSON.parse(content);
        // Validate the parsed output against the Zod schema
        const validation = TickerAnalysisOutputSchema.safeParse(parsedOutput);
        if (!validation.success) {
            console.error('Perplexity response validation error:', validation.error.errors);
            throw new Error('Perplexity response does not match the expected schema.');
        }
        return validation.data;
    } catch (e) {
        console.error('Error parsing Perplexity response:', e);
        throw new Error('Failed to parse analysis from Perplexity API.');
    }
  }
);
