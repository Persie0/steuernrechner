import { fetchWithTimeout } from "../../lib/network.ts";

type RatePoint = { date: string; rate: number };

const ECB_HISTORY_URL =
  "https://www.ecb.europa.eu/stats/eurofxref/eurofxref-hist.csv";
const ECB_DATA_URL = "https://data-api.ecb.europa.eu/service/data/EXR";
const BANCA_URL = "https://tassidicambio.bancaditalia.it/terzevalute-wf-web/rest/v1.0/dailyTimeSeries";
const ECB_HEADERS = {
  Accept: "text/csv,application/csv;q=0.9,*/*;q=0.1",
  "User-Agent":
    "ust-assistent-at/1.0 (+https://github.com/Persie0/steuernrechner)",
};

// The same multi-megabyte public history serves every report in an import.
// Share it across requests in a warm server, including concurrent requests.
let historyCache: { text: string; expires: number } | undefined;
let historyPending: Promise<string> | undefined;
async function historyText() {
  if (historyCache && historyCache.expires > Date.now())
    return historyCache.text;
  if (historyPending) return historyPending;
  historyPending = (async () => {
    const response = await fetchWithTimeout(
      ECB_HISTORY_URL,
      {
        headers: ECB_HEADERS,
        cache: "no-store",
      },
      8_000,
    );
    if (!response.ok)
      throw new Error(`EZB-Historie antwortete mit ${response.status}`);
    const text = await response.text();
    if (!text.startsWith("Date,") && !text.startsWith("\uFEFFDate,"))
      throw new Error("Unerwartetes Format der EZB-Historie");
    historyCache = { text, expires: Date.now() + 86_400_000 };
    return text;
  })();
  try {
    return await historyPending;
  } finally {
    historyPending = undefined;
  }
}

function parseCsvLine(line: string) {
  const cells: string[] = [];
  let cell = "";
  let quoted = false;
  for (let index = 0; index < line.length; index++) {
    const character = line[index];
    if (character === '"') {
      if (quoted && line[index + 1] === '"') {
        cell += '"';
        index++;
      } else {
        quoted = !quoted;
      }
    } else if (character === "," && !quoted) {
      cells.push(cell);
      cell = "";
    } else {
      cell += character;
    }
  }
  cells.push(cell);
  return cells;
}

function subtractDays(date: string, days: number) {
  const value = new Date(`${date}T00:00:00Z`);
  value.setUTCDate(value.getUTCDate() - days);
  return value.toISOString().slice(0, 10);
}

async function fetchCurrency(currency: string, from: string, to: string) {
  const url = new URL(`${ECB_DATA_URL}/D.${currency}.EUR.SP00.A`);
  url.searchParams.set("startPeriod", subtractDays(from, 10));
  url.searchParams.set("endPeriod", to);
  url.searchParams.set("format", "csvdata");
  url.searchParams.set("detail", "dataonly");

  const response = await fetchWithTimeout(
    url,
    {
      headers: ECB_HEADERS,
      next: { revalidate: 86400 },
    },
    8_000,
  );
  if (!response.ok) {
    throw new Error(`EZB-Antwort ${response.status} für ${currency}`);
  }

  const lines = (await response.text()).split(/\r?\n/).filter(Boolean);
  if (lines.length < 2) throw new Error(`Keine EZB-Kurse für ${currency}`);
  const headers = parseCsvLine(lines[0]);
  const dateIndex = headers.indexOf("TIME_PERIOD");
  const valueIndex = headers.indexOf("OBS_VALUE");
  if (dateIndex < 0 || valueIndex < 0) {
    throw new Error(`Unerwartetes EZB-Format für ${currency}`);
  }

  return lines
    .slice(1)
    .map(parseCsvLine)
    .map(
      (row): RatePoint => ({
        date: row[dateIndex],
        rate: Number(row[valueIndex]),
      }),
    )
    .filter((point) => point.date && Number.isFinite(point.rate))
    .sort((a, b) => a.date.localeCompare(b.date));
}

async function fetchHistory(currencies: string[], from: string, to: string) {
  const lines = (await historyText()).split(/\r?\n/).filter(Boolean);
  if (lines.length < 2) throw new Error("EZB-Historie ist leer");

  const headers = parseCsvLine(lines[0].replace(/^\uFEFF/, "")).map((cell) =>
    cell.trim(),
  );
  const dateIndex = headers.indexOf("Date");
  if (dateIndex < 0) throw new Error("Unerwartetes Format der EZB-Historie");

  const start = subtractDays(from, 10);
  const rates = Object.fromEntries(
    currencies.map((currency) => [currency, [] as RatePoint[]]),
  );
  const indexes = Object.fromEntries(
    currencies.map((currency) => [currency, headers.indexOf(currency)]),
  );

  for (const line of lines.slice(1)) {
    const row = parseCsvLine(line);
    const date = row[dateIndex]?.trim();
    if (!date || date < start || date > to) continue;

    for (const currency of currencies) {
      const index = indexes[currency];
      const rate = index >= 0 ? Number(row[index]) : Number.NaN;
      if (Number.isFinite(rate)) rates[currency].push({ date, rate });
    }
  }

  for (const currency of currencies) {
    rates[currency].sort((a, b) => a.date.localeCompare(b.date));
  }
  return rates;
}

