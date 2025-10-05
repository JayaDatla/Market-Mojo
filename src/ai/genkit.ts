
import 'dotenv/config';
import { genkit, Ai } from 'genkit';

const plugins: any[] = [
];

export const ai: Ai = genkit({
  plugins,
  logLevel: 'debug',
  enableTracing: true,
});
