import {NextRequest, NextResponse} from 'next/server';

/**
 * Global Yahoo Finance Historical Data Fetcher
 * 
 * - Automatically resolves correct tickers worldwide using Yahoo Finance Search API
 * - Uses Puppeteer Stealth for reliable scraping
 * - Includes fallback logic for known mappings and suffixes
 */

import puppeteer from 'puppeteer-extra';
import StealthPlugin from 'puppeteer-extra-plugin-stealth';
import fetch from 'node-fetch';

puppeteer.use(StealthPlugin());

// Get UNIX timestamps for a given number of days ago
function getUnixTimestamps(daysAgo: number): { start: number; end: number } {
  const end = Math.floor(Date.now() / 1000);
  const start = end - daysAgo * 24 * 3600;
  return { start, end };
}

// Yahoo Finance currency → suffix mapping
const currencySuffixes: { [currency: string]: string } = {
  USD: "",
  CAD: ".TO",
  MXN: ".MX",
  BRL: ".SA",
  GBP: ".L",
  EUR: ".PA",
  CHF: ".SW",
  SEK: ".ST",
  NOK: ".OL",
  DKK: ".CO",
  AUD: ".AX",
  NZD: ".NZ",
  JPY: ".T",
  CNY: ".SS",
  HKD: ".HK",
  INR: ".NS",
  KRW: ".KS",
  SGD: ".SI",
  ZAR: ".JSE",
  RUB: ".ME",
  TRY: ".IS",
  SAR: ".SR",
  MYR: ".KL",
  IDR: ".JK",
  TWD: ".TW",
  THB: ".BK",
  PHP: ".PS",
  AED: ".DFM",
  COP: ".MC",
  CLP: ".SN",
  PLN: ".WA",
  HUF: ".BU",
  CZK: ".PR",
  ILS: ".TA",
};

// Country → currency mapping
const countryPrimaryCurrency: { [country: string]: string } = {
  USA: "USD", US: "USD",
  India: "INR", IN: "INR",
  Japan: "JPY", JP: "JPY",
  UK: "GBP", GB: "GBP", "United Kingdom": "GBP",
  Canada: "CAD", CA: "CAD",
  Germany: "EUR", DE: "EUR",
  France: "EUR", FR: "EUR",
  Australia: "AUD", AU: "AUD",
  China: "CNY", CN: "CNY",
  HongKong: "HKD", HK: "HKD",
  SouthKorea: "KRW", KR: "KRW",
  Singapore: "SGD", SG: "SGD",
  Brazil: "BRL", BR: "BRL",
  Russia: "RUB", RU: "RUB",
  Mexico: "MXN", MX: "MXN",
  SouthAfrica: "ZAR", ZA: "ZAR",
  SaudiArabia: "SAR", SA: "SAR",
  UAE: "AED", AE: "AED",
  Sweden: "SEK", SE: "SEK",
  Norway: "NOK", NO: "NOK",
  Switzerland: "CHF", CH: "CHF",
  NewZealand: "NZD", NZ: "NZD",
  Poland: "PLN", PL: "PLN",
  Turkey: "TRY", TR: "TRY",
  Taiwan: "TWD", TW: "TWD",
  Denmark: "DKK", DK: "DKK",
  Chile: "CLP", CL: "CLP",
  Colombia: "COP", CO: "COP",
  Philippines: "PHP", PH: "PHP",
  Thailand: "THB", TH: "THB",
  Israel: "ILS", IL: "ILS",
  Hungary: "HUF", HU: "HUF",
  CzechRepublic: "CZK", CZ: "CZK",
  Malaysia: "MYR", MY: "MYR",
  Indonesia: "IDR", ID: "IDR",
  Ireland: "EUR", IE: "EUR",
  Netherlands: "EUR", NL: "EUR",
  Belgium: "EUR", BE: "EUR",
  Austria: "EUR", AT: "EUR",
  Finland: "EUR", FI: "EUR",
  Portugal: "EUR", PT: "EUR",
  Greece: "EUR", GR: "GR",
};

// Known ambiguous company name → ticker mappings
const companyOriginToPrimaryTicker: { [key: string]: string } = {
  "tata motors|india": "TATAMOTORS.NS",
  "ttm|india": "TATAMOTORS.NS",
  "apple|usa": "AAPL",
  "meta|usa": "META",
  "facebook|usa": "META",
  "toyota motor|japan": "7203.T",
  "toyota|japan": "7203.T",
  "bp|uk": "BP.L",
  "bp|united kingdom": "BP.L",
};

