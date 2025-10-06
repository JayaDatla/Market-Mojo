
'use client';

import { useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import type { NewsArticle } from '@/types';
import { ChevronsUp, ChevronUp, ChevronsDown, ChevronDown, Minus, Award } from 'lucide-react';
import { Progress } from '@/components/ui/progress';

interface InvestmentSuggestionProps {
  newsData: NewsArticle[];
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


export default function InvestmentSuggestion({ newsData }: InvestmentSuggestionProps) {

  const { suggestion, reason, averageScore, confidence, confidenceValue } = useMemo(() => {
    if (!newsData || newsData.length === 0) {
      return { suggestion: null };
    }

    const totalScore = newsData.reduce((acc, article) => acc + article.sentimentScore, 0);
    const avgScore = totalScore / newsData.length;
    
    let level: SuggestionLevel = 'Hold';
    let analysis = '';
    let conf: ConfidenceLevel = 'Low';
    let confValue = 0;

    const absScore = Math.abs(avgScore);

    if (avgScore > 0.35) {
      level = 'Strong Buy';
      analysis = 'Sentiment from recent news is overwhelmingly positive.';
    } else if (avgScore > 0.1) {
      level = 'Buy';
      analysis = 'News sentiment is generally positive.';
    } else if (avgScore < -0.35) {
      level = 'Strong Sell';
      analysis = 'Sentiment from recent news is overwhelmingly negative.';
    } else if (avgScore < -0.1) {
      level = 'Sell';
      analysis = 'News sentiment is largely negative.';
    } else {
      level = 'Hold';
      analysis = 'News sentiment is mixed or neutral. Wait for a clearer signal.';
    }

    confValue = Math.min((absScore / 0.5) * 100, 100);
    
    if (level === 'Hold') {
      confValue = 100 - confValue;
    }

    if (confValue > 70) {
      conf = 'High';
    } else if (confValue > 40) {
      conf = 'Medium';
    } else {
      conf = 'Low';
    }

    return { 
        suggestion: level, 
        reason: analysis, 
        averageScore: avgScore,
        confidence: conf,
        confidenceValue: confValue,
    };
  }, [newsData]);

  if (!suggestion) {
    return null;
  }
  
  const style = suggestionStyles[suggestion];

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
        <p className="text-sm text-center text-muted-foreground">{reason}</p>

        <div className="space-y-4">
             <div className="grid grid-cols-1 gap-4 text-center pt-2">
                <div>
                     <div className={`text-xl font-bold ${averageScore > 0.1 ? 'text-green-500' : averageScore < -0.1 ? 'text-red-500' : 'text-gray-500'}`}>
                        {averageScore.toFixed(2)}
                    </div>
                    <div className="text-xs text-muted-foreground">Overall Sentiment Score</div>
                </div>
            </div>
            <div>
              <div className="flex justify-between items-center mb-1">
                <span className="text-xs text-muted-foreground">Confidence Level</span>
                <span className="text-xs font-semibold text-foreground">{confidence}</span>
              </div>
              <Progress value={confidenceValue} className="h-2" />
            </div>
        </div>
      </CardContent>
    </Card>
  );
}
