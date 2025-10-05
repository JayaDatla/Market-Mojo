# Market Mojo: Global Financial News Sentiment Analyzer

Market Mojo is a web application designed to provide real-time sentiment analysis of financial news for global companies. By entering a stock ticker, users can get an immediate sense of the market's perception of a company based on the latest news coverage.

![Market Mojo Dashboard Screenshot](https://placehold.co/800x500/242938/ffffff?text=Market+Mojo+UI)

## Features

- **Real-Time Sentiment Analysis**: Leverages the Perplexity API to fetch and analyze the latest news articles for any given stock ticker.
- **Sentiment Visualization**: Displays the sentiment distribution (Positive, Neutral, Negative) in an easy-to-read pie chart.
- **Overall Sentiment Score**: Calculates and displays an aggregate sentiment score based on the analyzed articles.
- **Historical Price Chart**: Shows a 30-day historical stock price chart (using placeholder data) to correlate with news sentiment.
- **Detailed News Feed**: Presents a list of analyzed articles, including the title, a concise summary, the sentiment label, and a link to the original source.
- **Industry Deep Dive**: Provides a static analysis of the company's industry sector and major competitors for select global companies.
- **Top Companies**: Offers quick-select buttons for the top 10 global companies by market cap to easily trigger an analysis.
- **User Authentication**: Secure sign-up and login functionality using Firebase Authentication.
- **Responsive Design**: A modern, dark-themed UI that is fully responsive and works on all screen sizes.

## Technology Stack

- **Framework**: [Next.js](https://nextjs.org/) (App Router)
- **Language**: [TypeScript](https://www.typescriptlang.org/)
- **Styling**: [Tailwind CSS](https://tailwindcss.com/)
- **UI Components**: [ShadCN UI](https://ui.shadcn.com/)
- **Charts**: [Recharts](https://recharts.org/)
- **AI/Sentiment Analysis**: [Perplexity AI API](https://www.perplexity.ai/)
- **Authentication**: [Firebase Authentication](https://firebase.google.com/docs/auth)
- **State Management**: React Hooks (`useState`, `useCallback`, `useTransition`)
- **Form Handling**: [React Hook Form](https://react-hook-form.com/) & [Zod](https://zod.dev/)

## Getting Started

Follow these instructions to get a copy of the project up and running on your local machine for development and testing purposes.

### Prerequisites

- [Node.js](https://nodejs.org/) (v18 or later)
- [npm](https://www.npmjs.com/) or a compatible package manager

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

    Create a `.env` file in the root of your project by copying the example file:
    ```sh
    cp .env.example .env
    ```

    Open the `.env` file and add your Perplexity API key:
    ```
    PERPLEXITY_API_KEY="your_perplexity_api_key_here"
    ```
    You will also need to add your Firebase configuration details to this file if you are connecting it to your own Firebase project.

4.  **Run the development server**
    ```sh
    npm run dev
    ```

The application should now be running on [http://localhost:3000](http://localhost:3000).

## Project Structure

- `src/app/`: Contains the main pages of the application (dashboard, login, signup).
- `src/components/`: Reusable React components, organized by feature (`market-mojo/`) and UI elements (`ui/`).
- `src/app/actions.ts`: Server Action that handles the call to the Perplexity API.
- `src/firebase/`: Configuration and hooks for Firebase services (Authentication, Firestore).
- `src/types/`: TypeScript type definitions used throughout the application.
- `public/`: Static assets.
- `tailwind.config.ts`: Configuration for Tailwind CSS.
