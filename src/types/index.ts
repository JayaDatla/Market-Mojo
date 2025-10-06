
export type Sentiment = 'Positive' | 'Neutral' | 'Negative';

export type NewsArticle = {
  title: string;
  url: string;
  summary: string;
  sentiment: Sentiment;
  sentiment_score: number;
};

export type AnalysisSummary = {
  average_sentiment_score: number;
  dominant_sentiment: Sentiment;
  investor_outlook: string;
};

export type TickerAnalysis = {
  ticker: string;
  exchange: string;
  currency: string;
  articles: NewsArticle[];
  analysis_summary: AnalysisSummary;
};

// This type represents the direct output from the API call
export type TickerAnalysisOutput = {
  company?: string;
  tickers?: TickerAnalysis[];
  error?: string;
  rawResponse?: any;
};

// This type represents a single day of historical price data from Yahoo Finance API
export type PriceData = {
  date: string; // "YYYY-MM-DD"
  close: number;
  open: number;
  high: number;
  low: number;
  volume: number;
  currency: string;
};
