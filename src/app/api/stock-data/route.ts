
import {NextRequest, NextResponse} from 'next/server';
import type {PriceData} from '@/types';

/**
 * Calculates the Unix timestamp for a date N days ago.
 * @param daysAgo - The number of days to go back.
 * @returns The Unix timestamp in seconds.
 */
function getUnixTimestampDaysAgo(daysAgo: number): number {
  const date = new Date();
  date.setDate(date.getDate() - daysAgo);
  // Unix timestamp is in seconds, so divide by 1000 and floor it.
  return Math.floor(date.getTime() / 1000);
}

/**
 * Fetches the historical stock data for the last 30 trading days from Yahoo Finance.
 *
 * NOTE: This relies on an unofficial, undocumented Yahoo Finance API endpoint (v8/finance/chart).
 * This endpoint is subject to change, may be rate-limited, and may return delayed data.
 *
 * @param ticker The official stock ticker symbol (e.g., "NVDA", "AAPL").
 * @returns A Promise that resolves to an array of PriceData objects.
 */
export async function fetchHistoricalData(
  ticker: string
): Promise<PriceData[]> {
  if (!ticker) {
    console.error('Ticker symbol is required.');
    return [];
  }

  // Calculate the time range: 30 days ago until now, using Unix timestamps in seconds.
  const period1 = getUnixTimestampDaysAgo(31); // Start slightly before 30 days ago to ensure 30 days of data
  const period2 = getUnixTimestampDaysAgo(0); // Today's date (end of day)

  // Construct the unofficial Yahoo Finance Chart API URL.
  // We request daily data ('1d') for the specified time range.
  const apiUrl = `https://query1.finance.yahoo.com/v8/finance/chart/${ticker}?period1=${period1}&period2=${period2}&interval=1d&events=history&includeAdjustedClose=true`;

  try {
    const response = await fetch(apiUrl);

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();

    // Check for API errors or empty results
    const result = data.chart?.result?.[0];
    if (!result || !result.indicators?.quote?.[0]?.close || !result.timestamp) {
      // If the ticker is invalid or no data is found, the result array might be null or empty.
      const error =
        data.chart?.error?.description ||
        `No historical data found for ${ticker}. (Check if ticker is valid)`;
      throw new Error(error);
    }

    const timestamps = result.timestamp;
    // We use the adjusted close prices for accuracy.
    const closes =
      result.indicators.adjclose?.[0]?.adjclose ||
      result.indicators.quote[0].close;

    // Map the timestamps and closing prices into the required format.
    const historicalData: PriceData[] = timestamps
      .map((ts: number, index: number) => {
        // The Yahoo API often returns null for close prices on non-trading days/holidays.
        const closePrice = closes[index];

        // Convert Unix timestamp (seconds) to ISO date string (YYYY-MM-DD).
        const dateString = new Date(ts * 1000).toISOString().split('T')[0];

        return {
          date: dateString,
          // Ensure the close price is a valid number, or filter it out if required.
          close: closePrice === null ? NaN : closePrice,
        };
      })
      .filter((item: PriceData) => !isNaN(item.close)); // Filter out entries where close price is null/NaN

    return historicalData;
  } catch (error: any) {
    console.error(`Failed to fetch data for ${ticker}:`, error);
    // Re-throw the error to be caught by the API route handler
    throw error;
  }
}

export async function GET(request: NextRequest) {
  const {searchParams} = new URL(request.url);
  const ticker = searchParams.get('ticker');

  if (!ticker) {
    return NextResponse.json(
      {error: 'Ticker symbol is required'},
      {status: 400}
    );
  }

  try {
    const history = await fetchHistoricalData(ticker);
    return NextResponse.json(history);
  } catch (error: any) {
    return NextResponse.json({error: error.message}, {status: 500});
  }
}
