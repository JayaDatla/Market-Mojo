
'use server';

import { NextResponse } from 'next/server';
import axios from 'axios';
import * as cheerio from 'cheerio';
import dayjs from 'dayjs';

// Browser-like headers to avoid 403 and overflow issues
const axiosOptions = {
  headers: {
    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)',
    'Accept-Language': 'en-US,en;q=0.9',
    'Accept-Encoding': 'gzip, deflate, br',
    'Connection': 'keep-alive',
    'Cache-Control': 'no-cache',
  },
  decompress: true,
  maxRedirects: 0,
  validateStatus: (status: number) => status < 400,
};

async function resolveTicker(query: string): Promise<string> {
  const directTickerRegex = /^[A-Z]{1,5}(\.[A-Z]{2})?$/;
  if (directTickerRegex.test(query)) {
    return query;
  }

  // 1️⃣ Try direct ticker first
  try {
    const url = `https://finance.yahoo.com/quote/${query}`;
    const res = await axios.get(url, axiosOptions);
    if (res.status === 200 && res.data.includes('Currency in')) {
      return query;
    }
  } catch {
    // Continue to next method
  }

  // 2️⃣ Lookup by name
  try {
    const lookupUrl = `https://finance.yahoo.com/lookup?s=${encodeURIComponent(query)}`;
    const res = await axios.get(lookupUrl, axiosOptions);
    const $ = cheerio.load(res.data);
    const ticker = $('table tbody tr td:first-child a').first().text().trim();
    if (ticker) return ticker;
  } catch {
    // Continue to fallback
  }

  // 3️⃣ Try fallback suffixes (regional)
  const suffixes = ['.NS', '.BO', '.L', '.DE', '.SW', '.T', '.KS', '.TO', '.AX'];
  const baseTicker = query.split(' ')[0]; // Use only the first word for suffix appending
  for (const sfx of suffixes) {
    try {
      const t = `${baseTicker}${sfx}`;
      const url = `https://finance.yahoo.com/quote/${t}`;
      const res = await axios.get(url, axiosOptions);
      if (res.status === 200 && res.data.includes('Currency in')) {
        return t;
      }
    } catch {}
  }

  throw new Error(`Could not resolve ticker for '${query}'`);
}

async function fetchHistoricalData(ticker: string) {
  const url = `https://finance.yahoo.com/quote/${ticker}/history?p=${ticker}`;
  const res = await axios.get(url, axiosOptions);
  const html = res.data;
  const $ = cheerio.load(html);

  // Try to get currency
  const currencyMatch = $("span:contains('Currency in')").text().match(/Currency in (\w+)/);
  const currency = currencyMatch ? currencyMatch[1] : 'Unknown';

  // First try: table selector
  const rows = $('table[data-test="historical-prices"] tbody tr');
  const data: { date: string; price: number }[] = [];

  rows.each((i, el) => {
    const cols = $(el).find('td');
    const dateText = $(cols[0]).text().trim();
    const closeText = $(cols[4]).text().trim().replace(/,/g, '');
    if (dateText && closeText) {
      const date = dayjs(dateText, ["MMM D, YYYY", "D MMM YYYY", "YYYY-MM-DD"]).format('YYYY-MM-DD');
      const price = parseFloat(closeText);
      if (!isNaN(price)) {
        data.push({ date, price });
      }
    }
  });

  if (data.length === 0) {
    // Debug: log snippet
    console.warn(`⚠️ No table rows found for ${ticker}. HTML snippet:`);
    console.warn(html.slice(0, 5000));  // log first 5000 chars for inspection

    // Fallback: try parsing embedded JSON in script tags
    // Yahoo often has a script tag with root.App.main or something similar containing historical data in JSON
    const scripts = $('script').toArray();
    for (const script of scripts) {
      const scriptText = $(script).html();
      if (!scriptText) continue;
      // Look for “HistoricalPriceStore” or similar JSON key
      const m = scriptText.match(/"HistoricalPriceStore":\s*({[^}]*})/);
      if (m) {
        try {
          const obj = JSON.parse(m[1]);
          if (obj.prices && Array.isArray(obj.prices)) {
            for (const p of obj.prices) {
              if (p && p.date && p.close) {
                const date = dayjs.unix(p.date).format('YYYY-MM-DD');
                const price = p.close;
                if (!isNaN(price)) {
                  data.push({ date, price });
                }
              }
            }
            break;
          }
        } catch (e) {
          console.error('⚠️ JSON parse fallback failed', e);
        }
      }
    }
  }

  if (data.length === <strong>0</strong>) {
    throw new Error(`No historical data found for '${ticker}'`);
  }

  // Sort oldest first and only last 30
  data.sort((a, b) => (a.date > b.date ? 1 : -1));
  const last30 = data.slice(-30);

  return { currency, historicalData: last30 };
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const query = searchParams.get('query');

  if (!query) {
    return NextResponse.json({ error: 'Query parameter is required' }, { status: 400 });
  }

  try {
    const ticker = await resolveTicker(query);
    const { currency, historicalData } = await fetchHistoricalData(ticker);

    return NextResponse.json({
      currency,
      historicalData,
      ticker,
    });
  } catch (error: any) {
    console.error(`❌ Error fetching stock data for ${query}:`, error.message);
    return NextResponse.json({ error: error.message || 'Failed to fetch stock data' }, { status: 500 });
  }
}
