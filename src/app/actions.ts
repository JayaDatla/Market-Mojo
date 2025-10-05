'use server';

import { analyzeTicker as analyzeTickerFlow } from "@/ai/flows/sentiment-analysis-flow";

export async function fetchAndAnalyzeNews(ticker: string) {
    try {
        const result = await analyzeTickerFlow(ticker);
        return result;
    } catch (error: any) {
        console.error('Error analyzing ticker:', error);
        return { error: error.message || 'Failed to analyze ticker.' };
    }
}
