import {
  createAppleToken,
  createGoogleAssertion,
  type AppleCredentials,
  type GoogleServiceAccount,
} from "./provider-auth.ts";
import { appleFinancialPeriod, firstUncoveredDate, type ApplePeriod } from "./apple-period.ts";
import type { ProviderDebug } from "./provider-debug.ts";

export type ProviderName = "apple" | "google" | "appodeal";
export type ProviderCredentials = {
  apple: AppleCredentials;
  google: { bucket: string; serviceAccountJson: string };
  appodeal: { apiKey: string; userId: string };
};

export function configuredProviders(credentials: ProviderCredentials): ProviderName[] {
  const result: ProviderName[] = [];
  const apple = credentials.apple;
  if (apple.issuerId && apple.keyId && /^\d{4,32}$/.test(apple.vendor) && apple.privateKey.includes("BEGIN PRIVATE KEY"))
    result.push("apple");
  try {
    const google = JSON.parse(credentials.google.serviceAccountJson);
    if (credentials.google.bucket && typeof google.client_email === "string" && google.client_email && typeof google.private_key === "string" && google.private_key)
      result.push("google");
  } catch {}
  if (credentials.appodeal.apiKey && /^\d{1,32}$/.test(credentials.appodeal.userId))
    result.push("appodeal");
  return result;
}

export function appleReportMonths(year: number, quarter: number) {
  if (
    !Number.isInteger(year) ||
    year < 2001 ||
    year > 2099 ||
    ![1, 2, 3, 4].includes(quarter)
  )
    throw new Error("Ungültiges Quartal.");
  return Array.from({ length: 8 }, (_, i) => {
    const date = new Date(Date.UTC(year, (quarter - 1) * 3 - 1 + i, 1));
    return `${date.getUTCFullYear()}-${String(date.getUTCMonth() + 1).padStart(2, "0")}`;
  });
}

export function googleEarningsObjects(year: number, quarter: number) {
  if (
    !Number.isInteger(year) ||
    year < 2001 ||
    year > 2099 ||
    ![1, 2, 3, 4].includes(quarter)
  )
    throw new Error("Ungültiges Quartal.");
  return [quarter * 3 - 2, quarter * 3 - 1, quarter * 3].map(
    (month) => `earnings/earnings_${year}${String(month).padStart(2, "0")}.zip`,
  );
}

export function decodeReportText(input: Uint8Array | ArrayBuffer) {
  const bytes = input instanceof Uint8Array ? input : new Uint8Array(input);
  if (bytes[0] === 0xff && bytes[1] === 0xfe)
    return new TextDecoder("utf-16le").decode(bytes);
  if (bytes[0] === 0xfe && bytes[1] === 0xff)
    return new TextDecoder("utf-16be").decode(bytes);
  const sample = bytes.slice(0, 128);
  const oddZeros = sample.filter(
    (value, index) => index % 2 === 1 && value === 0,
  ).length;
  if (oddZeros > sample.length / 6)
    return new TextDecoder("utf-16le").decode(bytes);
  return new TextDecoder("utf-8").decode(bytes);
}

export async function gunzipReport(input: Uint8Array) {
  let result = input;
  for (
    let layer = 0;
    layer < 2 && result[0] === 0x1f && result[1] === 0x8b;
    layer++
  ) {
    const stream = new Blob([result as BlobPart])
      .stream()
      .pipeThrough(new DecompressionStream("gzip"));
    const reader = stream.getReader();
    const chunks: Uint8Array[] = [];
    let size = 0;
    while (true) {
      const { value, done } = await reader.read();
      if (done) break;
      size += value.length;
      if (size > 50 * 1024 * 1024) {
        await reader.cancel();
        throw new Error("Bericht ist entpackt größer als 50 MB.");
      }
      chunks.push(value);
    }
    const merged = new Uint8Array(size);
    let offset = 0;
    for (const chunk of chunks) {
      merged.set(chunk, offset);
      offset += chunk.length;
    }
    result = merged;
  }
  return result;
}
export type ProviderProgress = (message: string) => void;
export type ProviderDownload = { files: File[]; warnings: string[] };
type ProviderOptions = { signal?: AbortSignal; progress?: ProviderProgress; debug?: ProviderDebug; onDebug?: () => void };

