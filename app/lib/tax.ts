import { fetchWithTimeout } from "./network.ts";
import { decodeReportText } from "./provider-import.ts";
import { appleFinancialPeriod, applePeriodMonth } from "./apple-period.ts";

export type Source =
  | "google"
  | "apple_sales"
  | "apple_financial"
  | "appodeal"
  | "kalkuel"
  | "expense"
  | "attachment";
export type Level = "ok" | "warn" | "error";
export type Contribution = {
  googleZm: number;
  appleZm: number;
  kz057: number;
  kz060: number;
  kz066: number;
  appodealUsd: number;
  appodealEur: number;
};
export type StoredReport = {
  id: string;
  source: Source;
  name: string;
  size: number;
  type: string;
  lastModified: number;
  year: number | null;
  month: number | null;
  level: Level;
  message: string;
  rows: number;
  contribution: Contribution;
  appleEntities?: Partial<Record<AppleEntityId, number>>;
  unresolvedAppleCountries?: string[];
  missingAppleDates?: number;
  createdAt: string;
  parserVersion?: number;
  sha256?: string;
  periodStart?: string;
  periodEnd?: string;
  monthly?: Record<string, Contribution>;
  indicativeFx?: boolean;
  expenses?: ExpenseDraft[];
};
export type Values = {
  kz000: number;
  kz057: number;
  kz060: number;
  kz066: number;
};
export type ZmRow = { uid: string; name: string; exact: number };

export const ZERO: Contribution = {
  googleZm: 0,
  appleZm: 0,
  kz057: 0,
  kz060: 0,
  kz066: 0,
  appodealUsd: 0,
  appodealEur: 0,
};
export const PARSER_VERSION = 8;
export const GOOGLE_MOR = new Set([
  "AT",
  "BE",
  "BG",
  "HR",
  "CY",
  "CZ",
  "DK",
  "EE",
  "FI",
  "FR",
  "DE",
  "GR",
  "HU",
  "IS",
  "SJ",
  "IE",
  "IT",
  "LV",
  "LI",
  "LT",
  "LU",
  "MT",
  "NL",
  "NO",
  "PL",
  "PT",
  "RO",
  "SK",
  "SI",
  "ES",
  "SE",
  "GB",
  "AX",
  "FO",
  "GI",
  "GL",
  "MC",
  "SM",
  "VA",
  "GP",
  "GF",
  "MQ",
  "YT",
  "RE",
  "BL",
  "MF",
  "PM",
  "PF",
  "NC",
  "WF",
  "IC",
  "EA",
]);
export type AppleEntityId =
  | "adi"
  | "services_pte"
  | "latam"
  | "apple_inc"
  | "canada"
  | "pty"
  | "itunes_kk";

export const APPLE_ENTITIES: Record<
  AppleEntityId,
  { name: string; zm: boolean }
> = {
  adi: { name: "Apple Distribution International Ltd. (Irland)", zm: true },
  services_pte: { name: "Apple Services Pte. Ltd. (Singapur)", zm: false },
  latam: { name: "Apple Services LATAM LLC", zm: false },
  apple_inc: { name: "Apple Inc. (USA)", zm: false },
  canada: { name: "Apple Canada, Inc.", zm: false },
  pty: { name: "Apple Pty Limited (Australien)", zm: false },
  itunes_kk: { name: "iTunes K.K. (Japan)", zm: false },
};

const APPLE_ENTITY_COUNTRIES: Record<AppleEntityId, readonly string[]> = {
  adi: [
    "AF",
    "AL",
    "DZ",
    "AO",
    "AM",
    "AT",
    "AZ",
    "BH",
    "BY",
    "BE",
    "BJ",
    "BA",
    "BW",
    "BG",
    "BF",
    "CM",
    "CV",
    "TD",
    "CN",
    "CD",
    "CG",
    "CI",
    "HR",
    "CY",
    "CZ",
    "DK",
    "EG",
    "EE",
    "FI",
    "FR",
    "GA",
    "GM",
    "GE",
    "DE",
    "GH",
    "GR",
    "GW",
    "HK",
    "HU",
    "IS",
    "IN",
    "ID",
    "IQ",
    "IE",
    "IL",
    "IT",
    "JO",
    "KZ",
    "KE",
    "XK",
    "KW",
    "KG",
    "LV",
    "LB",
    "LR",
    "LY",
    "LT",
    "LU",
    "MK",
    "MG",
    "MW",
    "MY",
    "ML",
    "MT",
    "MR",
    "MU",
    "MD",
    "ME",
    "MA",
    "MZ",
    "NA",
    "NL",
    "NE",
    "NG",
    "NO",
    "OM",
    "PK",
    "PH",
    "PL",
    "PT",
    "QA",
    "RO",
    "RU",
    "RW",
    "ST",
    "SA",
    "SN",
    "RS",
    "SC",
    "SL",
    "SG",
    "SK",
    "SI",
    "ZA",
    "ES",
    "SZ",
    "SE",
    "CH",
    "TW",
    "TJ",
    "TZ",
    "TH",
    "TN",
    "TR",
    "TM",
    "AE",
    "UG",
    "UA",
    "GB",
    "UZ",
    "VN",
    "YE",
    "ZM",
    "ZW",
  ],
  services_pte: [
    "BT",
    "BN",
    "KH",
    "LA",
    "MO",
    "MV",
    "FM",
    "MN",
    "MM",
    "NP",
    "PW",
    "LK",
    "KR",
    "FJ",
    "NR",
    "PG",
    "SB",
    "TO",
    "VU",
  ],
  latam: [
    "AR",
    "AI",
    "AG",
    "BS",
    "BB",
    "BZ",
    "BM",
    "BO",
    "BR",
    "VG",
    "KY",
    "CL",
    "CO",
    "CR",
    "DM",
    "DO",
    "EC",
    "SV",
    "GD",
    "GY",
    "GT",
    "HN",
    "JM",
    "MX",
    "MS",
    "NI",
    "PA",
    "PY",
    "PE",
    "LC",
    "VC",
    "SR",
    "TT",
    "TC",
    "UY",
    "VE",
    "KN",
  ],
  apple_inc: ["US"],
  canada: ["CA"],
  pty: ["AU", "NZ"],
  itunes_kk: ["JP"],
};

