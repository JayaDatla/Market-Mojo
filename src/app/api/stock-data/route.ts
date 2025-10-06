
import { NextRequest, NextResponse } from 'next/server';
import axios from 'axios';
import * as cheerio from 'cheerio';
import dayjs from 'dayjs';
import type { PriceData } from '@/types';

// Mock user agent to avoid bot detection
const headers = {
  'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/96.0.4664.110 Safari/537.36',
  'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,image/apng,*/*;q=0.8',
  'Accept-Language': 'en-US,en;q=0.9',
};


function getUnixTimestampDaysAgo(daysAgo: number): number {
  return dayjs().subtract(daysAgo, 'day').unix();
}


async function fetchYahooFinanceHistory(ticker: string, currency: string): Promise<PriceData[]> {
    const period2 = getUnixTimestampDaysAgo(0);    // today
    const period1 = getUnixTimestampDaysAgo(30);   // 30 days ago
    const url = `https://finance.yahoo.com/quote/${ticker}/history?period1=${period1}&period2=${period2}&interval=1d&filter=history&frequency=1d`;

    try {
        const { data: html } = await axios.get(url, { headers });
        const $ = cheerio.load(html);

        const historyRows: PriceData[] = [];
        const tableRows = $('table[data-test="historical-prices"] tbody tr');
        
        tableRows.each((i, elem) => {
            const cols = $(elem).find("td");
            if (cols.length === 7) {
                const dateText = $(cols[0]).text().trim();
                const openText = $(cols[1]).text().replace(/,/g, "");
                
                // Skip dividend rows or other special rows which don't have a valid price.
                if (openText.toLowerCase().includes('dividend') || isNaN(parseFloat(openText))) {
                    return;
                }

                const date = dayjs(dateText, "MMM DD, YYYY");

                const row = {
                    date: date.isValid() ? date.format('YYYY-MM-DD') : 'Invalid Date',
                    open: parseFloat(openText),
                    high: parseFloat($(cols[2]).text().replace(/,/g, "")),
                    low: parseFloat($(cols[3]).text().replace(/,/g, "")),
                    close: parseFloat($(cols[4]).text().replace(/,/g, "")),
                    adjClose: parseFloat($(cols[5]).text().replace(/,/g, "")),
                    volume: parseInt($(cols[6]).text().replace(/,/g, ""), 10),
                    currency: currency,
                };
                
                if (!isNaN(row.open) && row.date !== 'Invalid Date') {
                    historyRows.push(row);
                }
            }
        });
        
        if (historyRows.length === 0) {
            // Check for a specific message that indicates the ticker is not found
            if ($('h1').text().includes("We can't find any results for")) {
                 throw new Error(`Ticker '${ticker}' not found on Yahoo Finance.`);
            }
            throw new Error(`No historical data found for ${ticker}. The page structure might have changed or the ticker is invalid.`);
        }

        return historyRows.reverse(); // reverse to have dates in ascending order
    } catch (error: any) {
        if (axios.isAxiosError(error) && error.response?.status === 404) {
            throw new Error(`Ticker '${ticker}' not found on Yahoo Finance.`);
        }
        // Re-throw errors that we've already created with a specific message
        if (error.message.includes('Ticker') || error.message.includes('No historical data')) {
            throw error;
        }
        // General error
        throw new Error(`Failed to fetch from Yahoo Finance: ${error.message}`);
    }
}

export async function GET(req: NextRequest) {
  const searchParams = req.nextUrl.searchParams;
  const ticker = searchParams.get('ticker');
  const currency = searchParams.get('currency') || 'USD';

  if (!ticker) {
    return NextResponse.json({ error: 'Ticker symbol is required' }, { status: 400 });
  }

  try {
    const data = await fetchYahooFinanceHistory(ticker, currency);
    return NextResponse.json(data);
  } catch (error: any) {
    console.error(`Error fetching data for ${ticker}:`, error.message);
    return NextResponse.json({ error: `Could not fetch or parse historical data for ${ticker}. ${error.message}` }, { status: 500 });
  }
}
