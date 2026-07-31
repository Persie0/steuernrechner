"use client";

import {useEffect, useMemo, useState} from "react";
import {categories, csvDownload, useBooks} from "../components/BookkeepingProvider";
import {money} from "../lib/tax";

const official = {
  ea: "https://www.usp.gv.at/themen/steuern-finanzen/steuerliche-gewinnermittlung/einnahmen-ausgaben-rechnung.html",
  est: "https://www.usp.gv.at/themen/steuern-finanzen/einkommensteuer-ueberblick/weitere-informationen-est/einkommensteuererklaerung.html",
  ust: "https://www.usp.gv.at/themen/steuern-finanzen/umsatzsteuer-ueberblick/umsatzsteuervoranmeldung-und-umsatzsteuererklaerung.html",
  zm: "https://www.usp.gv.at/themen/steuern-finanzen/umsatzsteuer-ueberblick/weitere-informationen-zur-umsatzsteuer/umsaetze-mit-auslandsbezug/zusammenfassende-meldung-zm.html",
  archive: "https://www.usp.gv.at/themen/steuern-finanzen/steuerliche-gewinnermittlung/weitere-informationen-zur-steuerlichen-gewinnermittlung/betriebliches-rechnungswesen/aufbewahrungspflicht.html",
  gfb: "https://www.usp.gv.at/themen/steuern-finanzen/steuerliche-gewinnermittlung/weitere-informationen-zur-steuerlichen-gewinnermittlung/betriebseinnahmen-und-ausgaben/gewinnfreibetrag.html",
};

function nextWorkday(date: Date) {
  const result = new Date(date);
  while (result.getDay() === 0 || result.getDay() === 6) result.setDate(result.getDate() + 1);
  return result;
}
const formatDate = (date: Date) => date.toLocaleDateString("de-AT", {day: "2-digit", month: "long", year: "numeric"});
const checklist = [
  "Bank-, PayPal- und Plattformzahlungen mit den Buchungen abstimmen",
  "Fehlende Belege, Gutschriften und Fremdwährungsnachweise ergänzen",
  "Privatanteile und nicht abzugsfähige Teile prüfen",
  "Anlageverzeichnis und AfA vollständig prüfen",
  "E1a-Kennzahlen aus der E/A-Rechnung kontrollieren",
  "Alle UVA-Zeiträume mit der U1-Jahressumme abstimmen",
  "E1 + E1a und U1 in FinanzOnline übermitteln",
  "Bescheide, Protokolle, Exporte und Originalbelege archivieren",
];

