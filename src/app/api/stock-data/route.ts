
import {NextRequest, NextResponse} from 'next/server';
import puppeteer from 'puppeteer';

// Convert days ago to UNIX timestamps
function getUnixTimestamps(daysAgo: number): { start: number; end: number } {
  const end = Math.floor(Date.now() / 1000);
  const start = end - daysAgo * 24 * 3600;
  return { start, end };
}

// Extensive currency suffix mapping for Yahoo Finance tickers
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

// Map origin country to primary currency
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
};

// Mapping ambiguous tickers/name + origin to primary Yahoo ticker
const companyOriginToPrimaryTicker: { [key: string]: string } = {
  "tata motors|india": "TATAMOTORS.NS",
  "ttm|india": "TATAMOTORS.NS",
  "apple|usa": "AAPL",
  "apple|united states": "AAPL",
  "aapl|usa": "AAPL",
  "aapl|united states": "AAPL",
  "meta|usa": "META",
  "meta platforms|usa": "META",
  "facebook|usa": "META",
  "fb|usa": "META",
  "bp|uk": "BP.L",
  "bp|united kingdom": "BP.L",
  "toyota motor|japan": "7203.T",
  "toyota motors|japan": "7203.T",
  "toyota|japan": "7203.T",
  "tm|japan": "7203.T",
};

// Normalize for consistent mapping lookups
function normalizeString(str: string): string {
  return str.trim().toLowerCase().replace(/\s+/g, " ");
}

function resolveTicker(input: string, originCountry: string, isTicker: boolean): string {
  const key = `${normalizeString(input)}|${normalizeString(originCountry)}`;

  if (key in companyOriginToPrimaryTicker) {
    return companyOriginToPrimaryTicker[key];
  }

  // If input is ticker without suffix, append based on origin currency
  if (isTicker) {
    const currency = countryPrimaryCurrency[originCountry] ?? "USD";
    if (input.includes(".")) return input;
    return input + (currencySuffixes[currency] ?? "");
  }

  // For unknown company name, fallback (likely to fail if Yahoo ticker differs)
  return input;
}

/**
 * Fetches 30-day historical price data from Yahoo Finance using Puppeteer.
 * @param input Company name or ticker symbol
 * @param originCountry Company's origin country
 * @param isTicker True if input is ticker, false if company name
 * @param days Number of days of historical data to fetch, defaults to 30
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

  // Setting viewport to reduce bot detection
  await page.setViewport({ width: 1366, height: 768 });

  try {
    await page.goto(url, { waitUntil: "networkidle2", timeout: 60000 });
    await page.waitForSelector('table[data-test="historical-prices"] tbody tr', {
      timeout: 25000,
    });

    const rows = await page.$$eval(
      'table[data-test="historical-prices"] tbody tr',
      trs => trs.map(tr => Array.from(tr.querySelectorAll('td')).map(td => td.innerText.trim()))
    );

    if (!rows.length) {
      await page.screenshot({ path: "no_data.png", fullPage: true });
      throw new Error("No historical price rows found - possibly page structure changed.");
    }

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
      .filter(e => !isNaN(e.close) && e.close > 0);

  } catch (error: any) {
    await browser.close();
    throw new Error(`Failed fetching data for ${ticker} (${originCountry}): ${error.message}`);
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
