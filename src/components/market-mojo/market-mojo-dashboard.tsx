
'use client';

import { useState, useCallback, useTransition, useEffect } from 'react';
import { fetchAndAnalyzeNews, fetchChartData, fetchHistoricalDataAuto } from '@/app/actions';
import type { Ticker, TickerAnalysisOutput, PriceData } from '@/types';
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
import SentimentPieChart from './sentiment-pie-chart';
import HistoricalPriceChart from './historical-price-chart';
import MojoSynthesis from './mojo-synthesis';
import { Skeleton } from '../ui/skeleton';
import TickerSelector from './ticker-selector';

// Helper function to calculate a Simple Moving Average (SMA)
const calculateMovingAverage = (data: PriceData[], windowSize: number): number[] => {
  const averages: number[] = [];
  if (data.length < windowSize) return [];
  
  // First, calculate the sum of the initial window
  let sum = 0;
  for (let i = 0; i < windowSize; i++) {
    sum += data[i].close;
  }
  averages.push(sum / windowSize);

  // Then, use a sliding window for efficiency
  for (let i = windowSize; i < data.length; i++) {
    sum = sum - data[i - windowSize].close + data[i].close;
    averages.push(sum / windowSize);
  }
  
  return averages;
};


// New trend calculation logic using moving averages
const calculateTrend = (data: PriceData[]): 'Up' | 'Down' | 'Neutral' => {
    const n = data.length;
    const shortTermWindow = 7;
    const longTermWindow = 25;

    // We need enough data to make a meaningful comparison
    if (n < longTermWindow) return 'Neutral';

    // Calculate moving averages
    const shortTermMA = calculateMovingAverage(data, shortTermWindow);
    const longTermMA = calculateMovingAverage(data, longTermWindow);

    // Ensure we have averages to compare
    if (shortTermMA.length === 0 || longTermMA.length === 0) {
        return 'Neutral';
    }

    // Get the most recent average values
    const latestShortTermMA = shortTermMA[shortTermMA.length - 1];
    const latestLongTermMA = longTermMA[longTermMA.length - 1];

    // Determine the trend based on the crossover
    const difference = latestShortTermMA - latestLongTermMA;
    
    // Use a percentage of the long-term average as a threshold to avoid flagging minor fluctuations
    const threshold = latestLongTermMA * 0.02; // 2% threshold

    if (difference > threshold) return 'Up';
    if (difference < -threshold) return 'Down';
    return 'Neutral';
};


