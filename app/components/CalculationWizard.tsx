"use client";

import Link from "next/link";
import {useEffect, useMemo, useRef, useState} from "react";
import {formatBytes, Q2Status, UploadFeedback, useUst} from "./UstProvider";
import {
  APPLE_ENTITIES,
  AppleEntityId,
  money,
  Source,
  sourceLabel,
} from "../lib/tax";

const uploads = [
  {
    source: "google" as Source,
    title: "Google Play",
    count: "3 × Earnings CSV",
    files: ["April", "Mai", "Juni"],
    accept: ".csv",
    help: "Play Console → Download reports → Financial → Earnings",
  },
  {
    source: "apple_financial" as Source,
    title: "Apple Financial",
    count: "3 × FD-TXT",
    files: ["FD_…_0426.txt", "FD_…_0526.txt", "FD_…_0626.txt"],
    accept: ".txt,.csv",
    help: "App Store Connect → Reports → Financial Reports → Detailed → .gz entpacken",
  },
  {
    source: "appodeal" as Source,
    title: "Appodeal",
    count: "3 × Monats-PDF",
    files: ["April", "Mai", "Juni"],
    accept: ".pdf",
    help: "Appodeal → Payouts → Billing / Reports → Download Report",
  },
  {
    source: "kalkuel" as Source,
    title: "Kalkül",
    count: "1 × Q2-CSV",
    files: ["Nur Ausgaben · 01.04.–30.06."],
    accept: ".csv",
    help: "Kalkül → E/A-Rechnung → April–Juni → Nur Ausgaben exportieren",
  },
  {
    source: "apple_sales" as Source,
    title: "Apple Sales",
    count: "optional",
    files: ["Nur S_M_-Dateien", "Keine FD_-Datei"],
    accept: ".txt,.csv",
    help: "Freiwillige Plausibilitätskontrolle; für die Berechnung nicht erforderlich.",
  },
];

const steps = [
  {number: 1, label: "Hochladen"},
  {number: 2, label: "Prüfen"},
  {number: 3, label: "Berechnen"},
  {number: 4, label: "Fertig"},
];

function UploadCard({item}: {item: (typeof uploads)[number]}) {
  const {addFiles} = useUst();
  const [dragging, setDragging] = useState(false);
  const [busy, setBusy] = useState(false);
  const [feedback, setFeedback] = useState<UploadFeedback[]>([]);

  async function upload(files: FileList | null) {
    if (!files?.length) return;
    setBusy(true);
    setFeedback([{level: "warn", message: `${files.length} Datei(en) werden geprüft …`}]);
    try {
      setFeedback(await addFiles(item.source, files));
    } catch {
      setFeedback([{level: "error", message: "Datei konnte nicht verarbeitet werden. Bitte erneut versuchen."}]);
    } finally {
      setBusy(false);
    }
  }

  return (
    <article
      className={`wizardUpload ${item.source === "apple_sales" ? "optional" : ""} ${dragging ? "dragging" : ""}`}
      onDragEnter={(event) => {
        event.preventDefault();
        setDragging(true);
      }}
      onDragOver={(event) => {
        event.preventDefault();
        event.dataTransfer.dropEffect = "copy";
      }}
      onDragLeave={(event) => {
        if (!event.currentTarget.contains(event.relatedTarget as Node)) setDragging(false);
      }}
      onDrop={(event) => {
        event.preventDefault();
        setDragging(false);
        void upload(event.dataTransfer.files);
      }}
    >
      <div className={`sourceBadge ${item.source}`}>{item.title.slice(0, 1)}</div>
      <div className="wizardUploadInfo">
        <div>
          <h3>{item.title}</h3>
          <span>{item.count}</span>
        </div>
        <p>{item.help}</p>
        <div className="fileChips">{item.files.map((file) => <span key={file}>{file}</span>)}</div>
      </div>
      <label className="uploadBtn">
        {busy ? "Prüfe …" : "Dateien wählen"}
        <input
          type="file"
          multiple
          accept={item.accept}
          disabled={busy}
          onChange={(event) => {
            void upload(event.target.files);
            event.currentTarget.value = "";
          }}
        />
      </label>
      {feedback.length > 0 && (
        <div className="uploadFeedback" aria-live="polite">
          {feedback.map((item, index) => (
            <p className={item.level} key={`${item.message}-${index}`}>
              {item.level === "ok" ? "✓" : item.level === "warn" ? "!" : "×"} {item.message}
            </p>
          ))}
        </div>
      )}
    </article>
  );
}

