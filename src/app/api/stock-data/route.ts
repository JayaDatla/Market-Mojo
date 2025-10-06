'use server';

import { NextResponse } from 'next/server';
import * as cheerio from "cheerio";
import dayjs from "dayjs";

const HEADERS = { "User-Agent": "Mozilla/5.0" };

async function isDirectTicker(symbol: string): Promise<boolean> {
  try {
    const url = `https://finance.yahoo.com/quote/${symbol}`;
    const res = await fetch(url, { headers: HEADERS });
    const text = await res.text();
    return res.ok && !text.includes("Quote Lookup");
  } catch {
    return false;
  }
}

async function findTicker(query: string): Promise<{ symbol: string; name: string; exchange: string }> {
  const encoded = encodeURIComponent(query);
  const searchUrl = `https://finance.yahoo.com/lookup?s=${encoded}`;
  const res = await fetch(searchUrl, { headers: HEADERS });
  const text = await res.text();
  const $ = cheerio.load(text);

  const rows = $("table tbody tr");
  if (rows.length === 0) throw new Error(`No results found for '${query}'`);

  const tickerData: { symbol: string; name: string; exchange: string }[] = [];
  rows.each((_, row) => {
    const cols = $(row).find("td").map((_, td) => $(td).text().trim()).get();
    if (cols.length >= 3) {
      tickerData.push({ symbol: cols[0], name: cols[1], exchange: cols[2] });
    }
  });

  const preferred = ["NASDAQ", "NYSE", "LSE", "TSE", "NSE", "BSE"];
  for (const pref of preferred) {
    const match = tickerData.find((t) => t.exchange.includes(pref));
    if (match) return match;
  }
  return tickerData[0];
}

async function getCurrency(ticker: string): Promise<string> {
  try {
    const url = `https://finance.yahoo.com/quote/${ticker}`;
    const res = await fetch(url, { headers: HEADERS });
    const text = await res.text();
    const match = text.match(/Currency in (\w+)/);
    return match ? match[1] : "USD";
  } catch (error) {
    console.warn(`Could not fetch currency for ${ticker}, defaulting to USD.`, error);
    return "USD";
  }
}

async function fetchLast30Days(ticker: string): Promise<any[]> {
  const end = dayjs().unix();
  const start = dayjs().subtract(30, "day").unix();

  const url = `https://finance.yahoo.com/quote/${ticker}/history?period1=${start}&period2=${end}`;
  const res = await fetch(url, { headers: HEADERS });
  const text = await res.text();
  const $ = cheerio.load(text);

  const rows = $("table tbody tr");
  const data: any[] = [];

  rows.each((_, row) => {
    const cols = $(row).find("td").map((_, td) => $(td).text().trim()).get();
    if (cols.length === 7 && !cols[1].includes("Dividend")) {
      const date = dayjs(cols[0], "MMM DD, YYYY").format("YYYY-MM-DD");
      const price = parseFloat(cols[4].replace(/,/g, ''));
      if (date && !isNaN(price)) {
         data.push({ date, price });
      }
    }
  });

  if (data.length === 0) {
      // This is important. If the table is empty or not found, we throw.
      throw new Error(`No historical data found for ${ticker}`);
  }
  
  return data.reverse(); // reverse to have dates in ascending order
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const query = searchParams.get('query');

  if (!query) {
    return NextResponse.json({ error: 'Query parameter is required' }, { status: 400 });
  }

  try {
    let symbol = "";

    if (await isDirectTicker(query)) {
      symbol = query.toUpperCase();
    } else {
      const info = await findTicker(query);
      symbol = info.symbol;
    }

    const [currency, historicalData] = await Promise.all([
      getCurrency(symbol),
      fetchLast30Days(symbol)
    ]);

    return NextResponse.json({ currency, historicalData, ticker: symbol });

  } catch (error: any) {
    console.error(`Error fetching stock data for ${query}:`, error.message);
    return NextResponse.json({ error: error.message || 'Failed to fetch stock data' }, { status: 500 });
  }
}
