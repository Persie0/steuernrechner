"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { mergeExpenses, summarizeOverview } from "../lib/quarterly";
import { money } from "../lib/tax";
import { useUst } from "./UstProvider";

export default function OverviewDashboard() {
  const { ready, year, reports, expenseOverrides, downloadReport } = useUst();
  const [selectedYear, setSelectedYear] = useState(String(year));
  const [selectedQuarter, setSelectedQuarter] = useState("all");
  const expenses = useMemo(() => mergeExpenses(reports, expenseOverrides), [reports, expenseOverrides]);
  const years = useMemo(() => {
    const values = new Set<number>([year]);
    for (const report of reports) {
      if (report.year) values.add(report.year);
      for (const item of report.income || []) values.add(Number(item.date.slice(0, 4)));
    }
    for (const expense of expenses) {
      const date = expense.paymentDate || expense.date;
      if (/^\d{4}/.test(date)) values.add(Number(date.slice(0, 4)));
    }
    return [...values].filter(Number.isFinite).sort((a, b) => b - a);
  }, [reports, expenses, year]);
  const summary = useMemo(() => summarizeOverview(reports, expenses, selectedYear === "all" ? null : Number(selectedYear), selectedQuarter === "all" ? null : Number(selectedQuarter)), [reports, expenses, selectedYear, selectedQuarter]);
  const maybeDuplicatedGoogleFees = expenses.some((expense) => !expense.excluded && /google/i.test(expense.title) && /gebühr|fee|provision/i.test(expense.title));
  if (!ready) return <section className="wizardPanel"><p>Übersicht wird geladen …</p></section>;
  return <>
    <section className="overviewHero">
      <div><p className="eyebrow">DEINE FINANZEN</p><h1>Alles auf <em>einen Blick.</em></h1><p>Berichte, bezahlte Ausgaben und ein vorläufiger Überschuss an einem Ort.</p></div>
      <Link className="primary" href="/berechnung">Quartal abschließen →</Link>
    </section>
    <section className="overviewFilters" aria-label="Zeitraum auswählen">
      <label>Jahr<select value={selectedYear} onChange={(event) => setSelectedYear(event.target.value)}><option value="all">Alle Jahre</option>{years.map((value) => <option key={value} value={value}>{value}</option>)}</select></label>
      <label>Quartal<select value={selectedQuarter} onChange={(event) => setSelectedQuarter(event.target.value)}><option value="all">Alle Quartale</option>{[1,2,3,4].map((value) => <option key={value} value={value}>Q{value}</option>)}</select></label>
    </section>
    <div className="overviewMetrics">
      <article><span>Berichtsumsätze</span><strong>{money(summary.incomeTotal)}</strong><small>Google, Apple und Appodeal</small></article>
      <article><span>Bezahlte Ausgaben</span><strong>{money(summary.expenseTotal)}</strong><small>Betrieblicher Nettoanteil</small></article>
      <article className="overviewBalance"><span>Vorläufiger Überschuss</span><strong>{money(summary.balance)}</strong><small>Berichtsumsätze − bezahlte Ausgaben</small></article>
    </div>
    <p className="overviewNotice">Die Umsätze stammen aus Plattformberichten; sie sind keine bestätigten Bankzuflüsse. Der Überschuss ist kein endgültiger steuerlicher Gewinn: Auszahlungen, Abschreibungen, Steuern und fehlende Belege sind nicht vollständig berücksichtigt. Google-Berichtsumsätze enthalten bereits Gebühren und Steuerabzüge.</p>
    {(summary.unpaidExpenses > 0 || summary.unconfirmedExpenses > 0 || maybeDuplicatedGoogleFees) && <p className="callout">{summary.unpaidExpenses > 0 && `${summary.unpaidExpenses} Ausgaben ohne Zahlungsdatum sind nicht abgezogen. `}{summary.unconfirmedExpenses > 0 && `${summary.unconfirmedExpenses} Ausgaben warten auf Prüfung. `}{maybeDuplicatedGoogleFees && "Google-Gebühren in Ausgaben mit den bereits im Bericht enthaltenen Gebühren abgleichen, um Doppelzählungen zu vermeiden."}</p>}
    {summary.warnings.length > 0 && <details className="card overviewWarnings" open><summary>{summary.warnings.length} Hinweise zur Übersicht</summary><ul>{summary.warnings.map((warning) => <li key={warning}>{warning}</li>)}</ul></details>}
    <section className="card overviewSection">
      <div className="overviewSectionHead"><div><p className="eyebrow">NACH PLATTFORM</p><h2>Woher die Umsätze kommen</h2></div><Link href="/dateien">Alle Dateien ansehen →</Link></div>
      <div className="platformTotals"><article><span>Google Play</span><b>{money(summary.incomeBySource.google)}</b></article><article><span>Apple</span><b>{money(summary.incomeBySource.apple)}</b></article><article><span>Appodeal</span><b>{money(summary.incomeBySource.appodeal)}</b></article></div>
      <small>Berichtszeitpunkt und Auszahlung können in verschiedene Monate fallen. Appodeal-Werte verwenden die verfügbare Report-Umrechnung.</small>
    </section>
    <section className="card overviewSection">
      <div className="overviewSectionHead"><div><p className="eyebrow">ZEITVERLAUF</p><h2>Berichtsumsätze nach Datum</h2></div><Link href="/ausgaben">Ausgaben ansehen →</Link></div>
      {summary.incomeRows.length === 0 ? <p>Für diesen Zeitraum sind noch keine auswertbaren Berichtsumsätze vorhanden.</p> : <div className="overviewTableWrap"><table className="overviewTable"><thead><tr><th>Datum</th><th>Quelle / Vertragspartner</th><th>Bericht</th><th>Betrag</th></tr></thead><tbody>{summary.incomeRows.map((row, index) => <tr key={`${row.reportId}-${row.date}-${row.entity}-${index}`}><td>{row.date}</td><td><span className="sourceTag">{row.entity}</span></td><td><button className="textAction" onClick={() => void downloadReport(row.reportId)}>{row.reportName}</button></td><td>{money(row.amount)}</td></tr>)}</tbody></table></div>}
    </section>
  </>;
}