export default function CalculationWizard() {
  const {
    year,
    quarter,
    setYear,
    setQuarter,
    values,
    setValues,
    rows,
    setRows,
    totals,
    reports,
    missing,
    removeReport,
    downloadReport,
    downloadAllReports,
    appodealManual,
    setAppodealManual,
  } = useUst();
  const [step, setStep] = useState(1);
  const [autoMessage, setAutoMessage] = useState("");
  const [zipBusy, setZipBusy] = useState(false);
  const [zipMessage, setZipMessage] = useState("");
  const autoAdvanced = useRef(false);
  const requiredComplete =
    missing.google.length === 0 &&
    missing.apple_financial.length === 0 &&
    missing.appodeal.length === 0 &&
    missing.kalkuel.length === 0;
  const balance = values.kz000 + values.kz057 - values.kz060 - values.kz066;
  const appleEntityTotals = useMemo(() => {
    const months = [quarter * 3 - 2, quarter * 3 - 1, quarter * 3];
    const totals = Object.fromEntries(
      Object.keys(APPLE_ENTITIES).map((entity) => [entity, 0]),
    ) as Record<AppleEntityId, number>;
    for (const report of reports) {
      if (
        report.source !== "apple_financial" ||
        report.year !== year ||
        report.month === null ||
        !months.includes(report.month)
      )
        continue;
      for (const [entity, amount] of Object.entries(
        report.appleEntities || {},
      ))
        totals[entity as AppleEntityId] += amount || 0;
    }
    return totals;
  }, [quarter, reports, year]);
  const unresolvedAppleCountries = useMemo(
    () =>
      [
        ...new Set(
          reports
            .filter(
              (report) =>
                report.source === "apple_financial" &&
                report.year === year &&
                report.month !== null &&
                [
                  quarter * 3 - 2,
                  quarter * 3 - 1,
                  quarter * 3,
                ].includes(report.month),
            )
            .flatMap((report) => report.unresolvedAppleCountries || []),
        ),
      ].sort(),
    [quarter, reports, year],
  );

  useEffect(() => {
    if (step !== 1 || !requiredComplete || autoAdvanced.current) return;
    autoAdvanced.current = true;
    setAutoMessage("Alle Pflichtdateien erkannt. Die Prüfung öffnet sich automatisch …");
    const timer = window.setTimeout(() => {
      setStep(2);
      setAutoMessage("");
      window.scrollTo({top: 0, behavior: "smooth"});
    }, 850);
    return () => window.clearTimeout(timer);
  }, [requiredComplete, step]);

  function goTo(nextStep: number) {
    setStep(Math.max(1, Math.min(4, nextStep)));
    window.scrollTo({top: 0, behavior: "smooth"});
  }

  function applyAutomaticValues() {
    setValues({
      ...values,
      kz057: +totals.kz057.toFixed(2),
      kz060: +totals.kz060.toFixed(2),
      kz066: +totals.kz066.toFixed(2),
    });
    const standardRows = [
      {uid: "IE9825613N", name: "Google Commerce Limited", exact: +totals.googleZm.toFixed(2)},
      {uid: "IE9700053D", name: "Apple Distribution International Ltd.", exact: +totals.appleZm.toFixed(2)},
    ];
    const extraRows = rows.filter((row) => !standardRows.some((standard) => standard.uid === row.uid));
    setRows([...standardRows, ...extraRows]);
    if (totals.appodealUsd) setAppodealManual(+totals.appodealUsd.toFixed(2));
    goTo(3);
  }

  async function downloadZip() {
    if (!reports.length || zipBusy) return;
    setZipBusy(true);
    setZipMessage("");
    try {
      const included = await downloadAllReports();
      setZipMessage(
        included
          ? `${included} Originaldatei(en) wurden als ZIP heruntergeladen.`
          : "Die Originaldateien sind in diesem Browser nicht mehr verfügbar.",
      );
    } catch {
      setZipMessage("Das ZIP konnte nicht erstellt werden. Bitte erneut versuchen.");
    } finally {
      setZipBusy(false);
    }
  }

  return (
    <>
      <section className="wizardHero">
        <div>
          <p className="eyebrow">Berechnungsassistent</p>
          <h1>Hochladen. Prüfen. <em>Berechnen.</em></h1>
          <p>Ein durchgehender Ablauf von den Originaldateien bis zu den finalen UVA- und ZM-Werten.</p>
        </div>
        <div className="periodCompact">
          <label>
            Jahr
            <input type="number" value={year} onChange={(event) => setYear(+event.target.value)} />
          </label>
          <label>
            Quartal
            <select value={quarter} onChange={(event) => setQuarter(+event.target.value)}>
              <option value={1}>Q1</option>
              <option value={2}>Q2</option>
              <option value={3}>Q3</option>
              <option value={4}>Q4</option>
            </select>
          </label>
        </div>
      </section>

      <nav className="wizardStepper" aria-label="Berechnungsschritte">
        {steps.map((item) => (
          <button
            key={item.number}
            className={`${step === item.number ? "active" : ""} ${step > item.number ? "done" : ""}`}
            onClick={() => goTo(item.number)}
          >
            <span>{step > item.number ? "✓" : item.number}</span>
            {item.label}
          </button>
        ))}
      </nav>

      {step === 1 && (
        <section className="wizardPanel">
          <div className="wizardTitle">
            <div><span>1</span></div>
            <div>
              <p className="eyebrow">Originaldateien</p>
              <h2>Alle Berichte an einem Ort hochladen</h2>
              <p>Pflichtdateien werden direkt erkannt. Sobald alles vollständig ist, geht es automatisch zur Prüfung.</p>
            </div>
          </div>
          <div className="wizardUploads">{uploads.map((item) => <UploadCard item={item} key={item.source} />)}</div>
          {autoMessage && <p className="autoAdvance" aria-live="polite">✓ {autoMessage}</p>}
          <div className="inlineStatus">
            <div>
              <b>{requiredComplete ? "Pflichtdateien vollständig" : "Noch nicht vollständig"}</b>
              <span>{reports.length} Dateien lokal gespeichert</span>
            </div>
            <button
              className="zipButton"
              type="button"
              disabled={!reports.length || zipBusy}
              onClick={() => void downloadZip()}
              aria-label="Alle hochgeladenen Originaldateien als ZIP herunterladen"
            >
              {zipBusy ? "ZIP wird erstellt …" : "↓ Alle als ZIP"}
            </button>
          </div>
          {zipMessage && <p className="zipMessage" aria-live="polite">{zipMessage}</p>}
        </section>
      )}

      {step === 2 && (
        <section className="wizardPanel">
          <div className="wizardTitle">
            <div><span>2</span></div>
            <div>
              <p className="eyebrow">Automatische Prüfung</p>
              <h2>Zeitraum und Erkennung kontrollieren</h2>
              <p>Hier geht es nur um Vollständigkeit und Dateierkennung. Fachliche Erklärungen stehen separat unter „Wissen & Quellen“.</p>
            </div>
          </div>
          <Q2Status />
          <div className="callout">
            <b>Keine Doppelzählung</b>
            <span>
              Die automatischen Werte werden bei jedem Hinzufügen oder Entfernen
              vollständig aus den aktuell gespeicherten Dateien neu aufgebaut.
              Frühere Kontrollwerte werden nicht addiert.
            </span>
          </div>
          {!requiredComplete && (
            <div className="callout warningBox">
              <b>Es fehlen noch Pflichtdateien</b>
              <span>Du kannst zurückgehen und sie ergänzen oder mit den bereits vorhandenen Daten weiterarbeiten.</span>
            </div>
          )}
          <div className="reportSummary">
            <div className="reportSummaryHead">
              <h3>Erkannte Dateien</h3>
              <div>
                <span>{reports.length} gespeichert</span>
                <button
                  className="zipButton"
                  type="button"
                  disabled={!reports.length || zipBusy}
                  onClick={() => void downloadZip()}
                  aria-label="Alle hochgeladenen Originaldateien als ZIP herunterladen"
                >
                  {zipBusy ? "ZIP wird erstellt …" : "↓ Alle als ZIP"}
                </button>
              </div>
            </div>
            {zipMessage && <p className="zipMessage inSummary" aria-live="polite">{zipMessage}</p>}
            {reports.length === 0 ? (
              <div className="empty">Noch keine Dateien gespeichert.</div>
            ) : (
              reports.map((report) => (
                <article className={report.level} key={report.id}>
                  <div>
                    <b>{sourceLabel[report.source]}</b>
                    <span>{report.name}</span>
                  </div>
                  <span>{report.month && report.year ? `${String(report.month).padStart(2, "0")}/${report.year}` : "Zeitraum offen"}</span>
                  <p>{report.message}</p>
                  <small>{formatBytes(report.size)}</small>
                  <div>
                    <button onClick={() => downloadReport(report.id)}>Laden</button>
                    <button className="danger" onClick={() => removeReport(report.id)}>Entfernen</button>
                  </div>
                </article>
              ))
            )}
          </div>
          <div className="calculationPreview">
            <div><span>Google ZM</span><b>{money(totals.googleZm)}</b></div>
            <div><span>Apple ZM</span><b>{money(totals.appleZm)}</b></div>
            <div><span>KZ057</span><b>{money(totals.kz057)}</b></div>
            <div><span>KZ060</span><b>{money(totals.kz060)}</b></div>
            <div><span>KZ066</span><b>{money(totals.kz066)}</b></div>
            <div><span>Appodeal erkannt</span><b>{money(totals.appodealUsd, "USD")}</b></div>
            <div><span>Appodeal in EUR</span><b>{money(totals.appodealEur)}</b></div>
          </div>
          <div className="appleEntityAudit">
            <div>
              <b>Apple-Zuordnung nach Vertragspartner</b>
              <span>Nur die irische Entity fließt in die österreichische ZM.</span>
            </div>
            {(Object.keys(APPLE_ENTITIES) as AppleEntityId[])
              .filter((entity) => appleEntityTotals[entity])
              .map((entity) => (
                <p key={entity}>
                  <span>{APPLE_ENTITIES[entity].name}</span>
                  <b>{money(appleEntityTotals[entity])}</b>
                  <small>{APPLE_ENTITIES[entity].zm ? "ZM" : "nicht ZM"}</small>
                </p>
              ))}
            {unresolvedAppleCountries.length > 0 && (
              <p className="unknown">
                <span>Ungeklärte neue Ländercodes</span>
                <b>{unresolvedAppleCountries.join(", ")}</b>
                <small>nicht still übernommen</small>
              </p>
            )}
          </div>
        </section>
      )}

      {step === 3 && (
        <section className="wizardPanel">
          <div className="wizardTitle">
            <div><span>3</span></div>
            <div>
              <p className="eyebrow">Finale Werte</p>
              <h2>Berechnung prüfen und bei Bedarf korrigieren</h2>
              <p>Die automatisch erkannten Werte sind übernommen. Jede Zahl bleibt vor der XML-Erstellung editierbar.</p>
            </div>
          </div>
          <div className="calculationColumns">
            <article>
              <div className="editorHeading"><h3>UVA-Werte</h3><span>U30</span></div>
              <div className="calcRows">
                {(["kz000", "kz057", "kz060", "kz066"] as const).map((key) => (
                  <label key={key}>
                    <span>
                      <b>{key.toUpperCase()}</b>
                      <small>{{
                        kz000: "österreichische Umsätze 20 %",
                        kz057: "Steuer aus Reverse Charge",
                        kz060: "inländische Vorsteuer",
                        kz066: "Vorsteuer aus Reverse Charge",
                      }[key]}</small>
                    </span>
                    <input
                      type="number"
                      step="0.01"
                      value={values[key]}
                      onChange={(event) => setValues({...values, [key]: +event.target.value})}
                    />
                  </label>
                ))}
              </div>
              <div className="equationLive">
                <span>KZ000 {money(values.kz000)}</span><i>+</i>
                <span>KZ057 {money(values.kz057)}</span><i>−</i>
                <span>KZ060 {money(values.kz060)}</span><i>−</i>
                <span>KZ066 {money(values.kz066)}</span>
                <b>= {money(balance)} {balance < 0 ? "Gutschrift" : "Zahllast"}</b>
              </div>
            </article>
            <article>
              <div className="editorHeading"><h3>ZM-Werte</h3><span>U13</span></div>
              <div className="zmEditor">
                {rows.map((row, index) => (
                  <article key={`${row.uid}-${index}`}>
                    <div>
                      <label>Unternehmen<input value={row.name} onChange={(event) => setRows(rows.map((item, rowIndex) => rowIndex === index ? {...item, name: event.target.value} : item))} /></label>
                      <label>UID<input value={row.uid} onChange={(event) => setRows(rows.map((item, rowIndex) => rowIndex === index ? {...item, uid: event.target.value} : item))} /></label>
                    </div>
                    <label>Exakter Wert in Euro<input type="number" step="0.01" value={row.exact} onChange={(event) => setRows(rows.map((item, rowIndex) => rowIndex === index ? {...item, exact: +event.target.value} : item))} /></label>
                    <p><span>XML-Wert</span><b>{Math.trunc(row.exact)} €</b><small>sonstige Leistung</small></p>
                  </article>
                ))}
              </div>
              <div className="appleEntityAudit compact">
                <div>
                  <b>Apple-Entity-Kontrolle</b>
                  <span>Alle FD-Zeilen werden einem Vertragspartner zugeordnet.</span>
                </div>
                {(Object.keys(APPLE_ENTITIES) as AppleEntityId[])
                  .filter((entity) => appleEntityTotals[entity])
                  .map((entity) => (
                    <p key={entity}>
                      <span>{APPLE_ENTITIES[entity].name}</span>
                      <b>{money(appleEntityTotals[entity])}</b>
                      <small>{APPLE_ENTITIES[entity].zm ? "ZM" : "nicht ZM"}</small>
                    </p>
                  ))}
                {unresolvedAppleCountries.length > 0 && (
                  <p className="unknown">
                    <span>Ungeklärte Ländercodes</span>
                    <b>{unresolvedAppleCountries.join(", ")}</b>
                    <small>manuell prüfen</small>
                  </p>
                )}
              </div>
              <label className="manualField">
                Appodeal Q2 Ad revenue in USD (nicht UVA/ZM)
                <input type="number" step="0.01" value={appodealManual || totals.appodealUsd} onChange={(event) => setAppodealManual(+event.target.value)} />
              </label>
              <p className="fxNote">
                Automatische EUR-Orientierung aus den erkannten Berichten: <b>{money(totals.appodealEur)}</b>.
                Verwendet wird der letzte veröffentlichte EZB-Referenzkurs zum jeweiligen Monatsende.
              </p>
            </article>
          </div>
        </section>
      )}

      {step === 4 && (
        <section className="wizardPanel finishPanel">
          <div className="finishMark">✓</div>
          <p className="eyebrow">Berechnung abgeschlossen</p>
          <h2>Die Werte sind bereit für XML & Abgabe</h2>
          <p>Kontrolliere im nächsten Schritt Steuernummer, Bestätigungen und die finalen XML-Werte.</p>
          <div className="finishSummary">
            <div><span>UVA-Kontrolle</span><b>{money(balance)}</b></div>
            <div><span>ZM gesamt exakt</span><b>{money(rows.reduce((sum, row) => sum + row.exact, 0))}</b></div>
            <div><span>Belegbasis</span><b>{reports.length} Dateien</b></div>
          </div>
          <Link className="primary" href="/finanzonline">Weiter zu XML & Abgabe</Link>
        </section>
      )}

      <section className="wizardControls">
        <button className="back" disabled={step === 1} onClick={() => goTo(step - 1)}>← Zurück</button>
        <span>Schritt {step} von {steps.length}</span>
        {step === 2 ? (
          <button className="next" onClick={applyAutomaticValues}>Werte übernehmen & weiter →</button>
        ) : step < 4 ? (
          <button className="next" onClick={() => goTo(step + 1)}>Weiter →</button>
        ) : (
          <Link className="next" href="/finanzonline">XML & Abgabe →</Link>
        )}
      </section>
    </>
  );
}
