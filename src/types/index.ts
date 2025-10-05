import type { Timestamp } from "firebase/firestore";

export type NewsArticle = {
  id: string;
  newsTitle: string;
  summary: string;
  sentimentScore: number;
  sentimentLabel: 'Positive' | 'Neutral' | 'Negative';
  sourceUri: string;
  timestamp: Timestamp;
  ticker: string;
};

export type ArticleAnalysis = {
  title: string;
  url: string;
  summary:string;
  sentiment: 'Positive' | 'Negative' | 'Neutral';
  sentiment_score: number;
};

// This type represents the direct output from the Perplexity API call
export type TickerAnalysisOutput = {
  analysis?: ArticleAnalysis[];
  error?: string;
};
