
'use client';

import { useState, useEffect, useCallback } from 'react';
import { collection, query, where, onSnapshot, orderBy, Firestore } from 'firebase/firestore';
import { useFirebase, useUser, useMemoFirebase } from '@/firebase';
import { useRouter } from 'next/navigation';
import type { NewsArticle } from '@/types';

import { useToast } from '@/hooks/use-toast';
import { Loader2, Search, BarChart } from 'lucide-react';

import Header from './header';
import SentimentCharts from './sentiment-charts';
import NewsFeed from './news-feed';
import StaticAnalysis from './static-analysis';
import TopCompanies from './top-companies';
import { Input } from '../ui/input';
import { Button } from '../ui/button';

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
  const [ticker, setTicker] = useState(''); // Don't default to a ticker
  const [tickerInput, setTickerInput] = useState('');
  const [newsData, setNewsData] = useState<NewsArticle[]>([]);
  const [isLoading, setIsLoading] = useState(false); // Not loading initially
  const [hasSearched, setHasSearched] = useState(false); // Track if a search has been performed
  const [noResults, setNoResults] = useState(false); // Track if a search yielded no results
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
        return;
    };

    setIsLoading(true);
    setNoResults(false);
    const unsubscribe = onSnapshot(newsQuery, (querySnapshot) => {
      const data: NewsArticle[] = [];
      querySnapshot.forEach((doc) => {
        data.push({ id: doc.id, ...doc.data() } as NewsArticle);
      });
      setNewsData(data);
      if(data.length === 0 && hasSearched) {
        setNoResults(true);
      }
      setIsLoading(false);
    }, (error) => {
      console.error("Firestore snapshot error", error);
      toast({ variant: 'destructive', title: 'Data Error', description: 'Could not load real-time data.' });
      setIsLoading(false);
    });

    return () => unsubscribe();
  }, [newsQuery, toast, ticker, hasSearched]);
  

  const handleCompanySelect = useCallback((tickerToAnalyze: string) => {
    if (!tickerToAnalyze) return;
    setHasSearched(true);
    setNoResults(false);
    setTickerInput(tickerToAnalyze);
    setTicker(tickerToAnalyze);
    setIsLoading(true);
    toast({ title: 'Loading Data', description: `Fetching sentiment analysis for ${tickerToAnalyze}.` });
  }, [toast]);

  const handleViewTicker = () => {
    if (tickerInput) {
      handleCompanySelect(tickerInput);
    }
  }

  if (isUserLoading || !user) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  const showDashboard = newsData.length > 0 && hasSearched;

  return (
    <div className="flex flex-col min-h-screen">
      <Header />
      <div className="container mx-auto px-4 py-8 flex-grow">
        <div className="max-w-3xl mx-auto mb-12 text-center">
            <h2 className="text-4xl md:text-5xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-primary to-cyan-400 mb-4 tracking-tighter animate-gradient-x">Market Sentiment Analyzer</h2>
            <p className="text-lg text-muted-foreground">Enter a ticker or select a company below to see its real-time news sentiment analysis.</p>
            <div className="mt-6 max-w-xl mx-auto flex items-center gap-2">
              <div className="relative w-full">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  type="text"
                  placeholder="Enter a stock ticker (e.g., TSLA)"
                  value={tickerInput}
                  onChange={(e) => setTickerInput(e.target.value.toUpperCase())}
                  onKeyDown={(e) => e.key === 'Enter' && handleViewTicker()}
                  className="bg-background/50 border-border/50 text-base pl-10"
                />
              </div>
              <Button onClick={handleViewTicker} disabled={isLoading || !tickerInput} className="px-6">
                {isLoading ? <Loader2 className="animate-spin" /> : 'View'}
              </Button>
            </div>
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
        ) : noResults ? (
            <div className="text-center py-16 bg-card border border-dashed border-border/50 rounded-lg">
                <BarChart className="mx-auto h-12 w-12 text-muted-foreground" />
                <h3 className="mt-4 text-lg font-medium text-foreground">No Data Found</h3>
                <p className="mt-1 text-sm text-muted-foreground">
                    No sentiment data found for <span className="font-semibold text-foreground">{ticker}</span>.
                </p>
                 <p className="text-sm text-muted-foreground">Try selecting one of the top companies below.</p>
                 <div className="mt-8">
                    <TopCompanies onCompanySelect={handleCompanySelect} />
                 </div>
            </div>
        ) : (
          <div className="text-center">
            <TopCompanies onCompanySelect={handleCompanySelect} />
          </div>
        )}
      </div>
    </div>
  );
}
