
import {NextRequest, NextResponse} from 'next/server';
import fetch from 'node-fetch';

// This is a legacy GET handler that is no longer called by the main dashboard,
// but is kept for potential other uses or direct API access.
// The main dashboard now uses Server Actions for better performance.

// ------------------ Utility: Date Range ------------------

function getUnixTimestamps(daysAgo: number): {start: number; end: number} {
  const end = Math.floor(Date.now() / 1000);
  const start = end - daysAgo * 24 * 3600;
  return {start, end};
}

// ------------------ Step 1: Search Yahoo Finance ------------------

async function searchYahooFinance(query: string) {
  const url = `https://query1.finance.yahoo.com/v1/finance/search?q=${encodeURIComponent(
    query
  )}&quotesCount=1&newsCount=0`;

  const res = await fetch(url, {headers: {'User-Agent': 'Mozilla/5.0'}});

  if (!res.ok) throw new Error(`Search failed: ${res.statusText}`);

  const data: any = await res.json();

  if (!data.quotes || data.quotes.length === 0)
    throw new Error(`No ticker found for "${query}"`);

  const info = data.quotes[0];
  return {
    shortname: info.shortname || query,
    symbol: info.symbol,
    exchange: info.exchange,
    type: info.quoteType,
    country: info.exchangeDisp || 'Unknown',
  };
}

// ------------------ Step 2: Fetch Chart Data ------------------

async function fetchChartData(ticker: string, days = 30) {
  const {start, end} = getUnixTimestamps(days);
  const apiUrl = `https://query1.finance.chart.yahoo.com/v8/finance/chart/${encodeURIComponent(
    ticker
  )}?period1=${start}&period2=${end}&interval=1d`;

  const res = await fetch(apiUrl, {headers: {'User-Agent': 'Mozilla/5.0'}});
  if (!res.ok) throw new Error(`Chart fetch failed: ${res.statusText}`);

  const data: any = await res.json();

  if (!data.chart?.result?.length)
    throw new Error(`No chart data available for ${ticker}`);

  const result = data.chart.result[0];
  const timestamps = result.timestamp || [];
  const quotes = result.indicators.quote?.[0] || {};

  const historicalData = timestamps.map((ts: number, i: number) => ({
    date: new Date(ts * 1000).toISOString().split('T')[0],
    open: quotes.open?.[i] ?? null,
    high: quotes.high?.[i] ?? null,
    low: quotes.low?.[i] ?? null,
    close: quotes.close?.[i] ?? null,
    volume: quotes.volume?.[i] ?? null,
    currency: result.meta?.currency ?? 'USD',
  }));

  return historicalData.filter(d => d.open !== null);
}

// This GET handler remains available for other potential uses but is not called by the main dashboard.
export async function GET(request: NextRequest) {
  const {searchParams} = new URL(request.url);
  const ticker = searchParams.get('ticker'); // This is the user's input

  if (!ticker) {
    return NextResponse.json(
      {
        error: 'A company name or ticker is required.',
      },
      {status: 400}
    );
  }

  try {
    const searchResult = await searchYahooFinance(ticker);
    const history = await fetchChartData(searchResult.symbol, 30);
    const result = {
        company: searchResult.shortname,
        ticker: searchResult.symbol,
        exchange: searchResult.exchange,
        country: searchResult.country,
        data: history,
    };
    return NextResponse.json(result.data);
  } catch (error: any) {
    console.error(`Error in /api/stock-data for ticker "${ticker}":`, error.message);
    return NextResponse.json({error: error.message}, {status: 500});
  }
}
