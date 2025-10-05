import { genkit, Ai } from 'genkit';
import { googleAI } from '@genkit-ai/google-genai';

const plugins: any[] = [googleAI()];

export const ai: Ai = genkit({
  plugins,
});
