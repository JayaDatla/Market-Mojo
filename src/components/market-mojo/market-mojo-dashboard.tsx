
'use client';

import { useState, useEffect, useCallback } from 'react';
import { collection, query, where, onSnapshot, orderBy, Firestore } from 'firebase/firestore';
import { useFirebase, useMemoFirebase } from '@/firebase';
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
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";


// Helper function to create the query
const createNewsQuery = (firestore: Firestore, ticker: string) => {
    if (!ticker) return null;
    // The app ID should be static for this app's public data structure.
    const appId = "studio-app"; 
    const collectionPath = `artifacts/${appId}/public/data/financial_news_sentiment`;
    return query(
      collection(firestore, collectionPath),
      where('ticker', '==', ticker.toUpperCase()),
      orderBy('timestamp', 'desc')
    );
};


export default function MarketMojoDashboard() {
  const { firestore } = useFirebase();
  const [ticker, setTicker] = useState('');
  const [tickerInput, setTickerInput] = useState('');
  const [newsData, setNewsData] = useState<NewsArticle[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [hasSearched, setHasSearched] = useState(false);
  const [noResults, setNoResults] = useState(false);
  const { toast } = useToast();

  const newsQuery = useMemoFirebase(() => {
    if (!firestore || !ticker) return null;
    return createNewsQuery(firestore, ticker);
  }, [firestore, ticker]);

  useEffect(() => {
    if (!newsQuery) {
        setNewsData([]);
        setIsLoading(false);
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
      if (hasSearched) {
        setNoResults(data.length === 0);
      }
      setIsLoading(false);

    }, (error) => {
      console.error("Firestore snapshot error", error);
      toast({ variant: 'destructive', title: 'Data Error', description: 'Could not load real-time data.' });
      setIsLoading(false);
    });

    return () => unsubscribe();
  }, [newsQuery, toast, hasSearched]);
  

  const handleCompanySelect = useCallback((tickerToAnalyze: string) => {
    if (!tickerToAnalyze) return;
    setTickerInput(tickerToAnalyze);
    setTicker(tickerToAnalyze);
    setHasSearched(true);
  }, []);

  const handleViewTicker = () => {
    if (tickerInput) {
      setHasSearched(true);
      setTicker(tickerInput);
    }
  }

  const showDashboard = newsData.length > 0 && hasSearched;
  const showNoResults = noResults && hasSearched && !isLoading;

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

        {hasSearched && !isLoading && (
          <Accordion type="single" collapsible className="w-full mb-8 max-w-3xl mx-auto">
            <AccordionItem value="item-1">
              <AccordionTrigger>View Fetched API Data</AccordionTrigger>
              <AccordionContent>
                <pre className="p-4 bg-muted rounded-md text-xs overflow-x-auto">
                  <code>{JSON.stringify(newsData, null, 2)}</code>
                </pre>
              </AccordionContent>
            </AccordionItem>
          </Accordion>
        )}
        
        {isLoading && hasSearched ? (
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
        ) : showNoResults ? (
            <div className="text-center py-16 bg-card border border-dashed border-border/50 rounded-lg max-w-3xl mx-auto">
                <BarChart className="mx-auto h-12 w-12 text-muted-foreground" />
                <h3 className="mt-4 text-lg font-medium text-foreground">No Data Found</h3>
                <p className="mt-1 text-sm text-muted-foreground">
                    No sentiment data found for <span className="font-semibold text-foreground">{ticker}</span>.
                </p>
                 <p className="text-sm text-muted-foreground">This could be because the ticker is incorrect or there's no analysis data for it yet.</p>
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
