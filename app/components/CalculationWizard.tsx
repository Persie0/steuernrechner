"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { formatBytes, useUst, type UploadFeedback } from "./UstProvider";
import { money, vatBalance, type ExpenseDraft } from "../lib/tax";
import { quarterDates } from "../lib/quarterly";
import {
  reportQuarterHint,
  summarizeReportQuarters,
} from "../lib/quarter-hints";
import ImportProgressPanel, { importIsActive } from "./ImportProgressPanel";
import ProviderImportPanel from "./ProviderImportPanel";

const monthNames = [
  "Jänner",
  "Februar",
  "März",
  "April",
  "Mai",
  "Juni",
  "Juli",
  "August",
  "September",
  "Oktober",
  "November",
  "Dezember",
];
const steps = ["Quartal", "Belege", "Ausgaben", "Prüfen", "UVA & ZM"];

function ExpenseEditor({ expense }: { expense: ExpenseDraft }) {
  const { updateExpense } = useUst();
  const change = (patch: Partial<ExpenseDraft>) =>
    updateExpense({
      ...expense,
      ...patch,
      confirmed: false,
      ...("net" in patch || "share" in patch ? { businessNet: undefined } : {}),
    });
  return (
    <article
      className={`expenseEditor ${expense.confirmed ? "confirmed" : ""}`}
    >
      <div className="expenseHeading">
        <h3>{expense.title}</h3>
        <span>{expense.confirmed ? "Geprüft" : "Bitte prüfen"}</span>
      </div>
      <small>{expense.sourceName}</small>
      <label>
        Beschreibung / Lieferant
        <input
          value={expense.title}
          onChange={(e) => change({ title: e.target.value })}
        />
      </label>
      <label className="checkLine">
        <input
          type="checkbox"
          checked={!!expense.excluded}
          onChange={(e) =>
            updateExpense({
              ...expense,
              excluded: e.target.checked,
              confirmed: false,
            })
          }
        />{" "}
        Nicht berücksichtigen (privat / irrtümlich erfasst)
      </label>
      <div className="expenseFields">
        <label>
          Steuerdatum
          <input
            type="date"
            value={expense.date}
            onChange={(e) => change({ date: e.target.value })}
          />
        </label>
        <label>
          Leistungsende
          <input
            type="date"
            value={expense.serviceDate}
            onChange={(e) => change({ serviceDate: e.target.value })}
          />
        </label>
        <label>
          Bezahlt am
          <input
            type="date"
            value={expense.paymentDate}
            onChange={(e) => change({ paymentDate: e.target.value })}
          />
        </label>
        <label>
          Netto gesamt · EUR
          <input
            type="number"
            step="0.01"
            min="0"
            value={expense.net}
            onChange={(e) => change({ net: +e.target.value })}
          />
        </label>
        <label>
          USt laut Rechnung · EUR
          <input
            type="number"
            step="0.01"
            min="0"
            value={expense.vat}
            onChange={(e) => change({ vat: +e.target.value })}
          />
        </label>
        <label>
          Betrieblich · %
          <input
            type="number"
            min="0"
            max="100"
            value={expense.share}
            onChange={(e) =>
              change({ share: Math.min(100, Math.max(0, +e.target.value)) })
            }
          />
        </label>
        <label>
          USt-Behandlung
          <select
            value={expense.vatCase}
            onChange={(e) =>
              change({ vatCase: e.target.value as ExpenseDraft["vatCase"] })
            }
          >
            <option value="review">Noch ungeklärt – nicht abgabefertig</option>
            <option value="domestic">
              Korrekte österreichische USt · KZ 060
            </option>
            <option value="reverse_charge">
              Ausländische Dienstleistung · RC 20 %
            </option>
            <option value="none">
              Keine UVA-Wirkung / kein Vorsteuerabzug
            </option>
          </select>
        </label>
      </div>
      <label>
        Prüfnotiz
        <input
          value={expense.note}
          onChange={(e) => change({ note: e.target.value })}
        />
      </label>
      <p className="hint">
        Bei RC zählt grundsätzlich das Leistungsende, bei bezahlter
        Vorauszahlung der frühere Zahlungstermin. Bei gewöhnlicher
        Einkaufs-Vorsteuer müssen Rechnung und Zahlung vorliegen. Steuerdatum
        entsprechend setzen. Bereits reduzierte Kalkül-Buchungsbeträge werden
        nicht nochmals gekürzt.
      </p>
      <label className="checkLine">
        <input
          type="checkbox"
          disabled={
            expense.excluded ||
            expense.vatCase === "review" ||
            !expense.date ||
            expense.net <= 0
          }
          checked={expense.confirmed}
          onChange={(e) =>
            updateExpense({ ...expense, confirmed: e.target.checked })
          }
        />{" "}
        Betrag, Steuerdatum, USt-Fall und Betriebsanteil mit dem Beleg geprüft
      </label>
    </article>
  );
}

