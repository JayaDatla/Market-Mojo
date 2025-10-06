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
  currency?: string;
};

// This type now matches the structure of the JSON expected from Perplexity
export type ArticleAnalysis = {
  title: string;
  url: string;
  summary:string;
  sentiment: 'Positive' | 'Negative' | 'Neutral';
  sentiment_score: number;
  ticker: string;
  currency?: string;
};

// This type represents the direct output from the API call
export type TickerAnalysisOutput = {
  analysis?: ArticleAnalysis[];
  error?: string;
  rawResponse?: any;
};
