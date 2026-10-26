"use client";

import Link from "next/link";
import { useBooks } from "../components/BookkeepingProvider";
import { useUst } from "../components/UstProvider";
import { money } from "../lib/tax";

export default function Steuer() {
  const {
    year,
    setYear,
    summary,
    regularVat,
    quarterlyVat,
    hasEmployees,
    usesOss,
    hasCashRegister,
    setProfile,
  } = useBooks();
  const { quarter, setQuarter, values, rows } = useUst();
  const uvaBalance =
    values.kz000 * 0.2 + values.kz057 - values.kz060 - values.kz066;
  return (
    <>
      <section className="subHero">
        <p className="eyebrow">Aus Buchungen abgeleitet</p>
        <h1>
          Steuer-Auswertung <em>ohne Mischmasch</em>
        </h1>
        <p>
          Jahreswerte aus den allgemeinen Buchungen stehen getrennt von der
          belegbasierten UVA-/ZM-Quartalsberechnung.
        </p>
      </section>

      <section className="settingsStrip">
        <label>
          Jahr
          <select
            value={year}
            onChange={(e) => setYear(Number(e.target.value))}
          >
            {[2024, 2025, 2026, 2027].map((item) => (
              <option key={item}>{item}</option>
            ))}
          </select>
        </label>
        <label className="checkLine">
          <input
            type="checkbox"
            checked={regularVat}
            onChange={(e) => setProfile({ regularVat: e.target.checked })}
          />{" "}
          Regelbesteuerung
        </label>
        <label className="checkLine">
          <input
            type="checkbox"
            checked={quarterlyVat}
            onChange={(e) => setProfile({ quarterlyVat: e.target.checked })}
          />{" "}
          UVA quartalsweise
        </label>
        <label className="checkLine">
          <input
            type="checkbox"
            checked={usesOss}
            onChange={(e) => setProfile({ usesOss: e.target.checked })}
          />{" "}
          eigener EU-OSS
        </label>
        <label className="checkLine">
          <input
            type="checkbox"
            checked={hasEmployees}
            onChange={(e) => setProfile({ hasEmployees: e.target.checked })}
          />{" "}
          Arbeitnehmer
        </label>
        <label className="checkLine">
          <input
            type="checkbox"
            checked={hasCashRegister}
            onChange={(e) => setProfile({ hasCashRegister: e.target.checked })}
          />{" "}
          Registrierkasse
        </label>
      </section>

      <section className="dashboardGrid">
        <article className="card">
          <div className="cardKicker">EINKOMMENSTEUER · {year}</div>
          <h2>E/A-Gewinnermittlung</h2>
          <div className="statement">
            <p>
              <span>Betriebseinnahmen</span>
              <b>{money(summary.income)}</b>
            </p>
            <p>
              <span>Betriebsausgaben inkl. AfA</span>
              <b>− {money(summary.expenses)}</b>
            </p>
            <p className="total">
              <span>vorläufiger Gewinn</span>
              <b>{money(summary.profitBeforeGfb)}</b>
            </p>
            <p>
              <span>möglicher Grundfreibetrag</span>
              <b>− {money(summary.basicGfb)}</b>
            </p>
            <p className="total">
              <span>nach Grundfreibetrag</span>
              <b>{money(summary.profitAfterBasicGfb)}</b>
            </p>
          </div>
          <p className="hint">
            Noch keine persönliche Einkommensteuer: Andere Einkünfte, SVS,
            Absetzbeträge und ein möglicher investitionsbedingter
            Gewinnfreibetrag fehlen.
          </p>
          <Link className="textLink" href="/jahresabschluss">
            E1/E1a vorbereiten →
          </Link>
        </article>

        <article className="card">
          <div className="cardKicker">UMSATZSTEUER · JAHRESKONTROLLE</div>
          <h2>Aus den Buchungen</h2>
          {!regularVat ? (
            <p className="callout">
              Regelbesteuerung ist ausgeschaltet. Die U1-Pflicht muss anhand
              deiner tatsächlichen Kleinunternehmer-/Optionssituation geprüft
              werden.
            </p>
          ) : (
            <div className="statement">
              <p>
                <span>USt aus Ausgangsrechnungen</span>
                <b>{money(summary.outputVat)}</b>
              </p>
              <p>
                <span>Reverse-Charge-Steuer</span>
                <b>+ {money(summary.reverseChargeVat)}</b>
              </p>
              <p>
                <span>abziehbare Vorsteuer</span>
                <b>− {money(summary.inputVat)}</b>
              </p>
              <p>
                <span>RC-Vorsteuer</span>
                <b>− {money(summary.reverseChargeDeductible)}</b>
              </p>
              <p className="total">
                <span>Jahreskontrolle</span>
                <b>{money(summary.vatBalance)}</b>
              </p>
            </div>
          )}
          <p className="hint">
            Die endgültige U1 ist mit allen eingereichten UVAs und
            Sonderkennzahlen abzugleichen. Diese Buchungsübersicht ersetzt keine
            U1-Formularprüfung.
          </p>
        </article>
      </section>

      <section className="card">
        <div className="sectionTitle">
          <span>Q</span>
          <div>
            <h2>Bestehende UVA-/ZM-Auswertung</h2>
            <p>
              Nur dieser Bereich verwendet die spezialisierten
              Google-/Apple-/Appodeal- und Kalkül-Parser.
            </p>
          </div>
        </div>
        <div className="quarterTabs">
          {[1, 2, 3, 4].map((item) => (
            <button
              className={quarter === item ? "active" : ""}
              onClick={() => setQuarter(item)}
              key={item}
            >
              Q{item}
            </button>
          ))}
        </div>
        <div className="metricGrid six">
          <div>
            <span>KZ000</span>
            <b>{money(values.kz000)}</b>
          </div>
          <div>
            <span>KZ057</span>
            <b>{money(values.kz057)}</b>
          </div>
          <div>
            <span>KZ060</span>
            <b>{money(values.kz060)}</b>
          </div>
          <div>
            <span>KZ066</span>
            <b>{money(values.kz066)}</b>
          </div>
          <div className={uvaBalance < 0 ? "good" : ""}>
            <span>UVA</span>
            <b>{money(uvaBalance)}</b>
          </div>
          <div>
            <span>ZM gesamt</span>
            <b>{money(rows.reduce((sum, row) => sum + row.exact, 0))}</b>
          </div>
        </div>
        <div className="splitActions">
          <Link className="secondaryBtn" href="/berechnung">
            Importe und Kontrolle
          </Link>
          <Link className="primary" href="/finanzonline">
            U30/U13 XML
          </Link>
        </div>
      </section>

      {(usesOss || hasEmployees || hasCashRegister) && (
        <section className="conditionalTasks">
          {usesOss && (
            <article>
              <b>EU-OSS</b>
              <span>
                Quartalsmeldung und Zahlung innerhalb eines Monats nach
                Quartalsende.
              </span>
            </article>
          )}
          {hasEmployees && (
            <article>
              <b>Lohnabgaben</b>
              <span>
                Monatliche Lohnsteuer, DB/DZ und Kommunalsteuer;
                Jahreslohnzettel gesondert berücksichtigen.
              </span>
            </article>
          )}
          {hasCashRegister && (
            <article>
              <b>Registrierkasse</b>
              <span>
                Jahresbeleg zum 31. Dezember erstellen, prüfen und
                Datenerfassungsprotokoll sichern.
              </span>
            </article>
          )}
        </section>
      )}
    </>
  );
}
