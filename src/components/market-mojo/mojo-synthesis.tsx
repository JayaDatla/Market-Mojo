
'use client';

import { useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import type { AnalysisSummary } from '@/types';
import { ChevronsUp, ChevronUp, ChevronsDown, ChevronDown, Minus, TrendingUp, TrendingDown, Combine, Sparkles } from 'lucide-react';

interface MojoSynthesisProps {
  sentimentAnalysis: AnalysisSummary;
  priceTrend: 'Up' | 'Down' | 'Neutral';
}

type SuggestionLevel = 'Strong Buy' | 'Buy' | 'Hold' | 'Sell' | 'Strong Sell';

const suggestionStyles: Record<SuggestionLevel, {
    className: string;
    icon: React.ReactNode;
}> = {
  'Strong Buy': { className: 'bg-green-500/20 text-green-400 border-green-500/30', icon: <ChevronsUp className="h-4 w-4" /> },
  'Buy': { className: 'bg-green-500/10 text-green-500 border-green-500/20', icon: <ChevronUp className="h-4 w-4" /> },
  'Hold': { className: 'bg-gray-500/10 text-gray-400 border-gray-500/20', icon: <Minus className="h-4 w-4" /> },
  'Sell': { className: 'bg-red-500/10 text-red-500 border-red-500/20', icon: <ChevronDown className="h-4 w-4" /> },
  'Strong Sell': { className: 'bg-red-500/20 text-red-400 border-red-500/30', icon: <ChevronsDown className="h-4 w-4" /> },
};

const priceTrendStyles = {
    'Up': { className: 'bg-green-500/10 text-green-500 border-green-500/20', icon: <TrendingUp className="h-4 w-4" /> },
    'Neutral': { className: 'bg-gray-500/10 text-gray-400 border-gray-500/20', icon: <Minus className="h-4 w-4" /> },
    'Down': { className: 'bg-red-500/10 text-red-500 border-red-500/20', icon: <TrendingDown className="h-4 w-4" /> },
}

export default function MojoSynthesis({ sentimentAnalysis, priceTrend }: MojoSynthesisProps) {

  const { sentimentSuggestion, synthesis } = useMemo(() => {
    const { average_sentiment_score } = sentimentAnalysis;
    
    let level: SuggestionLevel = 'Hold';
    if (average_sentiment_score > 0.35) level = 'Strong Buy';
    else if (average_sentiment_score > 0.1) level = 'Buy';
    else if (average_sentiment_score < -0.35) level = 'Strong Sell';
    else if (average_sentiment_score < -0.1) level = 'Sell';

    let synthesisText = '';

    if (level.includes('Buy')) {
        if (priceTrend === 'Up') {
            synthesisText = "Strong Confirmation: Both the positive news sentiment and the upward price trend are aligned. This indicates strong bullish momentum, as the positive market perception is reflected in the stock's performance.";
        } else if (priceTrend === 'Down') {
            synthesisText = "Potential Reversal / 'Buy the Dip': Despite the recent price drop, news sentiment is positive. This could signal a potential buying opportunity before the market sentiment is reflected in the price.";
        } else {
            synthesisText = "Positive Outlook: News sentiment is positive, but the price has remained stable. This may suggest a buildup of positive pressure that could precede a future upward move.";
        }
    } else if (level.includes('Sell')) {
         if (priceTrend === 'Up') {
            synthesisText = "Warning / Potential Pullback: The stock price has been rising, but the underlying news sentiment is negative. This divergence warrants caution, as the positive price action may not be sustainable.";
        } else if (priceTrend === 'Down') {
            synthesisText = "Strong Confirmation: Both the negative news sentiment and the downward price trend are aligned. This indicates strong bearish pressure on the stock.";
        } else {
            synthesisText = "Negative Outlook: News sentiment is negative while the price is stable. This could indicate underlying weakness that may lead to a future price decline.";
        }
    } else { // Hold
        if (priceTrend === 'Up') {
            synthesisText = "Neutral with Upward Drift: The price is trending up, but news sentiment is neutral. The price action may be driven by broader market trends rather than company-specific news.";
        } else if (priceTrend === 'Down') {
            synthesisText = "Neutral with Downward Drift: The price is trending down with neutral news sentiment. The stock may be following a broader market downturn or facing headwinds not yet captured in major news.";
        } else {
            synthesisText = "Consolidation Phase: Both news sentiment and price action are neutral, suggesting the market is in a 'wait and see' mode. The stock is likely consolidating before its next significant move.";
        }
    }

    return { sentimentSuggestion: level, synthesis: synthesisText };
  }, [sentimentAnalysis, priceTrend]);

  const sentimentStyle = suggestionStyles[sentimentSuggestion];
  const trendStyle = priceTrendStyles[priceTrend];

  return (
    <Card className="bg-card border-border/50">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Combine className="h-5 w-5 text-primary" />
          Mojo Synthesis
        </CardTitle>
        <CardDescription>A combined analysis of news sentiment and price trend.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-center">
            <div className="space-y-2">
                <div className="text-sm text-muted-foreground font-semibold">News Sentiment</div>
                <Badge variant="secondary" className={`px-3 py-1.5 text-sm ${sentimentStyle.className}`}>
                    <div className="flex items-center gap-2">
                        {sentimentStyle.icon}
                        {sentimentSuggestion}
                    </div>
                </Badge>
            </div>
            <div className="space-y-2">
                <div className="text-sm text-muted-foreground font-semibold">30-Day Price Trend</div>
                <Badge variant="secondary" className={`px-3 py-1.5 text-sm ${trendStyle.className}`}>
                    <div className="flex items-center gap-2">
                        {trendStyle.icon}
                        {priceTrend}
                    </div>
                </Badge>
            </div>
        </div>
        
        <div className="p-4 bg-accent/30 border border-dashed border-border rounded-lg text-center space-y-2">
            <h4 className="font-semibold text-foreground flex items-center justify-center gap-2"><Sparkles className="h-4 w-4 text-cyan-400" />Combined Insight</h4>
            <p className="text-sm text-muted-foreground break-words">{synthesis}</p>
        </div>
      </CardContent>
    </Card>
  );
}