export default function MarketMojoDashboard() {
  const [userInput, setUserInput] = useState('');
  const [analysisResult, setAnalysisResult] = useState<TickerAnalysisOutput | null>(null);
  const [selectedTicker, setSelectedTicker] = useState<Ticker | null>(null);
  const [priceData, setPriceData] = useState<PriceData[]>([]);
  const [priceTrend, setPriceTrend] = useState<'Up' | 'Down' | 'Neutral'>('Neutral');
  const [isHistoryLoading, setHistoryLoading] = useState(false);

  const [isAnalyzing, startTransition] = useTransition();
  const [hasSearched, setHasSearched] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    if (priceData && priceData.length > 0) {
      const trend = calculateTrend(priceData);
      setPriceTrend(trend);
    } else {
      setPriceTrend('Neutral');
    }
  }, [priceData]);


  const handleAnalysis = (input: string) => {
    if (!input) return;

    startTransition(async () => {
      setHasSearched(true);
      setAnalysisResult(null);
      setSelectedTicker(null);
      setPriceData([]);

      const analysisData = await fetchAndAnalyzeNews(input);
      setAnalysisResult(analysisData);

      if (analysisData?.error) {
        toast({
          variant: 'destructive',
          title: 'Analysis Failed',
          description: analysisData.error || 'No analysis could be performed for this input.',
        });
        return;
      }

      if (analysisData?.tickers && analysisData.tickers.length === 1) {
        const firstTicker = analysisData.tickers[0];
        handleTickerSelection(firstTicker);
      }
    });
  };
  
  const handleTickerSelection = async (ticker: Ticker) => {
    setSelectedTicker(ticker);
    setPriceData([]);
    
    if (ticker.ticker !== 'PRIVATE') {
      setHistoryLoading(true);
      try {
        // Use the more direct fetchChartData function
        const historyData = await fetchChartData(ticker.ticker);
        if (historyData) {
          setPriceData(historyData);
        }
      } catch (e: any) {
        console.warn(`Historical data fetch failed for ${ticker.ticker}:`, e.message);
        toast({
          variant: 'default',
          title: 'Historical Data Notice',
          description: `Could not fetch price data for ${ticker.ticker}. This can happen for some symbols.`,
        });
      } finally {
        setHistoryLoading(false);
      }
    }
  };


  const handleCompanySelect = useCallback((tickerToAnalyze: string) => {
    setUserInput(tickerToAnalyze);
    handleAnalysis(tickerToAnalyze);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleViewTicker = () => {
    if (userInput) {
      handleAnalysis(userInput);
    }
  };

  const isLoading = isAnalyzing;
  
  const showSentimentAnalysis = hasSearched && !isLoading && analysisResult && analysisResult.articles && analysisResult.articles.length > 0;
  const showDisambiguation = showSentimentAnalysis && analysisResult.tickers && analysisResult.tickers.length > 1 && !selectedTicker;
  const showPriceChart = selectedTicker && priceData.length > 0;
  const showNoResults = hasSearched && !isLoading && (!analysisResult || !analysisResult.tickers || analysisResult.tickers.length === 0);

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
                  placeholder="e.g., 'TSLA', 'Zerodha', or 'Apple'"
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
        
        {isLoading && !hasSearched ? (
          <div className="text-center py-16">
            <Loader2 className="animate-spin mx-auto h-8 w-8 text-primary" />
            <p className="text-muted-foreground mt-4">Analyzing {userInput}...</p>
          </div>
        ) : hasSearched ? (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <div className="lg:col-span-2 space-y-8">

              {showDisambiguation && analysisResult.tickers && (
                <TickerSelector tickers={analysisResult.tickers} onSelect={handleTickerSelection} />
              )}

              {isHistoryLoading ? (
                <div className="h-[365px] bg-card border-border/50 rounded-xl flex items-center justify-center">
                  <Loader2 className="animate-spin h-8 w-8 text-primary" />
                </div>
              ) : showPriceChart && selectedTicker ? (
                 <HistoricalPriceChart 
                  priceData={priceData} 
                  priceTrend={priceTrend}
                  currency={selectedTicker?.currency}
                  exchange={selectedTicker?.exchange || ''}
                />
              ): null}


              {showSentimentAnalysis && analysisResult.analysis_summary ? (
                  <>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                      <InvestmentSuggestion analysisSummary={analysisResult.analysis_summary} />
                      <SentimentPieChart newsData={analysisResult.articles || []} />
                    </div>
                    {showPriceChart && <MojoSynthesis sentimentAnalysis={analysisResult.analysis_summary} priceTrend={priceTrend} />}
                    <NewsFeed newsData={analysisResult.articles || []} />
                  </>
                ) : isLoading ? (
                     <div className="space-y-8">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                            <Skeleton className="h-[270px] rounded-xl" />
                            <Skeleton className="h-[270px] rounded-xl" />
                        </div>
                        <Skeleton className="h-[240px] rounded-xl" />
                        <Skeleton className="h-[400px] rounded-xl" />
                    </div>
                ) : null }

                {showNoResults && (
                   <div className="text-center py-16 bg-card border border-dashed border-border/50 rounded-lg">
                       <BarChart className="mx-auto h-12 w-12 text-muted-foreground" />
                       <h3 className="mt-4 text-lg font-medium text-foreground">No Analysis Found</h3>
                       <p className="mt-1 text-sm text-muted-foreground">
                           Could not retrieve sentiment data for <span className="font-semibold text-foreground">{userInput}</span>.
                       </p>
                        {analysisResult?.rawResponse && (
                          <Accordion type="single" collapsible className="w-full mt-4 max-w-xl mx-auto text-left">
                            <AccordionItem value="item-1">
                              <AccordionTrigger>View Raw API Response</AccordionTrigger>
                              <AccordionContent>
                                <pre className="p-4 bg-muted rounded-md text-xs overflow-x-auto">
                                  <code>{JSON.stringify(analysisResult.rawResponse, null, 2)}</code>
                                </pre>
                              </AccordionContent>
                            </AccordionItem>
                          </Accordion>
                       )}
                   </div>
                )}
            </div>
            <div className="space-y-8 lg:sticky lg:top-24 self-start">
               <StaticAnalysis 
                isLoading={isLoading && !analysisResult}
                analysisData={analysisResult?.industryAnalysis} 
                companyName={analysisResult?.company}
              />
              <TopCompanies onCompanySelect={handleCompanySelect} />
            </div>
          </div>
        ) : (
          <div className="max-w-4xl mx-auto">
            <TopCompanies onCompanySelect={handleCompanySelect} />
          </div>
        )}
      </main>
    </div>
  );
}
