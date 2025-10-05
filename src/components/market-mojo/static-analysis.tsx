
'use client';

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Building, Lightbulb } from 'lucide-react';

interface StaticAnalysisProps {
  ticker: string;
}

const generatePriceData = (base: number) => {
  const data = [];
  let currentDate = new Date();
  currentDate.setDate(currentDate.getDate() - 30);
  for (let i = 0; i < 30; i++) {
    currentDate.setDate(currentDate.getDate() + 1);
    const fluctuation = (Math.random() - 0.5) * (base * 0.05);
    const price = base + fluctuation * i * 0.2 + Math.sin(i / 5) * 5;
    data.push({
      date: currentDate.toISOString().split('T')[0],
      price: parseFloat(price.toFixed(2)),
    });
  }
  return data;
};

export const industryData: { [key: string]: { industry: string; analysis: string; competitors: string[]; priceData: { date: string; price: number }[] } } = {
  'TSLA': {
    industry: 'Automotive & Clean Energy',
    analysis: 'A dominant force in the EV market, Tesla faces increasing competition from legacy automakers and new EV startups. Its valuation is often tied to future growth projections in autonomous driving and energy storage.',
    competitors: ['Ford (F)', 'General Motors (GM)', 'Volkswagen (VWAGY)'],
    priceData: generatePriceData(180),
  },
  'AAPL': {
    industry: 'Consumer Electronics & Software',
    analysis: 'Apple maintains a powerful ecosystem with high brand loyalty. Key drivers include iPhone sales, services growth (App Store, iCloud), and expansion into new product categories like augmented reality.',
    competitors: ['Microsoft (MSFT)', 'Google (GOOGL)', 'Samsung (SSNLF)'],
    priceData: generatePriceData(210),
  },
  'MSFT': {
    industry: 'Software & Cloud Computing',
    analysis: 'Microsoft is a diversified technology giant with strongholds in enterprise software, cloud computing (Azure), and gaming (Xbox). Its growth is driven by digital transformation trends and AI integration.',
    competitors: ['Amazon (AMZN)', 'Google (GOOGL)', 'Oracle (ORCL)'],
    priceData: generatePriceData(440),
  },
  'GOOGL': {
    industry: 'Internet & Advertising',
    analysis: 'Alphabet, Google\'s parent company, dominates online search and advertising. It is also a major player in cloud computing, autonomous driving (Waymo), and artificial intelligence.',
    competitors: ['Meta (META)', 'Amazon (AMZN)', 'Microsoft (MSFT)'],
    priceData: generatePriceData(175),
  },
  'AMZN': {
    industry: 'E-commerce & Cloud Computing',
    analysis: 'Amazon leads in e-commerce and cloud infrastructure (AWS). Its stock is influenced by consumer spending, digital advertising growth, and the continued expansion of its logistics and services network.',
    competitors: ['Walmart (WMT)', 'Microsoft (MSFT)', 'Alibaba (BABA)'],
    priceData: generatePriceData(185),
  },
  'NVDA': {
    industry: 'Semiconductors & AI',
    analysis: 'NVIDIA is the leader in GPUs, which are critical for AI and machine learning. Its performance is heavily tied to the demand for data center acceleration, gaming, and professional visualization.',
    competitors: ['AMD (AMD)', 'Intel (INTC)', 'Qualcomm (QCOM)'],
    priceData: generatePriceData(125),
  },
  'META': {
    industry: 'Social Media & Advertising',
    analysis: 'Meta Platforms operates the world\'s largest social networks (Facebook, Instagram, WhatsApp). Its growth is dependent on user engagement, digital advertising revenue, and its long-term bet on the metaverse.',
    competitors: ['Google (GOOGL)', 'TikTok', 'Snap (SNAP)'],
    priceData: generatePriceData(500),
  },
  'LLY': {
    industry: 'Pharmaceuticals',
    analysis: 'Eli Lilly is a global pharmaceutical company with a strong pipeline in diabetes, oncology, and immunology. Its stock performance is driven by drug trial results, new product approvals, and patent expirations.',
    competitors: ['Novo Nordisk (NVO)', 'Pfizer (PFE)', 'Merck (MRK)'],
    priceData: generatePriceData(880),
  },
  'AVGO': {
    industry: 'Semiconductors & Infrastructure Software',
    analysis: 'Broadcom is a diversified semiconductor and software company. Its products are used in data centers, networking, smartphones, and industrial applications. Growth is tied to enterprise IT spending and 5G adoption.',
    competitors: ['Qualcomm (QCOM)', 'Marvell (MRVL)', 'VMware (VMW)'],
    priceData: generatePriceData(1700),
  },
  'JPM': {
    industry: 'Financial Services',
    analysis: 'JPMorgan Chase is the largest bank in the United States. Its performance is linked to interest rates, economic growth, and the health of global financial markets. It operates across investment banking, consumer banking, and asset management.',
    competitors: ['Bank of America (BAC)', 'Goldman Sachs (GS)', 'Morgan Stanley (MS)'],
    priceData: generatePriceData(200),
  },
  'VW': {
    industry: 'Automotive',
    analysis: 'One of the world\'s largest automakers, Volkswagen Group is aggressively transitioning to electric vehicles to compete with new market entrants. Its performance is heavily linked to global auto sales and its success in the EV race.',
    competitors: ['Toyota (TM)', 'General Motors (GM)', 'Stellantis (STLA)'],
    priceData: generatePriceData(120),
  },
  'SHELL': {
    industry: 'Oil & Gas',
    analysis: 'A major integrated energy company, Shell is navigating the global transition towards lower-carbon energy. Its stock is influenced by oil prices, geopolitical events, and its strategic investments in renewable energy sources.',
    competitors: ['ExxonMobil (XOM)', 'Chevron (CVX)', 'BP (BP)'],
    priceData: generatePriceData(85),
  },
  '700.HK': {
      industry: 'Internet & Technology',
      analysis: 'Tencent Holdings is a Chinese multinational conglomerate with subsidiaries in entertainment, AI, and other technology. Its performance is impacted by domestic regulatory changes and its vast portfolio of games and social media.',
      competitors: ['Alibaba (BABA)', 'ByteDance', 'NetEase (NTES)'],
      priceData: generatePriceData(380),
  }
};

export default function StaticAnalysis({ ticker }: StaticAnalysisProps) {
  const data = industryData[ticker.toUpperCase()];

  if (!data) {
    return (
       <Card className="bg-card border-border/50">
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
    <Card className="bg-card border-border/50">
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
