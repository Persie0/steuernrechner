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
  extractPdfText,
  Source,
  StoredReport,
  Values,
  ZmRow,
  ZERO,
} from "../lib/tax";

import {
  detectSource,
  emptyReview,
  summarizeQuarter,
  type QuarterReview,
} from "../lib/quarterly";

export type UploadFeedback = {
  level: "ok" | "warn" | "error";
  message: string;
};
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
  importFiles: (files: FileList | null) => Promise<UploadFeedback[]>;
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
    const stale = s.reports.filter((r) => r.parserVersion !== PARSER_VERSION);
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
          const parsed = await inspectFile(report.source, file);
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
  async function importBatch(
    files: File[],
    source?: Source,
  ): Promise<UploadFeedback[]> {
    const feedback: UploadFeedback[] = [],
      parsed: { record: StoredReport; blob: Blob }[] = [];
    const existing = new Set(s.reports.map((r) => r.sha256).filter(Boolean));
    for (const file of files) {
      if (file.size > 50 * 1024 * 1024) {
        feedback.push({
          level: "error",
          message: `${file.name}: maximal 50 MB je Datei.`,
        });
        continue;
      }
      try {
        let detected = source;
        if (!detected) {
          let text = "";
          if (/\.(csv|txt)$/i.test(file.name)) text = await file.text();
          else if (/\.pdf$/i.test(file.name) && !/^report_/.test(file.name))
            text = await extractPdfText(await file.arrayBuffer());
          detected = detectSource(file.name, text);
        }
        const value = await inspectFile(detected, file);
        if (value.record.sha256 && existing.has(value.record.sha256)) {
          feedback.push({
            level: "warn",
            message: `${file.name}: identischer Inhalt bereits vorhanden, nicht doppelt gerechnet.`,
          });
          continue;
        }
        if (value.record.level !== "error") {
          existing.add(value.record.sha256);
          await putFile(value.record, value.blob);
          parsed.push(value);
        }
        feedback.push({
          level: value.record.level,
          message: `${file.name}: ${value.record.message}`,
        });
      } catch (e) {
        feedback.push({
          level: "error",
          message: `${file.name}: ${e instanceof Error ? e.message : "Import fehlgeschlagen"}`,
        });
      }
    }
    if (parsed.length)
      setS((c) => {
        const hashes = new Set(c.reports.map((r) => r.sha256).filter(Boolean));
        const added = parsed
          .filter((p) => !p.record.sha256 || !hashes.has(p.record.sha256))
          .map((p) => p.record);
        return {
          ...c,
          reports: [...c.reports, ...added],
          reviews: Object.fromEntries(
            Object.entries(c.reviews).map(([k, v]) => [
              k,
              { ...v, reviewed: false },
            ]),
          ),
        };
      });
    return feedback;
  }
  async function importFiles(list: FileList | null): Promise<UploadFeedback[]> {
    if (!list?.length) return [];
    const input = Array.from(list),
      files: File[] = [],
      messages: UploadFeedback[] = [];
    for (const file of input) {
      if (!/\.zip$/i.test(file.name)) {
        files.push(file);
        continue;
      }
      if (file.size > 100 * 1024 * 1024) {
        messages.push({
          level: "error",
          message: `${file.name}: ZIP maximal 100 MB.`,
        });
        continue;
      }
      const { default: JSZip } = await import("jszip"),
        zip = await JSZip.loadAsync(file);
      let total = 0,
        count = 0;
      for (const entry of Object.values(zip.files)) {
        if (entry.dir || /(?:^|\/)__MACOSX\/|(?:^|\/)\./.test(entry.name))
          continue;
        if (++count > 500) {
          messages.push({
            level: "error",
            message: "ZIP: maximal 500 Dateien.",
          });
          break;
        }
        const bytes = await entry.async("uint8array");
        total += bytes.length;
        if (total > 100 * 1024 * 1024) {
          messages.push({
            level: "error",
            message: "ZIP: entpackter Inhalt über 100 MB.",
          });
          break;
        }
        const basename = entry.name.split("/").pop() || entry.name;
        files.push(
          new File([bytes as BlobPart], basename, {
            lastModified: entry.date.getTime(),
          }),
        );
      }
    }
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
        for (const [id, e] of Object.entries(state.expenseOverrides || {}) as [
          string,
          ExpenseDraft,
        ][]) {
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
        if (/^\d{9}$/.test(state.submitter)) backup.submitter = state.submitter;
        if (
          Number.isInteger(state.year) &&
          state.year >= 2024 &&
          state.year <= 2100
        )
          backup.year = state.year;
        if ([1, 2, 3, 4].includes(state.quarter))
          backup.quarter = state.quarter;
        messages.push({
          level: "ok",
          message:
            "Quartalsstand wiederhergestellt; Originale werden neu berechnet und Bestätigungen müssen erneut geprüft werden.",
        });
      } catch (e) {
        messages.push({
          level: "error",
          message:
            e instanceof Error
              ? e.message
              : "Backup konnte nicht gelesen werden.",
        });
      }
    }
    let feedback: UploadFeedback[] = [];
    const task = importQueue.current.then(async () => {
      feedback = await importBatch(
        files.filter((f) => f.name !== "quartalskontrolle.json"),
      );
      if (backup)
        setS((c) => ({
          ...c,
          ...backup,
          expenseOverrides: {
            ...c.expenseOverrides,
            ...backup.expenseOverrides,
          },
          reviews: { ...c.reviews, ...backup.reviews },
          edits: { ...c.edits, ...backup.edits },
        }));
    });
    importQueue.current = task.catch(() => {});
    await task;
    return [...messages, ...feedback];
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
    await clearDb();
    localStorage.removeItem(LS);
    setS(initial);
    return true;
  }
  return (
    <Context.Provider
      value={{
        ...s,
        ready,
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
          importBatch(Array.from(files || []), source),
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
