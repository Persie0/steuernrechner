export type Source =
  | "google"
  | "apple_sales"
  | "apple_financial"
  | "appodeal"
  | "kalkuel";
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
  createdAt: string;
  parserVersion?: number;
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
export const PARSER_VERSION = 5;
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
};

async function extractPdfText(buffer: ArrayBuffer) {
  const pdfjs = await import("pdfjs-dist/legacy/build/pdf.mjs");
  pdfjs.GlobalWorkerOptions.workerSrc = "/pdf.worker.min.mjs";
  const pdf = await pdfjs.getDocument({ data: new Uint8Array(buffer) }).promise;
  const pages: string[] = [];
  for (let pageNo = 1; pageNo <= pdf.numPages; pageNo++) {
    const page = await pdf.getPage(pageNo),
      content = await page.getTextContent();
    pages.push(
      content.items.map((item) => ("str" in item ? item.str : "")).join(" "),
    );
  }
  return pages.join("\n");
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

async function exchangeRates(currencies: string[], from: string, to: string) {
  const unique = [...new Set(currencies)].sort();
  const combined: FxResponse = {
    source: "EZB / Europäische Kommission InforEuro",
    basis: "1 EUR",
    rates: {},
    sources: {},
  };
  for (let index = 0; index < unique.length; index += 12) {
    const query = new URLSearchParams({
      currencies: unique.slice(index, index + 12).join(","),
      from,
      to,
    });
    const response = await fetch(`/api/exchange-rates?${query}`);
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

export async function inspectFile(
  source: Source,
  file: File,
): Promise<{ record: StoredReport; blob: Blob }> {
  const id = `${source}:${file.name}:${file.size}:${file.lastModified}`;
  const base = {
    id,
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
    if (source === "appodeal") {
      if (!file.name.toLowerCase().endsWith(".pdf"))
        throw new Error("PDF erwartet");
      const buffer = await file.arrayBuffer(),
        signature = new TextDecoder("latin1").decode(buffer.slice(0, 5));
      if (signature !== "%PDF-") throw new Error("keine gültige PDF");
      const text = await extractPdfText(buffer),
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
          const fx = await exchangeRates(["USD"], rateDate, rateDate);
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
          parserVersion: fxComplete ? PARSER_VERSION : 0,
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
    const text = await file.text();
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
          GOOGLE_MOR.has(c)
        )
          fees -= a;
      }
      if (!relevant) throw new Error("keine relevanten Transaktionen");
      return {
        record: {
          ...base,
          ...p,
          rows: rs.length,
          message: `${relevant}/${rs.length} relevante Zeilen · ZM ${money(zm)} · Gebührenbasis ${money(fees)}`,
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
          "Apple Summary Sales-Kopfzeile fehlt; erwartet wird eine S_M_-Datei mit „Provider“ und „Provider Country“.",
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
      const fallbackDate =
        p.year && p.month
          ? isoMonthEnd(p.year, p.month)
          : new Date().toISOString().slice(0, 10);
      const items: {
        entity: AppleEntityId;
        amount: number;
        currency: string;
        date: string;
      }[] = [];
      const unknown = new Set<string>();
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
        if (amount)
          items.push({ entity, amount, currency: cur, date: fallbackDate });
      }
      const entityTotals = Object.fromEntries(
        Object.keys(APPLE_ENTITIES).map((entity) => [entity, 0]),
      ) as Record<AppleEntityId, number>;
      for (const item of items)
        if (item.currency === "EUR")
          entityTotals[item.entity] += item.amount;
      const foreign = items.filter((item) => item.currency !== "EUR");
      let missingRates = 0;
      let fxSummary = "";
      if (foreign.length) {
        const dates = foreign.map((item) => item.date).sort();
        const currencies = [...new Set(foreign.map((item) => item.currency))];
        try {
          const fx = await exchangeRates(
            currencies,
            dates[0],
            dates[dates.length - 1],
          );
          const used = new Set<string>();
          for (const item of foreign) {
            const point = rateOnOrBefore(fx.rates[item.currency], item.date);
            if (!point) {
              missingRates++;
              continue;
            }
            entityTotals[item.entity] += item.amount / point.rate;
            const source = fx.sources?.[item.currency] || "Referenzkurs";
            used.add(`${item.currency} ${point.date} (${source})`);
          }
          fxSummary = ` · ${foreign.length - missingRates}/${foreign.length} Fremdwährungszeilen automatisch umgerechnet`;
          if (used.size) {
            fxSummary += ` (${[...used].sort().join(", ")})`;
          }
        } catch {
          missingRates = foreign.length;
          fxSummary =
            " · Fremdwährungszeilen konnten derzeit nicht mit EZB-/InforEuro-Kurs umgerechnet werden";
        }
      }
      const totalEur = entityTotals.adi;
      const otherEntities = (
        Object.keys(APPLE_ENTITIES) as AppleEntityId[]
      )
        .filter((entity) => entity !== "adi" && entityTotals[entity])
        .map(
          (entity) =>
            `${APPLE_ENTITIES[entity].name}: ${money(entityTotals[entity])} (nicht ZM)`,
        )
        .join(" · ");
      return {
        record: {
          ...base,
          ...p,
          rows: rs.length,
          level: missingRates || unknown.size ? "warn" : "ok",
          parserVersion: missingRates ? 0 : PARSER_VERSION,
          appleEntities: entityTotals,
          unresolvedAppleCountries: [...unknown].sort(),
          message: `Financial Detailed · ${rs.length} Transaktionen · ADI/Irland ${money(totalEur)} (ZM)${otherEntities ? ` · ${otherEntities}` : ""}${unknown.size ? ` · ungeklärte neue Ländercodes: ${[...unknown].sort().join(", ")}` : ""}${fxSummary}`,
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
      let kz060 = 0,
        kz057 = 0,
        kz066 = 0;
      for (const r of rs) {
        const blob = Object.values(r).join(" ").toLowerCase(),
          rate =
            num(r["USt-Satz"] || r["Steuersatz"] || r["Umsatzsteuer"] || "20") /
            100,
          net = Math.abs(
            num(r["Gesamter Netto-Betrag"] || r["Netto-Betrag"] || r["Netto"]),
          ),
          booked = Math.abs(
            num(
              r["Netto-Buchungsbetrag"] ||
                r["Buchungsbetrag netto"] ||
                r["Netto"],
            ),
          ),
          gross = Math.abs(num(r["Brutto-Buchungsbetrag"] || r["Brutto"]));
        if (blob.includes("reverse charge")) {
          kz057 += net * rate;
          kz066 += booked * rate;
        } else if (gross && booked) kz060 += Math.max(0, gross - booked);
      }
      return {
        record: {
          ...base,
          ...p,
          rows: rs.length,
          message: `${rs.length} Ausgaben · KZ060 ${money(kz060)} · RC-USt ${money(kz057)}`,
          contribution: { ...ZERO, kz057, kz060, kz066 },
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
  return `<?xml version="1.0" encoding="UTF-8"?>\n<!-- BMF U30 ${format}; automatisch nach Voranmeldungszeitraum gewählt -->\n<ERKLAERUNGS_UEBERMITTLUNG><INFO_DATEN><ART_IDENTIFIKATIONSBEGRIFF>FASTNR</ART_IDENTIFIKATIONSBEGRIFF><IDENTIFIKATIONSBEGRIFF>${esc(submitter)}</IDENTIFIKATIONSBEGRIFF><PAKET_NR>${packet}</PAKET_NR><DATUM_ERSTELLUNG type="datum">${date}</DATUM_ERSTELLUNG><UHRZEIT_ERSTELLUNG type="uhrzeit">${time}</UHRZEIT_ERSTELLUNG><ANZAHL_ERKLAERUNGEN>1</ANZAHL_ERKLAERUNGEN></INFO_DATEN><ERKLAERUNG art="U30"><SATZNR>1</SATZNR><ALLGEMEINE_DATEN><ANBRINGEN>U30</ANBRINGEN><ZRVON type="jahrmonat">${from}</ZRVON><ZRBIS type="jahrmonat">${to}</ZRBIS><FASTNR>${esc(tax)}</FASTNR></ALLGEMEINE_DATEN><LIEFERUNGEN_LEISTUNGEN_EIGENVERBRAUCH><KZ000 type="kz">${v.kz000.toFixed(2)}</KZ000><VERSTEUERT>${opt("KZ057", v.kz057)}</VERSTEUERT></LIEFERUNGEN_LEISTUNGEN_EIGENVERBRAUCH><VORSTEUER>${opt("KZ060", v.kz060)}${opt("KZ066", v.kz066)}</VORSTEUER></ERKLAERUNG></ERKLAERUNGS_UEBERMITTLUNG>`;
}
export function u13Xml(
  year: number,
  quarter: number,
  tax: string,
  submitter: string,
  rows: ZmRow[],
) {
  const { date, time, packet } = stamp(),
    from = `${year}-${String((quarter - 1) * 3 + 1).padStart(2, "0")}`,
    to = `${year}-${String(quarter * 3).padStart(2, "0")}`;
  return `<?xml version="1.0" encoding="UTF-8"?>\n<ERKLAERUNGS_UEBERMITTLUNG><INFO_DATEN><ART_IDENTIFIKATIONSBEGRIFF>FASTNR</ART_IDENTIFIKATIONSBEGRIFF><IDENTIFIKATIONSBEGRIFF>${esc(submitter)}</IDENTIFIKATIONSBEGRIFF><PAKET_NR>${packet}</PAKET_NR><DATUM_ERSTELLUNG type="datum">${date}</DATUM_ERSTELLUNG><UHRZEIT_ERSTELLUNG type="uhrzeit">${time}</UHRZEIT_ERSTELLUNG><ANZAHL_ERKLAERUNGEN>1</ANZAHL_ERKLAERUNGEN></INFO_DATEN><ERKLAERUNG art="U13"><SATZNR>1</SATZNR><ALLGEMEINE_DATEN><ANBRINGEN>U13</ANBRINGEN><ZRVON type="jahrmonat">${from}</ZRVON><ZRBIS type="jahrmonat">${to}</ZRBIS><FASTNR>${esc(tax)}</FASTNR></ALLGEMEINE_DATEN>${rows
    .filter((r) => r.exact)
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
