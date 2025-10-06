
import {NextRequest, NextResponse} from 'next/server';
import puppeteer from 'puppeteer';

function getUnixTimestamps(daysAgo: number): { start: number; end: number } {
  const end = Math.floor(Date.now() / 1000);
  const start = end - daysAgo * 24 * 3600;
  return { start, end };
}

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

// Map known ambiguous tickers or company names + origin to primary ticker
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

function normalizeString(str: string): string {
  return str.trim().toLowerCase().replace(/\s+/g, " ");
}

function resolveTicker(input: string, originCountry: string, isTicker: boolean): string {
  const key = `${normalizeString(input)}|${normalizeString(originCountry)}`;
  if (key in tickerCountryToPrimaryTicker) return tickerCountryToPrimaryTicker[key];

  const currency = countryPrimaryCurrency[originCountry] ?? "USD";
  if (isTicker) {
    if (input.includes(".")) return input;
    return input + (currencySuffixes[currency] ?? "");
  }
  return input;
}

export async function fetchHistoricalData(
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

  // Use a real user agent and set viewport to avoid bot detection
  await page.setUserAgent(
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 " +
      "(KHTML, like Gecko) Chrome/117.0.0.0 Safari/537.36"
  );
  await page.setViewport({ width: 1366, height: 768 });

  try {
    await page.goto(url, { waitUntil: "networkidle2", timeout: 60000 });
    await page.waitForSelector('table[data-test="historical-prices"] tbody tr', { timeout: 20000 });

    const rows = await page.$$eval('table[data-test="historical-prices"] tbody tr', (trs) =>
      trs.map((tr) => Array.from(tr.querySelectorAll("td")).map((td) => td.innerText.trim()))
    );

    if (!rows.length) {
      await page.screenshot({ path: "debug_no_rows.png", fullPage: true });
      throw new Error("No historical price rows found - page structure may have changed.");
    }

    await browser.close();

    const parseNum = (str: string): number => {
      const num = parseFloat(str.replace(/,/g, "").replace(/-/g, ""));
      return isNaN(num) ? NaN : num;
    };

    return rows
      .filter((cols) => cols.length === 7)
      .map((cols) => ({
        date: new Date(cols[0]).toISOString().split('T')[0], // Standardize date format
        close: parseNum(cols[4]),
      }))
      .filter((entry) => !isNaN(entry.close) && entry.close > 0);
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
    const history = await fetchHistoricalData(ticker, companyCountry, isTicker);
    return NextResponse.json(history);
  } catch (error: any) {
    console.error(error.message);
    return NextResponse.json({error: error.message}, {status: 500});
  }
}
