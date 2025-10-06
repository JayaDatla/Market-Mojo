
import {NextRequest, NextResponse} from 'next/server';
import puppeteer from 'puppeteer';

// Convert days ago to UNIX timestamps
function getUnixTimestamps(daysAgo: number): { start: number; end: number } {
  const end = Math.floor(Date.now() / 1000);
  const start = end - daysAgo * 24 * 3600;
  return { start, end };
}

// Extensive mapping for currency suffixes used by Yahoo Finance tickers
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
  JPY: ".TYO",
  CNY: ".SS",
  HKD: ".HK",
  INR: ".NS",
  KRW: ".KS",
  SGD: ".SI",
  ZAR: ".JSE",
  RUB: ".ME",
  TRY: ".IS",
  SAR: ".SD",
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

// Mapping from country to primary currency
const countryPrimaryCurrency: { [country: string]: string } = {
  USA: "USD",
  US: "USD",
  "United States": "USD",
  India: "INR",
  IN: "INR",
  Japan: "JPY",
  JP: "JPY",
  UK: "GBP",
  "United Kingdom": "GBP",
  GB: "GBP",
  Canada: "CAD",
  CA: "CAD",
  Germany: "EUR",
  DE: "EUR",
  France: "EUR",
  FR: "EUR",
  Australia: "AUD",
  AU: "AUD",
  China: "CNY",
  CN: "CNY",
  HongKong: "HKD",
  HK: "HKD",
  SouthKorea: "KRW",
  KR: "KRW",
  Singapore: "SGD",
  SG: "SGD",
  Brazil: "BRL",
  BR: "BRL",
  Russia: "RUB",
  RU: "RUB",
  Mexico: "MXN",
  MX: "MXN",
  SouthAfrica: "ZAR",
  ZA: "ZAR",
  SaudiArabia: "SAR",
  SA: "SAR",
  UAE: "AED",
  AE: "AED",
  Sweden: "SEK",
  SE: "SEK",
  Norway: "NOK",
  NO: "NOK",
  Switzerland: "CHF",
  CH: "CHF",
  NewZealand: "NZD",
  NZ: "NZD",
  Poland: "PLN",
  PL: "PLN",
  Turkey: "TRY",
  TR: "TRY",
  Taiwan: "TWD",
  TW: "TWD",
  Denmark: "DKK",
  DK: "DKK",
  Chile: "CLP",
  CL: "CLP",
  Colombia: "COP",
  CO: "COP",
  Philippines: "PHP",
  PH: "PHP",
  Thailand: "THB",
  TH: "THB",
  Israel: "ILS",
  IL: "ILS",
  Hungary: "HUF",
  HU: "HUF",
  CzechRepublic: "CZK",
  CZ: "CZK",
  Malaysia: "MYR",
  MY: "MYR",
  Indonesia: "IDR",
  ID: "IDR",
};

// Map ambiguous or ADR tickers & company names + origin to primary Yahoo ticker
const tickerCountryToPrimaryTicker: { [key: string]: string } = {
  "ttm|india": "TATAMOTORS.NS",
  "tata motors|india": "TATAMOTORS.NS",
  "apple|united states": "AAPL",
  "aapl|united states": "AAPL",
  "bp|united kingdom": "BP.L",
  "bp|uk": "BP.L",
  "toyota|japan": "7203.T",
  "toyota motor|japan": "7203.T", // common variation
};

// Normalize strings for matching
function normalizeString(str: string): string {
  return str.trim().toLowerCase().replace(/\s+/g, " ");
}

/**
 * Resolves the proper Yahoo Finance ticker symbol based on the user input and origin country.
 * Accepts either a ticker or a company name input.
 */
function resolveTicker(input: string, originCountry: string, isTicker: boolean): string {
  const key = `${normalizeString(input)}|${normalizeString(originCountry)}`;
  
  if (key in tickerCountryToPrimaryTicker) {
    return tickerCountryToPrimaryTicker[key];
  }

  if (isTicker) {
    const currency = countryPrimaryCurrency[originCountry] ?? "USD";
    if (input.includes(".")) return input; 
    const suffix = currencySuffixes[currency] ?? "";
    return input.toUpperCase() + suffix;
  }

  // Fallback for company names not in the map - may not match Yahoo's expected ticker
  return input;
}


/**
 * Fetch historical data from Yahoo Finance using Puppeteer,
 * resolving ticker dynamically based on input type and origin country.
 */
export async function fetchHistoricalDataDynamic(
  input: string,
  originCountry: string,
  isTicker: boolean = false,
  days: number = 30
) {
  const ticker = resolveTicker(input, originCountry, isTicker);
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

  try {
    await page.goto(url, { waitUntil: "networkidle2", timeout: 45000 });
    await page.waitForSelector('table[data-test="historical-prices"] tbody tr', { timeout: 20000 });

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
        date: new Date(cols[0]).toISOString().split('T')[0], // Standardize date format
        close: parseNum(cols[4]),
      }))
      .filter(entry => !isNaN(entry.close) && entry.close > 0);
  } catch (error) {
    await browser.close();
    throw new Error(`Failed to fetch historical data for ${ticker} (${originCountry}): ${error}`);
  }
}


export async function GET(request: NextRequest) {
  const {searchParams} = new URL(request.url);
  const ticker = searchParams.get('ticker');
  const companyCountry = searchParams.get('companyCountry');
  // The `isTicker` parameter is expected to be 'true' or 'false'
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
    // We use the original ticker from the AI as the `input` for our dynamic fetch function.
    const history = await fetchHistoricalDataDynamic(ticker, companyCountry, isTicker);
    return NextResponse.json(history);
  } catch (error: any) {
    console.error(error.message);
    return NextResponse.json({error: error.message}, {status: 500});
  }
}
