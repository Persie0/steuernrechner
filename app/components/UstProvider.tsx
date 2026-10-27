"use client";
import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import {
  Contribution,
  download,
  inspectFile,
  money,
  PARSER_VERSION,
  ExpenseDraft,
  periodKey,
  Source,
  StoredReport,
  Values,
  ZmRow,
} from "../lib/tax";

import {
  emptyReview,
  summarizeQuarter,
  type QuarterReview,
} from "../lib/quarterly";

import {
  expandImportFiles,
  importDocumentBatch,
  type ImportProgress,
  type UploadFeedback,
} from "../lib/importer";
import { PROVIDER_STORAGE_KEY } from "../lib/provider-auth";
export type { UploadFeedback } from "../lib/importer";
type Edit = { values: Values; rows: ZmRow[] };
type Store = {
  year: number;
  quarter: number;
  tax: string;
  submitter: string;
  reports: StoredReport[];
  expenseOverrides: Record<string, ExpenseDraft>;
  reviews: Record<string, QuarterReview>;
  edits: Record<string, Edit>;
};
type Ctx = Store & {
  ready: boolean;
  importProgress: ImportProgress | null;
  importFeedback: UploadFeedback[];
  cancelImport: () => void;
  values: Values;
  rows: ZmRow[];
  warnings: string[];
  totals: Contribution;
  review: QuarterReview;
  setReview: (patch: Partial<QuarterReview>) => void;
  expenses: ExpenseDraft[];
  updateExpense: (expense: ExpenseDraft) => void;
  filingBlockers: string[];
  setYear: (n: number) => void;
  setQuarter: (n: number) => void;
  setTax: (s: string) => void;
  setSubmitter: (s: string) => void;
  setValues: (v: Values) => void;
  setRows: (r: ZmRow[]) => void;
  clearEdits: () => void;
  addFiles: (
    source: Source,
    files: FileList | null,
  ) => Promise<UploadFeedback[]>;
  importFiles: (files: FileList | File[] | null) => Promise<UploadFeedback[]>;
  removeReport: (id: string) => Promise<void>;
  downloadReport: (id: string) => Promise<void>;
  downloadAllReports: () => Promise<number>;
  reset: (skipConfirm?: boolean) => Promise<boolean>;
};
const initial: Store = {
  year: new Date().getFullYear(),
  quarter: Math.max(1, Math.floor(new Date().getMonth() / 3)),
  tax: "",
  submitter: "",
  reports: [],
  expenseOverrides: {},
  reviews: {},
  edits: {},
};
const Context = createContext<Ctx | null>(null);
const LS = "ust-assistent-at-v2";
const DB = "ust-assistent-at-files";
type StoredFile = StoredReport & { blob: Blob };
function openDb() {
  return new Promise<IDBDatabase>((resolve, reject) => {
    const q = indexedDB.open(DB, 1);
    q.onupgradeneeded = () => {
      if (!q.result.objectStoreNames.contains("files"))
        q.result.createObjectStore("files", { keyPath: "id" });
    };
    q.onsuccess = () => resolve(q.result);
    q.onerror = () => reject(q.error);
  });
}
async function putFile(record: StoredReport, blob: Blob) {
  const db = await openDb();
  await new Promise<void>((resolve, reject) => {
    const tx = db.transaction("files", "readwrite");
    tx.objectStore("files").put({ ...record, blob });
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
  });
  db.close();
}
async function getFile(id: string) {
  const db = await openDb();
  const value = await new Promise<StoredFile | undefined>((resolve, reject) => {
    const q = db.transaction("files").objectStore("files").get(id);
    q.onsuccess = () => resolve(q.result as StoredFile | undefined);
    q.onerror = () => reject(q.error);
  });
  db.close();
  return value;
}
async function deleteFile(id: string) {
  const db = await openDb();
  await new Promise<void>((resolve, reject) => {
    const tx = db.transaction("files", "readwrite");
    tx.objectStore("files").delete(id);
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
  });
  db.close();
}
async function clearDb() {
  const db = await openDb();
  await new Promise<void>((resolve, reject) => {
    const tx = db.transaction("files", "readwrite");
    tx.objectStore("files").clear();
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
  });
  db.close();
}
export function UstProvider({ children }: { children: React.ReactNode }) {
  const [s, setS] = useState<Store>(initial),
    [ready, setReady] = useState(false);
  const [importProgress, setImportProgress] = useState<ImportProgress | null>(
    null,
  );
  const [importFeedback, setImportFeedback] = useState<UploadFeedback[]>([]);
  const importController = useRef<AbortController | null>(null);
  const reportsRef = useRef(s.reports);
  useEffect(() => {
    reportsRef.current = s.reports;
  }, [s.reports]);
  const migrationStarted = useRef(false),
    importQueue = useRef(Promise.resolve());
  useEffect(() => {
    queueMicrotask(() => {
      try {
        const raw = localStorage.getItem(LS);
        if (raw) {
          const old = JSON.parse(raw);
          setS({
            ...initial,
            ...old,
            expenseOverrides: old.expenseOverrides || {},
            reviews: old.reviews || {},
            edits: old.edits || {},
          });
        }
      } catch {}
      setReady(true);
    });
  }, []);
  useEffect(() => {
    if (ready) localStorage.setItem(LS, JSON.stringify(s));
  }, [s, ready]);
  useEffect(() => {
    if (!ready || migrationStarted.current) return;
    const stale = s.reports.filter(
      (r) =>
        r.parserVersion !== PARSER_VERSION ||
        (r.source === "attachment" && /^S_D_.*\.(txt|csv)$/i.test(r.name)),
    );
    if (!stale.length) return;
    migrationStarted.current = true;
    void (async () => {
      const updates = new Map<string, StoredReport>();
      for (const report of stale) {
        try {
          const stored = await getFile(report.id);
          if (!stored?.blob) continue;
          const file = new File([stored.blob], report.name, {
            type: report.type,
            lastModified: report.lastModified,
          });
          const dailyAttachment =
            report.source === "attachment" &&
            /^S_D_.*\.(txt|csv)$/i.test(report.name);
          const parsed = await inspectFile(
            dailyAttachment ? "apple_sales" : report.source,
            file,
          );
          if (dailyAttachment && parsed.record.level === "error") continue;
          const updated = {
            ...parsed.record,
            id: report.id,
            createdAt: report.createdAt,
          };
          await putFile(updated, stored.blob);
          updates.set(report.id, updated);
        } catch {}
      }
      setS((c) => ({
        ...c,
        reports: c.reports.map((r) => updates.get(r.id) || r),
      }));
    })();
  }, [ready, s.reports]);
  const key = periodKey(s.year, s.quarter),
    review = s.reviews[key] || emptyReview();
  const result = useMemo(
    () =>
      summarizeQuarter(
        s.reports,
        s.expenseOverrides,
        s.reviews[periodKey(s.year, s.quarter)] || emptyReview(),
        s.year,
        s.quarter,
      ),
    [s],
  );
  const automatic: Edit = {
    values: {
      kz000: 0,
      kz057: result.totals.kz057,
      kz060: result.totals.kz060,
      kz066: result.totals.kz066,
    },
    rows: [
      {
        uid: "IE9825613N",
        name: "Google Commerce Limited",
        exact: result.totals.googleZm,
      },
      {
        uid: "IE9700053D",
        name: "Apple Distribution International Ltd.",
        exact: result.totals.appleZm,
      },
    ],
  };
  const edit = s.edits[key] || automatic;
  const filingBlockers = [...result.blockers];
  if (
    s.reports.some(
      (r) => r.parserVersion !== PARSER_VERSION && r.source !== "attachment",
    )
  )
    filingBlockers.push(
      "Alte Parserwerte werden neu berechnet. Fehlende Originale erneut importieren.",
    );
  if (!review.reviewed)
    filingBlockers.push("Abschließende Quartalskontrolle noch bestätigen.");
  const setReview = (patch: Partial<QuarterReview>) =>
    setS((c) => ({
      ...c,
      reviews: {
        ...c.reviews,
        [key]: { ...(c.reviews[key] || emptyReview()), ...patch },
      },
    }));
  const setValues = (values: Values) => {
    setS((c) => ({
      ...c,
      edits: { ...c.edits, [key]: { ...(c.edits[key] || automatic), values } },
      reviews: {
        ...c.reviews,
        [key]: { ...(c.reviews[key] || emptyReview()), reviewed: false },
      },
    }));
  };
  const setRows = (rows: ZmRow[]) => {
    setS((c) => ({
      ...c,
      edits: { ...c.edits, [key]: { ...(c.edits[key] || automatic), rows } },
      reviews: {
        ...c.reviews,
        [key]: { ...(c.reviews[key] || emptyReview()), reviewed: false },
      },
    }));
  };
  async function enqueueImport(
    input: File[],
    source?: Source,
  ): Promise<UploadFeedback[]> {
    if (!input.length) return [];
    let feedback: UploadFeedback[] = [];
    const task = importQueue.current.then(async () => {
      const controller = new AbortController();
      importController.current = controller;
      const startedAt = Date.now();
      const messages: UploadFeedback[] = [];
      const progress = (value: ImportProgress) =>
        setImportProgress({ ...value, startedAt, updatedAt: Date.now() });
      const report = (value: UploadFeedback) => {
        messages.push(value);
        setImportFeedback((current) => [...current, value]);
      };
      setImportFeedback([]);
      progress({
        stage: "queued",
        currentFile: input[0].name,
        detail: "Import vorbereiten",
        completed: 0,
        total: input.length,
      });
      try {
        const { files } = await expandImportFiles(input, {
          signal: controller.signal,
          onProgress: progress,
          onFeedback: report,
        });
        let backup: Partial<Store> | undefined;
        for (const file of files.filter(
          (f) => f.name === "quartalskontrolle.json",
        )) {
          try {
            const payload = JSON.parse(await file.text());
            if (
              payload.version !== 1 ||
              payload.parserVersion !== PARSER_VERSION ||
              !payload.state ||
              typeof payload.state !== "object"
            )
              throw new Error("Unbekanntes Backup-Format.");
            const state = payload.state;
            const expenseOverrides: Record<string, ExpenseDraft> = {};
            for (const [id, e] of Object.entries(
              state.expenseOverrides || {},
            ) as [string, ExpenseDraft][]) {
              if (
                typeof e.title !== "string" ||
                typeof e.date !== "string" ||
                ![e.net, e.vat, e.share].every(Number.isFinite) ||
                e.share < 0 ||
                e.share > 100 ||
                !["domestic", "reverse_charge", "none", "review"].includes(
                  e.vatCase,
                )
              )
                throw new Error("Ungültige Ausgabe im Backup.");
              expenseOverrides[id] = { ...e, confirmed: false };
            }
            const reviews: Record<string, QuarterReview> = {};
            for (const [period, r] of Object.entries(state.reviews || {}) as [
              string,
              QuarterReview,
            ][]) {
              if (
                !/^\d{4}-Q[1-4]$/.test(period) ||
                ![
                  r.google,
                  r.apple,
                  r.appodeal,
                  r.expensesComplete,
                  r.modelConfirmed,
                ].every((v) => typeof v === "boolean") ||
                typeof r.appleExact !== "string" ||
                typeof r.appleEvidence !== "string"
              )
                throw new Error("Ungültige Quartalsdaten im Backup.");
              reviews[period] = { ...emptyReview(), ...r, reviewed: false };
            }
            const edits: Record<string, Edit> = {};
            for (const [period, e] of Object.entries(state.edits || {}) as [
              string,
              Edit,
            ][]) {
              if (
                !/^\d{4}-Q[1-4]$/.test(period) ||
                !e.values ||
                ![
                  e.values.kz000,
                  e.values.kz057,
                  e.values.kz060,
                  e.values.kz066,
                ].every(Number.isFinite) ||
                !Array.isArray(e.rows) ||
                !e.rows.every(
                  (row) =>
                    typeof row.uid === "string" &&
                    typeof row.name === "string" &&
                    Number.isFinite(row.exact),
                )
              )
                throw new Error("Ungültige Korrekturwerte im Backup.");
              edits[period] = e;
            }
            backup = { expenseOverrides, reviews, edits };
            if (/^\d{9}$/.test(state.tax)) backup.tax = state.tax;
            if (/^\d{9}$/.test(state.submitter))
              backup.submitter = state.submitter;
            if (
              Number.isInteger(state.year) &&
              state.year >= 2024 &&
              state.year <= 2100
            )
              backup.year = state.year;
            if ([1, 2, 3, 4].includes(state.quarter))
              backup.quarter = state.quarter;
            report({
              level: "ok",
              message:
                "Quartalsstand wiederhergestellt; Originale werden neu berechnet und Bestätigungen müssen erneut geprüft werden.",
            });
          } catch (e) {
            report({
              level: "error",
              message:
                e instanceof Error
                  ? e.message
                  : "Backup konnte nicht gelesen werden.",
            });
          }
        }

        const documents = files.filter(
          (file) => file.name !== "quartalskontrolle.json",
        );
        const result = await importDocumentBatch(documents, {
          source,
          existingHashes: new Set(
            reportsRef.current
              .map((record) => record.sha256)
              .filter((hash): hash is string => !!hash),
          ),
          existingReports: reportsRef.current,
          signal: controller.signal,
          onProgress: progress,
          onFeedback: report,
          save: putFile,
        });
        const merge = (current: StoredReport[]) => {
          const hashes = new Set(
            current.map((record) => record.sha256).filter(Boolean),
          );
          return [
            ...current,
            ...result.records.filter(
              (record) => !record.sha256 || !hashes.has(record.sha256),
            ),
          ];
        };
        if (result.records.length || (!result.cancelled && backup)) {
          reportsRef.current = merge(reportsRef.current);
          setS((current) => {
            const restored = !result.cancelled ? backup : undefined;
            return {
              ...current,
              ...restored,
              reports: merge(current.reports),
              expenseOverrides: {
                ...current.expenseOverrides,
                ...restored?.expenseOverrides,
              },
              reviews: Object.fromEntries(
                Object.entries({
                  ...current.reviews,
                  ...restored?.reviews,
                }).map(([period, value]) => [
                  period,
                  { ...value, reviewed: false },
                ]),
              ),
              edits: { ...current.edits, ...restored?.edits },
            };
          });
        }
        const errors = messages.filter(
          (message) => message.level === "error",
        ).length;
        setImportProgress(
          (current) =>
            current && {
              ...current,
              total: documents.length,
              completed: result.cancelled
                ? current.completed
                : documents.length,
              stage: result.cancelled
                ? "cancelled"
                : errors && !documents.length
                  ? "error"
                  : "done",
              updatedAt: Date.now(),
              detail: `${result.records.length} Dateien gespeichert${errors ? ` · ${errors} Fehler` : ""}${result.cancelled ? ". Bereits fertige Dateien bleiben erhalten." : "."}`,
            },
        );
      } catch (error) {
        const cancelled = controller.signal.aborted;
        if (!cancelled)
          report({
            level: "error",
            message:
              error instanceof Error ? error.message : "Import fehlgeschlagen",
          });
        setImportProgress(
          (current) =>
            current && {
              ...current,
              stage: cancelled ? "cancelled" : "error",
              updatedAt: Date.now(),
              detail: cancelled
                ? "Import gestoppt. Bereits fertige Dateien bleiben erhalten."
                : "Import konnte nicht abgeschlossen werden. Ergebnisse unten prüfen.",
            },
        );
      } finally {
        if (importController.current === controller)
          importController.current = null;
        feedback = messages;
      }
    });
    importQueue.current = task.catch(() => {});
    await task;
    return feedback;
  }
  async function importFiles(list: FileList | File[] | null) {
    return enqueueImport(Array.from(list || []));
  }
  async function removeReport(id: string) {
    await deleteFile(id);
    setS((c) => ({
      ...c,
      reports: c.reports.filter((r) => r.id !== id),
      expenseOverrides: Object.fromEntries(
        Object.entries(c.expenseOverrides).filter(([expenseId]) => {
          const removed = c.reports
            .find((r) => r.id === id)
            ?.expenses?.some((e) => e.id === expenseId);
          return (
            !removed ||
            c.reports.some(
              (r) => r.id !== id && r.expenses?.some((e) => e.id === expenseId),
            )
          );
        }),
      ),
      reviews: Object.fromEntries(
        Object.entries(c.reviews).map(([k, v]) => [
          k,
          { ...v, reviewed: false },
        ]),
      ),
    }));
  }
  async function downloadReport(id: string) {
    const item = await getFile(id);
    if (!item?.blob) return;
    const url = URL.createObjectURL(item.blob),
      a = document.createElement("a");
    a.href = url;
    a.download = item.name;
    a.click();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  }
  async function downloadAllReports() {
    const { default: JSZip } = await import("jszip"),
      zip = new JSZip();
    let count = 0;
    for (const report of s.reports) {
      const item = await getFile(report.id);
      if (item?.blob) {
        zip.file(
          `${report.source}/${++count}-${item.name.replace(/[\\/:*?"<>|]/g, "_")}`,
          item.blob,
        );
      }
    }
    zip.file(
      "quartalskontrolle.json",
      JSON.stringify(
        { version: 1, parserVersion: PARSER_VERSION, state: s },
        null,
        2,
      ),
    );
    const url = URL.createObjectURL(await zip.generateAsync({ type: "blob" })),
      a = document.createElement("a");
    a.href = url;
    a.download = `UVA-ZM-Q${s.quarter}-${s.year}-Backup.zip`;
    a.click();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
    return count;
  }
  async function reset(skipConfirm = false) {
    if (
      !skipConfirm &&
      !confirm("Alle lokalen Dateien und Quartalsdaten löschen?")
    )
      return false;
    importController.current?.abort();
    await importQueue.current;
    await clearDb();
    localStorage.removeItem(LS);
    localStorage.removeItem(PROVIDER_STORAGE_KEY);
    window.dispatchEvent(new Event("provider-credentials-cleared"));
    setS(initial);
    setImportProgress(null);
    setImportFeedback([]);
    return true;
  }
  return (
    <Context.Provider
      value={{
        ...s,
        ready,
        importProgress,
        importFeedback,
        cancelImport: () => importController.current?.abort(),
        ...edit,
        totals: result.totals,
        review,
        setReview,
        expenses: result.expenses,
        filingBlockers,
        warnings: [
          ...new Set([
            ...result.blockers,
            ...result.selected
              .filter((r) => r.level !== "ok")
              .map((r) => `${r.name}: ${r.message}`),
          ]),
        ],
        setYear: (year) => setS((c) => ({ ...c, year })),
        setQuarter: (quarter) => setS((c) => ({ ...c, quarter })),
        setTax: (tax) => setS((c) => ({ ...c, tax })),
        setSubmitter: (submitter) => setS((c) => ({ ...c, submitter })),
        setValues,
        setRows,
        clearEdits: () =>
          setS((c) => {
            const edits = { ...c.edits };
            delete edits[key];
            return {
              ...c,
              edits,
              reviews: {
                ...c.reviews,
                [key]: {
                  ...(c.reviews[key] || emptyReview()),
                  reviewed: false,
                },
              },
            };
          }),
        updateExpense: (expense) =>
          setS((c) => ({
            ...c,
            expenseOverrides: { ...c.expenseOverrides, [expense.id]: expense },
            reviews: {
              ...c.reviews,
              [key]: { ...(c.reviews[key] || emptyReview()), reviewed: false },
            },
          })),
        addFiles: (source, files) =>
          enqueueImport(Array.from(files || []), source),
        importFiles,
        removeReport,
        downloadReport,
        downloadAllReports,
        reset,
      }}
    >
      {children}
    </Context.Provider>
  );
}
export function useUst() {
  const context = useContext(Context);
  if (!context) throw new Error("UstProvider missing");
  return context;
}
export function StoredNotice() {
  const { reports } = useUst();
  return (
    <span className="storedNotice">
      ● {reports.length} Dateien ·{" "}
      {(reports.reduce((a, r) => a + r.size, 0) / 1024 / 1024).toFixed(1)} MB
      lokal gespeichert
    </span>
  );
}
export function Q2Status() {
  const { filingBlockers } = useUst();
  return (
    <div className="statusList">
      {filingBlockers.map((message) => (
        <p key={message}>{message}</p>
      ))}
    </div>
  );
}
export const formatBytes = (n: number) =>
  n < 1024
    ? `${n} B`
    : n < 1024 * 1024
      ? `${(n / 1024).toFixed(1)} KB`
      : `${(n / 1024 / 1024).toFixed(1)} MB`;
export const totalText = (c: Contribution) =>
  `Google ZM ${money(c.googleZm)}, Apple ZM ${money(c.appleZm)}, Appodeal ${money(c.appodealUsd, "USD")}`;
export { download };
