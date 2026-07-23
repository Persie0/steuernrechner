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
  inferPeriod,
  inspectFile,
  money,
  PARSER_VERSION,
  Source,
  StoredReport,
  Values,
  ZmRow,
  ZERO,
} from "../lib/tax";

type Store = {
  year: number;
  quarter: number;
  tax: string;
  submitter: string;
  values: Values;
  rows: ZmRow[];
  reports: StoredReport[];
  warnings: string[];
  appodealManual: number;
};
export type UploadFeedback = {
  level: "ok" | "warn" | "error";
  message: string;
};
type Ctx = Store & {
  ready: boolean;
  setYear: (n: number) => void;
  setQuarter: (n: number) => void;
  setTax: (s: string) => void;
  setSubmitter: (s: string) => void;
  setValues: (v: Values) => void;
  setRows: (r: ZmRow[]) => void;
  setAppodealManual: (n: number) => void;
  addFiles: (
    source: Source,
    files: FileList | null,
  ) => Promise<UploadFeedback[]>;
  removeReport: (id: string) => Promise<void>;
  downloadReport: (id: string) => Promise<void>;
  downloadAllReports: () => Promise<number>;
  reset: () => Promise<void>;
  loadQ2: () => void;
  totals: Contribution;
  missing: Record<Source, number[]>;
};
const initial: Store = {
  year: 2026,
  quarter: 2,
  tax: "",
  submitter: "",
  values: { kz000: 0, kz057: 0, kz060: 0, kz066: 0 },
  rows: [
    { uid: "IE9825613N", name: "Google Commerce Limited", exact: 0 },
    {
      uid: "IE9700053D",
      name: "Apple Distribution International Ltd.",
      exact: 0,
    },
  ],
  reports: [],
  warnings: [],
  appodealManual: 0,
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
const add = (a: Contribution, b: Contribution): Contribution => ({
  googleZm: a.googleZm + b.googleZm,
  appleZm: a.appleZm + b.appleZm,
  kz057: a.kz057 + b.kz057,
  kz060: a.kz060 + b.kz060,
  kz066: a.kz066 + b.kz066,
  appodealUsd: a.appodealUsd + b.appodealUsd,
  appodealEur: a.appodealEur + (b.appodealEur || 0),
});
const appleSource = (s: Source) =>
  s === "apple_sales" || s === "apple_financial";
const fingerprint = (x: { name: string; size: number; lastModified: number }) =>
  `${x.name}:${x.size}:${x.lastModified}`;
function normalizeLegacyReports(reports: StoredReport[]) {
  const output: StoredReport[] = [];
  const appleIndexes = new Map<string, number>();
  for (const report of reports) {
    const fd = /^FD_.+_((?:0[1-9])|1[0-2])\d{2}\.(?:txt|csv)$/i.test(
        report.name,
      ),
      sm = /^S_M_/i.test(report.name);
    const target: Source = fd
      ? "apple_financial"
      : sm
        ? "apple_sales"
        : report.source;
    const remapped = target !== report.source,
      { year, month } =
        fd || sm
          ? inferPeriod(report.name)
          : { year: report.year, month: report.month };
    const normalized: StoredReport = {
      ...report,
      source: target,
      year,
      month,
      contribution: { ...ZERO, ...report.contribution },
      message: remapped
        ? `${report.message.replace(/^Detailed Sales/, "Financial Detailed").replace(/^Summary Sales/, "Summary Sales")} · Zuordnung automatisch korrigiert`
        : report.message,
    };
    if (!appleSource(target)) {
      output.push(normalized);
      continue;
    }
    const key = fingerprint(normalized),
      existingIndex = appleIndexes.get(key);
    if (existingIndex === undefined) {
      appleIndexes.set(key, output.length);
      output.push(normalized);
      continue;
    }
    const existing = output[existingIndex],
      prefer =
        remapped ||
        Math.abs(normalized.contribution.appleZm) >
          Math.abs(existing.contribution.appleZm);
    if (prefer) output[existingIndex] = normalized;
  }
  return output;
}

function inPeriod(report: StoredReport, year: number, quarter: number) {
  const months = [quarter * 3 - 2, quarter * 3 - 1, quarter * 3];
  return (
    report.year === year &&
    report.month !== null &&
    months.includes(report.month)
  );
}

function sumReports(reports: StoredReport[], year: number, quarter: number) {
  return reports
    .filter((report) => inPeriod(report, year, quarter))
    .reduce((total, report) => add(total, report.contribution), { ...ZERO });
}

function deriveFromReports(store: Store, reports: StoredReport[]) {
  const totals = sumReports(reports, store.year, store.quarter);
  const standardRows = [
    {
      uid: "IE9825613N",
      name: "Google Commerce Limited",
      exact: +totals.googleZm.toFixed(2),
    },
    {
      uid: "IE9700053D",
      name: "Apple Distribution International Ltd.",
      exact: +totals.appleZm.toFixed(2),
    },
  ];
  const extraRows = store.rows.filter(
    (row) => !standardRows.some((standard) => standard.uid === row.uid),
  );
  return {
    ...store,
    reports,
    // Warnings are derived from the current reports below. Never retain the
    // historical upload/event log in persistent state.
    warnings: [],
    values: {
      ...store.values,
      kz057: +totals.kz057.toFixed(2),
      kz060: +totals.kz060.toFixed(2),
      kz066: +totals.kz066.toFixed(2),
    },
    rows: [...standardRows, ...extraRows],
    appodealManual: totals.appodealUsd
      ? +totals.appodealUsd.toFixed(2)
      : store.appodealManual,
  };
}

export function UstProvider({ children }: { children: React.ReactNode }) {
  const [s, setS] = useState<Store>(initial),
    [ready, setReady] = useState(false);
  const migrationStarted = useRef(false);
  useEffect(() => {
    let cancelled = false;
    queueMicrotask(() => {
      if (cancelled) return;
      try {
        const raw = localStorage.getItem(LS);
        if (raw) {
          const stored = { ...initial, ...JSON.parse(raw) } as Store;
          const reports = normalizeLegacyReports(stored.reports || []);
          setS(deriveFromReports(stored, reports));
        }
      } catch {}
      setReady(true);
    });
    return () => {
      cancelled = true;
    };
  }, []);
  useEffect(() => {
    if (ready) localStorage.setItem(LS, JSON.stringify(s));
  }, [s, ready]);
  useEffect(() => {
    if (!ready || migrationStarted.current) return;
    const stale = s.reports.filter(
      (report) =>
        report.level !== "error" &&
        (report.parserVersion !== PARSER_VERSION ||
          /nicht.*umgerechnet|nicht verfügbar/i.test(report.message)),
    );
    if (!stale.length) return;
    migrationStarted.current = true;
    void Promise.all(
      stale.map(async (report) => {
        const stored = await getFile(report.id);
        if (!stored?.blob) return null;
        const file = new File([stored.blob], report.name, {
          type: report.type,
          lastModified: report.lastModified,
        });
        const parsed = await inspectFile(report.source, file);
        if (parsed.record.level === "error") return null;
        const updated = {
          ...parsed.record,
          id: report.id,
          createdAt: report.createdAt,
        };
        await putFile(updated, stored.blob);
        return updated;
      }),
    ).then((updates) => {
      const replacements = new Map(
        updates
          .filter((report): report is StoredReport => Boolean(report))
          .map((report) => [report.id, report]),
      );
      if (!replacements.size) return;
      setS((current) => {
        const reports = current.reports.map(
          (report) => replacements.get(report.id) || report,
        );
        return deriveFromReports(current, reports);
      });
    });
  }, [ready, s.reports]);
  const patch = <K extends keyof Store>(key: K, value: Store[K]) =>
    setS((x) => ({ ...x, [key]: value }));
  async function addFiles(
    source: Source,
    list: FileList | null,
  ): Promise<UploadFeedback[]> {
    if (!list?.length) return [];
    const incoming = Array.from(list),
      fresh = incoming.filter(
        (f) =>
          !s.reports.some(
            (r) =>
              r.id === `${source}:${f.name}:${f.size}:${f.lastModified}` ||
              (appleSource(source) &&
                appleSource(r.source) &&
                r.level !== "error" &&
                fingerprint(r) === fingerprint(f)),
          ),
      ),
      duplicateCount = incoming.length - fresh.length;
    if (!fresh.length) {
      const message =
        "Bereits gespeichert – dieselbe Datei wird nicht unter zwei Apple-Berichtsarten abgelegt.";
      return [{ level: "warn", message }];
    }
    const parsed = await Promise.all(fresh.map((f) => inspectFile(source, f))),
      valid = parsed.filter((p) => p.record.level !== "error");
    for (const p of valid) await putFile(p.record, p.blob);
    setS((x) => {
      const reports = [...x.reports, ...valid.map((p) => p.record)];
      return deriveFromReports(x, reports);
    });
    const feedback: UploadFeedback[] = parsed.map(({ record: r }) => ({
      level: r.level,
      message: `${r.name}: ${r.month && r.year ? `${String(r.month).padStart(2, "0")}/${r.year} · ` : ""}${r.message}`,
    }));
    if (duplicateCount)
      feedback.push({
        level: "warn",
        message: `${duplicateCount} bereits gespeicherte Datei(en) nicht doppelt eingerechnet.`,
      });
    return feedback;
  }
  async function removeReport(id: string) {
    await deleteFile(id);
    setS((x) => {
      const reports = x.reports.filter((r) => r.id !== id);
      return deriveFromReports(x, reports);
    });
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
    if (!s.reports.length) return 0;
    const { default: JSZip } = await import("jszip");
    const zip = new JSZip();
    const folderNames: Record<Source, string> = {
      google: "Google Play",
      apple_sales: "Apple Sales",
      apple_financial: "Apple Financial",
      appodeal: "Appodeal",
      kalkuel: "Kalkuel",
    };
    const usedPaths = new Set<string>();
    let included = 0;

    for (const report of s.reports) {
      const item = await getFile(report.id);
      if (!item?.blob) continue;
      const cleanName =
        item.name.replace(/[\\/:*?"<>|]/g, "_").trim() || `Datei-${included + 1}`;
      const dot = cleanName.lastIndexOf(".");
      const stem = dot > 0 ? cleanName.slice(0, dot) : cleanName;
      const extension = dot > 0 ? cleanName.slice(dot) : "";
      let candidate = `${folderNames[report.source]}/${cleanName}`;
      let suffix = 2;
      while (usedPaths.has(candidate)) {
        candidate = `${folderNames[report.source]}/${stem} (${suffix})${extension}`;
        suffix += 1;
      }
      usedPaths.add(candidate);
      zip.file(candidate, item.blob);
      included += 1;
    }

    if (!included) return 0;
    const archive = await zip.generateAsync({
      type: "blob",
      compression: "DEFLATE",
      compressionOptions: { level: 6 },
    });
    const url = URL.createObjectURL(archive);
    const a = document.createElement("a");
    a.href = url;
    a.download = `ust-assistent-Q${s.quarter}-${s.year}-originaldateien.zip`;
    a.click();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
    return included;
  }
  async function reset() {
    if (
      !confirm(
        "Alle lokal gespeicherten Dateien und Eingaben dieses Assistenten löschen?",
      )
    )
      return;
    await clearDb();
    localStorage.removeItem(LS);
    setS(initial);
  }
  function loadQ2() {
    setS((x) => ({
      ...x,
      year: 2026,
      quarter: 2,
      values: { kz000: 0, kz057: 28.93, kz060: 101.2, kz066: 27.4 },
      rows: [
        { uid: "IE9825613N", name: "Google Commerce Limited", exact: 602.12 },
        {
          uid: "IE9700053D",
          name: "Apple Distribution International Ltd.",
          exact: 111.41,
        },
      ],
      warnings: [],
    }));
  }
  const totals = useMemo(
    () => sumReports(s.reports, s.year, s.quarter),
    [s.reports, s.year, s.quarter],
  );
  const currentWarnings = useMemo(
    () =>
      Array.from(
        new Set(
          s.reports
            .filter(
              (report) =>
                inPeriod(report, s.year, s.quarter) &&
                report.level !== "ok",
            )
            .map((report) => `${report.name}: ${report.message}`),
        ),
      ),
    [s.reports, s.year, s.quarter],
  );
  const months = useMemo(
    () => [s.quarter * 3 - 2, s.quarter * 3 - 1, s.quarter * 3],
    [s.quarter],
  );
  const missing = useMemo(
    () =>
      Object.fromEntries(
        (
          [
            "google",
            "apple_sales",
            "apple_financial",
            "appodeal",
            "kalkuel",
          ] as Source[]
        ).map((src) => [
          src,
          src === "apple_sales"
            ? []
            : src === "kalkuel"
              ? s.reports.some(
                  (r) =>
                    r.source === src &&
                    r.level !== "error" &&
                    r.year === s.year &&
                    r.month !== null &&
                    months.includes(r.month),
                )
                ? []
                : months
              : months.filter(
                  (m) =>
                    !s.reports.some(
                      (r) =>
                        r.source === src &&
                        r.month === m &&
                        r.year === s.year &&
                        r.level !== "error",
                    ),
                ),
        ]),
      ) as Record<Source, number[]>,
    [s.reports, s.year, months],
  );
  const value: Ctx = {
    ...s,
    warnings: currentWarnings,
    ready,
    setYear: (n) =>
      setS((current) =>
        deriveFromReports({ ...current, year: n }, current.reports),
      ),
    setQuarter: (n) =>
      setS((current) =>
        deriveFromReports({ ...current, quarter: n }, current.reports),
      ),
    setTax: (v) => patch("tax", v),
    setSubmitter: (v) => patch("submitter", v),
    setValues: (v) => patch("values", v),
    setRows: (v) => patch("rows", v),
    setAppodealManual: (v) => patch("appodealManual", v),
    addFiles,
    removeReport,
    downloadReport,
    downloadAllReports,
    reset,
    loadQ2,
    totals,
    missing,
  };
  return <Context.Provider value={value}>{children}</Context.Provider>;
}
export function useUst() {
  const x = useContext(Context);
  if (!x) throw new Error("UstProvider missing");
  return x;
}
export function StoredNotice() {
  const { reports } = useUst();
  const bytes = reports.reduce((s, r) => s + r.size, 0);
  return (
    <span className="storedNotice">
      ● {reports.length} Dateien · {(bytes / 1024 / 1024).toFixed(1)} MB lokal
      gespeichert
    </span>
  );
}
export function Q2Status() {
  const { missing } = useUst();
  const labels: Record<Source, string> = {
    google: "Google Earnings",
    apple_sales: "Apple Sales (optional)",
    apple_financial: "Apple Financial (FD_)",
    appodeal: "Appodeal",
    kalkuel: "Kalkül",
  };
  return (
    <div className="statusList">
      {(Object.keys(labels) as Source[]).map((k) => (
        <div key={k} className={missing[k].length ? "incomplete" : "complete"}>
          <b>{labels[k]}</b>
          <span>
            {k === "apple_sales"
              ? "Keine Pflichtdatei; nur Plausibilitätskontrolle"
              : missing[k].length
                ? `Fehlt: ${k === "kalkuel" ? "Q2-Export" : missing[k].map((m) => ["", "Jan", "Feb", "Mär", "Apr", "Mai", "Jun", "Jul", "Aug", "Sep", "Okt", "Nov", "Dez"][m]).join(", ")}`
                : "Vollständig erkannt"}
          </span>
        </div>
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
  `Google ZM ${money(c.googleZm)}, Apple ZM ${money(c.appleZm)}, Appodeal ${money(c.appodealUsd, "USD")} / ${money(c.appodealEur)}`;
export { download };
