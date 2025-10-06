
import {NextRequest, NextResponse} from 'next/server';
import puppeteer from 'puppeteer';

// Get UNIX timestamps for the past 'daysAgo' days
function getUnixTimestamps(daysAgo: number): {start: number; end: number} {
  const end = Math.floor(Date.now() / 1000);
  const start = end - daysAgo * 24 * 3600;
  return {start, end};
}

// Extensive mapping from currency codes to Yahoo Finance ticker suffixes
const currencySuffixes: {[currency: string]: string} = {
  USD: '',
  CAD: '.TO',
  MXN: '.MX',
  BRL: '.SA',
  GBP: '.L',
  EUR: '.PA',
  CHF: '.SW',
  SEK: '.ST',
  NOK: '.OL',
  DKK: '.CO',
  AUD: '.AX',
  NZD: '.NZ',
  JPY: '.T',
  CNY: '.SS',
  HKD: '.HK',
  INR: '.NS',
  KRW: '.KS',
  SGD: '.SI',
  ZAR: '.J',
  RUB: '.ME',
  TRY: '.IS',
  SAR: '.SR',
  MYR: '.KL',
  IDR: '.JK',
  TWD: '.TW',
  THB: '.BK',
  PHP: '.PS',
  AED: '.DFM',
  COP: '.CN',
  CLP: '.SN',
  PLN: '.WA',
  HUF: '.BU',
  CZK: '.PR',
  ILS: '.TA',
};

// Mapping origin countries to their primary currency to identify main listing
const countryPrimaryCurrency: {[country: string]: string} = {
  USA: 'USD',
  US: 'USD',
  'United States': 'USD',
  India: 'INR',
  IN: 'INR',
  Japan: 'JPY',
  JP: 'JPY',
  UK: 'GBP',
  'United Kingdom': 'GBP',
  GB: 'GBP',
  Canada: 'CAD',
  CA: 'CAD',
  Germany: 'EUR',
  DE: 'EUR',
  France: 'EUR',
  FR: 'EUR',
  Australia: 'AUD',
  AU: 'AUD',
  China: 'CNY',
  CN: 'CNY',
  HongKong: 'HKD',
  HK: 'HKD',
  SouthKorea: 'KRW',
  KRW: 'KRW',
  KR: 'KRW',
  Singapore: 'SGD',
  SG: 'SGD',
  Brazil: 'BRL',
  BR: 'BRL',
  Russia: 'RUB',
  RU: 'RUB',
  Mexico: 'MXN',
  MX: 'MXN',
  SouthAfrica: 'ZAR',
  ZA: 'ZAR',
  SaudiArabia: 'SAR',
  SA: 'SAR',
  UAE: 'AED',
  AE: 'AED',
  Sweden: 'SEK',
  SE: 'SEK',
  Norway: 'NOK',
  NO: 'NOK',
  Switzerland: 'CHF',
  CH: 'CHF',
  NewZealand: 'NZD',
  NZ: 'NZD',
  Poland: 'PLN',
  PL: 'PLN',
  Turkey: 'TRY',
  TR: 'TRY',
  Taiwan: 'TWD',
  TW: 'TWD',
};

// Normalize strings to lowercase without spaces for matching
function normalizeString(input: string): string {
  return input.trim().toLowerCase().replace(/\s+/g, '');
}

// Find preferred currency for company given the origin country input
function getPreferredCurrencyForCountry(country: string): string {
  const norm = normalizeString(country);
  for (const c in countryPrimaryCurrency) {
    if (normalizeString(c) === norm) {
      return countryPrimaryCurrency[c];
    }
  }
  return '';
}

// Format ticker with Yahoo Finance suffix for given currency
function formatTickerForYahoo(ticker: string, currency: string): string {
  if (ticker.includes('.')) return ticker; // Already formatted
  const suffix = currencySuffixes[currency];
  return suffix !== undefined ? ticker + suffix : ticker;
}

// Main function: fetch 30 days historical data from origin country market only
export async function fetchHistoricalDataForOrigin(
  ticker: string,
  originCountry: string,
  days: number = 30
) {
  const currency = getPreferredCurrencyForCountry(originCountry);
  if (!currency) {
    throw new Error(
      `Unable to determine currency for origin country: ${originCountry}`
    );
  }
  const formattedTicker = formatTickerForYahoo(ticker, currency);

  const {start, end} = getUnixTimestamps(days);
  const url = `https://finance.yahoo.com/quote/${encodeURIComponent(
    formattedTicker
  )}/history?period1=${start}&period2=${end}&interval=1d&filter=history&frequency=1d`;

  let browser;
  try {
    browser = await puppeteer.launch({
      headless: true,
      args: ['--no-sandbox', '--disable-setuid-sandbox'],
    });
    const page = await browser.newPage();

    await page.setUserAgent(
      'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 ' +
        '(KHTML, like Gecko) Chrome/117.0.0.0 Safari/537.36'
    );

    await page.goto(url, {waitUntil: 'networkidle2', timeout: 30000});
    await page.waitForSelector('table[data-test="historical-prices"] tbody tr', {
      timeout: 15000,
    });

    const rows = await page.$$eval(
      'table[data-test="historical-prices"] tbody tr',
      (trs) =>
        trs.map((tr) =>
          Array.from(tr.querySelectorAll('td')).map((td) => td.innerText.trim())
        )
    );

    const parseNum = (str: string): number => {
      const num = parseFloat(str.replace(/,/g, '').replace(/-/g, ''));
      return isNaN(num) ? NaN : num;
    };

    const priceData = rows
      .filter((cols) => cols.length === 7)
      .map((cols) => ({
        date: new Date(cols[0]).toISOString().split('T')[0], // Standardize date format
        close: parseNum(cols[4]),
      }))
      .filter((entry) => !isNaN(entry.close) && entry.close > 0);

    return priceData;
  } catch (error: any) {
    console.error(
      `Failed to fetch historical data for ${ticker} (${currency}):`,
      error.message
    );
    throw new Error(
      `Failed to fetch historical data for ${ticker} from Yahoo Finance: ${error.message}`
    );
  } finally {
    if (browser) {
      await browser.close();
    }
  }
}

export async function GET(request: NextRequest) {
  const {searchParams} = new URL(request.url);
  const ticker = searchParams.get('ticker');
  const companyCountry = searchParams.get('companyCountry');

  if (!ticker || !companyCountry) {
    return NextResponse.json(
      {
        error: 'Ticker and companyCountry are required query parameters.',
      },
      {status: 400}
    );
  }

  try {
    const history = await fetchHistoricalDataForOrigin(ticker, companyCountry);
    return NextResponse.json(history);
  } catch (error: any) {
    return NextResponse.json({error: error.message}, {status: 500});
  }
}
