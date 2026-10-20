type RatePoint = { date: string; rate: number };

const ECB_HISTORY_URL =
  "https://www.ecb.europa.eu/stats/eurofxref/eurofxref-hist.csv";
const ECB_DATA_URL =
  "https://data-api.ecb.europa.eu/service/data/EXR";
const INFOEURO_URL =
  "https://ec.europa.eu/budg/inforeuro/api/public/monthly-rates";
const ECB_HEADERS = {
  Accept: "text/csv,application/csv;q=0.9,*/*;q=0.1",
  "User-Agent":
    "ust-assistent-at/1.0 (+https://github.com/Persie0/steuernrechner)",
};

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
  const url = new URL(
    `${ECB_DATA_URL}/D.${currency}.EUR.SP00.A`,
  );
  url.searchParams.set("startPeriod", subtractDays(from, 10));
  url.searchParams.set("endPeriod", to);
  url.searchParams.set("format", "csvdata");
  url.searchParams.set("detail", "dataonly");

  const response = await fetch(url, {
    headers: ECB_HEADERS,
  });
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

async function fetchHistory(
  currencies: string[],
  from: string,
  to: string,
) {
  const response = await fetch(ECB_HISTORY_URL, {
    headers: ECB_HEADERS,
  });
  if (!response.ok) {
    throw new Error(`EZB-Historie antwortete mit ${response.status}`);
  }

  const lines = (await response.text()).split(/\r?\n/).filter(Boolean);
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

type InforEuroRow = Record<string, unknown>;

function inforEuroRows(payload: unknown): InforEuroRow[] {
  if (Array.isArray(payload)) return payload as InforEuroRow[];
  if (!payload || typeof payload !== "object") return [];
  for (const key of ["content", "rates", "data", "results"]) {
    const value = (payload as Record<string, unknown>)[key];
    if (Array.isArray(value)) return value as InforEuroRow[];
  }
  return [];
}

function readString(row: InforEuroRow, keys: string[]) {
  for (const key of keys) {
    const value = row[key];
    if (typeof value === "string" && value.trim()) return value.trim();
  }
  return "";
}

function readNumber(row: InforEuroRow, keys: string[]) {
  for (const key of keys) {
    const value = row[key];
    const number =
      typeof value === "number"
        ? value
        : typeof value === "string"
          ? Number(value.replace(",", "."))
          : Number.NaN;
    if (Number.isFinite(number) && number > 0) return number;
  }
  return Number.NaN;
}

async function fetchInforEuroMonth(year: number, month: number) {
  const url = new URL(INFOEURO_URL);
  url.searchParams.set("year", String(year));
  url.searchParams.set("month", String(month));
  const response = await fetch(url, { headers: ECB_HEADERS });
  if (!response.ok) {
    throw new Error(`InforEuro antwortete mit ${response.status}`);
  }
  const rows = inforEuroRows(await response.json());
  const date = `${year}-${String(month).padStart(2, "0")}-01`;
  const rates: Record<string, RatePoint> = {};
  for (const row of rows) {
    const currency = readString(row, [
      "isoCode",
      "isoA3Code",
      "currencyIsoCode",
      "currencyCode",
      "currency",
    ]).toUpperCase();
    const rate = readNumber(row, [
      "value",
      "rate",
      "exchangeRate",
      "amount",
    ]);
    if (/^[A-Z]{3}$/.test(currency) && Number.isFinite(rate)) {
      rates[currency] = { date, rate };
    }
  }
  return rates;
}

function monthsBetween(from: string, to: string) {
  const start = new Date(`${from.slice(0, 7)}-01T00:00:00Z`);
  const end = new Date(`${to.slice(0, 7)}-01T00:00:00Z`);
  const months: { year: number; month: number }[] = [];
  while (start <= end) {
    months.push({
      year: start.getUTCFullYear(),
      month: start.getUTCMonth() + 1,
    });
    start.setUTCMonth(start.getUTCMonth() + 1);
  }
  return months;
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
    const monthResults = await Promise.allSettled(
      monthsBetween(from, to).map(({ year, month }) =>
        fetchInforEuroMonth(year, month),
      ),
    );
    for (const result of monthResults) {
      if (result.status !== "fulfilled") continue;
      for (const currency of missing) {
        const point = result.value[currency];
        if (!point) continue;
        (rates[currency] ||= []).push(point);
        sources[currency] = "EU InforEuro";
      }
    }
    for (const currency of missing) {
      rates[currency]?.sort((a, b) => a.date.localeCompare(b.date));
    }
    missing = currencies.filter((currency) => !rates[currency]?.length);
  }

  if (missing.length === currencies.length) {
    return Response.json(
      {
        error: "EZB-Kurse konnten derzeit nicht geladen werden.",
        missing,
      },
      { status: 502 },
    );
  }

  return Response.json(
    {
      source: "Europäische Zentralbank / Europäische Kommission InforEuro",
      basis: "1 EUR",
      rates,
      sources,
      missing,
      ...(missing.length
        ? {
            warning: `Kein EZB- oder InforEuro-Referenzkurs für: ${missing.join(", ")}`,
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
