
'use client';

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import type { Ticker } from '@/types';
import { HelpCircle } from 'lucide-react';

interface TickerSelectorProps {
  tickers: Ticker[];
  onSelect: (ticker: Ticker) => void;
}

export default function TickerSelector({ tickers, onSelect }: TickerSelectorProps) {
  if (!tickers || tickers.length <= 1) {
    return null;
  }

  return (
    <Card className="bg-card border-border/50">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
            <HelpCircle className="h-5 w-5 text-primary" />
            Confirm Company
        </CardTitle>
        <CardDescription>
            We found multiple potential matches for your search. Please select the correct company to view its price chart.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-3 gap-3">
          {tickers.map((ticker) => (
            <Button
              key={`${ticker.ticker}-${ticker.exchange}`}
              variant="outline"
              className="justify-start text-left h-auto py-3 px-4 flex flex-col items-start hover:bg-accent hover:text-accent-foreground"
              onClick={() => onSelect(ticker)}
            >
              <span className="font-semibold text-sm sm:text-base text-foreground truncate w-full">{ticker.ticker}</span>
              <span className="text-xs sm:text-sm text-muted-foreground">{ticker.exchange}</span>
            </Button>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
