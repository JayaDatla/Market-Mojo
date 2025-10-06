
'use client';

import { useState, useCallback, useTransition } from 'react';
import { fetchAndAnalyzeNews } from '@/app/actions';
import type { NewsArticle, TickerAnalysis, TickerAnalysisOutput, PriceData } from '@/types';
import { useToast } from '@/hooks/use-toast';
import { Loader2, Search, BarChart } from 'lucide-react';
import Header from './header';
import NewsFeed from './news-feed';
import StaticAnalysis, { industryData } from './static-analysis';
import TopCompanies from './top-companies';
import { Input } from '../ui/input';
import { Button } from '../ui/button';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import InvestmentSuggestion from './investment-suggestion';
import SentimentPieChart from './sentiment-pie-chart';
import HistoricalPriceChart from './historical-price-chart';
import MojoSynthesis from './mojo-synthesis';

export default function MarketMojoDashboard() {
  const [userInput, setUserInput] = useState('');
  const [analysisResult, setAnalysisResult] = useState<TickerAnalysisOutput | null>(null);
  const [selectedTickerData, setSelectedTickerData] = useState<TickerAnalysis | null>(null);
  const [priceData, setPriceData] = useState<PriceData[]>([]);
  const [priceTrend, setPriceTrend] = useState<'Up' | 'Down' | 'Neutral'>('Neutral');

  const [isAnalyzing, startTransition] = useTransition();
  const [hasSearched, setHasSearched] = useState(false);
  const { toast } = useToast();

  const handleAnalysis = (input: string) => {
    if (!input) return;

    startTransition(async () => {
      setHasSearched(true);
      setAnalysisResult(null);
      setSelectedTickerData(null);
      setPriceData([]);
      setPriceTrend('Neutral');
      
      const result = await fetchAndAnalyzeNews(input);
      setAnalysisResult(result);

      if (result && !result.error && result.tickers && result.tickers.length > 0) {
        // Default to the first ticker returned by the analysis
        const primaryTickerData = result.tickers[0];
        setSelectedTickerData(primaryTickerData);
        
        // Fetch historical data for the primary ticker
        try {
          const historyResponse = await fetch(`/api/stock-data?ticker=${encodeURIComponent(primaryTickerData.ticker)}`);
          
          if (!historyResponse.ok) {
              const err = await historyResponse.json();
              throw new Error(err.error || 'Unknown error from history API');
          }
          
          const historyResult = await historyResponse.json();

          if (historyResult && historyResult.length > 0) {
              setPriceData(historyResult);
          } else {
             setPriceData([]);
          }
        } catch (e: any) {
          console.warn(`Dynamic historical data fetch failed for ${primaryTickerData.ticker}:`, e.message);
          setPriceData([]);
          toast({
              variant: 'default',
              title: 'Historical Data Notice',
              description: `Could not fetch historical price data for ${primaryTickerData.ticker}.`,
          });
        }
      } else {
        toast({
          variant: 'destructive',
          title: 'Analysis Failed',
          description: result?.error || 'No analysis could be performed for this input.',
        });
      }
    });
  };

  const handleCompanySelect = useCallback((tickerToAnalyze: string) => {
    setUserInput(tickerToAnalyze);
    handleAnalysis(tickerToAnalyze);
  }, []);

  const handleViewTicker = () => {
    if (userInput) {
      handleAnalysis(userInput);
    }
  };

  const handleTrendCalculated = useCallback((trend: 'Up' | 'Down' | 'Neutral') => {
    setPriceTrend(trend);
  }, []);

  const isLoading = isAnalyzing;
  const showDashboard = hasSearched && !isLoading && selectedTickerData;
  const showNoResults = hasSearched && !isLoading && (!analysisResult || !analysisResult.tickers || analysisResult.tickers.length === 0);

  const displayTicker = selectedTickerData?.ticker.toUpperCase() || userInput.toUpperCase();

  return (
    <div className="flex flex-col min-h-screen">
      <Header />
      <main className="container mx-auto px-4 sm:px-6 py-8 flex-grow">
        <div className="max-w-3xl mx-auto mb-8 sm:mb-12 text-center">
            <h1 className="text-3xl sm:text-4xl md:text-5xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-primary to-cyan-400 mb-4 tracking-tighter animate-gradient-x">Market Sentiment Analyzer</h1>
            <p className="text-md sm:text-lg text-muted-foreground">Enter a stock ticker or company name to run a real-time news sentiment analysis.</p>
            <div className="mt-6 max-w-xl mx-auto flex items-center gap-2">
              <div className="relative w-full">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  type="text"
                  placeholder="e.g., 'TSLA', 'Tata Motors', or 'Apple'"
                  value={userInput}
                  onChange={(e) => setUserInput(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleViewTicker()}
                  className="bg-background/50 border-border/50 text-base pl-10 h-11"
                />
              </div>
              <Button onClick={handleViewTicker} disabled={isLoading || !userInput} className="px-6 h-11">
                {isLoading ? <Loader2 className="animate-spin" /> : 'Analyze'}
              </Button>
            </div>
        </div>

        {isAnalyzing && (
          <Accordion type="single" collapsible className="w-full mb-8 max-w-3xl mx-auto">
            <AccordionItem value="item-1">
              <AccordionTrigger>View Raw API Response</AccordionTrigger>
              <AccordionContent>
                <pre className="p-4 bg-muted rounded-md text-xs overflow-x-auto">
                  <code>{analysisResult ? JSON.stringify(analysisResult.rawResponse, null, 2) : "Loading..."}</code>
                </pre>
              </AccordionContent>
            </AccordionItem>
          </Accordion>
        )}
        
        {isLoading ? (
          <div className="text-center py-16">
            <Loader2 className="animate-spin mx-auto h-8 w-8 text-primary" />
            <p className="text-muted-foreground mt-4">Analyzing {userInput}...</p>
          </div>
        ) : showDashboard ? (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <div className="lg:col-span-2 space-y-8">
              <>
                  <HistoricalPriceChart 
                    priceData={priceData} 
                    sentimentScore={selectedTickerData.analysis_summary.average_sentiment_score} 
                    currency={selectedTickerData.currency}
                    exchange={selectedTickerData.exchange}
                    onTrendCalculated={handleTrendCalculated}
                  />
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    <InvestmentSuggestion tickerData={selectedTickerData} />
                    <SentimentPieChart newsData={selectedTickerData.articles} />
                  </div>
                  <MojoSynthesis sentimentAnalysis={selectedTickerData.analysis_summary} priceTrend={priceTrend} />
                  <NewsFeed newsData={selectedTickerData.articles} />
              </>
            </div>
            <div className="space-y-8 lg:sticky lg:top-24 self-start">
              <StaticAnalysis ticker={displayTicker} />
              <TopCompanies onCompanySelect={handleCompanySelect} />
            </div>
          </div>
        ) : showNoResults ? (
            <div className="text-center py-16 bg-card border border-dashed border-border/50 rounded-lg max-w-3xl mx-auto">
               <BarChart className="mx-auto h-12 w-12 text-muted-foreground" />
               <h3 className="mt-4 text-lg font-medium text-foreground">No Analysis Found</h3>
               <p className="mt-1 text-sm text-muted-foreground">
                   Could not retrieve sentiment data for <span className="font-semibold text-foreground">{userInput}</span>.
               </p>
               <p className="text-sm text-muted-foreground">This could be due to a lack of recent news or an issue with the data service.</p>
            </div>
        ) : (
          <div className="text-center">
            <TopCompanies onCompanySelect={handleCompanySelect} />
          </div>
        )}
      </main>
    </div>
  );
}