export const APPLE_ENTITY_BY_COUNTRY = Object.fromEntries(
  Object.entries(APPLE_ENTITY_COUNTRIES).flatMap(([entity, countries]) =>
    countries.map((country) => [country, entity as AppleEntityId]),
  ),
) as Record<string, AppleEntityId>;

export const APPLE_ADI = new Set(APPLE_ENTITY_COUNTRIES.adi);
export const sourceLabel: Record<Source, string> = {
  google: "Google Earnings",
  apple_sales: "Apple Sales",
  apple_financial: "Apple Financial",
  appodeal: "Appodeal",
  kalkuel: "Kalkül Ausgaben",
  expense: "Ausgabenbeleg",
  attachment: "Anlage / Zahlungsnachweis",
};

export const roundCent = (n: number) =>
  Math.round((n + Number.EPSILON) * 100) / 100;
export const vatBalance = (v: Values) =>
  roundCent(v.kz000 * 0.2 + v.kz057 - v.kz060 - v.kz066);
export const periodKey = (year: number, quarter: number) =>
  `${year}-Q${quarter}`;
export function isoDate(value: string): string {
  if (/^\d{4}-\d{2}-\d{2}$/.test(value)) return value;
  const us = value.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/);
  if (us) return `${us[3]}-${us[1].padStart(2, "0")}-${us[2].padStart(2, "0")}`;
  const english = value.match(/^([A-Za-z]+) (\d{1,2}), (\d{4})$/);
  if (english) {
    const month = [
      "jan",
      "feb",
      "mar",
      "apr",
      "may",
      "jun",
      "jul",
      "aug",
      "sep",
      "oct",
      "nov",
      "dec",
    ].indexOf(english[1].slice(0, 3).toLowerCase());
    if (month >= 0)
      return `${english[3]}-${String(month + 1).padStart(2, "0")}-${english[2].padStart(2, "0")}`;
  }
  return "";
}
export function reportContribution(
  report: StoredReport,
  year: number,
  quarter: number,
): Contribution {
  if (report.level === "error") return { ...ZERO };
  if (report.monthly) {
    const result = { ...ZERO };
    for (const [month, values] of Object.entries(report.monthly)) {
      if (
        +month.slice(0, 4) !== year ||
        Math.ceil(+month.slice(5, 7) / 3) !== quarter
      )
        continue;
      for (const key of Object.keys(ZERO) as (keyof Contribution)[])
        result[key] += values[key] || 0;
    }
    return result;
  }
  return report.year === year &&
    report.month &&
    Math.ceil(report.month / 3) === quarter
    ? report.contribution
    : { ...ZERO };
}
export type ExpenseDraft = {
  id: string;
  title: string;
  sourceName: string;
  attachmentId?: string;
  date: string;
  paymentDate: string;
  serviceDate: string;
  net: number;
  vat: number;
  share: number;
  businessNet?: number;
  vatCase: "domestic" | "reverse_charge" | "none" | "review";
  confirmed: boolean;
  excluded?: boolean;
  note: string;
};
export function expenseKey(title: string, date: string, net: number) {
  const supplier = /openai/i.test(title)
    ? "openai"
    : /apple/i.test(title)
      ? "apple"
      : /media/i.test(title)
        ? "mediamarkt"
        : title.toLowerCase().replace(/[^a-z0-9]/g, "");
  return `${supplier}:${date}:${roundCent(net)}`;
}
export function expenseContribution(expense: ExpenseDraft): Contribution {
  const out = { ...ZERO };
  if (expense.excluded) return out;
  const business =
    expense.businessNet ?? roundCent((expense.net * expense.share) / 100);
  if (expense.vatCase === "domestic" && expense.paymentDate)
    out.kz060 = (expense.vat * expense.share) / 100;
  if (expense.vatCase === "reverse_charge") {
    out.kz057 = expense.net * 0.2;
    out.kz066 = business * 0.2;
  }
  return out;
}
export function parseKalkuelExpenses(
  text: string,
  name: string,
): ExpenseDraft[] {
  return csv(text).map((r) => {
    const title = r["Kunde/Lieferant"] || r["Beschreibung"] || "Ausgabe",
      date = isoDate(r["Zahlungsdatum"] || r["Datum"] || "");
    const net = Math.abs(num(r["Gesamter Netto-Betrag"] || r.Netto)),
      businessNet = Math.abs(num(r["Netto-Buchungsbetrag"] || r.Netto));
    const gross = Math.abs(num(r["Gesamter Brutto-Betrag"] || r.Brutto));
    const rc = /reverse charge/i.test(
      r["Steuerliche Besonderheit"] || r["Steuerfall"] || "",
    );
    const review =
      (/apple/i.test(title) && gross > net) || /google/i.test(title);
    return {
      id: expenseKey(title, date, net),
      title,
      sourceName: name,
      date,
      serviceDate: date,
      paymentDate: date,
      net,
      vat: roundCent(gross - net),
      businessNet,
      share: net ? Math.round((businessNet / net) * 100) : 100,
      vatCase: review
        ? "review"
        : rc
          ? "reverse_charge"
          : gross > net
            ? "domestic"
            : "none",
      confirmed: false,
      note: [
        r.Hinweis,
        review
          ? "USt-Fall klären: Apple-Steuerausweis prüfen; Google-Gebühren ggf. bereits im Earnings-Report enthalten. Zunächst kein automatischer Vorsteuerabzug."
          : "",
        rc
          ? "Zahlungsdatum aus Export; Leistungszeitraum/Vorauszahlung prüfen."
          : "",
      ]
        .filter(Boolean)
        .join(" "),
    };
  });
}
export function parseExpenseText(
  text: string,
  name: string,
): ExpenseDraft | null {
  const issued = text.match(/Date of issue\s+([A-Za-z]+ \d{1,2}, \d{4})/i);
  if (/OpenAI Ireland/i.test(text) && issued) {
    const date = isoDate(issued[1]),
      hit = text.match(/(?:€|EUR)\s*([\d.,]+)\s+due/i);
    if (!hit) return null;
    const net = num(hit[1]),
      title = /Credits\s/i.test(text)
        ? "OpenAI Credits"
        : "OpenAI ChatGPT Plus";
    const end = text.match(/[A-Za-z]+ \d{1,2}[–-]([A-Za-z]+ \d{1,2}, \d{4})/);
    return {
      id: expenseKey(title, date, net),
      title,
      sourceName: name,
      date,
      paymentDate: "",
      serviceDate: end ? isoDate(end[1]) : date,
      net,
      vat: 0,
      share: 80,
      vatCase: "reverse_charge",
      confirmed: false,
      note: "80 % betrieblich vorgeschlagen. Steuerdatum: Leistungsende oder frühere bezahlte Vorauszahlung. Rechnung allein ist kein Zahlungsnachweis; Credits-Verbrauch/Leistungszeitpunkt prüfen.",
    };
  }
  if (/APPLE DEVELOPER PROGRAM/i.test(text)) {
    const d = text.match(/Rechnungsdatum:\s*(\d{2})\.(\d{2})\.(\d{4})/),
      date = d ? `${d[3]}-${d[2]}-${d[1]}` : "";
    const hit = text.match(/([\d,]+)\s+([\d,]+)\s+20[,.]00\s*%/);
    const net = hit ? num(hit[1]) : 0,
      vat = hit ? num(hit[2]) : 0;
    return {
      id: expenseKey("Apple", date, net),
      title: "Apple Developer",
      sourceName: name,
      date,
      paymentDate: /wurde beglichen/i.test(text) ? date : "",
      serviceDate: date,
      net,
      vat,
      share: 100,
      vatCase: "review",
      confirmed: false,
      note: "Irischer Anbieter mit AT-USt: tatsächliche Betriebsstätte/korrekten Steuerausweis oder Rechnungsberichtigung und RC klären. Kein automatischer Vorsteuerabzug.",
    };
  }
  return null;
}

