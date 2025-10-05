
'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
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
  { name: 'JPMorgan Chase', ticker: 'JPM' },
  { name: 'Tesla', ticker: 'TSLA' },
];

export default function TopCompanies({ onCompanySelect }: TopCompaniesProps) {
  return (
    <Card className="bg-card border-border/50">
      <CardHeader>
        <CardTitle>Top 10 Global Companies by Market Cap</CardTitle>
      </CardHeader>
      <CardContent>
        <p className="text-muted-foreground mb-6">Select a company to begin sentiment analysis.</p>
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
          {topCompanies.map((company) => (
            <Button
              key={company.ticker}
              variant="outline"
              className="justify-start text-left h-auto py-3 px-4 flex flex-col items-start hover:bg-accent hover:text-accent-foreground"
              onClick={() => onCompanySelect(company.ticker)}
            >
              <span className="font-semibold text-base text-foreground">{company.name}</span>
              <span className="text-sm text-muted-foreground">{company.ticker}</span>
            </Button>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
