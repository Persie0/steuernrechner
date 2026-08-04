"use client";

import {FormEvent, useMemo, useState} from "react";
import {
  BookEntry,
  CategoryId,
  categories,
  csvDownload,
  EntryKind,
  useBooks,
  vatCaseLabels,
  VatCase,
} from "../components/BookkeepingProvider";
import {money} from "../lib/tax";

const today = new Date().toISOString().slice(0, 10);
const empty = {
  paymentDate: today,
  serviceDate: today,
  kind: "expense" as EntryKind,
  description: "",
  partner: "",
  country: "AT",
  uid: "",
  documentNumber: "",
  category: "software" as CategoryId,
  net: 0,
  vat: 0,
  currency: "EUR",
  exchangeRate: 1,
  businessShare: 100,
  vatCase: "domestic" as VatCase,
  paid: true,
  asset: false,
  usefulLife: 3,
  depreciationMethod: "linear" as "linear"|"degressive"|"optimized",
  firstUseDate: today,
  note: "",
};

export default function Buchungen() {
  const {year, setYear, yearEntries, addEntry, removeEntry, updateEntry} = useBooks();
  const [draft, setDraft] = useState(empty);
  const allowedCategories = useMemo(
    () => (Object.entries(categories) as [CategoryId, typeof categories[CategoryId]][])
      .filter(([, category]) => category.kind === draft.kind),
    [draft.kind],
  );

  function submit(event: FormEvent) {
    event.preventDefault();
    if (!draft.description.trim() || !draft.paymentDate || draft.net < 0) return;
    addEntry(draft);
    setDraft((current) => ({...empty, paymentDate: current.paymentDate, serviceDate: current.serviceDate}));
  }

  function exportCsv() {
    csvDownload(`Buchungen_${year}.csv`, [
      ["Zahlungsdatum", "Leistungsdatum", "Art", "Beschreibung", "Partner", "Land", "UID", "Belegnummer", "Kategorie", "E1a-KZ", "Netto", "USt", "Betriebsanteil %", "USt-Fall", "Bezahlt", "Anlagegut", "Nutzungsdauer", "Inbetriebnahme", "Notiz"],
      ...yearEntries.map((entry) => [
        entry.paymentDate, entry.serviceDate, entry.kind === "income" ? "Einnahme" : "Ausgabe",
        entry.description, entry.partner, entry.country, entry.uid, entry.documentNumber,
        categories[entry.category].label, categories[entry.category].e1a,
        entry.net.toFixed(2), entry.vat.toFixed(2), String(entry.businessShare),
        vatCaseLabels[entry.vatCase], entry.paid ? "Ja" : "Nein", entry.asset ? "Ja" : "Nein",
        entry.asset ? String(entry.usefulLife) : "", entry.asset ? entry.firstUseDate : "", entry.note,
      ]),
    ]);
  }

  return (
    <>
      <section className="subHero">
        <p className="eyebrow">Einnahmen-Ausgaben-Rechnung</p>
        <h1>Buchungen <em>sauber erfassen</em></h1>
        <p>Das Zahlungsdatum ordnet die Buchung deinem E/A-Jahr zu. Das Leistungsdatum bleibt zusätzlich für UVA und ZM nachvollziehbar.</p>
      </section>

      <section className="bookToolbar">
        <label>Arbeitsjahr
          <select value={year} onChange={(event) => setYear(Number(event.target.value))}>
            {[2024, 2025, 2026, 2027].map((item) => <option key={item}>{item}</option>)}
          </select>
        </label>
        <span>{yearEntries.length} Buchungen</span>
        <button className="secondaryBtn" disabled={!yearEntries.length} onClick={exportCsv}>Buchungen CSV</button>
      </section>

      <form className="card bookForm" onSubmit={submit}>
        <div className="sectionTitle"><span>+</span><div><h2>Neue Buchung</h2><p>Netto-System: Beträge ohne Umsatzsteuer erfassen; USt separat eintragen.</p></div></div>
        <div className="kindSwitch">
          {(["income", "expense"] as EntryKind[]).map((kind) => (
            <button type="button" className={draft.kind === kind ? "active" : ""} key={kind}
              onClick={() => setDraft({...draft, kind, category: kind === "income" ? "revenue" : "software"})}>
              {kind === "income" ? "Einnahme" : "Ausgabe"}
            </button>
          ))}
        </div>
        <div className="formGrid">
          <label>Zahlungsdatum<input type="date" required value={draft.paymentDate} onChange={(e) => setDraft({...draft, paymentDate: e.target.value})}/><small>maßgeblich für E/A</small></label>
          <label>Leistungsdatum<input type="date" required value={draft.serviceDate} onChange={(e) => setDraft({...draft, serviceDate: e.target.value})}/><small>für UVA/ZM prüfen</small></label>
          <label className="wide">Beschreibung<input required placeholder="z. B. OpenAI-Abo Juli" value={draft.description} onChange={(e) => setDraft({...draft, description: e.target.value})}/></label>
          <label>Geschäftspartner<input placeholder="Firma / Kunde" value={draft.partner} onChange={(e) => setDraft({...draft, partner: e.target.value})}/></label>
          <label>Land<input maxLength={2} placeholder="AT" value={draft.country} onChange={(e) => setDraft({...draft, country: e.target.value.toUpperCase()})}/></label>
          <label>UID<input placeholder="z. B. IE…" value={draft.uid} onChange={(e) => setDraft({...draft, uid: e.target.value.toUpperCase()})}/></label>
          <label>Belegnummer<input value={draft.documentNumber} onChange={(e) => setDraft({...draft, documentNumber: e.target.value})}/></label>
          <label>Kategorie<select value={draft.category} onChange={(e) => setDraft({...draft, category: e.target.value as CategoryId})}>
            {allowedCategories.map(([id, item]) => <option value={id} key={id}>{item.label} · E1a {item.e1a}</option>)}
          </select></label>
          <label>Netto in Währung<input type="number" step="0.01" min="0" required value={draft.net || ""} onChange={(e) => setDraft({...draft, net: Number(e.target.value)})}/></label>
          <label>USt in Währung<input type="number" step="0.01" min="0" value={draft.vat || ""} disabled={draft.vatCase !== "domestic"} onChange={(e) => setDraft({...draft, vat: Number(e.target.value)})}/></label>
          <label>Währung<input maxLength={3} value={draft.currency} onChange={(e)=>setDraft({...draft,currency:e.target.value.toUpperCase()})}/></label>
          {draft.currency!=="EUR"&&<label>EUR je Währungseinheit<input type="number" min="0.000001" step="0.000001" value={draft.exchangeRate} onChange={(e)=>setDraft({...draft,exchangeRate:Number(e.target.value)})}/></label>}
          <label>Betriebsanteil %<input type="number" min="0" max="100" value={draft.businessShare} disabled={draft.kind === "income"} onChange={(e) => setDraft({...draft, businessShare: Number(e.target.value)})}/></label>
          <label className="wide">Umsatzsteuerfall<select value={draft.vatCase} onChange={(e) => setDraft({...draft, vatCase: e.target.value as VatCase, vat: e.target.value === "domestic" ? draft.vat : 0})}>
            {(Object.entries(vatCaseLabels) as [VatCase, string][]).map(([id, label]) => <option value={id} key={id}>{label}</option>)}
          </select></label>
        </div>
        {draft.kind === "expense" && (
          <div className="assetBox">
            <label className="checkLine"><input type="checkbox" checked={draft.asset} onChange={(e) => setDraft({...draft, asset: e.target.checked})}/> Anlagegut, das länger als ein Jahr genutzt wird</label>
            {draft.asset && <div className="formGrid compact">
              <label>Inbetriebnahme<input type="date" value={draft.firstUseDate} onChange={(e) => setDraft({...draft, firstUseDate: e.target.value})}/></label>
              <label>Nutzungsdauer Jahre<input type="number" min="1" value={draft.usefulLife} onChange={(e) => setDraft({...draft, usefulLife: Number(e.target.value)})}/></label>
              <label>AfA-Methode<select value={draft.depreciationMethod} onChange={(e)=>setDraft({...draft,depreciationMethod:e.target.value as "linear"|"degressive"|"optimized"})}><option value="linear">Linear</option><option value="degressive">Degressiv 30 %</option><option value="optimized">Optimiert · Wechsel zu linear</option></select></label>
              <p>{draft.net * draft.businessShare / 100 <= 1000 ? "Bis 1.000 € netto wird das Anlagegut als GWG sofort berücksichtigt." : "Lineare oder degressive AfA mit Halbjahresregel; optimiert wechselt rechnerisch zum günstigeren linearen Restwert."}</p>
            </div>}
          </div>
        )}
        <div className="formFoot">
          <label className="checkLine"><input type="checkbox" checked={draft.paid} onChange={(e) => setDraft({...draft, paid: e.target.checked})}/> bereits bezahlt / erhalten</label>
          <button className="primary" type="submit">Buchung speichern</button>
        </div>
      </form>

      <section className="card">
        <div className="sectionTitle"><span>{yearEntries.length}</span><div><h2>Buchungen {year}</h2><p>Unbezahlte Einträge bleiben sichtbar, zählen aber noch nicht in der E/A-Rechnung.</p></div></div>
        {yearEntries.length === 0 ? <div className="empty">Noch keine Buchung in diesem Jahr.</div> : (
          <div className="bookTable">
            <div className="bookHead"><span>Datum</span><span>Buchung</span><span>Kategorie</span><span>Netto</span><span>Status</span><span/></div>
            {yearEntries.map((entry: BookEntry) => (
              <div className={`bookRow ${!entry.paid ? "open" : ""}`} key={entry.id}>
                <span>{new Date(`${entry.paymentDate}T12:00:00`).toLocaleDateString("de-AT")}</span>
                <span><b>{entry.description}</b><small>{entry.partner || "ohne Partner"} · {entry.vatCase}</small></span>
                <span>{categories[entry.category].label}<small>E1a {categories[entry.category].e1a}</small></span>
                <span className={entry.kind}>{entry.kind === "income" ? "+" : "−"} {money(entry.net * (entry.kind === "expense" ? entry.businessShare / 100 : 1))}</span>
                {entry.source==="document"?<span className="statusToggle">automatisch</span>:<button className="statusToggle" onClick={() => updateEntry({...entry, paid: !entry.paid})}>{entry.paid ? "bezahlt" : "offen"}</button>}
                {entry.source==="document"?<span/>:<button className="iconDanger" aria-label={`${entry.description} löschen`} onClick={() => removeEntry(entry.id)}>×</button>}
              </div>
            ))}
          </div>
        )}
      </section>
    </>
  );
}
