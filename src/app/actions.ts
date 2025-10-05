'use server';

import { analyzeTicker } from '@/ai/flows/sentiment-analysis-flow';
import type { TickerAnalysisOutput } from '@/types';

export async function fetchAndAnalyzeNews(
  ticker: string
): Promise<TickerAnalysisOutput> {
  try {
    const result = await analyzeTicker(ticker);
    return result;
  } catch (e: any) {
    console.error(`Error analyzing ticker ${ticker}:`, e);
    return {
      error: e.message || `An unexpected error occurred while analyzing ${ticker}.`,
    };
  }
}
