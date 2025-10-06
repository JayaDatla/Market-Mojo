
'use client';

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Building, Lightbulb } from 'lucide-react';
import type { PriceData } from '@/types';

interface StaticAnalysisProps {
  ticker: string;
}

type IndustryData = {
  [key: string]: {
    industry: string;
    analysis: string;
    competitors: string[];
    historicalData?: PriceData[];
  };
};

// Function to generate sample historical data for a more realistic but stable demo
const generateSampleData = (base: number, days: number, volatility: number): PriceData[] => {
  const data: PriceData[] = [];
  let currentDate = new Date();
  currentDate.setDate(currentDate.getDate() - days);
  let currentPrice = base;

  for (let i = 0; i < days; i++) {
    const changePercent = 2 * volatility * Math.random() - volatility;
    currentPrice *= 1 + changePercent;
    currentPrice = Math.max(currentPrice, base * 0.8); // prevent price from dropping too low
    data.push({
      date: currentDate.toISOString().split('T')[0],
      price: parseFloat(currentPrice.toFixed(2)),
    });
    currentDate.setDate(currentDate.getDate() + 1);
  }
  return data;
};

export const industryData: IndustryData = {
  'TSLA': {
    industry: 'Automotive & Clean Energy',
    analysis: 'A dominant force in the EV market, Tesla faces increasing competition from legacy automakers and new EV startups. Its valuation is often tied to future growth projections in autonomous driving and energy storage.',
    competitors: ['Ford (F)', 'General Motors (GM)', 'Volkswagen (VWAGY)'],
    historicalData: generateSampleData(200, 30, 0.03),
  },
  'AAPL': {
    industry: 'Consumer Electronics & Software',
    analysis: 'Apple maintains a powerful ecosystem with high brand loyalty. Key drivers include iPhone sales, services growth (App Store, iCloud), and expansion into new product categories like augmented reality.',
    competitors: ['Microsoft (MSFT)', 'Google (GOOGL)', 'Samsung (SSNLF)'],
    historicalData: generateSampleData(170, 30, 0.02),
  },
  'MSFT': {
    industry: 'Software & Cloud Computing',
    analysis: 'Microsoft is a diversified technology giant with strongholds in enterprise software, cloud computing (Azure), and gaming (Xbox). Its growth is driven by digital transformation trends and AI integration.',
    competitors: ['Amazon (AMZN)', 'Google (GOOGL)', 'Oracle (ORCL)'],
    historicalData: generateSampleData(300, 30, 0.015),
  },
  'GOOGL': {
    industry: 'Internet & Advertising',
    analysis: 'Alphabet, Google\'s parent company, dominates online search and advertising. It is also a major player in cloud computing, autonomous driving (Waymo), and artificial intelligence.',
    competitors: ['Meta (META)', 'Amazon (AMZN)', 'Microsoft (MSFT)'],
    historicalData: generateSampleData(140, 30, 0.02),
  },
  'AMZN': {
    industry: 'E-commerce & Cloud Computing',
    analysis: 'Amazon leads in e-commerce and cloud infrastructure (AWS). Its stock is influenced by consumer spending, digital advertising growth, and the continued expansion of its logistics and services network.',
    competitors: ['Walmart (WMT)', 'Microsoft (MSFT)', 'Alibaba (BABA)'],
    historicalData: generateSampleData(130, 30, 0.025),
  },
  'NVDA': {
    industry: 'Semiconductors & AI',
    analysis: 'NVIDIA is the leader in GPUs, which are critical for AI and machine learning. Its performance is heavily tied to the demand for data center acceleration, gaming, and professional visualization.',
    competitors: ['AMD (AMD)', 'Intel (INTC)', 'Qualcomm (QCOM)'],
    historicalData: generateSampleData(450, 30, 0.04),
  },
  'META': {
    industry: 'Social Media & Advertising',
    analysis: 'Meta Platforms operates the world\'s largest social networks (Facebook, Instagram, WhatsApp). Its growth is dependent on user engagement, digital advertising revenue, and its long-term bet on the metaverse.',
    competitors: ['Google (GOOGL)', 'TikTok', 'Snap (SNAP)'],
    historicalData: generateSampleData(320, 30, 0.03),
  },
  'LLY': {
    industry: 'Pharmaceuticals',
    analysis: 'Eli Lilly is a global pharmaceutical company with a strong pipeline in diabetes, oncology, and immunology. Its stock performance is driven by drug trial results, new product approvals, and patent expirations.',
    competitors: ['Novo Nordisk (NVO)', 'Pfizer (PFE)', 'Merck (MRK)'],
     historicalData: generateSampleData(580, 30, 0.02),
  },
  'AVGO': {
    industry: 'Semiconductors & Infrastructure Software',
    analysis: 'Broadcom is a diversified semiconductor and software company. Its products are used in data centers, networking, smartphones, and industrial applications. Growth is tied to enterprise IT spending and 5G adoption.',
    competitors: ['Qualcomm (QCOM)', 'Marvell (MRVL)', 'VMware (VMW)'],
    historicalData: generateSampleData(850, 30, 0.02),
  },
  'JPM': {
    industry: 'Financial Services',
    analysis: 'JPMorgan Chase is the largest bank in the United States. Its performance is linked to interest rates, economic growth, and the health of global financial markets. It operates across investment banking, consumer banking, and asset management.',
    competitors: ['Bank of America (BAC)', 'Goldman Sachs (GS)', 'Morgan Stanley (MS)'],
    historicalData: generateSampleData(145, 30, 0.018),
  },
  'TM': {
    industry: 'Automotive',
    analysis: 'Toyota is one of the world\'s largest automakers, known for its reliability and leadership in hybrid vehicles. It is now making a major push into the EV market, leveraging its manufacturing prowess.',
    competitors: ['Volkswagen (VWAGY)', 'General Motors (GM)', 'Tesla (TSLA)'],
    historicalData: generateSampleData(180, 30, 0.015),
  },
  'VWAGY': {
    industry: 'Automotive',
    analysis: 'One of the world\'s largest automakers, Volkswagen Group is aggressively transitioning to electric vehicles to compete with new market entrants. Its performance is heavily linked to global auto sales and its success in the EV race.',
    competitors: ['Toyota (TM)', 'General Motors (GM)', 'Stellantis (STLA)'],
    historicalData: generateSampleData(15, 30, 0.02),
  },
  'SHELL': {
    industry: 'Oil & Gas',
    analysis: 'A major integrated energy company, Shell is navigating the global transition towards lower-carbon energy. Its stock is influenced by oil prices, geopolitical events, and its strategic investments in renewable energy sources.',
    competitors: ['ExxonMobil (XOM)', 'Chevron (CVX)', 'BP (BP)'],
    historicalData: generateSampleData(60, 30, 0.018),
  },
  '700.HK': {
    industry: 'Internet & Technology',
    analysis: 'Tencent Holdings is a Chinese multinational conglomerate with subsidiaries in entertainment, AI, and other technology. Its performance is impacted by domestic regulatory changes and its vast portfolio of games and social media.',
    competitors: ['Alibaba (BABA)', 'ByteDance', 'NetEase (NTES)'],
    historicalData: generateSampleData(350, 30, 0.035), // Note: HKD
  },
  'TATAMOTORS.NS': {
    industry: 'Automotive',
    analysis: 'An Indian multinational automotive manufacturing company, Tata Motors is a leading producer of cars, trucks, and buses. It owns Jaguar Land Rover and is making significant strides in the Indian electric vehicle market.',
    competitors: ['Mahindra & Mahindra (M&M.NS)', 'Maruti Suzuki (MARUTI.NS)', 'Hyundai'],
    historicalData: generateSampleData(620, 30, 0.03), // Note: INR
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
