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
