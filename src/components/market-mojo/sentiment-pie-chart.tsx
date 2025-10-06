
'use client';

import React, { useMemo, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import type { NewsArticle } from '@/types';
import { PieChart as PieChartIcon } from 'lucide-react';
import { PieChart, Pie, Sector, Cell, ResponsiveContainer } from 'recharts';

interface SentimentPieChartProps {
  newsData: NewsArticle[];
}

const sentimentConfig = {
  Positive: { color: "#22c55e" }, // green
  Neutral: { color: "#3b82f6" }, // blue
  Negative: { color: "#ef4444" }, // red
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
      liftY = 0 // Default liftY to 0 if not provided
    } = props;

    const sin = Math.sin(-RADIAN * midAngle);
    const cos = Math.cos(-RADIAN * midAngle);

    return (
      <g style={{ transition: "all 0.4s ease-out" }}>
        {/* Glow filter */}
        <defs>
            <filter id="hover-glow" x="-50%" y="-50%" width="200%" height="200%">
            <feDropShadow dx="0" dy="0" stdDeviation="6" floodColor={fill} floodOpacity="0.7" />
            </filter>
        </defs>

        {/* Lifted slice */}
        <Sector
          cx={cx}
          cy={cy + liftY}
          innerRadius={innerRadius - 2}
          outerRadius={outerRadius + 4}
          startAngle={startAngle}
          endAngle={endAngle}
          fill={fill}
          filter="url(#hover-glow)"
        />

        {/* Label */}
        <text
          x={cx + (outerRadius + 10) * cos}
          y={cy + liftY + (outerRadius + 10) * sin}
          textAnchor={cos >= 0 ? "start" : "end"}
          fill="#ffffff"
          fontWeight={700}
          fontSize={14}
        >
          {payload.name}
        </text>
        <text
          x={cx + (outerRadius + 10) * cos}
          y={cy + liftY + (outerRadius + 30) * sin}
          textAnchor={cos >= 0 ? "start" : "end"}
          fill="#cccccc"
          fontSize={13}
        >
          {`${(percent * 100).toFixed(0)}%`}
        </text>
      </g>
    );
  };


export default function SentimentPieChart({ newsData }: SentimentPieChartProps) {
  const [activeIndex, setActiveIndex] = useState<number | null>(null);
  const [liftAmount, setLiftAmount] = useState(0);

  const chartData = useMemo(() => {
    if (!newsData) return [];
    const counts: Record<'Positive' | 'Neutral' | 'Negative', number> = { Positive: 0, Neutral: 0, Negative: 0 };
    newsData.forEach(article => {
      if (counts[article.sentiment] !== undefined) {
        counts[article.sentiment]++;
      }
    });

    return [
      { name: 'Positive', value: counts.Positive, color: sentimentConfig.Positive.color },
      { name: 'Neutral', value: counts.Neutral, color: sentimentConfig.Neutral.color },
      { name: 'Negative', value: counts.Negative, color: sentimentConfig.Negative.color },
    ].filter(d => d.value > 0);
  }, [newsData]);

  const handleMouseEnter = (_: any, index: number) => {
    setActiveIndex(index);
    setLiftAmount(-10); // slice lifts up
  };

  const handleMouseLeave = () => {
    setActiveIndex(null);
    // Smoothly lower the slice
    setLiftAmount(0);
  };

  if (newsData.length === 0) {
    return null;
  }

  return (
    <Card className="bg-card border-border/50 overflow-hidden">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
            <PieChartIcon className="h-5 w-5 text-primary" />
            Sentiment Distribution
        </CardTitle>
        <CardDescription>Breakdown of news article sentiment.</CardDescription>
      </CardHeader>
      <CardContent>
          <div className="flex items-center justify-center rounded-2xl p-0">
            <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                <Pie
                    data={chartData}
                    dataKey="value"
                    cx="50%"
                    cy="50%"
                    innerRadius={80}
                    outerRadius={120}
                    paddingAngle={3}
                    activeIndex={activeIndex ?? undefined}
                    activeShape={(props) => renderActiveShape({ ...props, liftY: liftAmount })}
                    onMouseEnter={handleMouseEnter}
                    onMouseLeave={handleMouseLeave}
                    isAnimationActive={true}
                    animationDuration={600}
                >
                    {chartData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} stroke="none" />
                    ))}
                </Pie>
                </PieChart>
            </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
}
