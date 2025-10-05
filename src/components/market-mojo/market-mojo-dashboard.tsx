
'use client';

import { useState, useEffect, useMemo, useCallback } from 'react';
import { User } from 'firebase/auth';
import { collection, query, where, onSnapshot, orderBy, Firestore, Timestamp, serverTimestamp } from 'firebase/firestore';
import { useFirebase, useUser, useMemoFirebase } from '@/firebase';
import { fetchAndAnalyzeNews } from '@/app/actions';
import { useRouter } from 'next/navigation';
import { addDocumentNonBlocking } from '@/firebase/firestore-mutations';
import type { NewsArticle } from '@/types';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useToast } from '@/hooks/use-toast';
import { Loader2, Search } from 'lucide-react';

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
  const { auth, firestore } = useFirebase();
  const [ticker, setTicker] = useState('');
  const [inputValue, setInputValue] = useState('');
  const [newsData, setNewsData] = useState<NewsArticle[]>([]);
  const [isLoading, setIsLoading] = useState(false);
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

    const unsubscribe = onSnapshot(newsQuery, (querySnapshot) => {
      const data: NewsArticle[] = [];
      querySnapshot.forEach((doc) => {
        data.push({ id: doc.id, ...doc.data() } as NewsArticle);
      });
      setNewsData(data);
    }, (error) => {
      console.error("Firestore snapshot error", error);
      toast({ variant: 'destructive', title: 'Data Error', description: 'Could not load real-time data.' });
    });

    return () => unsubscribe();
  }, [newsQuery, toast]);

  const saveAnalysisResultsClientSide = useCallback(async (tickerToSave: string, results: any[]) => {
      if (!firestore) {
          toast({ variant: 'destructive', title: 'Save Error', description: 'Database not available.' });
          return;
      }
      const appId = process.env.NEXT_PUBLIC_APP_ID || '__app_id';
      const collectionPath = `artifacts/${appId}/public/data/financial_news_sentiment`;
      const collectionRef = collection(firestore, collectionPath);
      
      results.forEach((result) => {
          addDocumentNonBlocking(collectionRef, {
              ...result,
              ticker: tickerToSave.toUpperCase(),
              timestamp: serverTimestamp(),
          });
      });
      toast({ title: 'Success', description: 'New analysis saved.'});

  }, [firestore, toast]);
  

  const handleFetchAndAnalyze = useCallback(async (tickerToAnalyze: string) => {
    if (!tickerToAnalyze) {
      toast({ variant: 'destructive', title: 'Input Error', description: 'Please enter a stock ticker.' });
      return;
    }

    setIsLoading(true);
    setTicker(tickerToAnalyze); // Update the active ticker to trigger listener
    setInputValue(tickerToAnalyze);

    // 1. Check if recent data exists on the client
    const twentyFourHoursAgo = Date.now() - 24 * 60 * 60 * 1000;
    const hasRecentData = newsData.some(
      (item) => item.ticker.toUpperCase() === tickerToAnalyze.toUpperCase() && item.timestamp?.toDate().getTime() > twentyFourHoursAgo
    );

    if (hasRecentData) {
        toast({ title: 'Analysis Status', description: 'Recent analysis already available. Displaying cached results.' });
        setIsLoading(false);
        return;
    }

    // 2. If not, fetch new analysis from the server
    const result = await fetchAndAnalyzeNews(tickerToAnalyze);

    if (result.error) {
      toast({ variant: 'destructive', title: 'Analysis Error', description: result.error });
      setIsLoading(false);
      return;
    }
    if (result.message) {
      toast({ title: 'Analysis Status', description: result.message });
    }

    // 3. If new data was fetched, save it from the client
    if (result.data?.results) {
        await saveAnalysisResultsClientSide(tickerToAnalyze, result.data.results);
    }
    
    // The onSnapshot listener will update the UI, so we just need to stop the loading indicator
    setTimeout(() => setIsLoading(false), 500); // Give a moment for Firestore to sync
  }, [newsData, saveAnalysisResultsClientSide, toast]);

  const handleFormSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    handleFetchAndAnalyze(inputValue);
  };
  
  const showDashboard = useMemo(() => newsData.length > 0, [newsData]);

  if (isUserLoading || !user) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="flex flex-col min-h-screen">
      <Header />
      <div className="container mx-auto px-4 py-8 flex-grow">
        <div className="max-w-3xl mx-auto mb-12">
            <h2 className="text-4xl md:text-5xl font-bold text-center text-transparent bg-clip-text bg-gradient-to-r from-primary to-cyan-400 mb-4 tracking-tighter animate-gradient-x">Market Sentiment Analyzer</h2>
            <p className="text-lg text-muted-foreground text-center">Enter a stock ticker or select a company below to get real-time news sentiment analysis powered by AI.</p>
        </div>
        <div className="max-w-2xl mx-auto mb-12">
            <form onSubmit={handleFormSubmit} className="flex items-center gap-2 bg-card border border-border/50 p-1.5 rounded-full shadow-lg">
              <Search className="ml-4 text-muted-foreground" />
              <Input
                type="text"
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                placeholder="Enter a stock ticker (e.g. TSLA, AAPL)"
                className="flex-grow text-base h-11 bg-transparent border-none focus-visible:ring-0 focus-visible:ring-offset-0"
                aria-label="Stock Ticker Input"
              />
              <Button type="submit" disabled={isLoading} className="h-10 w-24 rounded-full" size="sm">
                {isLoading ? <Loader2 className="animate-spin" /> : 'Analyze'}
              </Button>
            </form>
        </div>
        
        {(isLoading && newsData.length === 0) ? (
          <div className="text-center py-16">
            <Loader2 className="animate-spin mx-auto h-8 w-8 text-primary" />
            <p className="text-muted-foreground mt-4">Analyzing sentiment for {ticker}...</p>
          </div>
        ) : showDashboard ? (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <div className="lg:col-span-2 space-y-8">
              <SentimentCharts newsData={newsData} />
              <NewsFeed newsData={newsData.slice(0, 5)} />
            </div>
            <div className="lg:col-span-1">
              <StaticAnalysis ticker={ticker} />
            </div>
          </div>
        ) : (
          <TopCompanies onCompanySelect={handleFetchAndAnalyze} />
        )}
      </div>
    </div>
  );
}
