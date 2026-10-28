"use client";

import { useMemo, useState } from "react";
import { useUst, formatBytes } from "../components/UstProvider";
import { mergeExpenses } from "../lib/quarterly";
import { reportQuarterHint } from "../lib/quarter-hints";
import type { ExpenseDraft, StoredReport } from "../lib/tax";

const labels: Record<StoredReport["source"], string> = {google:"Google Play",apple_financial:"Apple Financial",apple_sales:"Apple Sales",appodeal:"Appodeal",kalkuel:"Kalkül",expense:"Ausgabe",attachment:"Anlage"};
function fileCategory(report: StoredReport, linked: ExpenseDraft[]) {
  if (report.source !== "attachment") return labels[report.source];
  if (linked.length) return "Ausgabe";
  if (/appodeal/i.test(report.name)) return "Appodeal";
  if (/google|playapps/i.test(report.name)) return "Google Play";
  if (/apple|appstore|^s_[dm]_|^fd_/i.test(report.name)) return "Apple";
  return "Anlage";
}
function fileDate(report: StoredReport, linked: ExpenseDraft[]) {
  if (report.periodEnd) return { value: report.periodEnd, label: "Berichtsende" };
  const match = report.name.match(/(20\d{2})[-_]?((?:0[1-9]|1[0-2]))[-_]?((?:0[1-9]|[12]\d|3[01]))/);
  if (match) return { value: `${match[1]}-${match[2]}-${match[3]}`, label: "Dateiname" };
  if (linked.length && linked[0].date) return { value: linked[0].date, label: "Steuerdatum Ausgabe" };
  if (report.year && report.month) return { value: `${report.year}-${String(report.month).padStart(2,"0")}-01`, label: "Berichtsmonat" };
  return { value: "", label: "Datum unbekannt" };
}
export default function FilesPage() {
  const { reports, expenseOverrides, downloadReport, removeReport } = useUst();
  const [search, setSearch] = useState(""), [year, setYear] = useState("all"), [quarter, setQuarter] = useState("all"), [category, setCategory] = useState("all");
  const expenses = useMemo(() => mergeExpenses(reports, expenseOverrides), [reports, expenseOverrides]);
  const files = useMemo(() => reports.map((report) => {
    const linked = expenses.filter((expense) => expense.attachmentId === report.id);
    const hint = reportQuarterHint(report, expenseOverrides);
    const periods = [...hint.periods];
    for (const expense of linked) if (/^\d{4}-(0[1-9]|1[0-2])-/.test(expense.date)) {
      const found = { year: Number(expense.date.slice(0,4)), quarter: Math.ceil(Number(expense.date.slice(5,7)) / 3) };
      if (!periods.some((p) => p.year === found.year && p.quarter === found.quarter)) periods.push(found);
    }
    return { report, linked, hint, periods, category: fileCategory(report, linked), date: fileDate(report, linked) };
  }).sort((a, b) => b.date.value.localeCompare(a.date.value) || a.report.name.localeCompare(b.report.name)), [reports, expenses, expenseOverrides]);
  const years = useMemo(() => [...new Set(files.flatMap((file) => file.periods.map((period) => period.year)))].sort((a,b) => b-a), [files]);
  const categories = useMemo(() => [...new Set(files.map((file) => file.category))].sort(), [files]);
  const visible = files.filter((file) => (category === "all" || file.category === category) && (year === "all" && quarter === "all" || file.periods.some((p) => (year === "all" || p.year === Number(year)) && (quarter === "all" || p.quarter === Number(quarter)))) && `${file.report.name} ${file.category} ${file.report.message}`.toLowerCase().includes(search.toLowerCase().trim()));
  return <>
    <section className="subHero"><p className="eyebrow">ORIGINALE & BERICHTE</p><h1>Alle Dateien <em>im Überblick.</em></h1><p>Berichte, Rechnungen und Nachweise in diesem Browser. Quartalsangaben sind eine Orientierung und können mehrere Zeiträume umfassen.</p></section>
    <div className="overviewFilters"><label>Suchen<input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Dateiname oder Quelle"/></label><label>Quelle<select value={category} onChange={(event) => setCategory(event.target.value)}><option value="all">Alle Quellen</option>{categories.map((value) => <option key={value}>{value}</option>)}</select></label><label>Jahr<select value={year} onChange={(event) => setYear(event.target.value)}><option value="all">Alle Jahre</option>{years.map((value) => <option key={value} value={value}>{value}</option>)}</select></label><label>Quartal<select value={quarter} onChange={(event) => setQuarter(event.target.value)}><option value="all">Alle Quartale</option>{[1,2,3,4].map((value) => <option key={value} value={value}>Q{value}</option>)}</select></label></div>
    <p>{visible.length} von {files.length} Dateien · nach Berichts- oder Belegdatum sortiert</p>
    {visible.length === 0 ? <section className="card">Keine passenden Dateien vorhanden.</section> : <section className="fileList">{visible.map(({report, linked, hint, periods, category: tag, date}) => <article className="fileListRow" key={report.id}><div><div className="fileTags"><span className="sourceTag">{tag}</span>{periods.map((period) => <span className="quarterTag" key={`${period.year}-${period.quarter}`}>Q{period.quarter}/{period.year}</span>)}</div><h3>{report.name}</h3><small>{date.value ? `${date.label}: ${date.value}` : date.label} · {formatBytes(report.size)}{linked.length ? ` · ${linked.length} zugeordnete Ausgabe(n)` : ""}</small><p>{hint.label}</p><p>{report.message}</p></div><div className="fileActions"><button className="secondaryBtn" onClick={() => void downloadReport(report.id)}>Ansehen / Laden</button><button className="secondaryBtn danger" onClick={() => { if (window.confirm(`„${report.name}“ aus dem Browser entfernen?`)) void removeReport(report.id); }}>Entfernen</button></div></article>)}</section>}
  </>;
}