export async function extractPdfText(
  buffer: ArrayBuffer,
  options: {
    signal?: AbortSignal;
    onPage?: (page: number, total: number) => void;
  } = {},
) {
  options.signal?.throwIfAborted();
  const pdfjs = await import("pdfjs-dist/legacy/build/pdf.mjs");
  pdfjs.GlobalWorkerOptions.workerSrc = "/pdf.worker.min.mjs";
  const task = pdfjs.getDocument({ data: new Uint8Array(buffer) });
  const signal = options.signal
    ? AbortSignal.any([options.signal, AbortSignal.timeout(45_000)])
    : AbortSignal.timeout(45_000);
  const cancel = () => {
    void task.destroy();
  };
  signal.addEventListener("abort", cancel, { once: true });
  try {
    signal.throwIfAborted();
    const pdf = await task.promise;
    const pages: string[] = [];
    for (let pageNo = 1; pageNo <= pdf.numPages; pageNo++) {
      signal.throwIfAborted();
      options.onPage?.(pageNo, pdf.numPages);
      const page = await pdf.getPage(pageNo),
        content = await page.getTextContent();
      pages.push(
        content.items.map((item) => ("str" in item ? item.str : "")).join(" "),
      );
      page.cleanup();
    }
    return pages.join("\n");
  } finally {
    signal.removeEventListener("abort", cancel);
    await task.destroy();
  }
}

export function csv(text: string, separator?: string) {
  const first = text.split(/\r?\n/, 1)[0] || "";
  const sep =
    separator ||
    (first.includes("\t")
      ? "\t"
      : first.split(";").length > first.split(",").length
        ? ";"
        : ",");
  const rows: string[][] = [];
  let row: string[] = [],
    cell = "",
    quoted = false;
  for (let i = 0; i < text.length; i++) {
    const c = text[i];
    if (c === '"') {
      if (quoted && text[i + 1] === '"') {
        cell += '"';
        i++;
      } else quoted = !quoted;
    } else if (c === sep && !quoted) {
      row.push(cell);
      cell = "";
    } else if ((c === "\n" || c === "\r") && !quoted) {
      if (c === "\r" && text[i + 1] === "\n") i++;
      row.push(cell);
      if (row.some(Boolean)) rows.push(row);
      row = [];
      cell = "";
    } else cell += c;
  }
  if (cell || row.length) {
    row.push(cell);
    rows.push(row);
  }
  const h = rows.shift()?.map((x) => x.trim()) || [];
  return rows.map((r) =>
    Object.fromEntries(h.map((k, i) => [k, (r[i] || "").trim()])),
  );
}
export const num = (v?: string) => {
  if (!v) return 0;
  let s = v.replace(/\s/g, "").replace(/€|\$/g, "");
  if (s.includes(",") && s.includes(".")) {
    s =
      s.lastIndexOf(",") > s.lastIndexOf(".")
        ? s.replace(/\./g, "").replace(",", ".")
        : s.replace(/,/g, "");
  } else if (s.includes(",")) s = s.replace(",", ".");
  return Number(s) || 0;
};
export const money = (n: number, currency = "EUR") =>
  new Intl.NumberFormat("de-AT", {
    style: "currency",
    currency,
    minimumFractionDigits: 2,
  }).format(n);
