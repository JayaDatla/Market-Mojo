# Market Mojo: AI-Powered Financial Sentiment Analyzer

Market Mojo is a modern, responsive web application that provides real-time sentiment analysis of financial news for global companies. By entering a stock ticker or company name, users can get an immediate sense of the market's perception of a company, backed by AI-analyzed news coverage and historical price data.

![Market Mojo Dashboard Screenshot](https://placehold.co/800x500/242938/ffffff?text=Market+Mojo+UI)

## ✨ Key Features

- **AI-Powered Sentiment Analysis**: Leverages a powerful AI model to fetch and analyze the latest news articles for any given company.
- **Intelligent Ticker Disambiguation**: If a company name has multiple possible stock tickers, the app prompts the user to select the correct one, ensuring data accuracy.
- **Sentiment Visualization**: Displays the sentiment distribution (Positive, Neutral, Negative) in an interactive and easy-to-read pie chart.
- **"Mojo's Take"**: An AI-generated investment outlook based on the aggregated news sentiment.
- **Historical Price Chart**: Shows a 30-day historical stock price chart, correctly displaying prices in the stock's native currency (e.g., USD, INR, EUR).
- **Trend Analysis**: Calculates and displays the 30-day price trend (Up, Down, or Neutral) using a moving average crossover strategy.
- **Mojo Synthesis**: A unique feature that provides a combined insight by comparing the news sentiment with the price trend.
- **Detailed News Feed**: Presents a list of the analyzed articles, including the title, a concise summary, the sentiment label, and a link to the original source.
-**Industry Deep Dive**: Provides an AI-generated analysis of the company's industry sector, key drivers, challenges, and major competitors.
- **Quick-Select Companies**: Offers buttons for top global companies to quickly trigger an analysis.
- **Secure User Authentication**: Full sign-up and login functionality using Firebase Authentication.
- **Responsive Design**: A modern, dark-themed UI that is fully responsive and works beautifully on all screen sizes.

## 🚀 Technology Stack

- **Framework**: [Next.js](https://nextjs.org/) (App Router & Server Actions)
- **Language**: [TypeScript](https://www.typescriptlang.org/)
- **Styling**: [Tailwind CSS](https://tailwindcss.com/)
- **UI Components**: [ShadCN UI](https://ui.shadcn.com/)
- **Charts**: [Recharts](https://recharts.org/)
- **AI/Sentiment Analysis**: [Perplexity AI API](https://www.perplexity.ai/)
- **Financial Data**: [Yahoo Finance API](https://finance.yahoo.com/)
- **Authentication**: [Firebase Authentication](https://firebase.google.com/docs/auth)
- **State Management**: React Hooks (`useState`, `useCallback`, `useTransition`)
- **Form Handling**: [React Hook Form](https://react-hook-form.com/) & [Zod](https://zod.dev/)

## 🛠️ Getting Started

Follow these instructions to get a copy of the project up and running on your local machine for development and testing purposes.

### Prerequisites

- [Node.js](https://nodejs.org/) (v18 or later)
- [npm](https://www.npmjs.com/) or a compatible package manager
- A [Firebase Project](https://firebase.google.com/docs/web/setup) with Authentication enabled.
- A Perplexity AI API Key.

### Installation

1.  **Clone the repository**
    ```sh
    git clone https://github.com/your-username/market-mojo.git
    cd market-mojo
    ```

2.  **Install NPM packages**
    ```sh
    npm install
    ```

3.  **Set up environment variables**

    Create a `.env.local` file in the root of your project by copying the example file:
    ```sh
    cp .env.example .env.local
    ```

    Open the `.env.local` file and add your Firebase configuration details and your Perplexity API key. You can get your Firebase config from your Firebase project settings.

    ```bash
    # Perplexity AI API Key
    PERPLEXITY_API_KEY="your_perplexity_api_key_here"

    # Firebase Config
    NEXT_PUBLIC_FIREBASE_API_KEY="your-api-key"
    NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN="your-auth-domain"
    NEXT_PUBLIC_FIREBASE_PROJECT_ID="your-project-id"
    NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET="your-storage-bucket"
    NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID="your-sender-id"
    NEXT_PUBLIC_FIREBASE_APP_ID="your-app-id"
    ```

4.  **Run the development server**
    ```sh
    npm run dev
    ```

The application should now be running on [http://localhost:3000](http://localhost:3000).

## 📁 Project Structure

```
src
├── app/
│   ├── (auth)/         # Auth pages (login, signup)
│   ├── api/            # Legacy API routes
│   ├── actions.ts      # Server Actions for AI and data fetching
│   └── page.tsx        # Main entry point for the dashboard
├── components/
│   ├── market-mojo/    # Feature-specific components
│   └── ui/             # Reusable UI components (ShadCN)
├── firebase/
│   ├── config.ts       # Firebase configuration
│   └── provider.tsx    # Firebase context provider and hooks
├── hooks/
│   └── use-toast.ts    # Custom toast hook
├── lib/
│   └── utils.ts        # Utility functions
└── types/
    └── index.ts        # TypeScript type definitions
```

## 📄 License

This project is licensed under the MIT License - see the [LICENSE.md](LICENSE.md) file for details.
