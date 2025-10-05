
'use server';

import type { TickerAnalysisOutput, ArticleAnalysis } from "@/types";

export async function fetchAndAnalyzeNews(ticker: string): Promise<TickerAnalysisOutput> {
    // This function body is now handled by the Genkit flow.
    // The existing implementation can be removed or kept as a fallback.
    // For this example, we assume the Genkit flow is the primary mechanism.
    return { error: 'Direct API calls are deprecated. Use Genkit flow.' };
}
