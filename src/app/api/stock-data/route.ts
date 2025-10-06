
import { NextRequest, NextResponse } from 'next/server';
import axios from 'axios';
import * as cheerio from 'cheerio';
import dayjs from 'dayjs';
import type { PriceData } from '@/types';

// Mock user agent to avoid bot detection
const headers = {
  'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/96.0.4664.110 Safari/537.36',
};

// Main function to handle GET requests
export async function GET(req: NextRequest) {
  const searchParams = req.nextUrl.searchParams;
  const ticker = searchParams.get('ticker');

  if (!ticker) {
    return NextResponse.json({ error: 'Ticker symbol is required' }, { status: 400 });
  }

  try {
    const data = await getGoogleFinanceData(ticker);
    return NextResponse.json(data);
  } catch (error: any) {
    console.error(`Error fetching data for ${ticker}:`, error.message);
    return NextResponse.json({ error: `Could not fetch or parse historical data for ${ticker}. The scraper may be blocked or the page structure might have changed.` }, { status: 500 });
  }
}

/**
 * Scrapes Google Finance for historical stock data.
 * NOTE: This is highly unstable and can break at any time.
 */
async function getGoogleFinanceData(ticker: string): Promise<PriceData[]> {
  // Google Finance URLs can vary. This is a common pattern.
  const url = `https://www.google.com/finance/quote/${ticker}:NASDAQ`;
  
  const { data: html } = await axios.get(url, { headers });
  const $ = cheerio.load(html);

  // Find the script tag containing the data. This is the most brittle part.
  // The selector may need frequent updates.
  const scriptSelector = 'script[nonce]';
  let rawData: string | null = null;
  
  $(scriptSelector).each(function () {
      const scriptContent = $(this).html();
      // Look for a string that indicates the presence of charting data
      if (scriptContent && scriptContent.includes('[[["fs-q"]')) {
          rawData = scriptContent;
          return false; // exit loop
      }
  });

  if (!rawData) {
    throw new Error('Could not find the data script on the page. The page structure has likely changed.');
  }

  // The data is embedded in a complex array structure within the script.
  // We need to parse it carefully. This is a simplified and fragile approach.
  let data;
  try {
    // This attempts to find the relevant array within the script tag
    const match = rawData.match(/,(\[\[\["fs-q".*?\]\]\])/);
    if (match && match[1]) {
        // We use eval here for simplicity, but it's a security risk in a real app
        // if the source wasn't trusted. We trust Google Finance's output for this demo.
        const parsed = eval(match[1]);
        data = parsed[0][0][1];
    } else {
        throw new Error('Could not extract the main data array.');
    }
  } catch (e) {
    throw new Error('Failed to parse the data from the script.');
  }

  if (!Array.isArray(data)) {
    throw new Error('Parsed data is not in the expected array format.');
  }
  
  // The price data is typically in a nested array.
  // Each item is an array like [timestamp_in_days, ... , closing_price]
  const priceHistory = data[0];

  if (!Array.isArray(priceHistory)) {
    throw new Error('Price history array could not be found.');
  }

  // Find the first date to calculate subsequent dates
  const firstDateUnix = data[2] ? data[2][0] : null;
  if (!firstDateUnix) {
    throw new Error('Could not determine the starting date for the historical data.');
  }

  const startDate = dayjs.unix(firstDateUnix).startOf('day');

  const formattedData: PriceData[] = priceHistory.map((dayData: any[]) => {
    // The date is an offset in days from the start date.
    const dateOffset = dayData[0];
    // The closing price is usually at a specific index. This can change.
    const price = dayData[1][0];

    return {
      date: startDate.add(dateOffset, 'day').format('YYYY-MM-DD'),
      price: price,
    };
  }).slice(-30); // We only want the last 30 days

  if (formattedData.length === 0) {
    throw new Error(`No historical data found for '${ticker}'`);
  }

  return formattedData;
}