class ProviderError extends Error {
  readonly status: number;
  constructor(message: string, status: number) {
    super(message);
    this.status = status;
  }
}
async function relay(payload: Record<string, unknown>, options: ProviderOptions) {
  const started = Date.now();
  let response: Response;
  try {
    response = await fetch("/api/provider-reports", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
      signal: options.signal,
      cache: "no-store",
    });
  } catch (error) {
    if (!options.signal?.aborted) {
      options.debug?.capture(payload, undefined, undefined, Date.now() - started, "Netzwerkfehler.");
      options.onDebug?.();
    }
    throw error;
  }
  if (options.debug && !options.signal?.aborted) {
    let raw: Uint8Array | undefined, note: string | undefined;
    if (response.ok && ["apple_finance", "apple_sales", "google_list", "google_file", "appodeal_result"].includes(String(payload.kind))) {
      try { raw = new Uint8Array(await response.clone().arrayBuffer()); }
      catch { note = "Rohantwort konnte für das Debug-ZIP nicht gelesen werden."; }
    }
    if (!options.signal?.aborted) {
      options.debug.capture(payload, response.status, raw, Date.now() - started, note);
      options.onDebug?.();
    }
  }
  if (!response.ok) {
    const result = await response.json().catch(() => ({}));
    throw new ProviderError(
      typeof result.error === "string" ? result.error : "Abruf fehlgeschlagen.",
      response.status,
    );
  }
  return response;
}
function reportError(error: unknown) {
  return error instanceof Error ? error.message : "Abruf fehlgeschlagen.";
}
function checkCancelled(error: unknown, signal?: AbortSignal) {
  if (signal?.aborted) throw error;
}

export async function downloadAppleReports(
  config: AppleCredentials,
  year: number,
  quarter: number,
  options: ProviderOptions = {},
): Promise<ProviderDownload> {
  const token = await createAppleToken(config);
  const files: File[] = [],
    warnings: string[] = [];
  const periods: ApplePeriod[] = [];
  const from = `${year}-${String(quarter * 3 - 2).padStart(2, "0")}-01`;
  const to = new Date(Date.UTC(year, quarter * 3, 0)).toISOString().slice(0, 10);
  const months = appleReportMonths(year, quarter);
  for (const month of months) {
    options.signal?.throwIfAborted();
    options.progress?.(`Apple Financial ${month} abrufen …`);
    try {
      const response = await relay(
        { kind: "apple_finance", vendor: config.vendor, date: month, token },
        options,
      );
      const bytes = await gunzipReport(
        new Uint8Array(await response.arrayBuffer()),
      );
      const text = decodeReportText(bytes);
      if (!/^Transaction Date\tSettlement Date\t/im.test(text))
        throw new Error("Kein Financial-Detailed-Bericht zurückgegeben.");
      const period = appleFinancialPeriod(text);
      if (!period) throw new Error("Berichtszeitraum fehlt oder ist ungültig.");
      const overlaps = period.end >= from && period.start <= to;
      options.debug?.applePeriod(month, period.start, period.end, overlaps);
      options.onDebug?.();
      if (!overlaps) continue;
      if (periods.some((other) => other.start === period.start && other.end === period.end)) {
        warnings.push(`Apple: Mehrere Antworten für ${period.start} bis ${period.end}; Zeitraum prüfen.`);
        continue;
      }
      periods.push(period);
      files.push(
        new File(
          [bytes as BlobPart],
          `FD_${config.vendor}_${period.start.replace(/-/g, "")}_${period.end.replace(/-/g, "")}.txt`,
          { type: "text/plain" },
        ),
      );
    } catch (error) {
      checkCancelled(error, options.signal);
      if (error instanceof ProviderError && [401, 403].includes(error.status)) {
        if (!files.length) throw error;
        warnings.push(`Apple ${month}: ${reportError(error)}`);
        return { files, warnings };
      }
      if (!(error instanceof ProviderError && error.status === 404))
        warnings.push(`Apple API-Monat ${month}: ${reportError(error)}`);
    }
  }
  const uncovered = firstUncoveredDate(periods, from, to);
  if (uncovered)
    warnings.push(`Apple: Ab ${uncovered} ist das Quartal durch die abgerufenen Financial-Berichte nicht lückenlos abgedeckt. Bereits lokal gespeicherte Berichte werden bei der Quartalsprüfung berücksichtigt.`);
  // Daily summaries are supporting evidence only; the existing parser does not add them to ZM.
  const end = new Date(Date.UTC(year, quarter * 3, 0));
  for (let day = 6; day >= 0; day--) {
    const date = new Date(end);
    date.setUTCDate(date.getUTCDate() - day);
    const dayText = date.toISOString().slice(0, 10);
    options.signal?.throwIfAborted();
    options.progress?.(`Apple Tagesbericht ${dayText} abrufen …`);
    try {
      const response = await relay(
        { kind: "apple_sales", vendor: config.vendor, date: dayText, token },
        options,
      );
      const bytes = await gunzipReport(
        new Uint8Array(await response.arrayBuffer()),
      );
      const text = decodeReportText(bytes);
      if (!/^Provider\tProvider Country\t/im.test(text))
        throw new Error("Kein Sales-Summary-Bericht zurückgegeben.");
      files.push(
        new File(
          [bytes as BlobPart],
          `S_D_${config.vendor}_${dayText.replace(/-/g, "")}.txt`,
          { type: "text/plain" },
        ),
      );
    } catch (error) {
      checkCancelled(error, options.signal);
      if (error instanceof ProviderError && [401, 403].includes(error.status)) {
        if (!files.length) throw error;
        warnings.push(`Apple ${dayText}: ${reportError(error)}`);
        return { files, warnings };
      }
      warnings.push(`Apple ${dayText}: ${reportError(error)}`);
    }
  }
  return { files, warnings };
}

