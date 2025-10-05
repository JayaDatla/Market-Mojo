
'use client';

import { useState, useEffect, useCallback } from 'react';
import { collection, query, where, onSnapshot, orderBy, Firestore } from 'firebase/firestore';
import { useFirebase, useUser, useMemoFirebase } from '@/firebase';
import { useRouter } from 'next/navigation';
import type { NewsArticle } from '@/types';

import { useToast } from '@/hooks/use-toast';
import { Loader2 } from 'lucide-react';

import Header from './header';
import SentimentCharts from './sentiment-charts';
import NewsFeed from './news-feed';
import StaticAnalysis from './static-analysis';
import TopCompanies from './top-companies';

// Helper function to create the query
const createNewsQuery = (firestore: Firestore, ticker: string) => {
    if (!process.env.NEXT_PUBLIC_APP_ID || !ticker) return null;
    const appId = process.env.NEXT_PUBLIC_APP_ID;
    const collectionPath = `artifacts/${appId}/public/data/financial_news_sentiment`;
    return query(
      collection(firestore, collectionPath),
      where('ticker', '==', ticker.toUpperCase()),
      orderBy('timestamp', 'desc')
    );
};


export default function MarketMojoDashboard() {
  const { user, isUserLoading } = useUser();
  const { firestore } = useFirebase();
  const [ticker, setTicker] = useState('AAPL'); // Default to a ticker
  const [newsData, setNewsData] = useState<NewsArticle[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const { toast } = useToast();
  const router = useRouter();

  useEffect(() => {
    if (!isUserLoading && !user) {
        router.push('/login');
    }
  }, [isUserLoading, user, router]);


  const newsQuery = useMemoFirebase(() => {
    if (!firestore || !ticker) return null;
    return createNewsQuery(firestore, ticker);
  }, [firestore, ticker]);


  useEffect(() => {
    if (!newsQuery) {
        setNewsData([]); // Clear data if query is not available
        setIsLoading(false);
        return;
    };

    setIsLoading(true);
    const unsubscribe = onSnapshot(newsQuery, (querySnapshot) => {
      const data: NewsArticle[] = [];
      querySnapshot.forEach((doc) => {
        data.push({ id: doc.id, ...doc.data() } as NewsArticle);
      });
      setNewsData(data);
      setIsLoading(false);
    }, (error) => {
      console.error("Firestore snapshot error", error);
      toast({ variant: 'destructive', title: 'Data Error', description: 'Could not load real-time data.' });
      setIsLoading(false);
    });

    return () => unsubscribe();
  }, [newsQuery, toast]);
  

  const handleCompanySelect = useCallback((tickerToAnalyze: string) => {
    setIsLoading(true);
    setTicker(tickerToAnalyze);
    toast({ title: 'Loading Data', description: `Fetching sentiment analysis for ${tickerToAnalyze}.` });
  }, [toast]);

  if (isUserLoading || !user) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  const showDashboard = newsData.length > 0;

  return (
    <div className="flex flex-col min-h-screen">
      <Header />
      <div className="container mx-auto px-4 py-8 flex-grow">
        <div className="max-w-3xl mx-auto mb-12">
            <h2 className="text-4xl md:text-5xl font-bold text-center text-transparent bg-clip-text bg-gradient-to-r from-primary to-cyan-400 mb-4 tracking-tighter animate-gradient-x">Market Sentiment Analyzer</h2>
            <p className="text-lg text-muted-foreground text-center">Select a company below to see its real-time news sentiment analysis.</p>
        </div>
        
        {isLoading ? (
          <div className="text-center py-16">
            <Loader2 className="animate-spin mx-auto h-8 w-8 text-primary" />
            <p className="text-muted-foreground mt-4">Loading data for {ticker}...</p>
          </div>
        ) : showDashboard ? (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <div className="lg:col-span-2 space-y-8">
              <SentimentCharts newsData={newsData} />
              <NewsFeed newsData={newsData.slice(0, 5)} />
            </div>
            <div className="lg:col-span-1 space-y-8">
              <StaticAnalysis ticker={ticker} />
              <TopCompanies onCompanySelect={handleCompanySelect} />
            </div>
          </div>
        ) : (
          <TopCompanies onCompanySelect={handleCompanySelect} />
        )}
      </div>
    </div>
  );
}
