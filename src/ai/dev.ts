import { config } from 'dotenv';
config();

import '@/ai/flows/analyze-financial-news-sentiment.ts';
import '@/ai/flows/persist-and-display-sentiment-data.ts';
import '@/ai/flows/avoid-redundant-api-calls.ts';