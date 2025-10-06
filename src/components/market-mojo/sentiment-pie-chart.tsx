
'use client';

import React, { useMemo, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import type { NewsArticle } from '@/types';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend, Sector } from 'recharts';
import { TrendingUp } from 'lucide-react';
import { DropShadowFilter } from '@/components/ui/filters';

interface SentimentPieChartProps {
  newsData: NewsArticle[];
}

const renderActiveShape = (props: any) => {
  const RADIAN = Math.PI / 180;
  const { cx, cy, midAngle, innerRadius, outerRadius, startAngle, endAngle, fill, payload, percent, value } = props;
  const sin = Math.sin(-RADIAN * midAngle);
  const cos = Math.cos(-RADIAN * midAngle);
  const sx = cx + (outerRadius + 5) * cos;
  const sy = cy + (outerRadius + 5) * sin;
  const mx = cx + (outerRadius + 15) * cos;
  const my = cy + (outerRadius + 15) * sin;
  const ex = mx + (cos >= 0 ? 1 : -1) * 11;
  const ey = my;
  const textAnchor = cos >= 0 ? 'start' : 'end';

  return (
    <g>
      <Sector
        cx={cx}
        cy={cy}
        innerRadius={innerRadius}
        outerRadius={outerRadius}
        startAngle={startAngle}
        endAngle={endAngle}
        fill={fill}
      />
      <Sector
        cx={cx}
        cy={cy}
        startAngle={startAngle}
        endAngle={endAngle}
        innerRadius={outerRadius + 4}
        outerRadius={outerRadius + 8}
        fill={fill}
      />
      <path d={`M${sx},${sy}L${mx},${my}L${ex},${ey}`} stroke={fill} fill="none" />
      <circle cx={ex} cy={ey} r={2} fill={fill} stroke="none" />
      <text x={ex + (cos >= 0 ? 1 : -1) * 6} y={ey} textAnchor={textAnchor} fill="hsl(var(--foreground))" dy={4}>{`${payload.name}`}</text>
      <text x={ex + (cos >= 0 ? 1 : -1) * 6} y={ey} dy={18} textAnchor={textAnchor} fill="hsl(var(--muted-foreground))">
        {`(${(percent * 100).toFixed(0)}%)`}
      </text>
    </g>
  );
};


export default function SentimentPieChart({ newsData }: SentimentPieChartProps) {
  const [activeIndex, setActiveIndex] = useState<number | null>(null);

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

  const onPieEnter = (_: any, index: number) => {
    setActiveIndex(index);
  };
  
  const onPieLeave = () => {
    setActiveIndex(null);
  }

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
                    innerRadius={60}
                    outerRadius={80}
                    fill="#8884d8"
                    dataKey="value"
                    activeIndex={activeIndex ?? undefined}
                    activeShape={renderActiveShape}
                    onMouseEnter={onPieEnter}
                    onMouseLeave={onPieLeave}
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
                  color: "#FFFFFF"
                }}
                formatter={(value: number, name: string) => [`${value} articles`, name]}
              />
              <Legend iconSize={10} />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
}
