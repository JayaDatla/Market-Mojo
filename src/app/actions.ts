
'use server';

import type { TickerAnalysisOutput, ArticleAnalysis } from "@/types";

const API_URL = "https://api.perplexity.ai/chat/completions";
const MODEL = "sonar"; 

function generatePrompt(ticker: string): string {
    return `
You are a highly specialized Global Financial Sentiment Analyst. Your sole function is to assess the market-moving sentiment of news related to major global companies.

You MUST search for and analyze the top 5 most recent, relevant news articles for the company identified by the ticker: "${ticker}".

Strictly analyze these news snippets for their immediate impact on investor perception and stock price, ignoring all non-financial context.
For each article, provide:
1.  "title": The headline of the article.
2.  "url": The direct URL to the article.
3.  "summary": A concise, one-sentence summary of the article's key financial takeaway.
4.  "sentiment": A single-word sentiment: "Positive", "Negative", or "Neutral".
5.  "sentiment_score": A score from -1.0 (very negative) to 1.0 (very positive).

Your final output MUST be a single, valid JSON object containing one key, "analysis", which holds an array of these article analysis objects. Do not include any other text, markdown, or explanations outside of this JSON object.

Example output format:
{
  "analysis": [
    {
      "title": "Example News Title",
      "url": "http://example.com/news1",
      "summary": "The company reported record profits this quarter.",
      "sentiment": "Positive",
      "sentiment_score": 0.8
    }
  ]
}
`;
}


export async function fetchAndAnalyzeNews(ticker: string): Promise<TickerAnalysisOutput> {
    const prompt = generatePrompt(ticker);
    const apiKey = process.env.PERPLEXITY_API_KEY;

    if (!apiKey) {
        console.error('Perplexity API key is not set.');
        return { error: 'Server configuration error: API key missing.' };
    }

    try {
        const response = await fetch(API_URL, {
            method: 'POST',
            headers: {
                "Content-Type": "application/json",
                "Authorization": `Bearer ${apiKey}`
            },
            body: JSON.stringify({
                model: MODEL,
                messages: [
                    { role: "user", content: prompt }
                ],
            })
        });
        
        const rawResponse = await response.json();

        if (!response.ok) {
            console.error(`Perplexity API Error: ${response.status}`, rawResponse);
            return { error: `API request failed with status ${response.status}.`, rawResponse };
        }

        const content = rawResponse.choices[0]?.message?.content;

        if (!content) {
            console.error('No content in Perplexity API response', rawResponse);
            return { error: 'No content received from analysis service.', rawResponse };
        }

        try {
            const parsedContent: { analysis: ArticleAnalysis[] } = JSON.parse(content);

            if (!parsedContent.analysis || !Array.isArray(parsedContent.analysis)) {
                console.error('Parsed content is not in the expected format', parsedContent);
                return { error: 'Analysis result is in an unexpected format.', rawResponse };
            }
            
            return { analysis: parsedContent.analysis, rawResponse };
        } catch (jsonError: any) {
            console.error('Failed to parse JSON content from Perplexity API:', jsonError);
            console.log('Raw content received:', content);
            return { error: 'Failed to parse the analysis result.', rawResponse: { ...rawResponse, rawContent: content } };
        }

    } catch (error: any) {
        console.error('Error calling Perplexity API:', error);
        return { error: error.message || 'Failed to analyze ticker.' };
    }
}
