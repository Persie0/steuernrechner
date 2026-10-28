"use client";

import { useState } from "react";
import ImportProgressPanel, { importIsActive } from "../components/ImportProgressPanel";
import ProviderImportPanel from "../components/ProviderImportPanel";
import { useUst, type UploadFeedback } from "../components/UstProvider";
import { createProviderDebug } from "../lib/provider-debug";
import { money } from "../lib/tax";

export default function AppodealPage() {
  const { year, quarter, setYear, setQuarter, reports, addFiles, importFiles, importProgress, importFeedback, cancelImport, downloadReport } = useUst();
  const [apiBusy, setApiBusy] = useState(false), [feedback, setFeedback] = useState<UploadFeedback[]>([]);
  const [progressAfter, setProgressAfter] = useState<number | null>(null);
  const [debug] = useState(createProviderDebug);
  const busy = apiBusy || importIsActive(importProgress);
  const pageProgress = progressAfter !== null && (importProgress?.startedAt || 0) >= progressAfter ? importProgress : null;
  const appodealReports = reports.filter((report) => report.source === "appodeal" || /appodeal/i.test(report.name)).sort((a,b) => (b.year || 0) - (a.year || 0) || (b.month || 0) - (a.month || 0) || a.name.localeCompare(b.name));
  return <>
    <section className="subHero"><p className="eyebrow">WERBEEINNAHMEN</p><h1>Appodeal <em>separat verwalten.</em></h1><p>Monatsabrechnungen importieren und auf Wunsch Statistiken abrufen. Auszahlungen und Vertragspartner bleiben für die steuerliche Zuordnung zu prüfen.</p></section>
    <div className="overviewFilters"><label>Jahr<input type="number" min="2024" max="2100" value={year} onChange={(event) => { const value=Number(event.target.value); if (value>=2024 && value<=2100) setYear(value); }}/></label><label>Quartal<select value={quarter} onChange={(event) => setQuarter(Number(event.target.value))}>{[1,2,3,4].map((value) => <option key={value} value={value}>Q{value}</option>)}</select></label></div>
    <section className="card overviewSection"><h2>Monatsberichte hochladen</h2><p>PDF-Abrechnungen werden ausgelesen und ihre Originale lokal aufbewahrt. Der Bericht ist kein Zahlungsnachweis.</p><label className="uploadBtn">Appodeal-PDF auswählen<input type="file" multiple accept=".pdf,application/pdf" disabled={busy} onChange={(event) => {const files=event.target.files;if(files?.length) { setProgressAfter(Date.now()); setFeedback([]); void addFiles("appodeal", files).then(setFeedback); }event.currentTarget.value="";}}/></label>
      <ImportProgressPanel progress={pageProgress} feedback={pageProgress ? importFeedback : []} onCancel={cancelImport}/>
      {feedback.length > 0 && <ul>{feedback.map((item,index) => <li key={index}>{item.message}</li>)}</ul>}
    </section>
    <ProviderImportPanel scope="appodeal" year={year} quarter={quarter} disabled={busy} importFiles={importFiles} cancelImport={cancelImport} onBusyChange={(value) => { setApiBusy(value); if (value) { setProgressAfter(Date.now()); setFeedback([]); } }} onImportFeedback={setFeedback} debug={debug}/>
    <p className="overviewNotice">Ein API-Statistikabruf wird über den Server geleitet und ersetzt keine Abrechnung oder Zahlung. Unter dem bisher angenommenen Vertrag mit Appodeal Inc. ist keine zusätzliche irische ZM-Zeile vorgesehen; andere Vertragspartner bitte prüfen.</p>
    <section className="card overviewSection"><h2>Gespeicherte Appodeal-Berichte</h2>{!appodealReports.length ? <p>Noch keine Berichte gespeichert.</p> : <div className="fileList">{appodealReports.map((report) => <article className="fileListRow" key={report.id}><div><div className="fileTags"><span className="sourceTag">Appodeal</span>{report.year && report.month && <span className="quarterTag">Q{Math.ceil(report.month/3)}/{report.year}</span>}</div><h3>{report.name}</h3><p>{report.message}</p>{report.source === "appodeal" && <small>{money(report.contribution.appodealUsd, "USD")} · {money(report.contribution.appodealEur)} geschätzter Berichtswert</small>}</div><button className="secondaryBtn" onClick={() => void downloadReport(report.id)}>Ansehen / Laden</button></article>)}</div>}</section>
  </>;
}
