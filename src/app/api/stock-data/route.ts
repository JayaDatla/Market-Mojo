
import { NextRequest, NextResponse } from 'next/server';
import * as cheerio from 'cheerio';
import { subDays, format } from 'date-fns';

const HEADERS = { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36' };

// Helper to fetch and parse HTML
async function fetchHtml(url: string) {
    const response = await fetch(url, { headers: HEADERS });
    if (!response.ok) {
        throw new Error(`Failed to fetch ${url}, status: ${response.status}`);
    }
    const text = await response.text();
    return cheerio.load(text);
}

// Equivalent of get_currency
async function getCurrency(ticker: string) {
    try {
        const url = `https://finance.yahoo.com/quote/${ticker}`;
        const response = await fetch(url, { headers: HEADERS });
        if (!response.ok) return "USD"; // Fallback
        const text = await response.text();
        const match = text.match(/Currency in (\w+)/);
        return match ? match[1] : "USD";
    } catch (error) {
        console.error(`Failed to get currency for ${ticker}:`, error);
        return "USD"; // Fallback
    }
}

// Equivalent of fetch_last_30_days
async function fetchLast30Days(ticker: string) {
    const endDate = new Date();
    const startDate = subDays(endDate, 30);
    const period1 = Math.floor(startDate.getTime() / 1000);
    const period2 = Math.floor(endDate.getTime() / 1000);

    const url = `https://finance.yahoo.com/quote/${ticker}/history?period1=${period1}&period2=${period2}&interval=1d&filter=history&frequency=1d&includeAdjustedClose=true`;
    
    const $ = await fetchHtml(url);
    const data = [];

    const rows = $('table[data-test="historical-prices"] tbody tr');
    
    if (rows.length === 0) {
        return []; // No data found
    }

    for (const row of rows) {
        const cols = $(row).find('td');
        if (cols.length === 7) {
            const dateText = $(cols[0]).text().trim();
            const closeText = $(cols[4]).text().trim();
            
            // Skip rows that are not valid data (e.g., dividend announcements)
            if (dateText.toLowerCase().includes('dividend') || closeText === '-') {
                continue;
            }

            const date = new Date(dateText);
            const price = parseFloat(closeText.replace(/,/g, ''));

            if (!isNaN(price) && date.toString() !== 'Invalid Date') {
                 data.push({
                    date: format(date, 'yyyy-MM-dd'),
                    price,
                });
            }
        }
    }
    return data;
}

export async function GET(request: NextRequest) {
    const searchParams = request.nextUrl.searchParams;
    const ticker = searchParams.get('ticker');

    if (!ticker) {
        return NextResponse.json({ error: 'Ticker symbol is required' }, { status: 400 });
    }

    try {
        const historicalData = await fetchLast30Days(ticker);

        if (historicalData.length === 0) {
             return NextResponse.json({ error: `No historical data found for ${ticker}` }, { status: 404 });
        }
        
        // Enrich data with currency - assuming currency is the same for all entries
        const currency = await getCurrency(ticker);
        const enrichedData = historicalData.map(d => ({ ...d, currency }));

        return NextResponse.json({ historicalData: enrichedData });

    } catch (error: any) {
        console.error(`API Error for ticker ${ticker}:`, error);
        return NextResponse.json({ error: error.message || 'An internal server error occurred' }, { status: 500 });
    }
}
