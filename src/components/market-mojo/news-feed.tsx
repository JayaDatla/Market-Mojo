
'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import type { NewsArticle } from '@/types';
import { ExternalLink, Frown, Meh, Smile } from 'lucide-react';
import Link from 'next/link';

interface NewsFeedProps {
  newsData: NewsArticle[];
}

const sentimentStyles = {
  Positive: {
    variant: 'secondary',
    className: 'bg-green-500/10 text-green-400 border-green-500/20',
    icon: <Smile className="h-4 w-4" />,
  },
  Neutral: {
    variant: 'secondary',
    className: 'bg-gray-500/10 text-gray-400 border-gray-500/20',
    icon: <Meh className="h-4 w-4" />,
  },
  Negative: {
    variant: 'secondary',
    className: 'bg-red-500/10 text-red-400 border-red-500/20',
    icon: <Frown className="h-4 w-4" />,
  },
} as const;


export default function NewsFeed({ newsData }: NewsFeedProps) {
  if (!newsData || newsData.length === 0) {
    return null;
  }

  return (
    <Card className="bg-card border-border/50">
      <CardHeader>
        <CardTitle>Latest News Analysis</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-6">
          {newsData.map((article, index) => {
            const style = sentimentStyles[article.sentiment];
            return (
              <div key={`${article.url}-${index}`} className="p-4 rounded-lg border border-border/50 bg-background/50 hover:bg-card/50 transition-colors">
                <div className="flex justify-between items-start gap-4">
                  <h3 className="font-semibold text-base mb-1 text-foreground">{article.title}</h3>
                  <Link href={article.url} target="_blank" rel="noopener noreferrer" className="text-primary hover:underline flex-shrink-0">
                    <ExternalLink className="h-4 w-4" />
                  </Link>
                </div>
                <p className="text-sm text-muted-foreground mb-3">{article.summary}</p>
                <div className="flex items-center gap-4">
                   <Badge variant={style.variant} className={style.className}>
                    <div className="flex items-center gap-1.5">
                      {style.icon}
                      {article.sentiment}
                    </div>
                  </Badge>
                  <span className="text-sm font-mono text-muted-foreground">
                    Score: {article.sentiment_score.toFixed(2)}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}
