
'use client';

import React, { useMemo, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import type { NewsArticle } from '@/types';
import { PieChart as PieChartIcon } from 'lucide-react';
import { PieChart, Pie, Sector, Cell, ResponsiveContainer } from 'recharts';

interface SentimentPieChartProps {
  newsData: NewsArticle[];
}

// Function to darken a color for the shadow/depth layer
const darkenColor = (color: string, amount = 20): string => {
  try {
    // Handle HSL colors (e.g., "hsl(142.1 76.2% 36.3%)")
    if (color.startsWith('hsl')) {
      const parts = color.match(/hsl\(([\d.]+)\s([\d.]+)%\s([\d.]+)%\)/);
      if (!parts) return '#000000';
      const h = parseFloat(parts[1]);
      const s = parseFloat(parts[2]);
      let l = parseFloat(parts[3]);
      l = Math.max(0, l - amount); // Darken by reducing lightness
      return `hsl(${h} ${s}% ${l}%)`;
    }

    // Fallback for hex colors (though we use HSL)
    const clamp = (v: number) => Math.max(Math.min(v, 255), 0);
    const num = parseInt(color.replace("#", ""), 16);
    const r = clamp((num >> 16) - amount);
    const g = clamp(((num >> 8) & 0x00ff) - amount);
    const b = clamp((num & 0x0000ff) - amount);
    return `rgb(${r}, ${g}, ${b})`;
  } catch (e) {
    return '#000000'; // Return black on error
  }
};


const renderActiveShape = (props: any) => {
  const RADIAN = Math.PI / 180;
  const {
    cx,
    cy,
    midAngle,
    innerRadius,
    outerRadius,
    startAngle,
    endAngle,
    fill,
    payload,
    percent,
  } = props;

  const sin = Math.sin(-RADIAN * midAngle);
  const cos = Math.cos(-RADIAN * midAngle);
  
  // Position for the label line
  const sx = cx + (outerRadius + 10) * cos;
  const sy = cy + (outerRadius + 10) * sin;
  const mx = cx + (outerRadius + 30) * cos;
  const my = cy + (outerRadius + 30) * sin;
  const ex = mx + (cos >= 0 ? 1 : -1) * 22;
  const ey = my;
  const textAnchor = cos >= 0 ? 'start' : 'end';

  // "Lift" offset for 3D effect
  const lift = 8;
  const depth = 10;
  
  // Darker shades for the 3D effect
  const shadowFill = darkenColor(fill, 40);
  const sideFill = darkenColor(fill, 20);

  return (
    <g>
        {/* Back "shadow" layer */}
        <Sector
            cx={cx}
            cy={cy + depth}
            innerRadius={innerRadius}
            outerRadius={outerRadius}
            startAngle={startAngle}
            endAngle={endAngle}
            fill={shadowFill}
            stroke="none"
        />

        {/* Lifted main slice */}
        <Sector
            cx={cx}
            cy={cy - lift}
            innerRadius={innerRadius}
            outerRadius={outerRadius}
            startAngle={startAngle}
            endAngle={endAngle}
            fill={fill}
            stroke={fill}
            strokeWidth={1}
        />

        {/* Label line */}
        <path d={`M${sx},${sy - lift}L${mx},${my - lift}L${ex},${ey - lift}`} stroke={fill} fill="none" />
        <circle cx={ex} cy={ey - lift} r={2} fill={fill} stroke="none" />

        {/* Label Text - Explicitly white */}
        <text 
            x={ex + (cos >= 0 ? 1 : -1) * 12} 
            y={ey - lift} 
            textAnchor={textAnchor} 
            fill="#FFFFFF"
            className="text-base font-semibold"
        >
            {payload.name}
        </text>
        <text 
            x={ex + (cos >= 0 ? 1 : -1) * 12} 
            y={ey - lift} 
            dy={18} 
            textAnchor={textAnchor} 
            fill="#CCCCCC"
             className="text-sm"
        >
            {`(${(percent * 100).toFixed(0)}%)`}
        </text>
    </g>
  );
};


export default function SentimentPieChart({ newsData }: SentimentPieChartProps) {
  const [activeIndex, setActiveIndex] = useState<number | null>(0);

  const sentimentDistribution = useMemo(() => {
    if (!newsData) return [];
    const counts: Record<'Positive' | 'Neutral' | 'Negative', number> = { Positive: 0, Neutral: 0, Negative: 0 };
    newsData.forEach(article => {
      if (counts[article.sentiment] !== undefined) {
        counts[article.sentiment]++;
      }
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
            <PieChartIcon className="h-5 w-5 text-primary" />
            Sentiment Distribution
        </CardTitle>
        <CardDescription>Breakdown of news article sentiment.</CardDescription>
      </CardHeader>
      <CardContent>
        <div style={{ width: '100%', height: 250 }}>
          <ResponsiveContainer>
            <PieChart>
               <Pie
                    activeIndex={activeIndex ?? undefined}
                    activeShape={renderActiveShape}
                    data={sentimentDistribution}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={80}
                    dataKey="value"
                    onMouseEnter={onPieEnter}
                    onMouseLeave={onPieLeave}
                    paddingAngle={3}
                >
                    {sentimentDistribution.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} stroke={entry.color} />
                    ))}
              </Pie>
            </PieChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
}
