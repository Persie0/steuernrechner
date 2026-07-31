"use client";

import {categories, useBooks} from "../components/BookkeepingProvider";
import {useUst} from "../components/UstProvider";
import {APPLE_ENTITIES, money, sourceLabel} from "../lib/tax";

export default function Breakdown() {
  const {year, summary, yearEntries} = useBooks();
  const {reports, totals, values, rows, quarter} = useUst();
  const periodReports = reports.filter((report) =>
    report.year === year &&
    report.month !== null &&
    [quarter * 3 - 2, quarter * 3 - 1, quarter * 3].includes(report.month),
  );
  return (
    <>
      <section className="subHero">
        <p className="eyebrow">Prüfpfad statt Blackbox</p>
        <h1>Von der Zeile <em>bis zur Kennzahl</em></h1>
        <p>Diese Seite trennt allgemeine E/A-Buchungen, Jahreswerte und die spezialisierten Plattformdateien. So ist sichtbar, welche Spalten zählen und warum.</p>
      </section>

      <section className="breakdownNav">
        <a href="#ea">E/A und Gewinn</a>
        <a href="#ust">Umsatzsteuer</a>
        <a href="#e1a">E1a-Kennzahlen</a>
        <a href="#imports">Plattformimporte</a>
        <a href="#timing">Zeitliche Zuordnung</a>
      </section>

      <section className="card" id="ea">
        <div className="sectionTitle"><span>01</span><div><h2>E/A-Rechnung und Gewinn</h2><p>Grundsätzlich zählt der Zahlungsfluss. Anlagegüter werden über AfA verteilt.</p></div></div>
        <div className="formulaBoard">
          <div><span>bezahlte Betriebseinnahmen</span><b>{money(summary.income)}</b></div>
          <i>−</i><div><span>bezahlte Betriebsausgaben + AfA</span><b>{money(summary.expenses)}</b></div>
          <i>=</i><div className="result"><span>vorläufiger Gewinn</span><b>{money(summary.profitBeforeGfb)}</b></div>
        </div>
        <div className="ruleGrid">
          <article><b>Normale Einnahme</b><code>Netto × 100 %</code><p>nur wenn „bezahlt/erhalten“ und Zahlungsdatum im Jahr {year}</p></article>
          <article><b>Normale Ausgabe</b><code>Netto × Betriebsanteil</code><p>nur wenn bezahlt; Privatanteil wird nicht als Ausgabe gerechnet</p></article>
          <article><b>GWG</b><code>betriebliche Anschaffungskosten ≤ 1.000 €</code><p>im maßgeblichen Jahr sofort unter E1a KZ 9130</p></article>
          <article><b>Anlagegut</b><code>AK × Betriebsanteil ÷ Nutzungsdauer</code><p>lineare AfA; bei Inbetriebnahme Juli–Dezember im ersten Jahr halb</p></article>
          <article><b>Grundfreibetrag</b><code>min(Gewinn, 33.000 €) × 15 %</code><p>maximal 4.950 €; investitionsbedingter GFB ist noch nicht automatisch enthalten</p></article>
        </div>
      </section>

      <section className="card" id="ust">
        <div className="sectionTitle"><span>02</span><div><h2>Umsatzsteuer-Jahreskontrolle</h2><p>Sie verwendet USt-Fall, Netto, USt und Betriebsanteil – nicht bloß die Ausgabenkategorie.</p></div></div>
        <div className="formulaBoard vat">
          <div><span>Ausgangs-USt</span><b>{money(summary.outputVat)}</b></div>
          <i>+</i><div><span>Reverse-Charge-Steuer</span><b>{money(summary.reverseChargeVat)}</b></div>
          <i>−</i><div><span>Vorsteuer inkl. RC</span><b>{money(summary.inputVat + summary.reverseChargeDeductible)}</b></div>
          <i>=</i><div className="result"><span>Kontrollsaldo</span><b>{money(summary.vatBalance)}</b></div>
        </div>
        <div className="dataDictionary">
          <div><b>Feld</b><b>Verwendung</b><b>Warum</b></div>
          <div><code>USt-Fall</code><span>Inland, EU-B2B, Reverse Charge, Drittland, steuerfrei</span><span>bestimmt, ob und wo österreichische USt entsteht</span></div>
          <div><code>Netto</code><span>Bemessungsgrundlage; bei RC automatisch × 20 %</span><span>Netto-System behandelt USt getrennt</span></div>
          <div><code>USt</code><span>nur beim Inlandsfall aus der Rechnung</span><span>keine erfundene USt bei Drittland/EU-B2B</span></div>
          <div><code>Betriebsanteil</code><span>reduziert Vorsteuer und Ausgabe</span><span>Privatanteil ist nicht betrieblich abzugsfähig</span></div>
          <div><code>Leistungsdatum</code><span>Kontrollfeld für UVA/ZM-Zeitraum</span><span>kann vom Zahlungsdatum der E/A abweichen</span></div>
        </div>
      </section>

      <section className="card" id="e1a">
        <div className="sectionTitle"><span>03</span><div><h2>E1a-Zuordnung {year}</h2><p>Jede Kategorie landet in einer vorbereiteten Sammelkennzahl. Vor Einreichung mit dem aktuellen E1a prüfen.</p></div></div>
        <div className="e1aTable">
          <div><b>KZ</b><b>Beispiele</b><b>Betrag</b><b>Quellzeilen</b></div>
          {Object.entries(summary.e1a).sort().map(([key, amount]) => {
            const matching = yearEntries.filter((entry) => categories[entry.category].e1a === key || (entry.asset && key === "9130"));
            return <div key={key}><strong>{key}</strong><span>{[...new Set(Object.entries(categories).filter(([, item]) => item.e1a === key).map(([, item]) => item.label))].join(", ")}</span><b>{money(amount)}</b><span>{matching.length}</span></div>;
          })}
          {!Object.keys(summary.e1a).length && <p className="empty">Noch keine bezahlten Buchungen für {year}.</p>}
        </div>
      </section>

      <section className="card" id="imports">
        <div className="sectionTitle"><span>04</span><div><h2>Plattformimporte · Q{quarter}/{year}</h2><p>Importdateien sind optional und dienen der spezialisierten UVA-/ZM-Prüfung; sie erzeugen keine versteckten allgemeinen Buchungen.</p></div></div>
        <div className="importTotals">
          <p><span>Google-ZM</span><b>{money(totals.googleZm)}</b></p>
          <p><span>Apple-ADI-ZM</span><b>{money(totals.appleZm)}</b></p>
          <p><span>KZ057 / 060 / 066</span><b>{money(values.kz057)} / {money(values.kz060)} / {money(values.kz066)}</b></p>
          <p><span>ZM-Zeilen</span><b>{rows.map((row) => `${row.uid}: ${money(row.exact)}`).join(" · ") || "keine"}</b></p>
        </div>
        <div className="reportTrace">
          <div><b>Datei</b><b>erkannte Grundlage</b><b>Zeilen</b><b>Beitrag</b></div>
          {periodReports.map((report) => <div key={report.id}>
            <span><b>{report.name}</b><small>{sourceLabel[report.source]}</small></span>
            <span>{report.message}</span>
            <span>{report.rows}</span>
            <span>
              {report.contribution.googleZm ? `Google ZM ${money(report.contribution.googleZm)}` : ""}
              {report.contribution.appleZm ? `Apple ZM ${money(report.contribution.appleZm)}` : ""}
              {report.contribution.kz057 ? ` KZ057 ${money(report.contribution.kz057)}` : ""}
              {report.contribution.kz060 ? ` KZ060 ${money(report.contribution.kz060)}` : ""}
              {report.contribution.kz066 ? ` KZ066 ${money(report.contribution.kz066)}` : ""}
              {report.contribution.appodealEur ? ` Appodeal ${money(report.contribution.appodealEur)}` : ""}
            </span>
          </div>)}
          {!periodReports.length && <p className="empty">Keine optionalen Importdateien in diesem Zeitraum.</p>}
        </div>
        <details className="theoryDetails">
          <summary>Welche Spalten berücksichtigen die Plattformparser?</summary>
          <div className="parserColumns">
            <article><b>Google Earnings</b><p>Transaction Type, Product Type, Buyer Country, Merchant Currency, Amount (Merchant Currency) und Description. EU-Länder werden dem irischen Vertragspartner zugeordnet; Gebühren und Steuern werden getrennt geprüft.</p></article>
            <article><b>Apple Financial Detailed</b><p>Country of Sale, Partner Share, Extended Partner Share, Customer Currency, Partner Share Currency und Report-/Transaktionsperiode. Das Land steuert die Apple-Entity; nur Apple Distribution International (Irland) fließt in die ZM.</p></article>
            <article><b>Appodeal</b><p>Abrechnungsmonat, Ad revenue und Berichtswährung. Drittland-Umsatz bleibt außerhalb der ZM, wird aber als Einnahmenquelle sichtbar.</p></article>
            <article><b>Kalkül-Ausgaben</b><p>Datum, Netto/Brutto, Umsatzsteuer, Geschäftspartner/Land, Kategorie und Reverse-Charge-Kennzeichnung. Erkanntes KZ057/KZ060/KZ066 wird in der Quartalsprüfung gezeigt.</p></article>
          </div>
        </details>
        <p className="hint">Apple-Storefronts werden allen sieben offiziellen Vertragspartnern zugeordnet: {Object.values(APPLE_ENTITIES).map((entity) => entity.name).join("; ")}. Unbekannte neue Ländercodes werden markiert, nicht still eingerechnet.</p>
      </section>

      <section className="card" id="timing">
        <div className="sectionTitle"><span>05</span><div><h2>Zahlungsdatum oder Leistungsdatum?</h2></div></div>
        <div className="timingCompare">
          <article><b>E/A und Einkommensteuer</b><strong>Zahlungsdatum</strong><p>Bei Einnahmen-Ausgaben-Rechnung grundsätzlich Zufluss/Abfluss. Ausnahme: AfA für länger genutzte Anlagegüter.</p></article>
          <article><b>normale USt bei Istbesteuerung</b><strong>Zahlungsbezug</strong><p>Die laufende Umsatzsteuer richtet sich nach der gewählten Besteuerungsart; auf der Seite ist Istbesteuerung hinterlegt.</p></article>
          <article><b>Reverse Charge und ZM</b><strong>Leistungs-/Meldezeitraum</strong><p>Deshalb speichert jede Buchung zusätzlich ein Leistungsdatum und die Importparser erkennen Berichtsmonate.</p></article>
        </div>
      </section>
    </>
  );
}
