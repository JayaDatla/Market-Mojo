
'use client';

import { useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import type { NewsArticle } from '@/types';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend } from 'recharts';
import { TrendingUp } from 'lucide-react';
import { DropShadowFilter } from '@/components/ui/filters';


interface SentimentPieChartProps {
  newsData: NewsArticle[];
}

const RADIAN = Math.PI / 180;
const renderCustomizedLabel = ({ cx, cy, midAngle, innerRadius, outerRadius, percent }: any) => {
  const radius = innerRadius + (outerRadius - innerRadius) * 0.5;
  const x = cx + radius * Math.cos(-midAngle * RADIAN);
  const y = cy + radius * Math.sin(-midAngle * RADIAN);

  if (percent < 0.05) return null;

  return (
    <text x={x} y={y} fill="white" textAnchor={x > cx ? 'start' : 'end'} dominantBaseline="central">
      {`${(percent * 100).toFixed(0)}%`}
    </text>
  );
};

export default function SentimentPieChart({ newsData }: SentimentPieChartProps) {
  const sentimentDistribution = useMemo(() => {
    if (!newsData) return [];
    const counts: Record<'Positive' | 'Neutral' | 'Negative', number> = { Positive: 0, Neutral: 0, Negative: 0 };
    newsData.forEach(article => {
      counts[article.sentiment]++;
    });
    return [
      { name: 'Positive', value: counts.Positive, color: 'hsl(142.1 76.2% 36.3%)' }, // Green
      { name: 'Neutral', value: counts.Neutral, color: 'hsl(221.2 83.2% 53.3%)' }, // Blue
      { name: 'Negative', value: counts.Negative, color: 'hsl(0 72.2% 50.6%)' }, // Red
    ].filter(d => d.value > 0);
  }, [newsData]);

  if (newsData.length === 0) {
    return null;
  }

  return (
    <Card className="bg-card border-border/50">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
            <TrendingUp className="h-5 w-5 text-primary" />
            Sentiment Distribution
        </CardTitle>
        <CardDescription>Breakdown of news article sentiment.</CardDescription>
      </CardHeader>
      <CardContent>
        <div style={{ width: '100%', height: 250 }}>
          <ResponsiveContainer>
            <PieChart>
                <defs>
                    <DropShadowFilter id="pie-shadow" />
                </defs>
              <Pie
                data={sentimentDistribution}
                cx="50%"
                cy="50%"
                labelLine={false}
                label={renderCustomizedLabel}
                outerRadius={100}
                fill="#8884d8"
                dataKey="value"
                stroke="none"
                filter="url(#pie-shadow)"
              >
                {sentimentDistribution.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip
                contentStyle={{
                  background: "hsl(var(--background))",
                  borderColor: "hsl(var(--border))",
                  borderRadius: "var(--radius)",
                }}
              />
              <Legend />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
}
