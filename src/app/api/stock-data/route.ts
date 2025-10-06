
import {NextRequest, NextResponse} from 'next/server';
import puppeteer from 'puppeteer';
import type {PriceData} from '@/types';

// Convert days ago to UNIX timestamp range
function getUnixTimestamps(daysAgo: number): {start: number; end: number} {
  const end = Math.floor(Date.now() / 1000);
  const start = end - daysAgo * 24 * 3600;
  return {start, end};
}

/**
 * Global currency-to-YahooFinance exchange suffix mapping covering virtually all major stock markets.
 * If a currency is used by multiple exchanges, the most likely primary exchange for that currency is chosen.
 */
const currencySuffixes: {[currency: string]: string} = {
  USD: '', // US exchanges (NYSE, NASDAQ) usually have no suffix
  CAD: '.TO', // Toronto Stock Exchange
  MXN: '.MX', // Mexican Stock Exchange
  BRL: '.SA', // B3 - Brazil
  GBP: '.L', // London Stock Exchange
  EUR: '.PA', // Euronext Paris
  CHF: '.SW', // SIX Swiss Exchange
  SEK: '.ST', // Stockholm OMX
  NOK: '.OL', // Oslo Børs
  DKK: '.CO', // Copenhagen OMX
  AUD: '.AX', // Australian Securities Exchange
  NZD: '.NZ', // New Zealand Exchange
  JPY: '.T', // Tokyo Stock Exchange (Corrected from .TYO)
  CNY: '.SS', // Shanghai Stock Exchange
  HKD: '.HK', // Hong Kong Stock Exchange
  INR: '.NS', // NSE India
  KRW: '.KS', // Korea Exchange (KOSPI)
  SGD: '.SI', // Singapore Exchange
  ZAR: '.J', // Johannesburg Stock Exchange (Corrected from .JSE)
  RUB: '.ME', // Moscow Exchange
  TRY: '.IS', // Istanbul Stock Exchange
  SAR: '.SR', // Saudi Stock Exchange (Tadawul)
  MYR: '.KL', // Bursa Malaysia
  IDR: '.JK', // Indonesia Stock Exchange
  TWD: '.TW', // Taiwan Stock Exchange
  THB: '.BK', // Stock Exchange of Thailand
  PHP: '.PS', // Philippine Stock Exchange
  AED: '.DFM', // Dubai Financial Market (approximate)
  COP: '.CN', // Colombia Stock Exchange (Corrected from .MC)
  CLP: '.SN', // Santiago Stock Exchange - Chile
  PLN: '.WA', // Warsaw Stock Exchange (WSE)
  HUF: '.BU', // Budapest Stock Exchange
  CZK: '.PR', // Prague Stock Exchange
  ILS: '.TA', // Tel Aviv Stock Exchange
};

/**
 * Map of company country origins to preferred currency (uniquely identifies primary listing)
 * Used to resolve multiple listings across exchanges to ONE primary listing.
 * Keys should be ISO Alpha-2 country codes or company origin country names consistent with usage.
 */
const countryPrimaryCurrency: {[country: string]: string} = {
  // United States
  USA: 'USD',
  US: 'USD',
  'United States': 'USD',
  // India
  India: 'INR',
  IN: 'INR',
  // Japan
  Japan: 'JPY',
  JP: 'JPY',
  // United Kingdom
  UK: 'GBP',
  'United Kingdom': 'GBP',
  GB: 'GBP',
  // Canada
  Canada: 'CAD',
  CA: 'CAD',
  // Germany (mostly EUR market)
  Germany: 'EUR',
  DE: 'EUR',
  // France
  France: 'EUR',
  FR: 'EUR',
  // Australia
  Australia: 'AUD',
  AU: 'AUD',
  // China
  China: 'CNY',
  CN: 'CNY',
  // Hong Kong
  HongKong: 'HKD',
  HK: 'HKD',
  // South Korea
  SouthKorea: 'KRW',
  KRW: 'KRW', // Also add by currency
  KR: 'KRW',
  // Singapore
  Singapore: 'SGD',
  SG: 'SGD',
  // Brazil
  Brazil: 'BRL',
  BR: 'BRL',
  // Russia
  Russia: 'RUB',
  RU: 'RUB',
  // Mexico
  Mexico: 'MXN',
  MX: 'MXN',
  // South Africa
  SouthAfrica: 'ZAR',
  ZA: 'ZAR',
  // Saudi Arabia
  SaudiArabia: 'SAR',
  SA: 'SAR',
  // UAE
  UAE: 'AED',
  AE: 'AED',
  // Sweden
  Sweden: 'SEK',
  SE: 'SEK',
  // Norway
  Norway: 'NOK',
  NO: 'NOK',
  // Switzerland
  Switzerland: 'CHF',
  CH: 'CHF',
  // New Zealand
  NewZealand: 'NZD',
  NZ: 'NZD',
  // Poland
  Poland: 'PLN',
  PL: 'PLN',
  // Turkey
  Turkey: 'TRY',
  TR: 'TRY',
  // Taiwan
  Taiwan: 'TWD',
  TW: 'TWD',
};

