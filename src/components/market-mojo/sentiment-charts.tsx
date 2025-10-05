'use client';

import { useMemo } from 'react';
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend } from 'recharts';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import type { NewsArticle } from '@/types';
import { Frown, Meh, Smile } from 'lucide-react';

interface SentimentChartsProps {
  newsData: NewsArticle[];
}

const COLORS = {
  Positive: 'hsl(var(--chart-2))',
  Neutral: 'hsl(var(--muted-foreground))',
  Negative: 'hsl(var(--destructive))',
};
const ICONS: Record<string, React.ElementType> = {
  Positive: Smile,
  Neutral: Meh,
  Negative: Frown,
}

export default function SentimentCharts({ newsData }: SentimentChartsProps) {
  const { lineData, pieData } = useMemo(() => {
    if (!newsData || newsData.length === 0) {
      return { lineData: [], pieData: [] };
    }

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

    return { lineData: processedLineData, pieData: processedPieData };
  }, [newsData]);

  return (
    <div className="grid grid-cols-1 md:grid-cols-5 gap-8">
      <Card className="md:col-span-3 bg-card border-border/50">
        <CardHeader>
          <CardTitle>Daily Aggregate Sentiment</CardTitle>
          <CardDescription>Average sentiment score over time.</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={lineData} margin={{ top: 5, right: 20, left: -10, bottom: 5 }}>
                <XAxis dataKey="date" stroke="hsl(var(--muted-foreground))" fontSize={12} />
                <YAxis domain={[-1, 1]} stroke="hsl(var(--muted-foreground))" fontSize={12} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: 'hsl(var(--background))',
                    borderColor: 'hsl(var(--border))',
                  }}
                  labelStyle={{ color: 'hsl(var(--foreground))' }}
                />
                <Line
                  type="monotone"
                  dataKey="averageScore"
                  stroke="hsl(var(--primary))"
                  strokeWidth={2}
                  dot={{ r: 4, fill: 'hsl(var(--primary))' }}
                  activeDot={{ r: 8 }}
                  name="Avg. Sentiment"
                />
              </LineChart>
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
                <Pie data={pieData} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={80} label>
                  {pieData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.fill} />
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
