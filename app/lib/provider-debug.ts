type Payload = Record<string, unknown>;
type DebugEntry = {
  zeit: string;
  aktion: string;
  zeitraum?: string;
  httpStatus?: number;
  dauerMs: number;
  datei?: string;
  groesseBytes?: number;
  hinweis?: string;
};
type RawFile = { path: string; bytes: Uint8Array };
const reportKinds = new Set(["apple_finance", "apple_sales", "google_list", "google_file", "appodeal_result"]);
const maxBytes = 100 * 1024 * 1024;

export function createProviderDebug() {
  const events: DebugEntry[] = [], files: RawFile[] = [];
  let bytesStored = 0;
  return {
    events,
    files,
    clear() {
      events.length = 0;
      files.length = 0;
      bytesStored = 0;
    },
    addNote(provider: string, message: string, secrets: string[] = []) {
      let clean = message
        .replace(/-----BEGIN [^-]*PRIVATE KEY-----[\s\S]*?-----END [^-]*PRIVATE KEY-----/g, "[entfernt]")
        .replace(/\bBearer\s+[^\s]+/gi, "Bearer [entfernt]")
        .replace(/((?:api[_-]?key|access[_-]?token|assertion)=)[^\s&]+/gi, "$1[entfernt]");
      for (const secret of secrets)
        if (secret.length >= 4) clean = clean.split(secret).join("[entfernt]");
      events.push({ zeit: new Date().toISOString(), aktion: /^(apple|google|appodeal)$/.test(provider) ? `${provider}_verarbeitung` : "verarbeitung", dauerMs: 0, hinweis: clean.slice(0, 4000) });
    },
    applePeriod(month: string, start: string, end: string, included: boolean) {
      if (![month, start, end].every((value) => /^20\d{2}-\d{2}(?:-\d{2})?$/.test(value))) return;
      events.push({
        zeit: new Date().toISOString(),
        aktion: "apple_zeitraum_erkannt",
        zeitraum: month,
        dauerMs: 0,
        hinweis: `Berichtszeitraum ${start} bis ${end}; ${included ? "für das Quartal berücksichtigt" : "außerhalb des Quartals"}.`,
      });
    },
    capture(payload: Payload, status: number | undefined, raw: Uint8Array | undefined, durationMs: number, note?: string) {
      const kind = typeof payload.kind === "string" && /^(apple_finance|apple_sales|google_token|google_list|google_file|appodeal_start|appodeal_status|appodeal_result)$/.test(payload.kind)
        ? payload.kind : "unbekannt";
      const selected = typeof payload.date === "string" && /^20\d{2}-\d{2}(?:-\d{2})?$/.test(payload.date)
        ? payload.date
        : typeof payload.object === "string" && /^earnings\/earnings_20\d{4}(?:_[A-Za-z0-9_-]{1,100})?\.zip$/.test(payload.object)
          ? payload.object.split("/").pop()
          : typeof payload.from === "string" && typeof payload.to === "string" && /^20\d{2}-\d{2}-\d{2}$/.test(payload.from) && /^20\d{2}-\d{2}-\d{2}$/.test(payload.to)
            ? `${payload.from} bis ${payload.to}` : undefined;
      const entry: DebugEntry = { zeit: new Date().toISOString(), aktion: kind, zeitraum: selected, httpStatus: status, dauerMs: Math.max(0, Math.round(durationMs)), hinweis: note };
      if (raw && status === 200 && reportKinds.has(kind)) {
        const text = kind === "appodeal_result" ? new TextDecoder().decode(raw) : "";
        const apiKey = typeof payload.apiKey === "string" ? payload.apiKey : "";
        if (kind === "appodeal_result" && ((apiKey && text.includes(apiKey)) || /"(?:api.?key|access.?token|private.?key|secret)"\s*:/i.test(text)))
          entry.hinweis = "Rohantwort enthält möglicherweise Zugangsdaten und wurde nicht gespeichert.";
        else if (bytesStored + raw.byteLength > maxBytes)
          entry.hinweis = "Debug-Speicherlimit von 100 MB erreicht; Rohdatei nicht gespeichert.";
        else {
          const suffix = kind === "google_file" ? ".zip" : kind === "appodeal_result" || kind === "google_list" ? ".json" : raw[0] === 0x1f && raw[1] === 0x8b ? ".gz" : ".txt";
          const name = selected?.replace(/[^A-Za-z0-9_-]/g, "_").slice(0, 80) || "antwort";
          const path = `berichte/${String(events.length + 1).padStart(3, "0")}_${kind}_${name}${suffix}`;
          files.push({ path, bytes: raw });
          bytesStored += raw.byteLength;
          entry.datei = path;
          entry.groesseBytes = raw.byteLength;
        }
      } else if (kind === "google_token") entry.hinweis = "Anmeldeantwort nicht gespeichert.";
      events.push(entry);
    },
  };
}

export type ProviderDebug = ReturnType<typeof createProviderDebug>;

export async function buildProviderDebugZip(debug: ProviderDebug) {
  const { default: JSZip } = await import("jszip");
  const zip = new JSZip();
  zip.file("protokoll.json", JSON.stringify({ erstellt: new Date().toISOString(), hinweis: "Nur die aktuelle Sitzung. Zugangsdaten und OAuth-Antworten werden nicht protokolliert. Fehlerantworten sind vom Server bereinigt.", abrufe: debug.events }, null, 2));
  zip.file("README.txt", "Die Dateien unter berichte/ enthalten die vom Browser empfangenen Berichtsantworten unverändert. Sie können vertrauliche Finanzdaten enthalten. Authentifizierung und bereinigte Anbieterfehler sind nicht als Rohdatei enthalten.\n");
  for (const file of debug.files) zip.file(file.path, file.bytes);
  return zip.generateAsync({ type: "uint8array" });
}
