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
    const {
      cx,
      cy,
      innerRadius,
      outerRadius,
      startAngle,
      endAngle,
      fill,
      liftY = 0
    } = props;


    return (
      <g>
        {/* Glow filter */}
        <defs>
            <filter id="hover-glow" x="-50%" y="-50%" width="200%" height="200%">
              <feDropShadow dx="0" dy="0" stdDeviation="8" floodColor={fill} floodOpacity="0.7" />
            </filter>
        </defs>

        {/* The lifted, glowing slice on hover */}
        <Sector
          cx={cx}
          cy={cy + liftY}
          innerRadius={innerRadius}
          outerRadius={outerRadius + 6} // Make it pop a bit more
          startAngle={startAngle}
          endAngle={endAngle}
          fill={fill}
          filter="url(#hover-glow)"
          style={{ transition: 'cy 0.3s ease-out' }}
        />
        
        {/* The static base of the donut chart */}
         <Sector
          cx={cx}
          cy={cy}
          innerRadius={innerRadius}
          outerRadius={outerRadius}
          startAngle={startAngle}
          endAngle={endAngle}
          fill={fill}
          opacity={0.3}
        />
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
    setLiftAmount(-10); // Negative value lifts the slice "up"
  };

  const handleMouseLeave = () => {
    setActiveIndex(null);
    setLiftAmount(0); // Return to original position
  };

  if (newsData.length === 0) {
    return null;
  }
  
  const activeData = activeIndex !== null ? chartData[activeIndex] : null;
  const totalValue = useMemo(() => chartData.reduce((sum, entry) => sum + entry.value, 0), [chartData]);


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
          <div className="relative flex items-center justify-center rounded-2xl p-0">
            <ResponsiveContainer width="100%" height={250}>
                <PieChart>
                <Pie
                    data={chartData}
                    dataKey="value"
                    cx="50%"
                    cy="50%"
                    innerRadius={70}
                    outerRadius={100}
                    paddingAngle={3}
                    activeIndex={activeIndex ?? undefined}
                    activeShape={(props) => renderActiveShape({ ...props, liftY: activeIndex === props.index ? liftAmount : 0 })}
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
             {/* Center Label */}
            <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                {activeData ? (
                    <>
                        <span className="text-2xl font-bold text-foreground transition-opacity duration-300">
                           {((activeData.value / totalValue) * 100).toFixed(0)}%
                        </span>
                        <span className="text-sm text-muted-foreground transition-opacity duration-300" style={{color: activeData.color}}>
                            {activeData.name}
                        </span>
                    </>
                ) : (
                    <>
                        <span className="text-2xl font-bold text-foreground">{totalValue}</span>
                        <span className="text-sm text-muted-foreground">Total Articles</span>
                    </>
                )}
            </div>
        </div>
      </CardContent>
    </Card>
  );
}