function normalizeString(str: string): string {
  return str.trim().toLowerCase().replace(/\s+/g, " ");
}

/**
 * Query Yahoo Finance's autocomplete API for the best ticker match.
 */
async function getYahooTicker(query: string): Promise<string | null> {
  try {
    const res = await fetch(
      `https://query1.finance.yahoo.com/v1/finance/search?q=${encodeURIComponent(query)}`
    );
    const data: any = await res.json();
    if (data?.quotes?.length > 0) {
      return data.quotes[0].symbol;
    }
  } catch {
    // fail silently
  }
  return null;
}

/**
 * Validate ticker existence using Yahoo's chart API.
 */
async function isValidTicker(ticker: string): Promise<boolean> {
  try {
    const res = await fetch(
      `https://query1.finance.yahoo.com/v8/finance/chart/${ticker}`
    );
    const data: any = await res.json();
    return !!data?.chart?.result;
  } catch {
    return false;
  }
}

/**
 * Resolve correct ticker with AI-style logic, Yahoo API, and suffix fallback.
 */
async function resolveTicker(input: string, originCountry: string, isTicker: boolean): Promise<string> {
  const key = `${normalizeString(input)}|${normalizeString(originCountry)}`;
  if (key in companyOriginToPrimaryTicker) {
    return companyOriginToPrimaryTicker[key];
  }

  // Try Yahoo Finance search API
  const yahooTicker = await getYahooTicker(input);
  if (yahooTicker && await isValidTicker(yahooTicker)) {
    return yahooTicker;
  }

  // Fallback: construct suffix-based ticker
  if (isTicker) {
    if (input.includes(".")) return input;
    const currency = countryPrimaryCurrency[originCountry] ?? "USD";
    const suffix = currencySuffixes[currency] ?? "";
    return input + suffix;
  }

  return input;
}

/**
 * Fetch historical data from Yahoo Finance using Puppeteer.
 */
export async function fetchHistoricalDataDynamic(
  input: string,
  originCountry: string,
  isTicker: boolean = false,
  days: number = 30
) {
  const ticker = await resolveTicker(input, originCountry, isTicker);
  const currency = countryPrimaryCurrency[originCountry] ?? "USD";
  const { start, end } = getUnixTimestamps(days);

  const url = `https://finance.yahoo.com/quote/${encodeURIComponent(
    ticker
  )}/history?period1=${start}&period2=${end}&interval=1d&filter=history&frequency=1d`;

  const browser = await puppeteer.launch({ headless: true, args: ['--no-sandbox', '--disable-setuid-sandbox'] });
  const page = await browser.newPage();

  await page.setUserAgent(
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 " +
      "(KHTML, like Gecko) Chrome/117.0.0.0 Safari/537.36"
  );
  await page.setViewport({ width: 1366, height: 768 });

  try {
    await page.goto(url, { waitUntil: "networkidle2", timeout: 60000 });
    await page.waitForSelector('table[data-test="historical-prices"] tbody tr', {
      timeout: 25000,
    });

    const rows = await page.$$eval('table[data-test="historical-prices"] tbody tr', trs =>
      trs.map(tr => Array.from(tr.querySelectorAll('td')).map(td => td.innerText.trim()))
    );

    await browser.close();

    const parseNum = (str: string): number => {
      const n = parseFloat(str.replace(/,/g, "").replace(/-/g, ""));
      return isNaN(n) ? NaN : n;
    };

    return rows
      .filter(cols => cols.length === 7)
      .map(cols => ({
        date: new Date(cols[0]).toISOString().split('T')[0],
        close: parseNum(cols[4]),
      }))
      .filter(entry => !isNaN(entry.close) && entry.close > 0);
  } catch (error: any) {
    await browser.close();
    throw new Error(`Failed to fetch data for ${ticker} (${originCountry}): ${error.message}`);
  }
}

export async function GET(request: NextRequest) {
  const {searchParams} = new URL(request.url);
  const ticker = searchParams.get('ticker'); // This is the 'input' for your function
  const companyCountry = searchParams.get('companyCountry');
  const isTicker = searchParams.get('isTicker') === 'true';

  if (!ticker || !companyCountry) {
    return NextResponse.json(
      {
        error: 'Ticker and companyCountry are required query parameters.',
      },
      {status: 400}
    );
  }

  try {
    const history = await fetchHistoricalDataDynamic(ticker, companyCountry, isTicker);
    return NextResponse.json(history);
  } catch (error: any) {
    console.error(error.message);
    return NextResponse.json({error: error.message}, {status: 500});
  }
}
