'use client';

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Building, Lightbulb } from 'lucide-react';

interface StaticAnalysisProps {
  ticker: string;
}

const industryData: { [key: string]: { industry: string; analysis: string; competitors: string[] } } = {
  'TSLA': {
    industry: 'Automotive & Clean Energy',
    analysis: 'A dominant force in the EV market, Tesla faces increasing competition from legacy automakers and new EV startups. Its valuation is often tied to future growth projections in autonomous driving and energy storage.',
    competitors: ['Ford (F)', 'General Motors (GM)', 'Volkswagen (VWAGY)'],
  },
  'AAPL': {
    industry: 'Consumer Electronics & Software',
    analysis: 'Apple maintains a powerful ecosystem with high brand loyalty. Key drivers include iPhone sales, services growth (App Store, iCloud), and expansion into new product categories like augmented reality.',
    competitors: ['Microsoft (MSFT)', 'Google (GOOGL)', 'Samsung (SSNLF)'],
  },
  'VW': {
    industry: 'Automotive',
    analysis: 'One of the world\'s largest automakers, Volkswagen Group is aggressively transitioning to electric vehicles to compete with new market entrants. Its performance is heavily linked to global auto sales and its success in the EV race.',
    competitors: ['Toyota (TM)', 'General Motors (GM)', 'Stellantis (STLA)'],
  },
  'SHELL': {
    industry: 'Oil & Gas',
    analysis: 'A major integrated energy company, Shell is navigating the global transition towards lower-carbon energy. Its stock is influenced by oil prices, geopolitical events, and its strategic investments in renewable energy sources.',
    competitors: ['ExxonMobil (XOM)', 'Chevron (CVX)', 'BP (BP)'],
  },
  '700.HK': {
      industry: 'Internet & Technology',
      analysis: 'Tencent Holdings is a Chinese multinational conglomerate with subsidiaries in entertainment, AI, and other technology. Its performance is impacted by domestic regulatory changes and its vast portfolio of games and social media.',
      competitors: ['Alibaba (BABA)', 'ByteDance', 'NetEase (NTES)'],
  }
};

export default function StaticAnalysis({ ticker }: StaticAnalysisProps) {
  const data = industryData[ticker.toUpperCase()];

  if (!data) {
    return (
       <Card className="bg-card border-border/50 sticky top-24">
        <CardHeader>
          <CardTitle>Industry Deep Dive</CardTitle>
        </CardHeader>
        <CardContent>
            <p className="text-muted-foreground text-sm">No static analysis available for this ticker. This feature is available for select major global companies.</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="bg-card border-border/50 sticky top-24">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
            <Lightbulb className="h-5 w-5 text-primary" />
            Industry Deep Dive
        </CardTitle>
        <CardDescription>{data.industry}</CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div>
            <h4 className="font-semibold text-sm mb-2 text-muted-foreground">Sector Analysis</h4>
            <p className="text-sm text-foreground/90">{data.analysis}</p>
        </div>
        <div>
            <h4 className="font-semibold text-sm mb-3 text-muted-foreground">Major Competitors</h4>
            <ul className="space-y-2">
                {data.competitors.map(c => (
                    <li key={c} className="flex items-center gap-2 text-sm text-foreground/90">
                        <Building className="h-4 w-4 text-primary/70 flex-shrink-0" />
                        {c}
                    </li>
                ))}
            </ul>
        </div>
      </CardContent>
    </Card>
  );
}