export function inferPeriod(name: string, text = "") {
  const hay = `${name} ${text.slice(0, 2500)}`;
  let year: number | null = null,
    month: number | null = null;
  const y = hay.match(/20\d{2}/);
  if (y) year = +y[0];
  const financialName = name.match(
    /^FD_.+_((?:0[1-9])|1[0-2])(\d{2})\.(?:txt|csv)$/i,
  );
  if (financialName) {
    month = +financialName[1];
    year = 2000 + +financialName[2];
  }
  const fullDate = hay.match(
    /(?:^|\D)(20\d{2})((?:0[1-9])|1[0-2])(?:0[1-9]|[12]\d|3[01])(?:\D|$)/,
  );
  if (fullDate && !month) {
    year = +fullDate[1];
    month = +fullDate[2];
  }
  const usDate = hay.match(
    /(?:Begin|End) Date[^\d]{0,20}((?:0?[1-9])|1[0-2])\/\d{1,2}\/(20\d{2})/i,
  );
  if (usDate && !month) {
    month = +usDate[1];
    year = +usDate[2];
  }
  const compact = hay.match(
    /(?:^|\D)(20\d{2})[-_]?((?:0?[1-9])|1[0-2])(?:\D|$)/,
  );
  if (compact && !month) {
    year = +compact[1];
    month = +compact[2];
  }
  const reverse = hay.match(
    /(?:^|\D)((?:0?[1-9])|1[0-2])[-_](20\d{2})(?:\D|$)/,
  );
  if (reverse && !month) {
    month = +reverse[1];
    year = +reverse[2];
  }
  const short = hay.match(
    /(?:^|\D)((?:0[1-9])|1[0-2])(?:[-_]?)(\d{2})(?:\D|$)/,
  );
  if (short && !month) {
    month = +short[1];
    year = 2000 + +short[2];
  }
  const names: Record<string, number> = {
    jan: 1,
    january: 1,
    jänner: 1,
    feb: 2,
    february: 2,
    februar: 2,
    mar: 3,
    march: 3,
    märz: 3,
    apr: 4,
    april: 4,
    may: 5,
    mai: 5,
    jun: 6,
    june: 6,
    juni: 6,
    jul: 7,
    july: 7,
    juli: 7,
    aug: 8,
    august: 8,
    sep: 9,
    september: 9,
    oct: 10,
    october: 10,
    oktober: 10,
    nov: 11,
    november: 11,
    dec: 12,
    december: 12,
    dezember: 12,
  };
  for (const [k, v] of Object.entries(names))
    if (new RegExp(`\\b${k}\\b`, "i").test(hay)) {
      month = v;
      break;
    }
  return { year, month };
}

type FxPoint = { date: string; rate: number };
type FxResponse = {
  source: string;
  basis: string;
  rates: Record<string, FxPoint[]>;
  sources?: Record<string, string>;
  error?: string;
};

function isoMonthEnd(year: number, month: number) {
  return new Date(Date.UTC(year, month, 0)).toISOString().slice(0, 10);
}

async function exchangeRates(
  currencies: string[],
  from: string,
  to: string,
  options: InspectionOptions,
) {
  const unique = [...new Set(currencies)].sort();
  const combined: FxResponse = {
    source: "EZB / Europäische Kommission InforEuro",
    basis: "1 EUR",
    rates: {},
    sources: {},
  };
  for (let index = 0; index < unique.length; index += 12) {
    options.signal?.throwIfAborted();
    options.onProgress?.(
      "exchange_rates",
      `Wechselkurse für ${unique.slice(index, index + 12).join(", ")} abrufen`,
    );
    const query = new URLSearchParams({
      currencies: unique.slice(index, index + 12).join(","),
      from,
      to,
    });
    const response = await fetchWithTimeout(`/api/exchange-rates?${query}`, {
      signal: options.signal,
    });
    const payload = (await response.json()) as FxResponse;
    if (!response.ok) {
      throw new Error(
        payload.error || "Referenzkurse konnten nicht geladen werden.",
      );
    }
    Object.assign(combined.rates, payload.rates);
    Object.assign(combined.sources!, payload.sources || {});
  }
  return combined;
}

function rateOnOrBefore(points: FxPoint[] | undefined, date: string) {
  return [...(points || [])].reverse().find((point) => point.date <= date);
}

export type InspectionOptions = {
  signal?: AbortSignal;
  text?: string;
  sha256?: string;
  onProgress?: (stage: "reading" | "exchange_rates", detail: string) => void;
};

