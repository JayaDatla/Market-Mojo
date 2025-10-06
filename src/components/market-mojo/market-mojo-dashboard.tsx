
'use client';

import { useState, useCallback, useTransition } from 'react';
import { fetchAndAnalyzeNews } from '@/app/actions';
import type { NewsArticle, TickerAnalysisOutput } from '@/types';
import { useToast } from '@/hooks/use-toast';
import { Loader2, Search, BarChart } from 'lucide-react';
import Header from './header';
import NewsFeed from './news-feed';
import StaticAnalysis from './static-analysis';
import TopCompanies from './top-companies';
import { Input } from '../ui/input';
import { Button } from '../ui/button';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import InvestmentSuggestion from './investment-suggestion';

export default function MarketMojoDashboard() {
  const [ticker, setTicker] = useState('');
  const [tickerInput, setTickerInput] = useState('');
  const [newsData, setNewsData] = useState<NewsArticle[]>([]);
  const [rawApiData, setRawApiData] = useState<any>(null);

  const [isAnalyzing, startTransition] = useTransition();
  const [hasSearched, setHasSearched] = useState(false);
  const [noResults, setNoResults] = useState(false);
  const { toast } = useToast();

  const processAnalysisResult = (analysisResult: TickerAnalysisOutput) => {
    if (!analysisResult.analysis || analysisResult.analysis.length === 0) return [];
    return analysisResult.analysis.map((item, index) => ({
      id: `${item.ticker}-${index}-${Date.now()}`,
      newsTitle: item.title,
      summary: item.summary,
      sentimentScore: item.sentiment_score,
      sentimentLabel: item.sentiment,
      sourceUri: item.url,
      timestamp: { toDate: () => new Date() } as any,
      ticker: item.ticker.toUpperCase(),
      currency: item.currency,
    }));
  };

  const handleAnalysis = (input: string) => {
    if (!input) return;

    const normalizedInput = input.trim().toUpperCase();

    startTransition(async () => {
      setHasSearched(true);
      setNoResults(false);
      setNewsData([]);
      setRawApiData(null);
      setTicker(input);
      
      const analysisResult = await fetchAndAnalyzeNews(input);

      if (analysisResult && !analysisResult.error && analysisResult.analysis && analysisResult.analysis.length > 0) {
        const articles = processAnalysisResult(analysisResult);
        const finalTicker = articles[0].ticker;
        setNewsData(articles);
        setRawApiData(analysisResult.rawResponse);
        setTicker(finalTicker);
      } else {
        setRawApiData(analysisResult);
        setNoResults(true);
        setTicker(normalizedInput);
        toast({
          variant: 'destructive',
          title: 'Sentiment Analysis Failed',
          description: analysisResult?.error || 'No news articles could be analyzed for this ticker.',
        });
      }
    });
  };

  const handleCompanySelect = useCallback((tickerToAnalyze: string) => {
    setTickerInput(tickerToAnalyze);
    handleAnalysis(tickerToAnalyze);
  }, []);

  const handleViewTicker = () => {
    if (tickerInput) {
      handleAnalysis(tickerInput);
    }
  };
  
  const displayTicker = ticker.toUpperCase();
  
  const isLoading = isAnalyzing;
  const showDashboard = hasSearched && !isLoading;
  const showNoResults = hasSearched && !isLoading && newsData.length === 0;

  return (
    <div className="flex flex-col min-h-screen">
      <Header />
      <div className="container mx-auto px-4 py-8 flex-grow">
        <div className="max-w-3xl mx-auto mb-12 text-center">
            <h2 className="text-4xl md:text-5xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-primary to-cyan-400 mb-4 tracking-tighter animate-gradient-x">Market Sentiment Analyzer</h2>
            <p className="text-lg text-muted-foreground">Enter a ticker or company name below to run a real-time news sentiment analysis.</p>
            <div className="mt-6 max-w-xl mx-auto flex items-center gap-2">
              <div className="relative w-full">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  type="text"
                  placeholder="Enter a ticker or company name (e.g., TSLA)"
                  value={tickerInput}
                  onChange={(e) => setTickerInput(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleViewTicker()}
                  className="bg-background/50 border-border/50 text-base pl-10"
                />
              </div>
              <Button onClick={handleViewTicker} disabled={isLoading || !tickerInput} className="px-6">
                {isLoading ? <Loader2 className="animate-spin" /> : 'Analyze'}
              </Button>
            </div>
        </div>

        {hasSearched && !isLoading && rawApiData && (
          <Accordion type="single" collapsible className="w-full mb-8 max-w-3xl mx-auto">
            <AccordionItem value="item-1">
              <AccordionTrigger>View Fetched API Data</AccordionTrigger>
              <AccordionContent>
                <pre className="p-4 bg-muted rounded-md text-xs overflow-x-auto">
                  <code>{JSON.stringify(rawApiData, null, 2)}</code>
                </pre>
              </AccordionContent>
            </AccordionItem>
          </Accordion>
        )}
        
        {isLoading && hasSearched ? (
          <div className="text-center py-16">
            <Loader2 className="animate-spin mx-auto h-8 w-8 text-primary" />
            <p className="text-muted-foreground mt-4">Analyzing {tickerInput}...</p>
          </div>
        ) : showDashboard ? (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <div className="lg:col-span-2 space-y-8">
              {newsData.length > 0 ? (
                <>
                  <InvestmentSuggestion newsData={newsData} />
                  <NewsFeed newsData={newsData.slice(0, 5)} />
                </>
              ) : showNoResults ? (
                 <div className="text-center py-16 bg-card border border-dashed border-border/50 rounded-lg">
                    <BarChart className="mx-auto h-12 w-12 text-muted-foreground" />
                    <h3 className="mt-4 text-lg font-medium text-foreground">No Analysis Found</h3>
                    <p className="mt-1 text-sm text-muted-foreground">
                        Could not retrieve sentiment data for <span className="font-semibold text-foreground">{tickerInput}</span>.
                    </p>
                    <p className="text-sm text-muted-foreground">This could be due to a lack of recent news or an issue with the data service.</p>
                 </div>
              ) : null}
            </div>
            <div className="space-y-8">
              <div className="sticky top-24 space-y-8">
                  <StaticAnalysis ticker={displayTicker} />
                  <TopCompanies onCompanySelect={handleCompanySelect} />
              </div>
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
