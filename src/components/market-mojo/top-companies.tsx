
'use client';

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';

interface TopCompaniesProps {
  onCompanySelect: (ticker: string) => void;
}

const topCompanies = [
  { name: 'Apple', ticker: 'AAPL' },
  { name: 'Microsoft', ticker: 'MSFT' },
  { name: 'Google', ticker: 'GOOGL' },
  { name: 'Amazon', ticker: 'AMZN' },
  { name: 'NVIDIA', ticker: 'NVDA' },
  { name: 'Meta', ticker: 'META' },
  { name: 'Eli Lilly', ticker: 'LLY' },
  { name: 'Broadcom', ticker: 'AVGO' },
  { name: 'JPMorgan', ticker: 'JPM' },
  { name: 'Tesla', ticker: 'TSLA' },
  { name: 'Roche', ticker: 'RHHBY' },
];

export default function TopCompanies({ onCompanySelect }: TopCompaniesProps) {
  return (
    <Card className="bg-card border-border/50">
      <CardHeader>
        <CardTitle>Top Global Companies</CardTitle>
        <CardDescription>Select a company to begin sentiment analysis.</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-2 xl:grid-cols-3 gap-3 sm:gap-4">
          {topCompanies.map((company) => (
            <Button
              key={company.ticker}
              variant="outline"
              className="justify-start text-left h-auto py-3 px-4 flex flex-col items-start hover:bg-accent hover:text-accent-foreground"
              onClick={() => onCompanySelect(company.ticker)}
            >
              <span className="font-semibold text-sm sm:text-base text-foreground truncate w-full">{company.name}</span>
              <span className="text-xs sm:text-sm text-muted-foreground">{company.ticker}</span>
            </Button>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
