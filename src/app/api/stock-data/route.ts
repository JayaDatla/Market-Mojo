
'use server';

import { NextResponse } from 'next/server';
import axios from 'axios';
import * as cheerio from 'cheerio';
import dayjs from 'dayjs';

const axiosOptions = {
  headers: {
    "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64)",
    "Accept-Language": "en-US,en;q=0.9",
    "Accept-Encoding": "gzip, deflate, br",
    "Connection": "keep-alive",
  },
  maxRedirects: 0,
  decompress: true,
  validateStatus: (status: number) => status < 400,
};

async function getStockData(query: string): Promise<{ ticker: string; currency: string; data: { date: string; price: number }[] }> {
  const ticker = await resolveTicker(query);
  const historyUrl = `https://finance.yahoo.com/quote/${ticker}/history?p=${ticker}`;
  
  try {
    const res = await axios.get(historyUrl, axiosOptions);
    const $ = cheerio.load(res.data);

    const currencyMatch = $("span:contains('Currency in')").text().match(/Currency in (\w+)/);
    const currency = currencyMatch ? currencyMatch[1] : "Unknown";

    const rows = $('table[data-test="historical-prices"] tbody tr');
    const data: { date: string; price: number }[] = [];

    rows.each((i, el) => {
      const cols = $(el).find("td");
      const dateStr = $(cols[0]).text();
      // Ensure date is valid before parsing
      if (dayjs(dateStr, 'MMM DD, YYYY').isValid()) {
          const date = dayjs(dateStr, 'MMM DD, YYYY').format('YYYY-MM-DD');
          const close = parseFloat($(cols[4]).text().replace(/,/g, ""));
          if (date && !isNaN(close)) {
            data.push({ date, price: close });
          }
      }
    });

    if (data.length === 0) {
      throw new Error(`No historical data found for '${ticker}'`);
    }

    // Sort oldest to newest
    const sortedData = data.sort((a, b) => (a.date > b.date ? 1 : -1));

    return { ticker, currency, data: sortedData.slice(0, 30) };

  } catch (err: any) {
    if (err.message.includes("overflow") || (err.response && err.response.status === 302)) {
      console.warn("⚠️ Header overflow or redirect detected, retrying with fallback tickers...");
      const fallbackResult = await tryRegionalFallbacks(query);
      // If fallback works, it will recursively call getStockData, which returns full data.
      // This part might need adjustment based on what tryRegionalFallbacks returns.
      // Assuming tryRegionalFallbacks finds a working ticker and calls getStockData with it.
      return fallbackResult;
    }
    throw err;
  }
}

async function resolveTicker(query: string): Promise<string> {
  // First check if direct ticker page exists by trying to fetch its history
  try {
    const res = await axios.get(`https://finance.yahoo.com/quote/${query}/history`, axiosOptions);
    if (res.status === 200) return query;
  } catch {}

  // Otherwise, search by name
  const searchUrl = `https://finance.yahoo.com/lookup?s=${encodeURIComponent(query)}`;
  const res = await axios.get(searchUrl, axiosOptions);
  const $ = cheerio.load(res.data);
  
  // Find the first ticker link in the results table
  const preferred = ['NASDAQ', 'NYSE', 'LSE', 'TSE', 'NSE', 'BSE'];
  let foundTicker = '';

  const rows = $('table tbody tr');
  const tickerData: { symbol: string; exchange: string }[] = [];
  rows.each((_, row) => {
    const cols = $(row).find('td');
    const symbol = $(cols[0]).find('a').text().trim();
    const exchange = $(cols[2]).text().trim();
    if(symbol) tickerData.push({ symbol, exchange });
  });

  for (const pref of preferred) {
    const match = tickerData.find(t => t.exchange.includes(pref));
    if (match) {
        foundTicker = match.symbol;
        break;
    }
  }

  if (!foundTicker && tickerData.length > 0) {
    foundTicker = tickerData[0].symbol;
  }
  
  return foundTicker || query;
}

async function tryRegionalFallbacks(base: string): Promise<{ ticker: string; currency: string; data: { date: string; price: number }[] }> {
  const suffixes = [".NS", ".BO", ".L", ".DE", ".SW", ".T", ".KS", ".TO", ".AX"];
  for (const suffix of suffixes) {
    try {
      const ticker = (base.endsWith(suffix) ? base : base + suffix).replace(suffix+suffix, suffix);
      console.log(`Trying fallback: ${ticker}`);
      // Once a potential ticker is found, call getStockData with it to perform the full fetch
      return await getStockData(ticker); 
    } catch (e) {
        // If this ticker fails, continue to the next one
        console.log(`Fallback ${ticker} failed. Continuing...`);
    }
  }
  throw new Error(`❌ Could not fetch data for ${base} or any fallback tickers`);
}


// -------------------- Main API Handler --------------------

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const query = searchParams.get('query');

  if (!query) {
    return NextResponse.json({ error: 'Query parameter is required' }, { status: 400 });
  }

  try {
    const result = await getStockData(query);

    return NextResponse.json(
      {
        currency: result.currency,
        historicalData: result.data,
        ticker: result.ticker
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
