
'use client';

import { useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { AreaChart, LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, ReferenceLine } from 'recharts';
import type { PriceData } from '@/types';
import { TrendingDown, TrendingUp, Minus } from 'lucide-react';
import { DropShadowFilter } from '@/components/ui/filters';

interface HistoricalPriceChartProps {
    priceData: PriceData[];
    sentimentScore: number;
    currency?: string;
}

// Linear regression to find the trend
const calculateTrend = (data: {x: number; y: number}[]) => {
    const n = data.length;
    if (n < 2) return { slope: 0, intercept: 0 };
    const sumX = data.reduce((acc, p) => acc + p.x, 0);
    const sumY = data.reduce((acc, p) => acc + p.y, 0);
    const sumXY = data.reduce((acc, p) => acc + p.x * p.y, 0);
    const sumXX = data.reduce((acc, p) => acc + p.x * p.x, 0);
    
    const slope = (n * sumXY - sumX * sumY) / (n * sumXX - sumX * sumX);
    const intercept = (sumY - slope * sumX) / n;
    
    return { slope, intercept };
};

export default function HistoricalPriceChart({ priceData, sentimentScore, currency = 'USD' }: HistoricalPriceChartProps) {

    const { chartData, prediction, trendColor, TrendIcon } = useMemo(() => {
        if (!priceData || priceData.length === 0) {
            return { chartData: [], prediction: null, trendColor: 'text-gray-500', TrendIcon: Minus };
        }

        const formattedData = priceData.map((d, i) => ({
            name: d.date.substring(5), // "MM-DD"
            price: d.close,
            day: i
        }));

        const trendData = formattedData.map(d => ({ x: d.day, y: d.price }));
        const trend = calculateTrend(trendData);
        
        const fullChartData = formattedData.map(d => ({
            ...d,
            trend: trend.intercept + trend.slope * d.day
        }));

        let pred: 'Up' | 'Down' | 'Neutral' = 'Neutral';
        let color = 'text-gray-500';
        let icon = Minus;

        if (trend.slope > 0 && sentimentScore > 0.1) {
            pred = 'Up';
            color = 'text-green-500';
            icon = TrendingUp;
        } else if (trend.slope < 0 && sentimentScore < -0.1) {
            pred = 'Down';
            color = 'text-red-500';
            icon = TrendingDown;
        }

        return { chartData: fullChartData, prediction: pred, trendColor: color, TrendIcon: icon };

    }, [priceData, sentimentScore]);

    if (!priceData || priceData.length === 0) {
        return (
            <Card className="bg-card border-border/50">
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <AreaChart className="h-5 w-5 text-primary" />
                        30-Day Price History
                    </CardTitle>
                    <CardDescription>Historical stock performance and AI-driven trend analysis.</CardDescription>
                </CardHeader>
                <CardContent>
                    <div className="h-[250px] flex items-center justify-center bg-background/50 rounded-md">
                        <div className="text-center text-muted-foreground">
                            <p>No historical price data available for this ticker.</p>
                            <p className="text-xs">The scraper might be blocked or the ticker may not be on Yahoo Finance.</p>
                        </div>
                    </div>
                </CardContent>
            </Card>
        );
    }
    
    return (
        <Card className="bg-card border-border/50">
            <CardHeader className="flex flex-row justify-between items-start">
                <div>
                    <CardTitle className="flex items-center gap-2">
                        <AreaChart className="h-5 w-5 text-primary" />
                        30-Day Price History
                    </CardTitle>
                    <CardDescription>Historical stock performance and AI-driven trend analysis.</CardDescription>
                </div>
                {prediction && (
                    <div className={`flex items-center gap-2 text-sm font-semibold ${trendColor}`}>
                        <TrendIcon className="h-5 w-5" />
                        <span>Prediction: {prediction}</span>
                    </div>
                )}
            </CardHeader>
            <CardContent>
                <div className="h-[250px] w-full">
                    <ResponsiveContainer width="100%" height="100%">
                        <LineChart data={chartData} margin={{ top: 5, right: 20, left: -10, bottom: 5 }}>
                             <defs>
                                <DropShadowFilter id="chart-shadow" />
                            </defs>
                            <XAxis dataKey="name" stroke="hsl(var(--muted-foreground))" fontSize={12} tickLine={false} axisLine={false} />
                            <YAxis stroke="hsl(var(--muted-foreground))" fontSize={12} tickLine={false} axisLine={false} tickFormatter={(value) => `${currency} ${value}`} />
                            <Tooltip
                                contentStyle={{
                                    background: "hsl(var(--background))",
                                    borderColor: "hsl(var(--border))",
                                    borderRadius: "var(--radius)",
                                    boxShadow: "0 4px 12px hsla(0, 0%, 0%, 0.1)"
                                }}
                                cursor={{ stroke: 'hsl(var(--primary))', strokeWidth: 1, strokeDasharray: '3 3' }}
                            />
                            <Line
                                type="monotone"
                                dataKey="price"
                                stroke="hsl(var(--primary))"
                                strokeWidth={2}
                                dot={false}
                                filter="url(#chart-shadow)"
                            />
                            <Line
                                type="monotone"
                                dataKey="trend"
                                stroke={trendColor.includes('green') ? 'hsl(142.1 76.2% 36.3%)' : trendColor.includes('red') ? 'hsl(0 72.2% 50.6%)' : 'hsl(221.2 83.2% 53.3%)'}
                                strokeWidth={2}
                                strokeDasharray="5 5"
                                dot={false}
                                name="Trend"
                            />
                        </LineChart>
                    </ResponsiveContainer>
                </div>
            </CardContent>
        </Card>
    );
}