export default function CalculationWizard() {
  const {
    year,
    quarter,
    setYear,
    setQuarter,
    reports,
    expenseOverrides,
    importFiles,
    importProgress,
    importFeedback,
    cancelImport,
    removeReport,
    downloadReport,
    downloadAllReports,
    review,
    setReview,
    expenses,
    updateExpense,
    totals,
    values,
    rows,
    filingBlockers,
    clearEdits,
    setValues,
    setRows,
  } = useUst();
  const [step, setStep] = useState(1),
    [uploadPending, setBusy] = useState(false),
    [apiBusy, setApiBusy] = useState(false),
    [feedback, setFeedback] = useState<UploadFeedback[]>([]),
    [showFiles, setShowFiles] = useState(false),
    [showCorrection, setShowCorrection] = useState(false);
  const { from, to } = quarterDates(year, quarter),
    months = [quarter * 3 - 2, quarter * 3 - 1, quarter * 3];
  const balance = vatBalance(values),
    ready = filingBlockers.length === 0;
  const quarterSummary = useMemo(
    () => summarizeReportQuarters(reports, expenseOverrides),
    [reports, expenseOverrides],
  );
  const busy = uploadPending || apiBusy || importIsActive(importProgress);
  const visibleFeedback = busy
    ? importFeedback
    : feedback.length
      ? feedback
      : importFeedback;
  const go = (n: number) => {
    setStep(n);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };
  async function upload(files: FileList | null) {
    if (!files?.length) return;
    setBusy(true);
    setFeedback([]);
    try {
      setFeedback(await importFiles(files));
    } catch (e) {
      setFeedback([
        {
          level: "error",
          message: e instanceof Error ? e.message : "Import fehlgeschlagen",
        },
      ]);
    } finally {
      setBusy(false);
    }
  }
  function addExpense() {
    const id = crypto.randomUUID();
    updateExpense({
      id,
      title: "Weitere Ausgabe",
      date: from,
      paymentDate: "",
      serviceDate: from,
      net: 0,
      vat: 0,
      share: 100,
      vatCase: "review",
      confirmed: false,
      sourceName: "Manuell",
      note: "",
    });
  }
  return (
    <>
      <section className="wizardHero personalHero">
        <div>
          <p className="eyebrow">Dein Quartalsabschluss</p>
          <h1>
            Ein Durchlauf.
            <br />
            <em>UVA und ZM.</em>
          </h1>
          <p>
            Für dein österreichisches App-Einzelunternehmen: Google Play, Apple
            und Appodeal. Originale importieren, Ausgaben prüfen und Werte für
            FinanzOnline vorbereiten.
          </p>
          <div className="fileChips">
            <span>Regelbesteuerung</span>
            <span>Istbesteuerung</span>
            <span>Quartalsweise</span>
            <span>Nur lokal gespeichert</span>
          </div>
        </div>
        <div className="quarterBadge">
          <b>Q{quarter}</b>
          <span>{year}</span>
          <small>
            {from} bis {to}
          </small>
        </div>
      </section>
      <nav
        className="wizardStepper personalStepper"
        aria-label="Quartalsdurchlauf"
      >
        {steps.map((s, i) => (
          <button
            key={s}
            className={step === i + 1 ? "active" : step > i + 1 ? "done" : ""}
            disabled={busy}
            onClick={() => go(i + 1)}
          >
            <span>{i + 1}</span>
            {s}
          </button>
        ))}
      </nav>

      {step === 1 && (
        <section className="wizardPanel">
          <p className="eyebrow">1 · Zeitraum</p>
          <h2>Welches Quartal möchtest du erledigen?</h2>
          <div className="periodCompact">
            <label>
              Jahr
              <input
                type="number"
                min="2024"
                max="2100"
                value={year}
                onChange={(e) => {
                  const n = +e.target.value;
                  if (n >= 2024 && n <= 2100) setYear(n);
                }}
              />
            </label>
            <label>
              Quartal
              <select
                value={quarter}
                onChange={(e) => setQuarter(+e.target.value)}
              >
                {[1, 2, 3, 4].map((q) => (
                  <option value={q} key={q}>
                    Q{q} · {monthNames[q * 3 - 3]}–{monthNames[q * 3 - 1]}
                  </option>
                ))}
              </select>
            </label>
          </div>
          <p>
            Du kannst monatlich Belege ergänzen. Die Abgabe und deine
            Prüfschritte bleiben je Quartal getrennt gespeichert.
          </p>
          <h3>Welche Einnahmequellen waren aktiv?</h3>
          <div className="sourceChoices">
            {(
              [
                ["google", "Google Play"],
                ["apple", "Apple App Store"],
                ["appodeal", "Appodeal"],
              ] as const
            ).map(([key, label]) => (
              <label className="checkLine" key={key}>
                <input
                  type="checkbox"
                  checked={review[key]}
                  onChange={(e) =>
                    setReview({ [key]: e.target.checked, reviewed: false })
                  }
                />
                {label}
              </label>
            ))}
          </div>
          <p className="hint">
            Appodeal Inc. (USA): keine österreichische UVA-/ZM-Position.
            Monatsguthaben und Wise-Eigenüberträge sind keine zusätzlichen
            Umsätze. Ein anderer Werbe-Vertragspartner muss separat geprüft
            werden.
          </p>
        </section>
      )}

      {step === 2 && (
        <section className="wizardPanel">
          <p className="eyebrow">2 · Originale</p>
          <h2>ZIP oder einzelne Belege hochladen</h2>
          <p>
            Du kannst deinen ganzen Jahresordner hochladen. Identische Kopien
            werden am Dateiinhalt erkannt. Die Quartalssumme verwendet nur die
            passenden Steuerdaten.
          </p>
          <div
            className="personalDrop"
            onDragOver={(e) => e.preventDefault()}
            onDrop={(e) => {
              e.preventDefault();
              if (!busy) void upload(e.dataTransfer.files);
            }}
          >
            <b>
              {busy
                ? "Import läuft · Fortschritt siehe unten"
                : "ZIP, CSV, TXT, PDF oder XLSX hier ablegen"}
            </b>
            <span>
              Berichte, Ausgaben und Zahlungsnachweise dürfen gemeinsam im ZIP
              liegen.
            </span>
            <label className="uploadBtn">
              Dateien auswählen
              <input
                aria-label="ZIP oder Originalbelege hochladen"
                type="file"
                multiple
                accept=".zip,.csv,.txt,.pdf,.xlsx,.xml,.png,.jpg,.json"
                disabled={busy}
                onChange={(e) => {
                  void upload(e.target.files);
                  e.currentTarget.value = "";
                }}
              />
            </label>
          </div>
          <ImportProgressPanel
            progress={importProgress}
            feedback={importFeedback}
            onCancel={cancelImport}
          />
          <ProviderImportPanel
            year={year}
            quarter={quarter}
            disabled={busy}
            importFiles={importFiles}
            cancelImport={cancelImport}
            onBusyChange={setApiBusy}
            onImportFeedback={setFeedback}
          />
          {reports.length > 0 && (
            <section
              className="quarterSuggestions"
              aria-label="Erkannte Quartale"
            >
              <strong>Erkannte Quartale</strong>
              <p>
                Orientierung anhand der Berichte und Belegdaten. Apple-Berichte
                können mehrere Quartale betreffen. Die steuerliche Zuordnung und
                Ausgaben bitte weiterhin prüfen.
              </p>
              <div>
                {quarterSummary.groups.map((group) => (
                  <button
                    type="button"
                    key={`${group.year}-${group.quarter}`}
                    className={
                      year === group.year && quarter === group.quarter
                        ? "selected"
                        : ""
                    }
                    aria-pressed={
                      year === group.year && quarter === group.quarter
                    }
                    disabled={busy}
                    onClick={() => {
                      setYear(group.year);
                      setQuarter(group.quarter);
                    }}
                  >
                    Q{group.quarter}/{group.year} · {group.count}{" "}
                    {group.count === 1 ? "Datei" : "Dateien"}
                  </button>
                ))}
              </div>
              {quarterSummary.unknown > 0 && (
                <small>
                  {quarterSummary.unknown}{" "}
                  {quarterSummary.unknown === 1
                    ? "Datei konnte"
                    : "Dateien konnten"}{" "}
                  keinem Quartal zugeordnet werden.
                </small>
              )}
            </section>
          )}
          <div className="reportChecklist">
            <p>
              <b>Google:</b> Earnings CSV für{" "}
              {months.map((m) => monthNames[m - 1]).join(", ")}. Gebühren-PDFs
              dienen dem Abgleich und werden nicht zusätzlich auf die
              CSV-Gebühren addiert.
            </p>
            <p>
              <b>Apple:</b> Financial Detailed FD-Berichte für das Quartal und
              den Folgemonat. Apples Finanzmonate stimmen nicht mit
              Kalendermonaten überein. Für Q{quarter} sind insbesondere die Tage
              bis {to} nötig.
            </p>
            <p>
              <b>Wechselkurse:</b> „InforEuro nur Schätzung“ ist kein
              Lesefehler. Für diese Währungen einen zulässigen Kursbeleg prüfen
              oder in Schritt 4 eine auf das Kalenderquartal abgestimmte
              EUR-Summe mit Belegreferenz ergänzen. Eine Bankauszahlung allein
              belegt die ZM-Quartalssumme nicht.
            </p>
            <p>
              <b>Ausgaben:</b> Originalrechnungen oder „Nur Ausgaben“-CSV.
              Beides zusammen wird nach Lieferant, Datum und Betrag abgeglichen.
              Gescannte oder unbekannte Belege bitte in Schritt 3 manuell
              erfassen.
            </p>
            <p>
              <b>Appodeal / Wise:</b> Monats-PDFs und Zahlungsnachweise werden
              aufbewahrt. Wise-XLSX bleibt Anlage für den Zahlungsabgleich, ohne
              automatische UVA-/ZM-Buchung.
            </p>
          </div>
          {visibleFeedback.length > 0 && (
            <details className="uploadFeedback" open={!busy}>
              <summary>
                {visibleFeedback.length} Importmeldungen · Details anzeigen
              </summary>
              {visibleFeedback.map((f, i) =>
                f.message.length > 220 ? (
                  <details className={f.level} key={i}>
                    <summary>{f.message.slice(0, 200)} …</summary>
                    <p>{f.message}</p>
                  </details>
                ) : (
                  <p className={f.level} key={i}>
                    {f.message}
                  </p>
                ),
              )}
            </details>
          )}
          <button
            className="secondaryBtn"
            onClick={() => setShowFiles(!showFiles)}
          >
            {reports.length} gespeicherte Originale{" "}
            {showFiles ? "ausblenden" : "anzeigen"}
          </button>
          {showFiles && (
            <div className="personalFiles">
              {reports.map((r) => (
                <article key={r.id}>
                  <div>
                    <b>{r.name}</b>
                    <small>
                      {r.source} · {formatBytes(r.size)}
                    </small>
                    <small>
                      {reportQuarterHint(r, expenseOverrides).label}
                    </small>
                    <p>{r.message}</p>
                  </div>
                  <button onClick={() => void downloadReport(r.id)}>
                    Ansehen / Laden
                  </button>
                  <button
                    className="danger"
                    disabled={busy}
                    onClick={() => void removeReport(r.id)}
                  >
                    Entfernen
                  </button>
                </article>
              ))}
            </div>
          )}
        </section>
      )}

      {step === 3 && (
        <section className="wizardPanel">
          <p className="eyebrow">3 · Ausgaben</p>
          <h2>Hattest du zusätzliche betriebliche Ausgaben?</h2>
          <p>
            Google-Plattformgebühren sind bereits aus den Earnings erfasst. Hier
            prüfst du beispielsweise OpenAI, Apple Developer, Hardware, SVS und
            WKO.
          </p>
          <div className="answerButtons">
            <button
              className={review.expenses === "yes" ? "selected" : ""}
              onClick={() => setReview({ expenses: "yes", reviewed: false })}
            >
              Ja, Ausgaben prüfen
            </button>
            <button
              className={review.expenses === "no" ? "selected" : ""}
              onClick={() => setReview({ expenses: "no", reviewed: false })}
            >
              Nein, keine zusätzlichen Ausgaben
            </button>
          </div>
          {expenses.length > 0 && (
            <p>
              {expenses.length} zugeordnete Ausgaben im Quartal. Noch ungeklärte
              USt-Fälle zählen zunächst mit 0 € und verhindern den Abschluss.
            </p>
          )}
          {expenses.map((e) => (
            <ExpenseEditor key={e.id} expense={e} />
          ))}
          {review.expenses === "yes" && (
            <button className="secondaryBtn" onClick={addExpense}>
              + Ausgabe manuell ergänzen
            </button>
          )}
          <p className="callout">
            Wiederkehrende Belege einzeln prüfen: OpenAI-Abos und Credits werden
            nicht aus dem Vormonat erfunden. Bei Vorauszahlung vor Quartalsende
            Zahlungsnachweis und Leistungszeitraum abstimmen.
          </p>
          <label className="checkLine">
            <input
              type="checkbox"
              checked={review.expensesComplete}
              onChange={(e) =>
                setReview({
                  expensesComplete: e.target.checked,
                  reviewed: false,
                })
              }
            />{" "}
            Alle zusätzlichen Ausgaben und wiederkehrenden Abos dieses Quartals
            erfasst; keine Rechnung fehlt.
          </label>
        </section>
      )}

      {step === 4 && (
        <section className="wizardPanel">
          <p className="eyebrow">4 · Zuordnung</p>
          <h2>Zeiträume und Vertragspartner prüfen</h2>
          <div className="calculationPreview">
            <div>
              <span>Google · ZM Irland</span>
              <b>{money(totals.googleZm)}</b>
            </div>
            <div>
              <span>Google + Ausgaben · RC-Steuer</span>
              <b>{money(totals.kz057)}</b>
            </div>
            <div>
              <span>Apple ADI · Entwurf</span>
              <b>{money(totals.appleZm)}</b>
            </div>
          </div>
          <p>
            Google: Wiederverkaufsgebiete werden mit dem Erlös nach Marge der
            GCL zugeordnet. Separat bezogene Dienste außerhalb dieser Gebiete
            erzeugen RC. Diese Einordnung muss zu deinen geltenden Verträgen
            passen; die Überweisung von Google Payment Ireland allein beweist
            sie nicht.
          </p>
          <label className="checkLine">
            <input
              type="checkbox"
              checked={review.modelConfirmed}
              onChange={(e) =>
                setReview({ modelConfirmed: e.target.checked, reviewed: false })
              }
            />{" "}
            Standard-Store-Billing und regionale Vertragspartner geprüft. Keine
            zusätzlichen Direktverkäufe / alternativen Zahlungen;
            Appodeal-Vertragspartner ist das US-Unternehmen.
          </label>
          {review.apple && (
            <article className="card">
              <h3>Apple: bestätigte EUR-Abrechnung ergänzen</h3>
              <p>
                Nur Apple Distribution International (Irland) kommt in die ZM.
                Andere Apple-Gesellschaften bleiben getrennt. EZB-Umrechnung
                erfolgt zum Transaktionsdatum; InforEuro-Ersatzkurse sind
                lediglich Schätzwerte und geben den Export nicht frei.
              </p>
              <div className="expenseFields">
                <label>
                  Bestätigter ADI-Betrag · EUR (optional)
                  <input
                    type="number"
                    step="0.01"
                    value={review.appleExact}
                    onChange={(e) =>
                      setReview({ appleExact: e.target.value, reviewed: false })
                    }
                  />
                </label>
                <label>
                  Abrechnung / Kursbeleg / Rechenweg
                  <input
                    value={review.appleEvidence}
                    placeholder="Belegreferenz für genau dieses Kalenderquartal"
                    onChange={(e) =>
                      setReview({
                        appleEvidence: e.target.value,
                        reviewed: false,
                      })
                    }
                  />
                </label>
              </div>
              <p className="hint">
                Eine bestätigte EUR-Summe ersetzt die vorläufige Umrechnung. Sie
                ersetzt keinen fehlenden FD-Bericht für die Quartalsgrenze.
              </p>
            </article>
          )}
          <div className={`filingState ${ready ? "complete" : ""}`}>
            <h3>{ready ? "Quartal geprüft" : "Noch offene Prüfpunkte"}</h3>
            {filingBlockers.length ? (
              <ul>
                {filingBlockers.map((b) => (
                  <li key={b}>{b}</li>
                ))}
              </ul>
            ) : (
              <p>
                Die im Assistenten prüfbaren Voraussetzungen sind bestätigt.
              </p>
            )}
          </div>
          <label className="checkLine">
            <input
              type="checkbox"
              checked={review.reviewed}
              onChange={(e) => setReview({ reviewed: e.target.checked })}
            />{" "}
            Ich habe die Belege, Zeiträume, UIDs und untenstehenden Summen
            abschließend geprüft.
          </label>
        </section>
      )}

      {step === 5 && (
        <section className="wizardPanel">
          <p className="eyebrow">
            5 · Q{quarter}/{year}
          </p>
          <h2>
            {ready ? "Deine Werte für FinanzOnline" : "Deine vorläufigen Werte"}
          </h2>
          {!ready && (
            <p className="callout">
              {filingBlockers.length} offene Punkte. Die Werte sind ein
              Arbeitsstand; XML-Export ist bis zur Klärung gesperrt.
            </p>
          )}
          <div className="quarterResult">
            <article>
              <h3>Umsatzsteuervoranmeldung</h3>
              <table>
                <thead>
                  <tr>
                    <th>Kennzahl</th>
                    <th>Bedeutung</th>
                    <th>EUR</th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td>000 / 022</td>
                    <td>Inländische Netto-Umsätze zu 20 %</td>
                    <td>{money(values.kz000)}</td>
                  </tr>
                  <tr>
                    <td>057</td>
                    <td>RC-Steuer</td>
                    <td>{money(values.kz057)}</td>
                  </tr>
                  <tr>
                    <td>060</td>
                    <td>Abziehbare österreichische Vorsteuer</td>
                    <td>{money(values.kz060)}</td>
                  </tr>
                  <tr>
                    <td>066</td>
                    <td>Abziehbare RC-Vorsteuer</td>
                    <td>{money(values.kz066)}</td>
                  </tr>
                </tbody>
              </table>
              <div className="personalBalance">
                <span>{balance < 0 ? "Guthaben" : "Zahllast"}</span>
                <b>{money(Math.abs(balance))}</b>
              </div>
              <p className="hint">
                USt = KZ 022 × 20 % + KZ 057 − KZ 060 − KZ 066. KZ 000 ist eine
                Bemessungsgrundlage. Plattformleistungen mit ausländischem
                Leistungsort stehen nicht in KZ 000.
              </p>
            </article>
            <article>
              <h3>Zusammenfassende Meldung</h3>
              <table>
                <thead>
                  <tr>
                    <th>Empfänger / UID</th>
                    <th>Exakt</th>
                    <th>ZM · EUR</th>
                  </tr>
                </thead>
                <tbody>
                  {rows.map((r) => (
                    <tr key={r.uid}>
                      <td>
                        {r.name}
                        <small>{r.uid}</small>
                      </td>
                      <td>{money(r.exact)}</td>
                      <td>
                        <b>{Math.trunc(r.exact)}</b>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              <p className="hint">
                Je UID erst summieren, dann Cent weglassen. Für die ZM zählt die
                Leistung, unabhängig von der Bankauszahlung. Appodeal Inc. ist
                keine ZM-Position.
              </p>
            </article>
          </div>
          <details
            open={showCorrection}
            onToggle={(e) => setShowCorrection(e.currentTarget.open)}
          >
            <summary>Begründete manuelle Korrektur</summary>
            <p>
              Änderungen bleiben ausschließlich für Q{quarter}/{year}{" "}
              gespeichert. Danach die Quartalskontrolle erneut bestätigen.
            </p>
            <div className="expenseFields">
              {(["kz000", "kz057", "kz060", "kz066"] as const).map((k) => (
                <label key={k}>
                  {k.toUpperCase()}
                  <input
                    type="number"
                    step="0.01"
                    value={values[k]}
                    onChange={(e) =>
                      setValues({ ...values, [k]: +e.target.value })
                    }
                  />
                </label>
              ))}
              {rows.map((r, i) => (
                <label key={r.uid}>
                  ZM {r.uid}
                  <input
                    type="number"
                    step="0.01"
                    value={r.exact}
                    onChange={(e) =>
                      setRows(
                        rows.map((x, j) =>
                          i === j ? { ...x, exact: +e.target.value } : x,
                        ),
                      )
                    }
                  />
                </label>
              ))}
            </div>
            <button className="secondaryBtn" onClick={clearEdits}>
              Automatische Werte wiederherstellen
            </button>
          </details>
          <div className="actions">
            <Link className="primary" href="/finanzonline">
              Weiter zur Abgabevorbereitung
            </Link>
            <button
              className="secondaryBtn"
              onClick={() => void downloadAllReports()}
            >
              Originale + Quartalsstand als ZIP
            </button>
          </div>
          <div className="submissionChecks">
            <label className="checkLine">
              <input
                type="checkbox"
                checked={review.submittedUva}
                onChange={(e) => setReview({ submittedUva: e.target.checked })}
              />{" "}
              UVA eingebracht und positives Produktionsprotokoll gespeichert
            </label>
            <label className="checkLine">
              <input
                type="checkbox"
                checked={review.submittedZm}
                onChange={(e) => setReview({ submittedZm: e.target.checked })}
              />{" "}
              ZM eingebracht und positives Produktionsprotokoll gespeichert
            </label>
          </div>
        </section>
      )}
      <section className="wizardControls">
        <button disabled={step === 1 || busy} onClick={() => go(step - 1)}>
          ← Zurück
        </button>
        <span>Schritt {step} von 5</span>
        {step < 5 ? (
          <button className="next" disabled={busy} onClick={() => go(step + 1)}>
            Weiter →
          </button>
        ) : (
          <Link className="next" href="/finanzonline">
            Abgabevorbereitung →
          </Link>
        )}
      </section>
      <details className="card sourceDetails">
        <summary>Rechenregeln und Quellen · geprüft am 26.10.2026</summary>
        <p>
          <a
            href="https://www.wko.at/steuern/reverse-charge-dienstleistungen-b2b"
            target="_blank"
          >
            WKO: RC, KZ 057 und 066
          </a>{" "}
          ·{" "}
          <a
            href="https://findok.bmf.gv.at/findok/resources/pdf/14cf1f83-db85-46f5-a64d-190e1a29a664/45907.1.1.0.pdf"
            target="_blank"
          >
            BMF: ZM auch bei Istbesteuerung nach Leistung
          </a>{" "}
          ·{" "}
          <a
            href="https://www.bmf.gv.at/rechtsnews/steuern-rechtsnews/aktuelle-infos-und-erlaesse/fachinformationen---umsatzsteuer/finanzonline-zm-und-vorsteuerrueckerstattungen-im-eu--ausland.html"
            target="_blank"
          >
            BMF: ZM ohne Cent
          </a>{" "}
          ·{" "}
          <a
            href="https://support.google.com/googleplay/android-developer/answer/7645364"
            target="_blank"
          >
            Google: Wiederverkaufsgebiete
          </a>{" "}
          ·{" "}
          <a
            href="https://developer.apple.com/support/downloads/terms/exhibits/Exhibits-to-Schedule-2-and-3-English-UK.pdf"
            target="_blank"
          >
            Apple: regionale Gesellschaften
          </a>
        </p>
        <p>
          Die E/A-Jahresrechnung hat andere Zuflussregeln. Dieser
          Quartalsdurchlauf erstellt keine Einkommensteuererklärung und keine
          automatische Meldung an FinanzOnline.
        </p>
      </details>
    </>
  );
}
