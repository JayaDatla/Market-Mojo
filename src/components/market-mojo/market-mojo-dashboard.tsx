'use client';

import { useState, useEffect, useMemo } from 'react';
import { signInAnonymously, User } from 'firebase/auth';
import { collection, query, where, onSnapshot, orderBy, Firestore } from 'firebase/firestore';
import { useFirebase, useUser, useMemoFirebase } from '@/firebase';
import { fetchAndAnalyzeNews } from '@/app/actions';

import type { NewsArticle } from '@/types';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { Loader2, TrendingUp } from 'lucide-react';

import Header from './header';
import SentimentCharts from './sentiment-charts';
import NewsFeed from './news-feed';
import StaticAnalysis from './static-analysis';

// Helper function to create the query
const createNewsQuery = (firestore: Firestore, ticker: string) => {
    if (!process.env.NEXT_PUBLIC_APP_ID) return null;
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
  const [ticker, setTicker] = useState('TSLA');
  const [inputValue, setInputValue] = useState('TSLA');
  const [newsData, setNewsData] = useState<NewsArticle[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    if (!isUserLoading && !user && auth) {
      signInAnonymously(auth).catch((error) => {
        console.error("Anonymous sign-in error", error);
        toast({ variant: 'destructive', title: 'Authentication Error', description: 'Could not sign in anonymously.' });
      });
    }
  }, [isUserLoading, user, auth, toast]);

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
      // The useCollection hook will now handle emitting the detailed error.
      // We can still show a generic toast here if we want.
      toast({ variant: 'destructive', title: 'Data Error', description: 'Could not load real-time data.' });
    });

    return () => unsubscribe();
  }, [newsQuery, toast]);

  const handleFetchAndAnalyze = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputValue) {
      toast({ variant: 'destructive', title: 'Input Error', description: 'Please enter a stock ticker.' });
      return;
    }
    
    setIsLoading(true);
    setTicker(inputValue); // Set ticker to trigger Firestore listener update

    const result = await fetchAndAnalyzeNews(inputValue);

    if (result.error) {
      toast({ variant: 'destructive', title: 'Analysis Error', description: result.error });
    }
    if (result.message) {
      toast({ title: 'Analysis Status', description: result.message });
    }
    
    // Loading state is for the API call; Firestore listener will handle data arrival.
    // A small delay to allow message to be read before loader disappears
    setTimeout(() => setIsLoading(false), 2000);
  };
  
  const showDashboard = useMemo(() => newsData.length > 0, [newsData]);

  return (
    <div className="flex flex-col min-h-screen">
      <Header userId={user?.uid ?? null} />
      <div className="container mx-auto px-4 py-8 flex-grow">
        <Card className="bg-card/80 backdrop-blur-sm border-border/50 mb-8">
          <CardContent className="p-6">
            <form onSubmit={handleFetchAndAnalyze} className="flex flex-col sm:flex-row items-center gap-4">
              <Input
                type="text"
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                placeholder="Enter Global Ticker (e.g., VW, SHELL, TSLA)"
                className="flex-grow text-lg h-12"
                aria-label="Stock Ticker Input"
              />
              <Button type="submit" disabled={isLoading || isUserLoading} className="w-full sm:w-auto h-12 px-8 text-lg">
                {isLoading || isUserLoading ? <Loader2 className="animate-spin" /> : <><TrendingUp className="mr-2 h-5 w-5" />Analyze</>}
              </Button>
            </form>
          </CardContent>
        </Card>
        
        {showDashboard ? (
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
          <div className="text-center py-16">
            {isLoading || isUserLoading ? (
              <Loader2 className="animate-spin mx-auto h-8 w-8 text-primary" />
            ) : (
              <p className="text-muted-foreground text-lg">Enter a stock ticker to begin sentiment analysis.</p>
            )}
          </div>
        )}
      </div>
    </div>
  );
}