export async function inspectFile(
  source: Source,
  file: File,
  options: InspectionOptions = {},
): Promise<{ record: StoredReport; blob: Blob }> {
  options.signal?.throwIfAborted();
  const hash =
    options.sha256 ||
    Array.from(
      new Uint8Array(
        await crypto.subtle.digest("SHA-256", await file.arrayBuffer()),
      ),
      (b) => b.toString(16).padStart(2, "0"),
    ).join("");
  const id = `${source}:${hash}`;
  const base = {
    id,
    sha256: hash,
    source,
    name: file.name,
    size: file.size,
    type: file.type,
    lastModified: file.lastModified,
    year: null,
    month: null,
    level: "ok" as Level,
    message: "",
    rows: 0,
    contribution: { ...ZERO },
    createdAt: new Date().toISOString(),
    parserVersion: PARSER_VERSION,
  };
  try {
    if (source === "attachment")
      return {
        record: {
          ...base,
          message: "Als Anlage gespeichert; keine automatische Steuerbuchung.",
        },
        blob: file,
      };
    if (source === "expense") {
      const text =
          options.text ??
          (await extractPdfText(await file.arrayBuffer(), {
            signal: options.signal,
            onPage: (page, total) =>
              options.onProgress?.(
                "reading",
                `PDF-Seite ${page} von ${total} lesen`,
              ),
          })),
        expense = parseExpenseText(text, file.name);
      const expenses = expense ? [expense] : [];
      const p = expense?.date
        ? { year: +expense.date.slice(0, 4), month: +expense.date.slice(5, 7) }
        : inferPeriod(file.name, text);
      return {
        record: {
          ...base,
          ...p,
          level: "warn",
          message: expense
            ? "Ausgabenentwurf erkannt – Datum, Bezahlung, Betriebsanteil und USt-Fall bestätigen."
            : "Kein sicherer Ausgabenbetrag erkannt. Beleg prüfen und Ausgabe manuell erfassen.",
          expenses,
        },
        blob: file,
      };
    }
    if (source === "appodeal") {
      if (!file.name.toLowerCase().endsWith(".pdf"))
        throw new Error("PDF erwartet");
      const buffer = await file.arrayBuffer(),
        signature = new TextDecoder("latin1").decode(buffer.slice(0, 5));
      if (signature !== "%PDF-") throw new Error("keine gültige PDF");
      const text =
          options.text ??
          (await extractPdfText(buffer, {
            signal: options.signal,
            onPage: (page, total) =>
              options.onProgress?.(
                "reading",
                `PDF-Seite ${page} von ${total} lesen`,
              ),
          })),
        p = inferPeriod(file.name, text);
      const hit = text.match(/Ad\s+revenue\s*\$\s*([0-9][0-9,.]*)/i),
        usd = hit ? num(hit[1]) : 0;
      if (!p.month || !p.year) throw new Error("Berichtsmonat nicht erkannt");
      const rateDate = isoMonthEnd(p.year, p.month);
      let eur = 0;
      let fxNote = "";
      let fxComplete = !usd;
      if (usd) {
        try {
          const fx = await exchangeRates(["USD"], rateDate, rateDate, options);
          const point = rateOnOrBefore(fx.rates.USD, rateDate);
          if (!point) throw new Error("Kein USD-Kurs im Zeitraum gefunden.");
          eur = usd / point.rate;
          fxNote = ` · ${money(eur)} zum letzten EZB-Kurs ${point.date} (1 EUR = ${point.rate} USD)`;
          fxComplete = true;
        } catch {
          fxNote = " · EUR-Umrechnung derzeit nicht verfügbar";
        }
      }
      return {
        record: {
          ...base,
          ...p,
          level: hit && fxComplete ? "ok" : "warn",
          parserVersion: PARSER_VERSION,
          message: hit
            ? `Ad revenue ${money(usd, "USD")} erkannt${fxNote}`
            : "PDF gültig; Zeile „Ad revenue“ nicht gefunden – Betrag manuell prüfen",
          contribution: {
            ...ZERO,
            appodealUsd: usd,
            appodealEur: eur,
          },
        },
        blob: file,
      };
    }
    const text = options.text ?? decodeReportText(await file.arrayBuffer());
    const p = inferPeriod(file.name, text);
    if (source === "google") {
      if (!file.name.toLowerCase().endsWith(".csv"))
        throw new Error("CSV erwartet");
      const rs = csv(text);
      if (!rs.length) throw new Error("leer oder nicht lesbar");
      for (const h of [
        "Transaction Type",
        "Buyer Country",
        "Amount (Merchant Currency)",
      ])
        if (!(h in rs[0])) throw new Error(`Pflichtspalte ${h} fehlt`);
      const merchantCurrencies = new Set(
        rs.map((r) => r["Merchant Currency"] || "EUR"),
      );
      if ([...merchantCurrencies].some((c) => c !== "EUR"))
        throw new Error(
          "Merchant Currency muss EUR sein; andere Händlerwährung zuerst belegt umrechnen.",
        );
      let zm = 0,
        fees = 0,
        relevant = 0;
      for (const r of rs) {
        const t = r["Transaction Type"] || "",
          a = num(r["Amount (Merchant Currency)"]),
          c = (r["Buyer Country"] || "").toUpperCase();
        if (
          [
            "Charge",
            "Charge refund",
            "Google fee",
            "Google fee refund",
          ].includes(t)
        ) {
          relevant++;
          if (GOOGLE_MOR.has(c)) zm += a;
        }
        if (
          ["Google fee", "Google fee refund"].includes(t) &&
          !GOOGLE_MOR.has(c)
        )
          fees -= a;
      }
      if (!relevant) throw new Error("keine relevanten Transaktionen");
      return {
        record: {
          ...base,
          ...p,
          rows: rs.length,
          message: `${relevant}/${rs.length} relevante Zeilen · GCL ZM ${money(zm)} · separat bezogene Gebühren außerhalb Wiederverkaufsgebieten ${money(fees)} (Vertragsmodell prüfen; Gebührenrechnungen nur Abgleich, nicht nochmals addieren)`,
          contribution: {
            ...ZERO,
            googleZm: zm,
            kz057: fees * 0.2,
            kz066: fees * 0.2,
          },
        },
        blob: file,
      };
    }
    if (source === "apple_sales") {
      if (!/\.(txt|csv)$/i.test(file.name))
        throw new Error("entpackte TXT erwartet");
      const financial = text.search(/^Transaction Date\tSettlement Date\t/im),
        summary = text.search(/^Provider\tProvider Country\t/im);
      if (financial >= 0)
        throw new Error(
          "Das ist ein Apple Financial Detailed Report (FD_) – bitte unter „Apple Financial“ laden.",
        );
      if (summary < 0)
        throw new Error(
          "Apple Summary Sales-Kopfzeile fehlt; erwartet wird eine S_D_- oder S_M_-Datei mit „Provider“ und „Provider Country“.",
        );
      const rs = csv(text.slice(summary));
      if (!rs.length) throw new Error("keine Verkaufszeilen");
      for (const h of [
        "Country Code",
        "Units",
        "Developer Proceeds",
        "Currency of Proceeds",
      ])
        if (!(h in rs[0])) throw new Error(`Pflichtspalte ${h} fehlt`);
      let eur = 0,
        foreign = 0;
      const entities = new Map<AppleEntityId, number>();
      const unknown = new Set<string>();
      for (const r of rs) {
        const country = (r["Country Code"] || "").toUpperCase();
        const entity = APPLE_ENTITY_BY_COUNTRY[country];
        if (!entity) {
          if (country) unknown.add(country);
          continue;
        }
        entities.set(entity, (entities.get(entity) || 0) + 1);
        if (entity !== "adi") continue;
        const amount = num(r["Units"] || "1") * num(r["Developer Proceeds"]),
          cur = (r["Currency of Proceeds"] || "EUR").toUpperCase();
        if (cur === "EUR") eur += amount;
        else if (amount) foreign++;
      }
      const entitySummary = [...entities.entries()]
        .map(([entity, count]) => `${APPLE_ENTITIES[entity].name}: ${count}`)
        .join(" · ");
      return {
        record: {
          ...base,
          ...p,
          rows: rs.length,
          level: foreign || unknown.size ? "warn" : "ok",
          unresolvedAppleCountries: [...unknown].sort(),
          message: `Summary Sales · ${rs.length} Zeilen · ${entitySummary || "keine zuordenbaren Storefronts"} · Vergleich ADI-EUR ${money(eur)}${foreign ? ` · ${foreign} Fremdwährungszeilen offen` : ""}${unknown.size ? ` · unbekannte Ländercodes: ${[...unknown].sort().join(", ")}` : ""} · nicht zusätzlich zur Financial-Summe gerechnet`,
          contribution: { ...ZERO },
        },
        blob: file,
      };
    }
    if (source === "apple_financial") {
      if (!/\.(csv|txt)$/i.test(file.name))
        throw new Error("entpackte TXT erwartet");
      const financial = text.search(/^Transaction Date\tSettlement Date\t/im),
        summary = text.search(/^Provider\tProvider Country\t/im);
      if (summary >= 0)
        throw new Error(
          "Das ist ein Apple Summary Sales Report (S_M_) – bitte unter „Apple Sales“ laden.",
        );
      if (financial < 0)
        throw new Error(
          "Apple Financial-Kopfzeile fehlt; erwartet wird eine FD_-Datei mit „Transaction Date“ und „Settlement Date“.",
        );
      let table = text.slice(financial);
      const rollup = table.search(
        /\r?\nCountry Of Sale\tPartner Share Currency\tQuantity\tExtended Partner Share(?:\r?\n|$)/i,
      );
      if (rollup >= 0) table = table.slice(0, rollup);
      const rs = csv(table);
      if (!rs.length) throw new Error("keine Financial-Transaktionen");
      for (const h of [
        "Country of Sale",
        "Quantity",
        "Partner Share",
        "Partner Share Currency",
      ])
        if (!(h in rs[0])) throw new Error(`Pflichtspalte ${h} fehlt`);
      const applePeriod = appleFinancialPeriod(text);
      const actualPeriod = applePeriod ? applePeriodMonth(applePeriod) : p;
      const fallbackDate =
        actualPeriod.year && actualPeriod.month
          ? isoMonthEnd(actualPeriod.year, actualPeriod.month)
          : new Date().toISOString().slice(0, 10);
      const items: {
        entity: AppleEntityId;
        amount: number;
        currency: string;
        date: string;
      }[] = [];
      const monthly: Record<string, Contribution> = {};
      const unknown = new Set<string>();
      let missingAppleDates = 0;
      for (const r of rs) {
        const country = (r["Country of Sale"] || "").toUpperCase();
        const entity = APPLE_ENTITY_BY_COUNTRY[country];
        const rawExtended = r["Extended Partner Share"],
          qty = num(r["Quantity"] || "1"),
          share = num(r["Partner Share"]),
          kind = (r["Sale or Return"] || "").toUpperCase();
        let amount = rawExtended ? num(rawExtended) : qty * share;
        if (kind === "R" && amount > 0) amount = -amount;
        if (!entity) {
          if (country && amount) unknown.add(country);
          continue;
        }
        const cur = (r["Partner Share Currency"] || "EUR").toUpperCase();
        if (amount) {
          const transactionDate = isoDate(
            (kind === "R" ? r["Settlement Date"] : r["Transaction Date"]) || "",
          );
          if (!transactionDate && entity === "adi") {
            missingAppleDates++;
            continue;
          }
          items.push({
            entity,
            amount,
            currency: cur,
            date: transactionDate || fallbackDate,
          });
        }
      }
      const entityTotals = Object.fromEntries(
        Object.keys(APPLE_ENTITIES).map((entity) => [entity, 0]),
      ) as Record<AppleEntityId, number>;
      for (const item of items) {
        monthly[item.date.slice(0, 7)] ||= { ...ZERO };
        if (item.currency === "EUR") {
          entityTotals[item.entity] += item.amount;
          if (item.entity === "adi")
            monthly[item.date.slice(0, 7)].appleZm += item.amount;
        }
      }
      const foreign = items.filter((item) => item.currency !== "EUR");
      let missingRates = 0;
      let indicativeFx = false;
      let fxSummary = "";
      if (foreign.length) {
        const dates = foreign.map((item) => item.date).sort();
        const currencies = [...new Set(foreign.map((item) => item.currency))];
        try {
          const fx = await exchangeRates(
            currencies,
            dates[0],
            dates[dates.length - 1],
            options,
          );
          const used = new Set<string>();
          for (const item of foreign) {
            const point = rateOnOrBefore(fx.rates[item.currency], item.date);
            if (!point) {
              missingRates++;
              if (item.entity === "adi") indicativeFx = true;
              continue;
            }
            entityTotals[item.entity] += item.amount / point.rate;
            if (item.entity === "adi")
              monthly[item.date.slice(0, 7)].appleZm +=
                item.amount / point.rate;
            const source = fx.sources?.[item.currency] || "Referenzkurs";
            if (source !== "EZB" && item.entity === "adi") indicativeFx = true;
            used.add(`${item.currency} ${point.date} (${source})`);
          }
          fxSummary = ` · ${foreign.length - missingRates}/${foreign.length} Fremdwährungszeilen automatisch umgerechnet`;
          if (used.size) {
            fxSummary += ` (${[...used].sort().join(", ")})`;
          }
        } catch {
          missingRates = foreign.length;
          indicativeFx = foreign.some((item) => item.entity === "adi");
          fxSummary =
            " · Fremdwährungszeilen konnten derzeit nicht mit EZB-/InforEuro-Kurs umgerechnet werden";
        }
      }
      const totalEur = entityTotals.adi;
      const otherEntities = (Object.keys(APPLE_ENTITIES) as AppleEntityId[])
        .filter((entity) => entity !== "adi" && entityTotals[entity])
        .map(
          (entity) =>
            `${APPLE_ENTITIES[entity].name}: ${money(entityTotals[entity])} (nicht ZM)`,
        )
        .join(" · ");
      return {
        record: {
          ...base,
          ...actualPeriod,
          rows: rs.length,
          level: !applePeriod || missingAppleDates || missingRates || unknown.size || indicativeFx ? "warn" : "ok",
          parserVersion: PARSER_VERSION,
          appleEntities: entityTotals,
          monthly,
          indicativeFx,
          missingAppleDates,
          periodStart: applePeriod?.start,
          periodEnd: applePeriod?.end,
          unresolvedAppleCountries: [...unknown].sort(),
          message: `Kalenderzuordnung nach Transaktionsdatum · ${applePeriod ? `Berichtszeitraum ${applePeriod.start} bis ${applePeriod.end} · ` : "Berichtszeitraum fehlt · "}${missingAppleDates ? `${missingAppleDates} Apple-Irland-Zeilen: Datum fehlt, nicht in ZM-Summe enthalten · ` : ""}${indicativeFx ? "InforEuro nur Schätzung: bestätigte EUR-Abrechnung/Kursbeleg fehlt · " : ""}Financial Detailed · ${rs.length} Transaktionen · ADI/Irland ${money(totalEur)} (ZM)${otherEntities ? ` · ${otherEntities}` : ""}${unknown.size ? ` · ungeklärte neue Ländercodes: ${[...unknown].sort().join(", ")}` : ""}${fxSummary}`,
          contribution: { ...ZERO, appleZm: totalEur },
        },
        blob: file,
      };
    }
    if (source === "kalkuel") {
      if (!file.name.toLowerCase().endsWith(".csv"))
        throw new Error("CSV erwartet");
      const rs = csv(text);
      if (!rs.length) throw new Error("leerer Export");
      const keys = Object.keys(rs[0]).join("|").toLowerCase();
      if (!/(brutto|netto)/.test(keys))
        throw new Error("Brutto-/Netto-Spalten fehlen");
      const expenses = parseKalkuelExpenses(text, file.name);
      const monthly: Record<string, Contribution> = {};
      for (const expense of expenses) {
        const month = expense.date.slice(0, 7);
        if (!month) continue;
        monthly[month] ||= { ...ZERO };
        const c = expenseContribution(expense);
        for (const key of Object.keys(ZERO) as (keyof Contribution)[])
          monthly[month][key] += c[key];
      }
      const combined = Object.values(monthly).reduce(
        (a, b) => {
          for (const key of Object.keys(ZERO) as (keyof Contribution)[])
            a[key] += b[key];
          return a;
        },
        { ...ZERO },
      );
      return {
        record: {
          ...base,
          ...p,
          rows: rs.length,
          message: `${rs.length} Ausgabenentwürfe; gebuchte Privatanteile nicht erneut abziehen. Einzelne Steuerdaten prüfen.`,
          monthly,
          expenses,
          contribution: combined,
        },
        blob: file,
      };
    }
    throw new Error("unbekannte Quelle");
  } catch (e) {
    const p = inferPeriod(file.name);
    return {
      record: {
        ...base,
        ...p,
        level: "error",
        message: e instanceof Error ? e.message : "Datei nicht erkannt",
      },
      blob: file,
    };
  }
}

