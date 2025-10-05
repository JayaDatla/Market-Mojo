'use server';

import { sentimentAnalysisFlow } from '@/ai/sentiment-analysis';
import type { TickerAnalysisOutput } from '@/types';

export async function analyzeTicker(ticker: string): Promise<TickerAnalysisOutput> {
  const result = await sentimentAnalysisFlow({ ticker });
  return result;
}
