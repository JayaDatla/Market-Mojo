'use server';

import { analyzeTicker } from "@/ai/flows/sentiment-analysis-flow";

export async function fetchAndAnalyzeNews(ticker: string) {
    try {
        const result = await analyzeTicker({ ticker });
        return result;
    } catch (error) {
        console.error('Error analyzing ticker:', error);
        return { error: 'Failed to analyze ticker.' };
    }
}
