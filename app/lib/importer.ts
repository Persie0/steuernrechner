import { detectSource } from "./quarterly.ts";
import { reportQuarterHint } from "./quarter-hints.ts";
import {
  extractPdfText,
  inspectFile,
  type Source,
  type StoredReport,
} from "./tax.ts";

export type UploadFeedback = {
  level: "ok" | "warn" | "error";
  message: string;
};
export type ImportProgress = {
  stage:
    | "queued"
    | "unpacking"
    | "reading"
    | "exchange_rates"
    | "saving"
    | "done"
    | "cancelled"
    | "error";
  currentFile: string;
  detail: string;
  completed: number;
  total: number;
  startedAt?: number;
  updatedAt?: number;
};
type ProgressOptions = {
  signal?: AbortSignal;
  onProgress?: (progress: ImportProgress) => void;
  onFeedback?: (feedback: UploadFeedback) => void;
};

// Give React and the browser a paint opportunity before starting the next file.
const yieldToBrowser = () =>
  new Promise<void>((resolve) => setTimeout(resolve, 0));

export async function expandImportFiles(
  input: File[],
  options: ProgressOptions = {},
) {
  const files: File[] = [],
    feedback: UploadFeedback[] = [];
  const report = (message: UploadFeedback) => {
    feedback.push(message);
    options.onFeedback?.(message);
  };
  for (const file of input) {
    if (options.signal?.aborted) break;
    if (!/\.zip$/i.test(file.name)) {
      files.push(file);
      continue;
    }
    if (file.size > 100 * 1024 * 1024) {
      report({ level: "error", message: `${file.name}: ZIP maximal 100 MB.` });
      continue;
    }
    try {
      options.onProgress?.({
        stage: "unpacking",
        currentFile: file.name,
        detail: "ZIP öffnen",
        completed: 0,
        total: 0,
      });
      await yieldToBrowser();
      const { default: JSZip } = await import("jszip");
      const zip = await JSZip.loadAsync(await file.arrayBuffer());
      const entries = Object.values(zip.files).filter(
        (entry) =>
          !entry.dir && !/(?:^|\/)__MACOSX\/|(?:^|\/)\./.test(entry.name),
      );
      let totalBytes = 0,
        completed = 0;
      for (const entry of entries.slice(0, 500)) {
        if (options.signal?.aborted) break;
        const notify = (detail: string) =>
          options.onProgress?.({
            stage: "unpacking",
            currentFile: entry.name,
            detail: `${file.name} · ${detail}`,
            completed,
            total: Math.min(entries.length, 500),
          });
        notify("Datei entpacken");
        await yieldToBrowser();
        const bytes = await entry.async("uint8array", (metadata) =>
          notify(`Datei ${Math.floor(metadata.percent)} % entpackt`),
        );
        totalBytes += bytes.length;
        if (totalBytes > 100 * 1024 * 1024) {
          report({
            level: "error",
            message: `${file.name}: entpackter Inhalt über 100 MB.`,
          });
          break;
        }
        files.push(
          new File(
            [bytes as BlobPart],
            entry.name.split("/").pop() || entry.name,
            { lastModified: entry.date.getTime() },
          ),
        );
        completed++;
        notify("Datei entpackt");
      }
      if (entries.length > 500)
        report({
          level: "error",
          message: `${file.name}: maximal 500 Dateien je ZIP.`,
        });
    } catch (error) {
      if (options.signal?.aborted) break;
      report({
        level: "error",
        message: `${file.name}: ZIP konnte nicht gelesen werden (${error instanceof Error ? error.message : "ungültige Datei"}).`,
      });
    }
  }
  return { files, feedback, cancelled: !!options.signal?.aborted };
}

export async function importDocumentBatch(
  files: File[],
  options: ProgressOptions & {
    source?: Source;
    existingHashes: Set<string>;
    existingReports?: StoredReport[];
    save: (record: StoredReport, blob: Blob) => Promise<void>;
  },
) {
  const records: StoredReport[] = [],
    feedback: UploadFeedback[] = [];
  const hashes = new Set(options.existingHashes);
  const knownReports = new Map(
    (options.existingReports || [])
      .filter((record) => !!record.sha256)
      .map((record) => [record.sha256!, record]),
  );
  let completed = 0;
  const report = (message: UploadFeedback) => {
    feedback.push(message);
    options.onFeedback?.(message);
  };
  for (const file of files) {
    if (options.signal?.aborted) break;
    const progress = (stage: ImportProgress["stage"], detail: string) =>
      options.onProgress?.({
        stage,
        detail,
        currentFile: file.name,
        completed,
        total: files.length,
      });
    progress("reading", "Datei lesen und auf Kopien prüfen");
    await yieldToBrowser();
    try {
      if (file.size > 50 * 1024 * 1024)
        throw new Error("maximal 50 MB je Datei.");
      const buffer = await file.arrayBuffer();
      const hash = Array.from(
        new Uint8Array(await crypto.subtle.digest("SHA-256", buffer)),
        (b) => b.toString(16).padStart(2, "0"),
      ).join("");
      options.signal?.throwIfAborted();
      if (hashes.has(hash)) {
        const existing = knownReports.get(hash);
        report({
          level: "warn",
          message: `${file.name}: ${existing ? `${reportQuarterHint(existing).label} · ` : ""}identischer Inhalt bereits vorhanden, nicht doppelt gerechnet.`,
        });
      } else {
        let source = options.source;
        let text: string | undefined;
        if (!source) {
          if (/\.(csv|txt)$/i.test(file.name))
            text = new TextDecoder().decode(buffer);
          else if (/\.pdf$/i.test(file.name) && !/^report_/i.test(file.name)) {
            progress("reading", "PDF erkennen");
            text = await extractPdfText(buffer, {
              signal: options.signal,
              onPage: (page, total) =>
                progress("reading", `PDF-Seite ${page} von ${total} lesen`),
            });
          }
          source = detectSource(file.name, text);
        }
        options.signal?.throwIfAborted();
        const value = await inspectFile(source, file, {
          text,
          sha256: hash,
          signal: options.signal,
          onProgress: (stage, detail) => progress(stage, detail),
        });
        options.signal?.throwIfAborted();
        if (value.record.level !== "error") {
          progress("saving", "Original und Ergebnis im Browser speichern");
          await options.save(value.record, value.blob);
          hashes.add(hash);
          knownReports.set(hash, value.record);
          records.push(value.record);
        }
        report({
          level: value.record.level,
          message: `${file.name}: ${reportQuarterHint(value.record).label} · ${value.record.message}`,
        });
      }
    } catch (error) {
      if (options.signal?.aborted) break;
      report({
        level: "error",
        message: `${file.name}: ${error instanceof Error ? error.message : "Import fehlgeschlagen"}`,
      });
    }
    completed++;
    progress("reading", "Datei abgeschlossen");
  }
  return { records, feedback, cancelled: !!options.signal?.aborted };
}
