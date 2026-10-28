"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import ExpenseEditor from "../components/ExpenseEditor";
import { useUst } from "../components/UstProvider";
import { mergeExpenses } from "../lib/quarterly";
import { money } from "../lib/tax";

function category(title: string) {
  if (/openai/i.test(title)) return "OpenAI";
  if (/apple/i.test(title)) return "Apple";
  if (/google/i.test(title)) return "Google";
  if (/appodeal/i.test(title)) return "Appodeal";
  if (/sozialversicherung|\bsvs\b/i.test(title)) return "SVS";
  if (/wirtschaftskammer|\bwko\b/i.test(title)) return "WKO";
  return "Weitere";
}

export default function ExpensesPage() {
  const { reports, expenseOverrides } = useUst();
  const [search, setSearch] = useState("");
  const [year, setYear] = useState("all"), [quarter, setQuarter] = useState("all"), [source, setSource] = useState("all");
  const all = useMemo(() => mergeExpenses(reports, expenseOverrides), [reports, expenseOverrides]);
  const years = useMemo(() => [...new Set(all.map((expense) => expense.date.slice(0, 4)).filter((value) => /^\d{4}$/.test(value)))].sort().reverse(), [all]);
  const categories = useMemo(() => [...new Set(all.map((expense) => category(expense.title)))].sort(), [all]);
  const filtered = useMemo(() => all.filter((expense) => {
    const date = expense.date;
    return (year === "all" || date.startsWith(year)) && (quarter === "all" || Math.ceil(Number(date.slice(5, 7)) / 3) === Number(quarter)) && (source === "all" || category(expense.title) === source) && `${expense.title} ${expense.sourceName} ${expense.note}`.toLowerCase().includes(search.toLowerCase().trim());
  }).sort((a, b) => b.date.localeCompare(a.date) || a.title.localeCompare(b.title)), [all, year, quarter, search, source]);
  return <>
    <section className="subHero"><p className="eyebrow">ALLE AUSGABEN</p><h1>Ausgaben <em>prüfen & bearbeiten.</em></h1><p>Alle gespeicherten Ausgaben, unabhängig vom gewählten Quartal. Änderungen werden in den betroffenen Quartalen erneut zur Prüfung markiert.</p></section>
    <div className="overviewFilters"><label>Suchen<input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Lieferant oder Beleg"/></label><label>Quelle<select value={source} onChange={(event) => setSource(event.target.value)}><option value="all">Alle Quellen</option>{categories.map((value) => <option key={value}>{value}</option>)}</select></label><label>Jahr<select value={year} onChange={(event) => setYear(event.target.value)}><option value="all">Alle Jahre</option>{years.map((value) => <option key={value}>{value}</option>)}</select></label><label>Quartal<select value={quarter} onChange={(event) => setQuarter(event.target.value)}><option value="all">Alle Quartale</option>{[1,2,3,4].map((value) => <option key={value} value={value}>Q{value}</option>)}</select></label></div>
    <p>{filtered.length} von {all.length} Ausgaben · sortiert nach Steuerdatum</p>
    {!filtered.length && <section className="card"><p>Keine passenden Ausgaben vorhanden.</p><Link href="/berechnung">Ausgaben im Quartalsdurchlauf importieren →</Link></section>}
    {filtered.map((expense) => <details className="expenseListItem" key={expense.id}><summary><span><b>{expense.title}</b><span className="sourceTag">{category(expense.title)}</span><small>Steuerdatum {expense.date || "offen"} · {expense.paymentDate ? `bezahlt ${expense.paymentDate}` : "Zahlung offen"} · {expense.excluded ? "ausgeschlossen" : expense.confirmed ? "geprüft" : "bitte prüfen"}</small></span><strong>{money(expense.net)}</strong></summary><ExpenseEditor expense={expense}/></details>)}
  </>;
}