export async function downloadGoogleReports(
  config: { bucket: string; serviceAccount: GoogleServiceAccount },
  year: number,
  quarter: number,
  options: ProviderOptions = {},
): Promise<ProviderDownload> {
  options.progress?.("Google-Anmeldung vorbereiten …");
  const assertion = await createGoogleAssertion(config.serviceAccount);
  const tokenResponse = await relay(
    { kind: "google_token", assertion },
    options,
  );
  const auth = await tokenResponse.json();
  if (typeof auth.access_token !== "string")
    throw new Error("Google hat kein Zugriffstoken zurückgegeben.");
  const token: string = auth.access_token;
  const standard = googleEarningsObjects(year, quarter);
  const files: File[] = [], warnings: string[] = [];
  let selected = standard;
  try {
    const found = new Set<string>();
    let pageToken: string | undefined;
    let pages = 0;
    do {
      options.signal?.throwIfAborted();
      options.progress?.(`Google-Berichtsverzeichnis durchsuchen (Seite ${++pages}) …`);
      if (pages > 20) throw new Error("Zu viele Seiten im Google-Berichtsverzeichnis.");
      const response = await relay({ kind: "google_list", bucket: config.bucket, token, ...(pageToken ? { pageToken } : {}) }, options);
      const listing = await response.json();
      if (listing.items !== undefined && !Array.isArray(listing.items)) throw new Error("Ungültiges Google-Berichtsverzeichnis.");
      for (const item of listing.items || []) {
        const name = item?.name;
        if (typeof name === "string" && /^earnings\/earnings_20\d{2}(0[1-9]|1[0-2])(?:_[A-Za-z0-9_-]{1,100})?\.zip$/.test(name) &&
          standard.some((expected) => name.startsWith(expected.slice(0, -4)) && [".", "_"].includes(name[expected.length - 4]))) found.add(name);
      }
      pageToken = typeof listing.nextPageToken === "string" && listing.nextPageToken ? listing.nextPageToken : undefined;
    } while (pageToken);
    selected = standard.filter((name) => found.has(name));
    const additional = [...found].filter((name) => !standard.includes(name));
    if (additional.length) warnings.push(`Google: ${additional.length} zusätzliche Berichtsdatei(en) gefunden. Bitte separat prüfen; sie werden nicht automatisch zur Steuerberechnung addiert.`);
    for (const expected of standard)
      if (!selected.includes(expected))
        warnings.push(`Google ${expected.split("/").pop()}: Keine Datei für diesen Monat im angegebenen Bucket gefunden. Prüfe die Speicher-URI unter Finanzberichte in der Play Console.`);
  } catch (error) {
    checkCancelled(error, options.signal);
    warnings.push(`Google-Berichtsverzeichnis nicht lesbar (${reportError(error)}). Standarddateinamen werden direkt versucht; prüfe Finanz-Bucket und Berechtigung zum Auflisten der Objekte.`);
    selected = standard;
  }
  for (const object of selected) {
    options.signal?.throwIfAborted();
    options.progress?.(`Google ${object.split("/").pop()} abrufen …`);
    try {
      const response = await relay(
        { kind: "google_file", bucket: config.bucket, object, token },
        options,
      );
      const bytes = new Uint8Array(await response.arrayBuffer());
      const name = object.split("/").pop() || "earnings.zip";
      files.push(new File([bytes as BlobPart], name));
    } catch (error) {
      checkCancelled(error, options.signal);
      if (error instanceof ProviderError && [401, 403].includes(error.status)) {
        if (!files.length) throw error;
        warnings.push(
          `Google ${object.split("/").pop()}: ${reportError(error)}`,
        );
        return { files, warnings };
      }
      warnings.push(`Google ${object.split("/").pop()}: ${reportError(error)}`);
    }
  }
  return { files, warnings };
}

