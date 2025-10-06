
'use client';

import { useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import type { AnalysisSummary } from '@/types';
import { ChevronsUp, ChevronUp, ChevronsDown, ChevronDown, Minus, Award } from 'lucide-react';
import { Progress } from '@/components/ui/progress';

interface InvestmentSuggestionProps {
  analysisSummary: AnalysisSummary;
}

type SuggestionLevel = 'Strong Buy' | 'Buy' | 'Hold' | 'Sell' | 'Strong Sell';
type ConfidenceLevel = 'Low' | 'Medium' | 'High';

const suggestionStyles: Record<SuggestionLevel, {
    className: string;
    icon: React.ReactNode;
}> = {
  'Strong Buy': { className: 'bg-green-500/20 text-green-400 border-green-500/30', icon: <ChevronsUp className="h-5 w-5" /> },
  'Buy': { className: 'bg-green-500/10 text-green-500 border-green-500/20', icon: <ChevronUp className="h-5 w-5" /> },
  'Hold': { className: 'bg-gray-500/10 text-gray-400 border-gray-500/20', icon: <Minus className="h-5 w-5" /> },
  'Sell': { className: 'bg-red-500/10 text-red-500 border-red-500/20', icon: <ChevronDown className="h-5 w-5" /> },
  'Strong Sell': { className: 'bg-red-500/20 text-red-400 border-red-500/30', icon: <ChevronsDown className="h-5 w-5" /> },
};


export default function InvestmentSuggestion({ analysisSummary }: InvestmentSuggestionProps) {

  const { suggestion, confidence, confidenceValue } = useMemo(() => {
    if (!analysisSummary?.average_sentiment_score) {
      return { suggestion: null, confidence: null, confidenceValue: 0 };
    }

    const { average_sentiment_score } = analysisSummary;
    
    let level: SuggestionLevel = 'Hold';
    let conf: ConfidenceLevel = 'Low';
    let confValue = 0;

    const absScore = Math.abs(average_sentiment_score);

    if (average_sentiment_score > 0.35) level = 'Strong Buy';
    else if (average_sentiment_score > 0.1) level = 'Buy';
    else if (average_sentiment_score < -0.35) level = 'Strong Sell';
    else if (average_sentiment_score < -0.1) level = 'Sell';
    else level = 'Hold';

    confValue = Math.min((absScore / 0.5) * 100, 100);
    
    if (level === 'Hold') {
      confValue = 100 - confValue;
    }

    if (confValue > 70) conf = 'High';
    else if (confValue > 40) conf = 'Medium';
    else conf = 'Low';

    return { 
        suggestion: level, 
        confidence: conf,
        confidenceValue: confValue,
    };
  }, [analysisSummary]);

  if (!suggestion || !analysisSummary) {
    return null;
  }
  
  const style = suggestionStyles[suggestion];
  const { average_sentiment_score, investor_outlook } = analysisSummary;

  const hasValidScore = typeof average_sentiment_score === 'number';

  return (
    <Card className="bg-card border-border/50">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Award className="h-5 w-5 text-primary" />
          Mojo's Take
        </CardTitle>
        <CardDescription>An AI-generated investment outlook based on news sentiment.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="text-center">
            <Badge variant="secondary" className={`px-4 py-2 text-base ${style.className}`}>
                <div className="flex items-center gap-2">
                    {style.icon}
                    {suggestion}
                </div>
            </Badge>
        </div>
        <p className="text-sm text-center text-muted-foreground break-words">{investor_outlook}</p>

        <div className="space-y-4">
             <div className="grid grid-cols-1 gap-4 text-center pt-2">
                <div>
                     <div className={`text-xl font-bold ${hasValidScore && average_sentiment_score > 0.1 ? 'text-green-500' : hasValidScore && average_sentiment_score < -0.1 ? 'text-red-500' : 'text-gray-500'}`}>
                        {hasValidScore ? average_sentiment_score.toFixed(2) : 'N/A'}
                    </div>
                    <div className="text-xs text-muted-foreground">Overall Sentiment Score</div>
                </div>
            </div>
            {confidence && (
              <div>
                <div className="flex justify-between items-center mb-1">
                  <span className="text-xs text-muted-foreground">Confidence Level</span>
                  <span className="text-xs font-semibold text-foreground">{confidence}</span>
                </div>
                <Progress value={confidenceValue} className="h-2" />
              </div>
            )}
        </div>
      </CardContent>
    </Card>
  );
}