export default function Jahresabschluss() {
  const {year, setYear, summary, entries, yearEntries, quarterlyVat, regularVat, usesOss, hasEmployees, hasCashRegister} = useBooks();
  const [doneByYear, setDoneByYear] = useState<Record<string, Record<number, boolean>>>({});
  const done = doneByYear[String(year)] || {};
  const storageKey = "steuernrechner-close-all";
  useEffect(() => {
    let cancelled = false;
    queueMicrotask(() => {
      if (cancelled) return;
      try { setDoneByYear(JSON.parse(localStorage.getItem(storageKey) || "{}")); } catch { setDoneByYear({}); }
    });
    return () => {
      cancelled = true;
    };
  }, [storageKey]);
  useEffect(() => {
    localStorage.setItem(storageKey, JSON.stringify(doneByYear));
  }, [doneByYear, storageKey]);

  const assets = useMemo(() => entries.filter((entry) => entry.asset), [entries]);
  const dueYear = year + 1;
  const deadlines = [
    {date: nextWorkday(new Date(dueYear, 1, 15)), title: "ESt-Vorauszahlung + Q4-UVA", detail: quarterlyVat ? `Q4/${year} UVA und Zahlung` : "ESt-Vorauszahlung; UVA monatlich"},
    {date: nextWorkday(new Date(dueYear, 3, 30)), title: "Papierfrist E1/U1", detail: "nur wenn elektronische Abgabe unzumutbar ist"},
    {date: nextWorkday(new Date(dueYear, 4, 15)), title: "ESt-Vorauszahlung + Q1-UVA", detail: quarterlyVat ? `Q1/${dueYear}` : "ESt-Vorauszahlung; UVA monatlich"},
    {date: nextWorkday(new Date(dueYear, 5, 30)), title: "E1 + E1a und U1", detail: `elektronische Jahreserklärungen für ${year}`},
    {date: nextWorkday(new Date(dueYear, 7, 15)), title: "ESt-Vorauszahlung + Q2-UVA", detail: quarterlyVat ? `Q2/${dueYear}` : "ESt-Vorauszahlung; UVA monatlich"},
    {date: nextWorkday(new Date(dueYear, 10, 15)), title: "ESt-Vorauszahlung + Q3-UVA", detail: quarterlyVat ? `Q3/${dueYear}` : "ESt-Vorauszahlung; UVA monatlich"},
  ];

  function exportEa() {
    csvDownload(`EA_Rechnung_${year}.csv`, [
      ["E/A-Rechnung", String(year), "Betrag"],
      ["Betriebseinnahmen", "", summary.income.toFixed(2)],
      ["Betriebsausgaben inkl. AfA", "", summary.expenses.toFixed(2)],
      ["Vorläufiger Gewinn", "", summary.profitBeforeGfb.toFixed(2)],
      ["Grundfreibetrag, maximal automatisch", "", summary.basicGfb.toFixed(2)],
      ["Gewinn nach Grundfreibetrag", "", summary.profitAfterBasicGfb.toFixed(2)],
      [],
      ["E1a-Kennzahl", "Bezeichnung", "Betrag"],
      ...Object.entries(summary.e1a).sort().map(([key, value]) => [
        key,
        Object.values(categories).find((item) => item.e1a === key)?.label || "Sammelkennzahl",
        value.toFixed(2),
      ]),
    ]);
  }

  function exportAssets() {
    csvDownload(`Anlageverzeichnis_${year}.csv`, [
      ["Anlagegut", "Anschaffung/Zahlung", "Inbetriebnahme", "Netto", "Betriebsanteil %", "betriebliche AK", "Nutzungsdauer", "GWG bis 1.000 €", "Beleg"],
      ...assets.map((entry) => [
        entry.description, entry.paymentDate, entry.firstUseDate, entry.net.toFixed(2),
        String(entry.businessShare), (entry.net * entry.businessShare / 100).toFixed(2),
        String(entry.usefulLife), entry.net * entry.businessShare / 100 <= 1000 ? "Ja" : "Nein",
        entry.documentNumber,
      ]),
    ]);
  }

  function exportU1Check() {
    csvDownload(`U1_Jahreskontrolle_${year}.csv`, [
      ["U1-Jahreskontrolle", "Betrag"],
      ["USt aus Ausgangsrechnungen", summary.outputVat.toFixed(2)],
      ["Reverse-Charge-Steuer", summary.reverseChargeVat.toFixed(2)],
      ["Vorsteuer Inland", summary.inputVat.toFixed(2)],
      ["Reverse-Charge-Vorsteuer", summary.reverseChargeDeductible.toFixed(2)],
      ["Rechnerischer Saldo", summary.vatBalance.toFixed(2)],
      ["Hinweis", "Mit Summe aller eingereichten UVAs und allen U1-Kennzahlen abgleichen"],
    ]);
  }

  return (
    <>
      <section className="subHero">
        <p className="eyebrow">Jahrespflichten für dein Einzelunternehmen</p>
        <h1>{year} abschließen. <em>Nichts vergessen.</em></h1>
        <p>Für einen E/A-Rechner entsteht keine formelle GuV wie bei doppelter Buchhaltung. Maßgeblich sind E1 + E1a, die Umsatzsteuer-Jahreserklärung U1 und deine vollständigen Aufzeichnungen.</p>
      </section>

      <section className="bookToolbar">
        <label>Abschlussjahr<select value={year} onChange={(e) => setYear(Number(e.target.value))}>{[2024, 2025, 2026, 2027].map((item) => <option key={item}>{item}</option>)}</select></label>
        <span>{yearEntries.length} Buchungen · {assets.length} Anlagegüter</span>
        <span className="duePill">FinanzOnline-Frist: 30. Juni {dueYear}</span>
      </section>

      <section className="annualObligations">
        <article className="annualPrimary">
          <span>01</span><div><b>Einkommensteuer</b><h2>E1 + Beilage E1a</h2><p>Die E1a ist die standardisierte E/A-Rechnung. Eine zusätzliche Papier-GuV oder eigene E/A-Aufstellung wird normalerweise nicht mitgesendet.</p><strong>bis 30. Juni {dueYear} elektronisch</strong></div>
        </article>
        <article><span>02</span><div><b>Umsatzsteuer</b><h2>U1-Jahreserklärung</h2><p>{regularVat ? "Für dich wegen Regelbesteuerung einplanen; Jahressummen mit allen UVAs abgleichen." : "Nur angezeigt, weil die Regelbesteuerung im Profil ausgeschaltet wurde – tatsächliche Pflicht prüfen."}</p><strong>bis 30. Juni {dueYear} elektronisch</strong></div></article>
        <article><span>03</span><div><b>Gewinnermittlung</b><h2>E/A + Anlageverzeichnis</h2><p>Zufluss/Abfluss, AfA, GWG, Privatanteile und E1a-Zuordnung dokumentieren.</p><strong>mit Abschluss erstellen, nicht extra mitsenden</strong></div></article>
        <article><span>04</span><div><b>Zusammenfassende Meldung</b><h2>Keine Jahres-ZM</h2><p>ZM bleibt monatlich oder quartalsweise und ist bis Ende des Folgemonats fällig.</p><strong>nicht nochmals jährlich summiert abgeben</strong></div></article>
      </section>

      <section className="dashboardGrid">
        <article className="card">
          <div className="cardKicker">JAHRESZAHLEN</div>
          <h2>E/A-Vorschau {year}</h2>
          <div className="statement">
            <p><span>Einnahmen</span><b>{money(summary.income)}</b></p>
            <p><span>Ausgaben</span><b>− {money(summary.expenses)}</b></p>
            <p><span>davon AfA</span><b>{money(summary.depreciation)}</b></p>
            <p className="total"><span>Gewinn vor GFB</span><b>{money(summary.profitBeforeGfb)}</b></p>
            <p><span>Grundfreibetrag bis 15 %</span><b>− {money(summary.basicGfb)}</b></p>
          </div>
          <div className="exportStack">
            <button onClick={exportEa}>E/A- und E1a-Summen CSV</button>
            <button onClick={exportAssets}>Anlageverzeichnis CSV</button>
            <button onClick={exportU1Check}>U1-Jahreskontrolle CSV</button>
          </div>
        </article>
        <article className="card">
          <div className="cardKicker">ABSCHLUSS-CHECKLISTE</div>
          <h2>{Object.values(done).filter(Boolean).length} von {checklist.length} erledigt</h2>
          <div className="closeChecklist">
            {checklist.map((item, index) => <label key={item}><input type="checkbox" checked={Boolean(done[index])} onChange={(e) => setDoneByYear((current) => ({...current, [String(year)]: {...(current[String(year)] || {}), [index]: e.target.checked}}))}/><span>{item}</span></label>)}
          </div>
        </article>
      </section>

      <section className="card">
        <div className="sectionTitle"><span>⏱</span><div><h2>Steuerkalender {dueYear}</h2><p>Wo der gesetzliche Termin auf ein Wochenende fällt, wird hier der nächste Werktag angezeigt.</p></div></div>
        <div className="deadlineTimeline">
          {deadlines.map((item) => <article key={item.title + item.date.toISOString()}><time>{formatDate(item.date)}</time><div><b>{item.title}</b><span>{item.detail}</span></div></article>)}
          <article><time>laufend</time><div><b>ZM</b><span>bis Ende des auf den Meldezeitraum folgenden Monats</span></div></article>
          {usesOss && <article><time>quartalsweise</time><div><b>EU-OSS</b><span>Erklärung und Zahlung binnen eines Monats nach Quartalsende</span></div></article>}
          {hasEmployees && <article><time>monatlich</time><div><b>Lohnabgaben</b><span>grundsätzlich bis 15. des Folgemonats</span></div></article>}
          {hasCashRegister && <article><time>31. Dezember</time><div><b>Registrierkassen-Jahresbeleg</b><span>erstellen, prüfen und mit Datenerfassungsprotokoll sichern</span></div></article>}
        </div>
      </section>

      <section className="card theoryCard">
        <div className="sectionTitle"><span>7</span><div><h2>Aufbewahrung</h2></div></div>
        <p>Belege, Buchungsdaten, E/A-Aufstellung, Anlageverzeichnis, XMLs und positive FinanzOnline-Protokolle grundsätzlich sieben Jahre ab Ende des betreffenden Kalenderjahres aufbewahren. Für Grundstücksunterlagen und laufende Verfahren gelten längere Zeiten.</p>
        <p>Die Exporte sind Arbeitsunterlagen. Die amtlichen Erklärungen werden in FinanzOnline eingereicht; die Seite erzeugt derzeit bewusst kein unvalidiertes E1-/U1-XML.</p>
      </section>

      <section className="sourceLinks">
        <a href={official.ea} target="_blank">USP E/A-Rechnung ↗</a>
        <a href={official.est} target="_blank">USP Einkommensteuererklärung ↗</a>
        <a href={official.ust} target="_blank">USP U1/UVA ↗</a>
        <a href={official.zm} target="_blank">USP ZM ↗</a>
        <a href={official.gfb} target="_blank">USP Gewinnfreibetrag ↗</a>
        <a href={official.archive} target="_blank">USP Aufbewahrung ↗</a>
      </section>
    </>
  );
}
