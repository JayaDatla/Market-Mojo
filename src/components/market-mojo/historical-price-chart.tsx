'use client';

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { AreaChart } from 'lucide-react';

export default function HistoricalPriceChart() {

  return (
    <Card className="bg-card border-border/50">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
            <AreaChart className="h-5 w-5 text-primary" />
            30-Day Price History
        </CardTitle>
        <CardDescription>Historical stock performance over the last 30 days.</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="h-[250px] flex items-center justify-center bg-background/50 rounded-md">
            <div className="text-center text-muted-foreground">
                <p>Historical chart data will be displayed here.</p>
            </div>
        </div>
      </CardContent>
    </Card>
  );
}
