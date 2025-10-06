
'use client';

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Building, Lightbulb } from 'lucide-react';
import type { PriceData } from '@/types';

interface StaticAnalysisProps {
  ticker: string;
}

type CompanyData = {
  industry: string;
  analysis: string;
  competitors: string[];
  historicalData?: PriceData[];
};

type IndustryData = {
  [key: string]: CompanyData;
};

export const industryData: IndustryData = {
  'TSLA': {
    industry: 'Automotive & Clean Energy',
    analysis: 'A dominant force in the EV market, Tesla faces increasing competition from legacy automakers and new EV startups. Its valuation is often tied to future growth projections in autonomous driving and energy storage.',
    competitors: ['Ford (F)', 'General Motors (GM)', 'Volkswagen (VWAGY)'],
    historicalData: [{"date":"2024-04-29","price":194.05},{"date":"2024-04-30","price":183.28},{"date":"2024-05-01","price":179.99},{"date":"2024-05-02","price":180.01},{"date":"2024-05-03","price":181.19},{"date":"2024-05-06","price":184.72},{"date":"2024-05-07","price":182.19},{"date":"2024-05-08","price":177.81},{"date":"2024-05-09","price":174.72},{"date":"2024-05-10","price":171.89},{"date":"2024-05-13","price":172.00},{"date":"2024-05-14","price":177.55},{"date":"2024-05-15","price":173.99},{"date":"2024-05-16","price":174.84},{"date":"2024-05-17","price":177.46},{"date":"2024-05-20","price":174.95},{"date":"20_24-05-21","price":186.60},{"date":"2024-05-22","price":180.11},{"date":"2024-05-23","price":173.74},{"date":"2024-05-24","price":179.24}],
  },
  'AAPL': {
    industry: 'Consumer Electronics & Software',
    analysis: 'Apple maintains a powerful ecosystem with high brand loyalty. Key drivers include iPhone sales, services growth (App Store, iCloud), and expansion into new product categories like augmented reality.',
    competitors: ['Microsoft (MSFT)', 'Google (GOOGL)', 'Samsung (SSNLF)'],
    historicalData: [{"date":"2024-04-29","price":173.50},{"date":"2024-04-30","price":170.33},{"date":"2024-05-01","price":169.30},{"date":"2024-05-02","price":173.03},{"date":"2024-05-03","price":183.38},{"date":"2024-05-06","price":181.71},{"date":"2024-05-07","price":182.40},{"date":"2024-05-08","price":182.74},{"date":"2024-05-09","price":184.57},{"date":"2024-05-10","price":183.05},{"date":"2024-05-13","price":186.28},{"date":"2024-05-14","price":187.43},{"date":"2024-05-15","price":189.72},{"date":"2024-05-16","price":189.84},{"date":"2024-05-17","price":189.87},{"date":"2024-05-20","price":191.04},{"date":"2024-05-21","price":192.35},{"date":"2024-05-22","price":190.90},{"date":"2024-05-23","price":189.95},{"date":"2024-05-24","price":190.58}],
  },
  'MSFT': {
    industry: 'Software & Cloud Computing',
    analysis: 'Microsoft is a diversified technology giant with strongholds in enterprise software, cloud computing (Azure), and gaming (Xbox). Its growth is driven by digital transformation trends and AI integration.',
    competitors: ['Amazon (AMZN)', 'Google (GOOGL)', 'Oracle (ORCL)'],
    historicalData: [{"date":"2024-04-29","price":402.25},{"date":"2024-04-30","price":395.78},{"date":"2024-05-01","price":391.34},{"date":"2024-05-02","price":398.07},{"date":"2024-05-03","price":406.12},{"date":"2024-05-06","price":413.54},{"date":"2024-05-07","price":410.55},{"date":"2024-05-08","price":410.74},{"date":"2024-05-09","price":412.32},{"date":"2024-05-10","price":414.74},{"date":"2024-05-13","price":413.72},{"date":"2024-05-14","price":416.56},{"date":"2024-05-15","price":423.08},{"date":"2024-05-16","price":420.99},{"date":"2024-05-17","price":420.21},{"date":"2024-05-20","price":425.34},{"date":"2024-05-21","price":429.04},{"date":"2024-05-22","price":430.52},{"date":"2024-05-23","price":427.00},{"date":"2024-05-24","price":430.16}],
  },
  'GOOGL': {
    industry: 'Internet & Advertising',
    analysis: 'Alphabet, Google\'s parent company, dominates online search and advertising. It is also a major player in cloud computing, autonomous driving (Waymo), and artificial intelligence.',
    competitors: ['Meta (META)', 'Amazon (AMZN)', 'Microsoft (MSFT)'],
    historicalData: [{"date":"2024-04-29","price":168.00},{"date":"2024-04-30","price":164.97},{"date":"2024-05-01","price":165.68},{"date":"2024-05-02","price":168.04},{"date":"2024-05-03","price":170.00},{"date":"2024-05-06","price":171.69},{"date":"2024-05-07","price":173.08},{"date":"2024-05-08","price":172.11},{"date":"2024-05-09","price":172.29},{"date":"2024-05-10","price":170.47},{"date":"2024-05-13","price":170.89},{"date":"2024-05-14","price":172.02},{"date":"2024-05-15","price":173.80},{"date":"2024-05-16","price":174.54},{"date":"2024-05-17","price":176.47},{"date":"2024-05-20","price":176.84},{"date":"2024-05-21","price":177.62},{"date":"2024-05-22","price":177.38},{"date":"2024-05-23","price":175.08},{"date":"2024-05-24","price":176.33}],
  },
  'AMZN': {
    industry: 'E-commerce & Cloud Computing',
    analysis: 'Amazon leads in e-commerce and cloud infrastructure (AWS). Its stock is influenced by consumer spending, digital advertising growth, and the continued expansion of its logistics and services network.',
    competitors: ['Walmart (WMT)', 'Microsoft (MSFT)', 'Alibaba (BABA)'],
    historicalData: [{"date":"2024-04-29","price":175.00},{"date":"2024-04-30","price":175.00},{"date":"2024-05-01","price":179.00},{"date":"2024-05-02","price":184.70},{"date":"2024-05-03","price":186.42},{"date":"2024-05-06","price":188.80},{"date":"2024-05-07","price":188.76},{"date":"2024-05-08","price":188.00},{"date":"2024-05-09","price":189.50},{"date":"2024-05-10","price":187.48},{"date":"2024-05-13","price":186.57},{"date":"2024-05-14","price":187.07},{"date":"2024-05-15","price":185.99},{"date":"2024-05-16","price":183.63},{"date":"2024-05-17","price":184.39},{"date":"2024-05-20","price":183.54},{"date":"2024-05-21","price":183.15},{"date":"2024-05-22","price":183.13},{"date":"2024-05-23","price":181.05},{"date":"2024-05-24","price":180.75}],
  },
  'NVDA': {
    industry: 'Semiconductors & AI',
    analysis: 'NVIDIA is the leader in GPUs, which are critical for AI and machine learning. Its performance is heavily tied to the demand for data center acceleration, gaming, and professional visualization.',
    competitors: ['AMD (AMD)', 'Intel (INTC)', 'Qualcomm (QCOM)'],
    historicalData: [{"date":"2024-04-29","price":877.57},{"date":"2024-04-30","price":864.02},{"date":"2024-05-01","price":830.41},{"date":"2024-05-02","price":859.34},{"date":"2024-05-03","price":887.89},{"date":"2024-05-06","price":921.40},{"date":"2024-05-07","price":905.54},{"date":"2024-05-08","price":903.99},{"date":"2024-05-09","price":887.47},{"date":"2024-05-10","price":903.67},{"date":"2024-05-13","price":903.99},{"date":"2024-05-14","price":913.56},{"date":"2024-05-15","price":946.33},{"date":"2024-05-16","price":942.89},{"date":"2024-05-17","price":924.79},{"date":"2024-05-20","price":947.80},{"date":"2024-05-21","price":953.86},{"date":"2024-05-22","price":949.50},{"date":"2024-05-23","price":1037.99},{"date":"2024-05-24","price":1064.69}],
  },
  'META': {
    industry: 'Social Media & Advertising',
    analysis: 'Meta Platforms operates the world\'s largest social networks (Facebook, Instagram, WhatsApp). Its growth is dependent on user engagement, digital advertising revenue, and its long-term bet on the metaverse.',
    competitors: ['Google (GOOGL)', 'TikTok', 'Snap (SNAP)'],
    historicalData: [{"date":"2024-04-29","price":443.29},{"date":"2024-04-30","price":432.81},{"date":"2024-05-01","price":430.01},{"date":"2024-05-02","price":439.14},{"date":"2024-05-03","price":445.69},{"date":"2024-05-06","price":464.33},{"date":"2024-05-07","price":467.58},{"date":"2024-05-08","price":468.99},{"date":"2024-05-09","price":471.21},{"date":"2024-05-10","price":469.75},{"date":"2024-05-13","price":466.90},{"date":"2024-05-14","price":472.92},{"date":"2024-05-15","price":481.56},{"date":"2024-05-16","price":481.18},{"date":"2024-05-17","price":481.07},{"date":"2024-05-20","price":476.95},{"date":"2024-05-21","price":467.89},{"date":"2024-05-22","price":473.84},{"date":"2024-05-23","price":476.51},{"date":"2024-05-24","price":481.76}],
  },
  'LLY': {
    industry: 'Pharmaceuticals',
    analysis: 'Eli Lilly is a global pharmaceutical company with a strong pipeline in diabetes, oncology, and immunology. Its stock performance is driven by drug trial results, new product approvals, and patent expirations.',
    competitors: ['Novo Nordisk (NVO)', 'Pfizer (PFE)', 'Merck (MRK)'],
    historicalData: [{"date":"2024-04-29","price":738.99},{"date":"2024-04-30","price":781.10},{"date":"2024-05-01","price":760.77},{"date":"2024-05-02","price":753.94},{"date":"2024-05-03","price":751.49},{"date":"2024-05-06","price":761.34},{"date":"2024-05-07","price":763.50},{"date":"2024-05-08","price":771.85},{"date":"2024-05-09","price":779.62},{"date":"2024-05-10","price":776.01},{"date":"2024-05-13","price":785.49},{"date":"2024-05-14","price":793.41},{"date":"2024-05-15","price":806.91},{"date":"2024-05-16","price":807.77},{"date":"2024-05-17","price":809.52},{"date":"2024-05-20","price":809.84},{"date":"2024-05-21","price":813.00},{"date":"2024-05-22","price":821.57},{"date":"2024-05-23","price":835.95},{"date":"2024-05-24","price":833.00}],
  },
  'AVGO': {
    industry: 'Semiconductors & Infrastructure Software',
    analysis: 'Broadcom is a diversified semiconductor and software company. Its products are used in data centers, networking, smartphones, and industrial applications. Growth is tied to enterprise IT spending and 5G adoption.',
    competitors: ['Qualcomm (QCOM)', 'Marvell (MRVL)', 'VMware (VMW)'],
    historicalData: [{"date":"2024-04-29","price":1326.01},{"date":"2024-04-30","price":1289.43},{"date":"2024-05-01","price":1252.17},{"date":"2024-05-02","price":1295.69},{"date":"2024-05-03","price":1321.31},{"date":"2024-05-06","price":1341.28},{"date":"2024-05-07","price":1343.99},{"date":"2024-05-08","price":1362.48},{"date":"2024-05-09","price":1339.99},{"date":"2024-05-10","price":1360.01},{"date":"2024-05-13","price":1353.49},{"date":"2024-05-14","price":1380.00},{"date":"2024-05-15","price":1398.88},{"date":"2024-05-16","price":1406.84},{"date":"2024-05-17","price":1402.73},{"date":"2024-05-20","price":1408.00},{"date":"2024-05-21","price":1404.28},{"date":"2024-05-22","price":1425.21},{"date":"2024-05-23","price":1319.46},{"date":"2024-05-24","price":1318.00}],
  },
  'JPM': {
    industry: 'Financial Services',
    analysis: 'JPMorgan Chase is the largest bank in the United States. Its performance is linked to interest rates, economic growth, and the health of global financial markets. It operates across investment banking, consumer banking, and asset management.',
    competitors: ['Bank of America (BAC)', 'Goldman Sachs (GS)', 'Morgan Stanley (MS)'],
    historicalData: [{"date":"2024-04-29","price":194.02},{"date":"2024-04-30","price":190.17},{"date":"2024-05-01","price":188.08},{"date":"2024-05-02","price":191.06},{"date":"2024-05-03","price":193.30},{"date":"2024-05-06","price":196.44},{"date":"2024-05-07","price":198.88},{"date":"2024-05-08","price":200.08},{"date":"2024-05-09","price":201.27},{"date":"2024-05-10","price":200.32},{"date":"2024-05-13","price":199.19},{"date":"2024-05-14","price":201.28},{"date":"2024-05-15","price":203.46},{"date":"2024-05-16","price":204.81},{"date":"2024-05-17","price":203.88},{"date":"2024-05-20","price":205.61},{"date":"2024-05-21","price":205.21},{"date":"2024-05-22","price":203.81},{"date":"2024-05-23","price":201.55},{"date":"2024-05-24","price":201.35}],
  },
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
