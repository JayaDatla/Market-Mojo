
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
  Positive: { color1: '#00ffcc', color2: '#0077ff' },
  Neutral: { color1: '#ffcc00', color2: '#ff8800' },
  Negative: { color1: '#ff3366', color2: '#cc00ff' },
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
  const textX = cx + (outerRadius + 20) * cos;
  const textY = cy + (outerRadius + 5) * sin;

  return (
    <g style={{ filter: 'drop-shadow(0 0 6px rgba(128, 128, 255, 0.7))' }}>
        {/* Glowing drop shadow using an SVG filter */}
        <defs>
            <filter id="shadow-glow" x="-50%" y="-50%" width="200%" height="200%">
                <feDropShadow dx="0" dy="0" stdDeviation="6" floodColor={fill} floodOpacity="0.8" />
            </filter>
        </defs>

      {/* Base slice */}
      <Sector
        cx={cx}
        cy={cy}
        innerRadius={innerRadius}
        outerRadius={outerRadius}
        startAngle={startAngle}
        endAngle={endAngle}
        fill={fill}
      />
      {/* Highlighted slice */}
      <Sector
        cx={cx}
        cy={cy}
        innerRadius={innerRadius - 2}
        outerRadius={outerRadius + 6}
        startAngle={startAngle}
        endAngle={endAngle}
        fill={fill}
        filter="url(#shadow-glow)"
      />
      {/* Label */}
      <text
        x={textX}
        y={textY}
        textAnchor={cos >= 0 ? "start" : "end"}
        fill="#ffffff"
        fontWeight={700}
        fontSize={14}
      >
        {payload.name}
      </text>
      <text
        x={textX}
        y={textY + 18}
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
  const [activeIndex, setActiveIndex] = useState(0);

  const onPieEnter = (_: any, index: number) => {
    setActiveIndex(index);
  };

  const { chartData, totalValue } = useMemo(() => {
    if (!newsData) return { chartData: [], totalValue: 0 };
    const counts: Record<'Positive' | 'Neutral' | 'Negative', number> = { Positive: 0, Neutral: 0, Negative: 0 };
    newsData.forEach(article => {
      if (counts[article.sentiment] !== undefined) {
        counts[article.sentiment]++;
      }
    });

    const data = [
      { name: 'Positive', value: counts.Positive, ...sentimentConfig.Positive },
      { name: 'Neutral', value: counts.Neutral, ...sentimentConfig.Neutral },
      { name: 'Negative', value: counts.Negative, ...sentimentConfig.Negative },
    ].filter(d => d.value > 0);
    
    const total = data.reduce((sum, item) => sum + item.value, 0);

    return { chartData: data, totalValue: total };
  }, [newsData]);

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
      <CardContent className="p-0 sm:p-0 md:p-0 lg:p-0">
          <div className="flex flex-col md:flex-row items-center justify-center gap-4 p-4">
              {/* Pie chart */}
              <div className="w-full md:w-2/3 h-[250px]">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <defs>
                      {chartData.map((entry, index) => (
                        <linearGradient
                          key={`grad-${index}`}
                          id={`grad-${index}`}
                          x1="0%" y1="0%" x2="100%" y2="100%"
                        >
                          <stop offset="0%" stopColor={entry.color1} />
                          <stop offset="100%" stopColor={entry.color2} />
                        </linearGradient>
                      ))}
                    </defs>
                    <Pie
                        data={chartData}
                        dataKey="value"
                        cx="50%"
                        cy="50%"
                        innerRadius={60}
                        outerRadius={90}
                        paddingAngle={3}
                        activeIndex={activeIndex}
                        activeShape={renderActiveShape}
                        onMouseEnter={onPieEnter}
                        isAnimationActive={true}
                    >
                      {chartData.map((entry, index) => (
                        <Cell
                          key={`cell-${index}`}
                          fill={`url(#grad-${index})`}
                          stroke="none"
                        />
                      ))}
                    </Pie>
                  </PieChart>
                </ResponsiveContainer>
              </div>

              {/* Legend */}
              <div className="flex flex-col items-start justify-center space-y-3 w-full md:w-1/3">
                {chartData.map((item, index) => {
                  const percentage = totalValue > 0 ? ((item.value / totalValue) * 100).toFixed(0) : 0;
                  return (
                    <div key={index} className="flex items-center space-x-3 text-sm">
                      <div
                        className="w-3 h-3 rounded-full"
                        style={{
                          background: `linear-gradient(135deg, ${item.color1}, ${item.color2})`,
                        }}
                      ></div>
                      <span className="font-semibold text-foreground">{item.name}</span>
                      <span className="text-muted-foreground font-mono">{percentage}%</span>
                    </div>
                  );
                })}
              </div>
          </div>
      </CardContent>
    </Card>
  );
}
