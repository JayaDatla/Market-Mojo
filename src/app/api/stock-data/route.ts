
'use server';

import { NextResponse } from 'next/server';
import axios from 'axios';
import * as cheerio from 'cheerio';
import dayjs from 'dayjs';

const HEADERS = { 'User-Agent': 'Mozilla/5.0' };

// -------------------- Helper Functions --------------------

async function isDirectTicker(symbol: string): Promise<boolean> {
  try {
    const url = `https://finance.yahoo.com/quote/${symbol}`;
    const res = await axios.get(url, { headers: HEADERS });
    return res.status === 200 && !res.data.includes('Quote Lookup');
  } catch {
    return false;
  }
}

async function findTicker(query: string): Promise<{ symbol: string; name: string; exchange: string }> {
  const encoded = encodeURIComponent(query);
  const searchUrl = `https://finance.yahoo.com/lookup?s=${encoded}`;
  const res = await axios.get(searchUrl, { headers: HEADERS });
  const $ = cheerio.load(res.data);

  const rows = $('table tbody tr');
  if (rows.length === 0) {
    throw new Error(`No ticker found for '${query}'`);
  }

  const tickerData: { symbol: string; name: string; exchange: string }[] = [];
  rows.each((_, row) => {
    const cols = $(row).find('td').map((_, td) => $(td).text().trim()).get();
    if (cols.length >= 3) {
      tickerData.push({ symbol: cols[0], name: cols[1], exchange: cols[2] });
    }
  });

  // Auto-select preferred exchanges if multiple results
  const preferred = ['NASDAQ', 'NYSE', 'LSE', 'TSE', 'NSE', 'BSE'];
  for (const pref of preferred) {
    const match = tickerData.find(t => t.exchange.includes(pref));
    if (match) return match;
  }

  return tickerData[0];
}

async function getCurrency(ticker: string): Promise<string> {
  const url = `https://finance.yahoo.com/quote/${ticker}`;
  const res = await axios.get(url, { headers: HEADERS });
  const match = res.data.match(/Currency in (\w+)/);
  return match ? match[1] : 'Unknown';
}

async function fetchLast30Days(ticker: string): Promise<{ date: string; price: number }[]> {
  const end = dayjs().unix();
  const start = dayjs().subtract(30, 'day').unix();
  const url = `https://finance.yahoo.com/quote/${ticker}/history?period1=${start}&period2=${end}`;

  const res = await axios.get(url, { headers: HEADERS });
  const $ = cheerio.load(res.data);

  const rows = $('table tbody tr');
  const data: { date: string; price: number }[] = [];

  rows.each((_, row) => {
    const cols = $(row).find('td').map((_, td) => $(td).text().trim()).get();
    if (cols.length === 7 && !cols[1].includes('Dividend')) {
      const date = dayjs(cols[0]).format('YYYY-MM-DD');
      const closeStr = cols[4].replace(/,/g, '');
      const closeVal = parseFloat(closeStr);
      if (!isNaN(closeVal)) {
        data.push({ date, price: closeVal });
      }
    }
  });

  if (data.length === 0) {
    throw new Error(`No historical data found for '${ticker}'`);
  }

  // Sort oldest → newest
  data.sort((a, b) => (a.date > b.date ? 1 : -1));
  return data;
}

// -------------------- Main API Handler --------------------

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const query = searchParams.get('query');

  if (!query) {
    return NextResponse.json({ error: 'Query parameter is required' }, { status: 400 });
  }

  try {
    let symbol = '';
    let name = '';
    let exchange = '';

    // Step 1: detect if direct ticker
    if (await isDirectTicker(query)) {
      symbol = query.toUpperCase();
      name = query;
      exchange = 'Unknown';
    } else {
      const info = await findTicker(query);
      symbol = info.symbol;
      name = info.name;
      exchange = info.exchange;
    }

    // Step 2: get currency
    const currency = await getCurrency(symbol);

    // Step 3: fetch last 30 days of prices
    const historicalData = await fetchLast30Days(symbol);

    // Step 4: return JSON
    return NextResponse.json(
      {
        currency,
        historicalData,
        ticker: symbol
      },
      { status: 200 }
    );
  } catch (error: any) {
    console.error(`Error fetching stock data for ${query}:`, error.message);
    return NextResponse.json(
      { error: error.message || 'Failed to fetch stock data' },
      { status: 500 }
    );
  }
}
