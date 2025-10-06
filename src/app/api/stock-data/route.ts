
import {NextRequest, NextResponse} from 'next/server';
import axios from 'axios';
import * as cheerio from 'cheerio';
import {PriceData} from '@/types';
import dayjs from 'dayjs';
import utc from 'dayjs/plugin/utc';

dayjs.extend(utc);

// Helper function to format dates as UNIX timestamps for Yahoo Finance URLs
function getUnixTimestampDaysAgo(days: number): number {
  return dayjs().subtract(days, 'day').unix();
}

// Main function to scrape 30 days of historical prices from Yahoo Finance
async function fetchYahooFinanceHistory(
  ticker: string
): Promise<PriceData[]> {
  const period1 = getUnixTimestampDaysAgo(30); // 30 days ago
  const period2 = getUnixTimestampDaysAgo(0); // today
  const url = `https://finance.yahoo.com/quote/${ticker}/history?period1=${period1}&period2=${period2}&interval=1d&filter=history&frequency=1d`;

  try {
    const {data} = await axios.get(url, {
      headers: {
        'User-Agent':
          'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
      },
    });

    const $ = cheerio.load(data);
    const historyRows: PriceData[] = [];
    const tableRows = $('table[data-test="historical-prices"] tbody tr');

    if (tableRows.length === 0) {
      throw new Error('Could not find the historical prices table.');
    }

    tableRows.each((i, elem) => {
      const cols = $(elem).find('td');
      if (cols.length === 7) {
        const dateStr = $(cols[0]).text().trim();
        const closeStr = $(cols[4]).text().trim().replace(/,/g, '');

        // Basic check for valid row - ignore dividends, stock splits etc.
        if (dateStr && closeStr && !isNaN(parseFloat(closeStr))) {
          const date = dayjs(dateStr, 'MMM DD, YYYY').format('YYYY-MM-DD');
          const close = parseFloat(closeStr);

          if (date && !isNaN(close)) {
             historyRows.push({
                date,
                close,
             });
          }
        }
      }
    });

    if (historyRows.length === 0) {
      throw new Error('Failed to parse any valid data rows from the page.');
    }

    return historyRows.reverse(); // reverse to have dates in ascending order
  } catch (error: any) {
    console.error(`Error fetching or parsing data for ${ticker}:`, error.message);
    throw new Error(`Failed to fetch historical data for ${ticker}. The page structure may have changed or the ticker is invalid.`);
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
    const history = await fetchYahooFinanceHistory(ticker);
    return NextResponse.json(history);
  } catch (error: any) {
    return NextResponse.json({error: error.message}, {status: 500});
  }
}