// Utility: Normalize country input for consistent lookup
function normalizeCountry(country: string): string {
  return country.trim().replace(/\s+/g, '').toLowerCase();
}

/**
 * Resolve preferred ticker + currency for a company given its ticker, currency, and company origin country.
 * If multiple markets/currencies are possible, choose the one matching the country origin's primary currency.
 */
function resolvePrimaryListing(
  ticker: string,
  currency: string,
  companyCountry: string
): {ticker: string; currency: string} {
  // Normalize country input for key matching
  const normCountry = normalizeCountry(companyCountry);

  // Search countryPrimaryCurrency keys ignoring case/spacing
  for (const countryKey in countryPrimaryCurrency) {
    if (normalizeCountry(countryKey) === normCountry) {
      const preferredCurrency = countryPrimaryCurrency[countryKey];
      if (currency === preferredCurrency) {
        // Already matches preferred currency
        return {ticker, currency};
      }
      // Otherwise try to adapt ticker for preferred currency
      const targetSuffix = currencySuffixes[preferredCurrency] || '';
      const normalizedTickerBase = ticker.split('.')[0]; // Remove existing suffix if any
      return {
        ticker: normalizedTickerBase + targetSuffix,
        currency: preferredCurrency,
      };
    }
  }
  // If country unknown, return given ticker/currency unchanged
  return {ticker, currency};
}

/**
 * Main function: Fetch 30-day historical prices for a company,
 * given ticker, currency, and company origin country.
 * Ensures primary market is chosen based on company country.
 */
export async function fetchHistoricalDataGlobal(
  ticker: string,
  currency: string,
  companyCountry: string,
  days: number = 30
): Promise<PriceData[]> {
  // Resolve to primary market ticker and currency
  const {ticker: resolvedTicker, currency: resolvedCurrency} =
    resolvePrimaryListing(ticker, currency, companyCountry);

  // Format ticker with Yahoo suffix
  const suffix =
    currencySuffixes[resolvedCurrency] !== undefined
      ? currencySuffixes[resolvedCurrency]
      : '';
  const formattedTicker = resolvedTicker.includes('.')
    ? resolvedTicker
    : resolvedTicker + suffix;

  const {start, end} = getUnixTimestamps(days);
  const url = `https://finance.yahoo.com/quote/${encodeURIComponent(
    formattedTicker
  )}/history?period1=${start}&period2=${end}&interval=1d&filter=history&frequency=1d`;

  let browser;
  try {
    browser = await puppeteer.launch({
      headless: true,
      args: [
        '--no-sandbox',
        '--disable-setuid-sandbox',
        '--disable-infobars',
        '--window-position=0,0',
        '--ignore-certifcate-errors',
        '--ignore-certifcate-errors-spki-list',
      ],
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
  const currency = searchParams.get('currency');
  const companyCountry = searchParams.get('companyCountry');

  if (!ticker || !currency || !companyCountry) {
    return NextResponse.json(
      {
        error:
          'Ticker, currency, and companyCountry are required query parameters.',
      },
      {status: 400}
    );
  }

  try {
    const history = await fetchHistoricalDataGlobal(
      ticker,
      currency,
      companyCountry
    );
    return NextResponse.json(history);
  } catch (error: any) {
    return NextResponse.json({error: error.message}, {status: 500});
  }
}
