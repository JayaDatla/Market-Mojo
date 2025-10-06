
'use client';

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import type { Ticker } from '@/types';
import { HelpCircle } from 'lucide-react';

interface TickerSelectorProps {
  tickers: Ticker[];
  onSelect: (ticker: Ticker) => void;
}

// A mapping from Yahoo Finance short codes to full exchange names
const exchangeNames: Record<string, string> = {
  'NMS': 'NASDAQ',
  'NYQ': 'New York Stock Exchange',
  'PCX': 'NYSE Arca',
  'ASE': 'NYSE American',
  'OBB': 'OTC Bulletin Board',
  'PNK': 'Pink Sheets',
  'LSE': 'London Stock Exchange',
  'FRA': 'Frankfurt Stock Exchange',
  'BSE': 'Bombay Stock Exchange',
  'NSI': 'NSE (India)',
  'TOR': 'Toronto Stock Exchange',
  'IOB': 'London Stock Exchange (IOB)',
  'BER': 'Berlin Stock Exchange',
  'MCE': 'Madrid Stock Exchange',
  'PAR': 'Euronext Paris',
};


const getExchangeFullName = (shortName: string) => {
    return exchangeNames[shortName] || shortName;
};

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
            We found multiple potential matches. Please select the correct company to proceed.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-2 gap-3">
          {tickers.map((ticker) => (
            <Button
              key={`${ticker.ticker}-${ticker.exchange}`}
              variant="outline"
              className="justify-start text-left h-auto py-3 px-4 flex flex-col items-start hover:bg-accent hover:text-accent-foreground"
              onClick={() => onSelect(ticker)}
            >
              <div className='flex items-center justify-between w-full'>
                <span className="font-semibold text-sm sm:text-base text-foreground truncate">{ticker.ticker}</span>
                 <span className="text-xs sm:text-sm text-muted-foreground text-right">
                   {getExchangeFullName(ticker.exchange)} ({ticker.exchange})
                </span>
              </div>
              <span className="text-xs text-muted-foreground text-left w-full truncate pt-1">{ticker.companyName}</span>
            </Button>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
