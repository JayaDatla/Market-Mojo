'use server';

import { genkit, Ai } from 'genkit';
import { googleAI } from '@genkit-ai/google-genai';

const plugins: any[] = [googleAI({ apiKey: process.env.GEMINI_API_KEY })];

export const ai: Ai = genkit({
  plugins,
});
