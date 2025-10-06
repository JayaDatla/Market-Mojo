
'use client';

import { useMemo } from 'react';
import type { PriceData } from '@/types';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { AreaChart as AreaChartIcon, ArrowDown, ArrowUp, Minus } from 'lucide-react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { DropShadowFilter } from '@/components/ui/filters';

interface HistoricalPriceChartProps {
  priceData: PriceData[];
  currency?: string;
  sentimentScore: number;
}

const getTrend = (data: PriceData[]) => {
  if (data.length < 2) return 0;
  const endPrice = data[0].price; // Most recent
  const startPrice = data[data.length - 1].price; // Oldest
  return endPrice - startPrice;
};

const getPrediction = (trend: number, sentiment: number) => {
    if (trend > 0 && sentiment > 0.1) return { label: "Likely Up", Icon: ArrowUp, color: "text-green-500" };
    if (trend < 0 && sentiment < -0.1) return { label: "Likely Down", Icon: ArrowDown, color: "text-red-500" };
    return { label: "Neutral", Icon: Minus, color: "text-gray-500" };
};

export default function HistoricalPriceChart({ priceData, currency, sentimentScore }: HistoricalPriceChartProps) {
  const trend = useMemo(() => getTrend(priceData), [priceData]);
  const prediction = useMemo(() => getPrediction(trend, sentimentScore), [trend, sentimentScore]);

  const chartData = useMemo(() => {
    return priceData.map(d => ({ ...d, name: d.date })).reverse();
  }, [priceData]);

  const hasData = chartData.length > 0;

  return (
    <Card className="bg-card border-border/50">
      <CardHeader>
        <div className="flex justify-between items-start">
          <div>
            <CardTitle className="flex items-center gap-2">
                <AreaChartIcon className="h-5 w-5 text-primary" />
                30-Day Price History
            </CardTitle>
            <CardDescription>Historical stock performance and AI-driven trend analysis.</CardDescription>
          </div>
          {hasData && (
            <div className={`flex items-center gap-2 font-semibold ${prediction.color}`}>
              <prediction.Icon className="h-5 w-5" />
              <span>{prediction.label}</span>
            </div>
          )}
        </div>
      </CardHeader>
      <CardContent>
        {hasData ? (
            <div className="h-[250px]">
                <ResponsiveContainer width="100%" height="100%">
                    <AreaChart
                        data={chartData}
                        margin={{ top: 5, right: 20, left: -10, bottom: 0 }}
                    >
                        <defs>
                            <linearGradient id="priceGradient" x1="0" y1="0" x2="0" y2="1">
                                <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.3}/>
                                <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0}/>
                            </linearGradient>
                            <DropShadowFilter id="chart-shadow" />
                        </defs>
                        <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border) / 0.5)" />
                        <XAxis 
                            dataKey="date" 
                            stroke="hsl(var(--muted-foreground))"
                            fontSize={12}
                            tickLine={false}
                            axisLine={false}
                            tickFormatter={(str) => str.substring(5)} // Show MM-DD
                        />
                        <YAxis 
                            stroke="hsl(var(--muted-foreground))"
                            fontSize={12}
                            tickLine={false}
                            axisLine={false}
                            tickFormatter={(value) => `${currency || ''}${value.toFixed(0)}`}
                        />
                        <Tooltip
                            contentStyle={{
                                background: "hsl(var(--background))",
                                borderColor: "hsl(var(--border))",
                                borderRadius: "var(--radius)",
                                boxShadow: "0 4px 6px rgba(0,0,0,0.1)",
                            }}
                            labelStyle={{ color: "hsl(var(--foreground))" }}
                        />
                        <Area 
                            type="monotone" 
                            dataKey="price" 
                            stroke="hsl(var(--primary))" 
                            fill="url(#priceGradient)"
                            strokeWidth={2}
                            dot={false}
                            activeDot={{ r: 6, style: { fill: 'hsl(var(--background))', stroke: 'hsl(var(--primary))' } }}
                            filter="url(#chart-shadow)"
                        />
                    </AreaChart>
                </ResponsiveContainer>
            </div>
        ) : (
            <div className="h-[250px] flex items-center justify-center bg-background/50 rounded-md">
                <div className="text-center text-muted-foreground">
                    <p>No historical price data available for this ticker.</p>
                </div>
            </div>
        )}
      </CardContent>
    </Card>
  );
}
