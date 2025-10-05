'use client';

import { useMemo } from 'react';
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend, AreaChart, Area, Defs, linearGradient, Stop } from 'recharts';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import type { NewsArticle } from '@/types';
import { Frown, Meh, Smile } from 'lucide-react';

interface SentimentChartsProps {
  newsData: NewsArticle[];
}

const COLORS = {
  Positive: '#22c55e', // green-500
  Neutral: '#3b82f6', // blue-500
  Negative: '#ef4444', // red-500
};
const ICONS: Record<string, React.ElementType> = {
  Positive: Smile,
  Neutral: Meh,
  Negative: Frown,
}

export default function SentimentCharts({ newsData }: SentimentChartsProps) {
  const { lineData, pieData, averageScore } = useMemo(() => {
    if (!newsData || newsData.length === 0) {
      return { lineData: [], pieData: [], averageScore: 0 };
    }

    const totalScore = newsData.reduce((acc, article) => acc + article.sentimentScore, 0);
    const avg = totalScore / newsData.length;


    const dailyScores: { [key: string]: { scores: number[]; count: number } } = {};
    newsData.forEach(article => {
      if (article.timestamp) {
        const date = article.timestamp.toDate().toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
        if (!dailyScores[date]) {
          dailyScores[date] = { scores: [], count: 0 };
        }
        dailyScores[date].scores.push(article.sentimentScore);
        dailyScores[date].count++;
      }
    });

    const processedLineData = Object.entries(dailyScores)
      .map(([date, data]) => ({
        date,
        averageScore: data.scores.reduce((a, b) => a + b, 0) / data.count,
      }))
      .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

    const sentimentCounts = newsData.reduce((acc, article) => {
      acc[article.sentimentLabel] = (acc[article.sentimentLabel] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    const processedPieData = Object.entries(sentimentCounts).map(([name, value]) => ({
      name,
      value,
      fill: COLORS[name as keyof typeof COLORS],
      icon: ICONS[name as keyof typeof ICONS],
    }));

    return { lineData: processedLineData, pieData: processedPieData, averageScore: avg };
  }, [newsData]);
  
  const getGradientColor = (score: number) => {
    if (score > 0) return 'text-green-400';
    if (score < 0) return 'text-red-400';
    return 'text-gray-400';
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-5 gap-8">
      <Card className="md:col-span-3 bg-card border-border/50">
        <CardHeader>
          <div className='flex justify-between items-center'>
            <div>
              <CardTitle>Daily Aggregate Sentiment</CardTitle>
              <CardDescription>Average sentiment score over time.</CardDescription>
            </div>
            <div className='text-right'>
              <div className={`text-3xl font-bold ${getGradientColor(averageScore)}`}>
                  {averageScore.toFixed(2)}
              </div>
              <div className='text-xs text-muted-foreground'>Overall Score</div>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={lineData} margin={{ top: 5, right: 20, left: -10, bottom: 5 }}>
                 <defs>
                  <linearGradient id="colorScore" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.4}/>
                    <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <XAxis dataKey="date" stroke="hsl(var(--muted-foreground))" fontSize={12} />
                <YAxis domain={[-1, 1]} stroke="hsl(var(--muted-foreground))" fontSize={12} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: 'hsl(var(--background))',
                    borderColor: 'hsl(var(--border))',
                  }}
                  labelStyle={{ color: 'hsl(var(--foreground))' }}
                />
                <Area
                  type="monotone"
                  dataKey="averageScore"
                  stroke="hsl(var(--primary))"
                  strokeWidth={2}
                  fill="url(#colorScore)"
                  dot={{ r: 4, fill: 'hsl(var(--primary))' }}
                  activeDot={{ r: 8, style: { stroke: 'hsl(var(--background))', strokeWidth: 2 } }}
                  name="Avg. Sentiment"
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>
      <Card className="md:col-span-2 bg-card border-border/50">
        <CardHeader>
          <CardTitle>Sentiment Distribution</CardTitle>
          <CardDescription>Breakdown of news sentiment.</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={pieData} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={80} labelLine={false}
                   label={({ cx, cy, midAngle, innerRadius, outerRadius, percent }) => {
                    const radius = innerRadius + (outerRadius - innerRadius) * 0.5;
                    const x = cx + radius * Math.cos(-midAngle * (Math.PI / 180));
                    const y = cy + radius * Math.sin(-midAngle * (Math.PI / 180));
                    return (
                      <text x={x} y={y} fill="white" textAnchor="middle" dominantBaseline="central" fontSize={14}>
                        {`${(percent * 100).toFixed(0)}%`}
                      </text>
                    );
                  }}
                >
                  {pieData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.fill} stroke={entry.fill} />
                  ))}
                </Pie>
                <Tooltip
                  contentStyle={{
                    backgroundColor: 'hsl(var(--background))',
                    borderColor: 'hsl(var(--border))',
                  }}
                />
                <Legend iconType='circle'
                  formatter={(value, entry) => {
                      const { color } = entry;
                      return <span style={{ color }}>{value}</span>;
                  }}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