function wait(ms: number, signal?: AbortSignal) {
  return new Promise<void>((resolve, reject) => {
    if (signal?.aborted) {
      reject(signal.reason);
      return;
    }
    const done = () => {
      signal?.removeEventListener("abort", cancel);
      resolve();
    };
    const timer = setTimeout(done, ms);
    const cancel = () => {
      clearTimeout(timer);
      reject(signal?.reason);
    };
    signal?.addEventListener("abort", cancel, { once: true });
  });
}

export async function downloadAppodealReport(
  config: { apiKey: string; userId: string },
  year: number,
  quarter: number,
  options: ProviderOptions = {},
): Promise<ProviderDownload> {
  const from = `${year}-${String(quarter * 3 - 2).padStart(2, "0")}-01`;
  const to = new Date(Date.UTC(year, quarter * 3, 0))
    .toISOString()
    .slice(0, 10);
  const auth = { apiKey: config.apiKey, userId: config.userId };
  options.progress?.("Appodeal-Statistik anfordern …");
  const start = await (
    await relay({ kind: "appodeal_start", ...auth, from, to }, options)
  ).json();
  const taskId = start.task_id ?? start.data?.task_id;
  if (typeof taskId !== "string" && typeof taskId !== "number")
    throw new Error(
      "Appodeal hat keine Berichts-ID zurückgegeben. Schlüssel und User-ID prüfen.",
    );
  for (let attempt = 0; attempt < 30; attempt++) {
    options.signal?.throwIfAborted();
    options.progress?.(
      `Appodeal bereitet die Statistik vor (${attempt + 1}/30) …`,
    );
    const statusResponse = await relay(
      { kind: "appodeal_status", ...auth, taskId: String(taskId) },
      options,
    );
    await statusResponse.arrayBuffer();
    const result = await (
      await relay(
        { kind: "appodeal_result", ...auth, taskId: String(taskId) },
        options,
      )
    ).json();
    if (Number(result.code) === 0 && Array.isArray(result.data)) {
      // Store only report rows, never the request credentials or task metadata.
      const clean = (value: unknown): unknown => {
        if (Array.isArray(value)) return value.map(clean);
        if (value && typeof value === "object")
          return Object.fromEntries(
            Object.entries(value)
              .filter(([key]) => !/api.?key|token|secret|user.?id/i.test(key))
              .map(([key, item]) => [key, clean(item)]),
          );
        if (
          typeof value === "string" &&
          config.apiKey &&
          value.includes(config.apiKey)
        )
          return "[entfernt]";
        return value;
      };
      const rows = clean(result.data);
      const revenue = result.data.map((row: unknown) => {
        if (!row || typeof row !== "object" || !("revenue" in row)) return NaN;
        const amount = (row as { revenue: unknown }).revenue;
        return amount === "" || amount === null ? NaN : Number(amount);
      });
      const summary =
        revenue.length && revenue.every(Number.isFinite)
          ? [
              `Dashboard-Umsatz: ${new Intl.NumberFormat("de-AT", { maximumFractionDigits: 2 }).format(revenue.reduce((sum: number, amount: number) => sum + amount, 0))} (Währung im Appodeal-Dashboard prüfen).`,
            ]
          : [];
      return {
        files: [
          new File(
            [
              JSON.stringify(
                { source: "Appodeal Reporting API", from, to, data: rows },
                null,
                2,
              ),
            ],
            `Appodeal_Statistik_${from}_Q${quarter}.json`,
            { type: "application/json" },
          ),
        ],
        warnings: [
          "Appodeal-Dashboardstatistik nur zum Abgleich; keine zusätzliche UVA-/ZM-Buchung.",
          ...summary,
        ],
      };
    }
    if (result.url)
      throw new Error(
        "Appodeal hat einen externen Download bereitgestellt. Bitte den Bericht im Dashboard herunterladen.",
      );
    await wait(1500, options.signal);
  }
  throw new Error(
    "Appodeal-Bericht ist noch nicht fertig. Bitte später erneut abrufen.",
  );
}
