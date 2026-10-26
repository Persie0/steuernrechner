"use client";

import Link from "next/link";
import { useBooks } from "./components/BookkeepingProvider";
import { useUst } from "./components/UstProvider";
import { money } from "./lib/tax";

export default function Home() {
  const { year, setYear, summary, yearEntries, quarterlyVat } = useBooks();
  const { reports } = useUst();
  return (
    <>
      <section className="quarterlyShortcut">
        <div>
          <b>UVA und ZM quartalsweise erledigen</b>
          <p>
            Jahres-ZIP hochladen, Ausgaben prüfen, Kalenderquartal abschließen.
          </p>
        </div>
        <Link className="primary" href="/berechnung">
          Quartalsdurchlauf starten →
        </Link>
      </section>
      <section className="pageHero trackerHero">
        <div>
          <p className="eyebrow">Einnahmen · Ausgaben · Steuertermine</p>
          <h1>
            Dein Unternehmen. <em>Ein vollständiger Überblick.</em>
          </h1>
          <p>
            Erfasse normale Buchungen wie in Kalkül. Google, Apple und Appodeal
            sind optionale Importe; UVA, ZM und der Jahresabschluss werden
            daraus als eigene Auswertungen vorbereitet.
          </p>
          <div className="heroActions">
            <Link className="primary" href="/buchungen">
              Neue Buchung
            </Link>
            <Link className="secondaryBtn" href="/jahresabschluss">
              Jahresabschluss öffnen
            </Link>
          </div>
        </div>
        <aside>
          <label>
            Arbeitsjahr
            <select
              value={year}
              onChange={(event) => setYear(Number(event.target.value))}
            >
              {[2024, 2025, 2026, 2027].map((item) => (
                <option key={item}>{item}</option>
              ))}
            </select>
          </label>
          <span>
            {yearEntries.length} Buchungen · {reports.length} Importdateien
          </span>
          <span>E/A-Rechnung · USt-Nettosystem</span>
          <span>
            {quarterlyVat ? "vierteljährliche UVA" : "monatliche UVA"}
          </span>
        </aside>
      </section>

      <section className="metricGrid six trackerMetrics">
        <div>
          <span>Einnahmen {year}</span>
          <b>{money(summary.income)}</b>
        </div>
        <div>
          <span>Ausgaben inkl. AfA</span>
          <b>{money(summary.expenses)}</b>
        </div>
        <div className={summary.profitBeforeGfb >= 0 ? "good" : ""}>
          <span>vorläufiger Gewinn</span>
          <b>{money(summary.profitBeforeGfb)}</b>
        </div>
        <div>
          <span>Grundfreibetrag</span>
          <b>− {money(summary.basicGfb)}</b>
        </div>
        <div>
          <span>USt-Jahreskontrolle</span>
          <b>{money(summary.vatBalance)}</b>
        </div>
        <div>
          <span>offene Buchungen</span>
          <b>{summary.openEntries}</b>
        </div>
      </section>

      <section className="workflowIntro">
        <article>
          <b>1</b>
          <div>
            <h2>Buchungen</h2>
            <p>
              Zahlungsdatum, Betrag, Beleg, Kategorie, Privatanteil und
              Umsatzsteuerfall erfassen.
            </p>
          </div>
        </article>
        <article>
          <b>2</b>
          <div>
            <h2>Laufende Steuern</h2>
            <p>
              UVA und ZM bleiben eine eigene Quartalsauswertung mit XML und
              Prüfbericht.
            </p>
          </div>
        </article>
        <article>
          <b>3</b>
          <div>
            <h2>Jahresabschluss</h2>
            <p>
              E1/E1a, U1, E/A-Rechnung, AfA und Aufbewahrung mit konkreten
              Fristen vorbereiten.
            </p>
          </div>
        </article>
      </section>

      <section className="dashboardGrid">
        <article className="card">
          <div className="cardKicker">NÄCHSTER ABSCHLUSS</div>
          <h2>Jahr {year} vorbereiten</h2>
          <div className="annualMini">
            <p>
              <span>E1 + E1a</span>
              <b>30. Juni {year + 1}</b>
              <small>elektronisch via FinanzOnline</small>
            </p>
            <p>
              <span>U1-Jahreserklärung</span>
              <b>30. Juni {year + 1}</b>
              <small>bei Regelbesteuerung</small>
            </p>
            <p>
              <span>ZM</span>
              <b>nicht jährlich</b>
              <small>weiter monatlich oder quartalsweise</small>
            </p>
          </div>
          <Link className="textLink" href="/jahresabschluss">
            Alle Pflichten und Exporte →
          </Link>
        </article>
        <article className="card">
          <div className="cardKicker">DATENBASIS</div>
          <h2>Was noch fehlt</h2>
          <div className="checkSummary">
            <p className={yearEntries.length ? "done" : ""}>
              <b>{yearEntries.length ? "✓" : "!"}</b> Buchungen für {year}
            </p>
            <p className={summary.openEntries === 0 ? "done" : ""}>
              <b>{summary.openEntries === 0 ? "✓" : "!"}</b>{" "}
              {summary.openEntries} unbezahlte Einträge
            </p>
            <p className={reports.length ? "done" : ""}>
              <b>{reports.length ? "✓" : "·"}</b> Plattformimporte sind optional
            </p>
          </div>
          <Link className="textLink" href="/breakdown">
            Rechenweg bis zur Kennzahl →
          </Link>
        </article>
      </section>
    </>
  );
}