async function fetchBanca(currency: string, from: string, to: string) {
  const url = new URL(BANCA_URL);
  url.searchParams.set("startDate", subtractDays(from, 10));
  url.searchParams.set("endDate", to);
  url.searchParams.set("baseCurrencyIsoCode", currency);
  url.searchParams.set("currencyIsoCode", "EUR");
  url.searchParams.set("lang", "en");
  const response = await fetchWithTimeout(url, { headers: { Accept: "application/json" }, next: { revalidate: 86400 } }, 8000);
  if (!response.ok) throw new Error("Banca d’Italia nicht erreichbar.");
  const payload = await response.json();
  if (payload?.resultsInfo?.isoCode !== currency || !Array.isArray(payload.rates)) throw new Error("Unerwartete Kursantwort.");
  return payload.rates.map((row: { referenceDate?: unknown; avgRate?: unknown; exchangeConvention?: unknown }) => {
    const rate = Number(row.avgRate);
    if (typeof row.referenceDate !== "string" || !/^\d{4}-\d{2}-\d{2}$/.test(row.referenceDate) || !Number.isFinite(rate) || rate <= 0 || typeof row.exchangeConvention !== "string" || !/foreign currency amount for 1 euro/i.test(row.exchangeConvention)) throw new Error("Ungültiger Banca-d’Italia-Kurs.");
    return { date: row.referenceDate, rate };
  }).filter((row: RatePoint) => row.date >= subtractDays(from, 10) && row.date <= to).sort((a: RatePoint, b: RatePoint) => a.date.localeCompare(b.date));
}

export async function GET(request: Request) {
  const url = new URL(request.url);
  const from = url.searchParams.get("from") || "";
  const to = url.searchParams.get("to") || "";
  const currencies = [
    ...new Set(
      (url.searchParams.get("currencies") || "")
        .split(",")
        .map((currency) => currency.trim().toUpperCase())
        .filter(Boolean),
    ),
  ];
  const isoDate = /^\d{4}-\d{2}-\d{2}$/;

  if (
    !isoDate.test(from) ||
    !isoDate.test(to) ||
    from > to ||
    !currencies.length ||
    currencies.length > 12 ||
    currencies.some((currency) => !/^[A-Z]{3}$/.test(currency))
  ) {
    return Response.json(
      { error: "Ungültiger Zeitraum oder Währungscode." },
      { status: 400 },
    );
  }

  if (url.searchParams.get("proof") === "pdf") {
    if (currencies.length !== 1 || Date.parse(to) - Date.parse(from) > 370 * 86400000)
      return Response.json({ error: "Ungültiger Nachweiszeitraum." }, { status: 400 });
    const proof = new URL(BANCA_URL);
    proof.searchParams.set("startDate", subtractDays(from, 10));
    proof.searchParams.set("endDate", to);
    proof.searchParams.set("baseCurrencyIsoCode", currencies[0]);
    proof.searchParams.set("currencyIsoCode", "EUR");
    proof.searchParams.set("lang", "en");
    try {
      const response = await fetchWithTimeout(proof, { headers: { Accept: "application/pdf" }, cache: "no-store" }, 12000);
      if (!response.ok) throw new Error("Abruf fehlgeschlagen");
      const bytes = new Uint8Array(await response.arrayBuffer());
      if (bytes.length > 5 * 1024 * 1024 || new TextDecoder().decode(bytes.slice(0, 5)) !== "%PDF-") throw new Error("Kein PDF");
      return new Response(bytes, { headers: { "Content-Type": "application/pdf", "Cache-Control": "no-store" } });
    } catch {
      return Response.json({ error: "Kursnachweis konnte nicht geladen werden." }, { status: 502 });
    }
  }

  let rates: Record<string, RatePoint[]> = {};

  try {
    rates = await fetchHistory(currencies, from, to);
  } catch {}

  const unresolved = currencies.filter((currency) => !rates[currency]?.length);
  if (unresolved.length) {
    const results = await Promise.allSettled(
      unresolved.map(async (currency) => ({
        currency,
        points: await fetchCurrency(currency, from, to),
      })),
    );
    for (const result of results) {
      if (result.status === "fulfilled" && result.value.points.length) {
        rates[result.value.currency] = result.value.points;
      }
    }
  }

  let missing = currencies.filter((currency) => !rates[currency]?.length);
  const sources = Object.fromEntries(
    currencies
      .filter((currency) => rates[currency]?.length)
      .map((currency) => [currency, "EZB"]),
  ) as Record<string, string>;

  if (missing.length) {
    const results = await Promise.allSettled(missing.map(async (currency) => ({ currency, points: await fetchBanca(currency, from, to) })));
    for (const result of results) {
      if (result.status === "fulfilled" && result.value.points.length) {
        rates[result.value.currency] = result.value.points;
        sources[result.value.currency] = "Banca d’Italia";
      }
    }
    missing = currencies.filter((currency) => !rates[currency]?.length);
  }

  if (missing.length === currencies.length) {
    return Response.json(
      {
        error: "EZB- und Banca-d’Italia-Kurse konnten derzeit nicht geladen werden.",
        missing,
      },
      { status: 502 },
    );
  }

  return Response.json(
    {
      source: "Europäische Zentralbank / Banca d’Italia",
      basis: "1 EUR",
      rates,
      sources,
      missing,
      ...(missing.length
        ? {
            warning: `Kein EZB- oder Banca-d’Italia-Referenzkurs für: ${missing.join(", ")}`,
          }
        : {}),
    },
    {
      headers: {
        "Cache-Control": "public, max-age=3600, s-maxage=86400",
      },
    },
  );
}