const esc = (v: string) =>
  v.replace(
    /[<>&'\"]/g,
    (c) =>
      ({
        "<": "&lt;",
        ">": "&gt;",
        "&": "&amp;",
        "'": "&apos;",
        '"': "&quot;",
      })[c]!,
  );
const stamp = () => {
  const d = new Date();
  return {
    date: d.toISOString().slice(0, 10),
    time: d.toTimeString().slice(0, 8),
    packet: String(Date.now()).slice(-9),
  };
};
export function u30Format(year: number, quarter: number) {
  const firstMonth = (quarter - 1) * 3 + 1;
  return year > 2026 || (year === 2026 && firstMonth >= 7)
    ? "ab 07/2026"
    : "ab 01/2022";
}
export function u30Xml(
  year: number,
  quarter: number,
  tax: string,
  submitter: string,
  v: Values,
) {
  const { date, time, packet } = stamp(),
    from = `${year}-${String((quarter - 1) * 3 + 1).padStart(2, "0")}`,
    to = `${year}-${String(quarter * 3).padStart(2, "0")}`,
    opt = (tag: string, n: number) =>
      n ? `<${tag} type="kz">${n.toFixed(2)}</${tag}>` : "",
    format = u30Format(year, quarter);
  return `<?xml version="1.0" encoding="UTF-8"?>\n<!-- BMF U30 ${format}; automatisch nach Voranmeldungszeitraum gewählt -->\n<ERKLAERUNGS_UEBERMITTLUNG><INFO_DATEN><ART_IDENTIFIKATIONSBEGRIFF>FASTNR</ART_IDENTIFIKATIONSBEGRIFF><IDENTIFIKATIONSBEGRIFF>${esc(submitter)}</IDENTIFIKATIONSBEGRIFF><PAKET_NR>${packet}</PAKET_NR><DATUM_ERSTELLUNG type="datum">${date}</DATUM_ERSTELLUNG><UHRZEIT_ERSTELLUNG type="uhrzeit">${time}</UHRZEIT_ERSTELLUNG><ANZAHL_ERKLAERUNGEN>1</ANZAHL_ERKLAERUNGEN></INFO_DATEN><ERKLAERUNG art="U30"><SATZNR>1</SATZNR><ALLGEMEINE_DATEN><ANBRINGEN>U30</ANBRINGEN><ZRVON type="jahrmonat">${from}</ZRVON><ZRBIS type="jahrmonat">${to}</ZRBIS><FASTNR>${esc(tax)}</FASTNR></ALLGEMEINE_DATEN><LIEFERUNGEN_LEISTUNGEN_EIGENVERBRAUCH><KZ000 type="kz">${v.kz000.toFixed(2)}</KZ000><VERSTEUERT>${opt("KZ022", v.kz000)}${opt("KZ057", v.kz057)}</VERSTEUERT></LIEFERUNGEN_LEISTUNGEN_EIGENVERBRAUCH><VORSTEUER>${opt("KZ060", v.kz060)}${opt("KZ066", v.kz066)}</VORSTEUER></ERKLAERUNG></ERKLAERUNGS_UEBERMITTLUNG>`;
}
export function u13Xml(
  year: number,
  quarter: number,
  tax: string,
  submitter: string,
  rows: ZmRow[],
) {
  const grouped = new Map<string, ZmRow>();
  for (const row of rows) {
    const uid = row.uid.replace(/\s/g, "").toUpperCase();
    grouped.set(uid, {
      ...row,
      uid,
      exact: (grouped.get(uid)?.exact || 0) + row.exact,
    });
  }
  const { date, time, packet } = stamp(),
    from = `${year}-${String((quarter - 1) * 3 + 1).padStart(2, "0")}`,
    to = `${year}-${String(quarter * 3).padStart(2, "0")}`;
  return `<?xml version="1.0" encoding="UTF-8"?>\n<ERKLAERUNGS_UEBERMITTLUNG><INFO_DATEN><ART_IDENTIFIKATIONSBEGRIFF>FASTNR</ART_IDENTIFIKATIONSBEGRIFF><IDENTIFIKATIONSBEGRIFF>${esc(submitter)}</IDENTIFIKATIONSBEGRIFF><PAKET_NR>${packet}</PAKET_NR><DATUM_ERSTELLUNG type="datum">${date}</DATUM_ERSTELLUNG><UHRZEIT_ERSTELLUNG type="uhrzeit">${time}</UHRZEIT_ERSTELLUNG><ANZAHL_ERKLAERUNGEN>1</ANZAHL_ERKLAERUNGEN></INFO_DATEN><ERKLAERUNG art="U13"><SATZNR>1</SATZNR><ALLGEMEINE_DATEN><ANBRINGEN>U13</ANBRINGEN><ZRVON type="jahrmonat">${from}</ZRVON><ZRBIS type="jahrmonat">${to}</ZRBIS><FASTNR>${esc(tax)}</FASTNR></ALLGEMEINE_DATEN>${[
    ...grouped.values(),
  ]
    .filter((r) => Math.trunc(r.exact) !== 0)
    .map(
      (r) =>
        `<ZM><UID_MS>${esc(r.uid.replace(/\s/g, ""))}</UID_MS><SUM_BGL type="kz">${Math.trunc(r.exact)}</SUM_BGL><SOLEI>J</SOLEI></ZM>`,
    )
    .join("")}</ERKLAERUNG></ERKLAERUNGS_UEBERMITTLUNG>`;
}
export function download(
  name: string,
  body: string,
  type = "application/xml;charset=utf-8",
) {
  const a = document.createElement("a");
  a.href = URL.createObjectURL(new Blob([body], { type }));
  a.download = name;
  a.click();
  setTimeout(() => URL.revokeObjectURL(a.href), 1000);
}
