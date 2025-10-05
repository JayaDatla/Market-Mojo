# **App Name**: Market Mojo

## Core Features:

- Firebase Authentication: Authenticate users anonymously or via custom token, storing Firebase db instance and userId in React state.
- Real-time Sentiment Analysis via Firestore: Listen for real-time updates on sentiment analysis data for the selected ticker using onSnapshot.
- AI-Powered News Sentiment Analysis: Use the Gemini API to analyze news snippets for sentiment related to global companies, outputting structured JSON with sentiment scores and summaries, with a tool to determine if the tool should include this information in its output.
- Cost-Aware API Usage: Check for existing analysis records within the last 24 hours before calling the API to avoid redundant costs. Exponential backoff and robust error handling ensure reliable performance.
- Sentiment Data Persistence: Store sentiment analysis results, including newsTitle, summary, sentimentScore, sentimentLabel, and sourceUri, in Firestore with serverTimestamp for accurate tracking and plotting.
- Dashboard Visualization: Display sentiment data using Line and Pie charts, visualizing Daily Aggregate Average sentimentScore and Sentiment Distribution, along with a Hypothetical Market Movement correlation line.
- Static Industry Analysis: Provide a static analysis of the selected ticker's industry and list major global competitors for context.

## Style Guidelines:

- Background: Dark gray (#121212) to provide a high-contrast base for the content, referencing a clean and minimal approach.
- Cards: Slightly lighter gray (#212121) for elevated card elements, maintaining the monochromatic scheme.
- Primary color: Indigo (#6366F1) is used for interactive elements and chart lines.
- Body and headline font: 'Inter' (sans-serif) for a modern, objective feel, suitable for both headlines and body text.
- Note: currently only Google Fonts are supported.
- Use minimalist, geometric icons to represent different data types and actions, in white or light gray.
- Responsive layout with a focus on clear, readable typography. Cards should adapt to different screen sizes.
- Subtle transitions for loading data and updating charts, enhancing user experience without being distracting.