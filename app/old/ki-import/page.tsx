"use client";

import {useEffect, useState} from "react";
import {
  CategoryId,
  ContactKind,
  EntryKind,
  VatCase,
  categories,
  useBooks,
  vatCaseLabels,
} from "../../components/BookkeepingProvider";
import {saveReceipt} from "../../lib/receipts";

const GEMINI_KEY_STORAGE = "steuernrechner-gemini-key-v1";

type Partner = {
  company:string; firstName:string; lastName:string; email:string; phone:string;
  street:string; zip:string; city:string; country:string; uid:string;
};
type Result = {
  documentType:string; kind:EntryKind; description:string; documentNumber:string;
  issueDate:string; serviceDate:string; paymentDate:string; currency:string;
  net:number; vat:number; gross:number; vatRate:number; vatCase:VatCase;
  category:CategoryId; paid:boolean; partner:Partner;
  lineItems:{description:string;quantity:number;unit:string;netAmount:number;vatRate:number}[];
  reverseChargeEvidence:string; confidence:number; warnings:string[];
};
type ContactCandidate = Partner & {
  kind:ContactKind; paymentTerms:number; language:"de"|"en"; notes:string;
  confidence:number; warnings:string[]; selected:boolean;
};
type ImportMode = "receipt" | "contacts";

const readBase64 = (file:File) => new Promise<string>((resolve,reject) => {
  const reader = new FileReader();
  reader.onload = () => resolve(String(reader.result).split(",")[1]);
  reader.onerror = () => reject(reader.error);
  reader.readAsDataURL(file);
});

export default function KiImport() {
  const {contacts, addContact, addEntry} = useBooks();
  const [mode,setMode] = useState<ImportMode>("receipt");
  const [key,setKey] = useState("");
  const [keyReady,setKeyReady] = useState(false);
  const [file,setFile] = useState<File|null>(null);
  const [result,setResult] = useState<Result|null>(null);
  const [contactResults,setContactResults] = useState<ContactCandidate[]>([]);
  const [busy,setBusy] = useState(false);
  const [error,setError] = useState("");
  const [saved,setSaved] = useState("");

  useEffect(() => {
    queueMicrotask(() => {
      setKey(localStorage.getItem(GEMINI_KEY_STORAGE) || "");
      setKeyReady(true);
    });
  }, []);
  useEffect(() => {
    if (!keyReady) return;
    if (key.trim()) localStorage.setItem(GEMINI_KEY_STORAGE,key.trim());
    else localStorage.removeItem(GEMINI_KEY_STORAGE);
  }, [key,keyReady]);

  function clearResults(nextMode?:ImportMode) {
    setResult(null);
    setContactResults([]);
    setSaved("");
    setError("");
    if (nextMode) setMode(nextMode);
  }
  async function analyze() {
    if (!file || !key.trim()) return;
    setBusy(true); clearResults();
    try {
      const data = await readBase64(file);
      const response = await fetch("/api/gemini-import", {
        method:"POST", headers:{"content-type":"application/json"},
        body:JSON.stringify({apiKey:key.trim(),data,mimeType:file.type,fileName:file.name,mode}),
      });
      const json = await response.json();
      if (!response.ok) throw new Error(json.error || "Import fehlgeschlagen");
      if (mode === "contacts") {
        setContactResults((json.result.contacts || []).map((contact:Omit<ContactCandidate,"selected">) => ({...contact,selected:true})));
      } else setResult(json.result);
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "Import fehlgeschlagen");
    } finally { setBusy(false); }
  }
  async function confirmReceipt() {
    if (!result || !file) return;
    let contact = contacts.find(c =>
      (result.partner.uid && c.uid === result.partner.uid) ||
      (result.partner.company && c.company.toLowerCase() === result.partner.company.toLowerCase())
    );
    if (!contact && (result.partner.company || result.partner.lastName)) {
      contact = addContact({
        kind:result.kind === "income" ? "customer" : "supplier", ...result.partner,
        customerNumber:`AI-${String(contacts.length+1).padStart(4,"0")}`,
        paymentTerms:14, language:"de", notes:"Automatisch aus Beleg erkannt – Stammdaten prüfen.",
      });
    }
    const attachmentId = await saveReceipt(file);
    const today = new Date().toISOString().slice(0,10);
    addEntry({
      paymentDate:result.paymentDate||result.issueDate||today,
      serviceDate:result.serviceDate||result.issueDate||today,
      kind:result.kind, description:result.description||file.name,
      partner:result.partner.company||`${result.partner.firstName} ${result.partner.lastName}`.trim(),
      contactId:contact?.id, country:result.partner.country||"", uid:result.partner.uid||"",
      documentNumber:result.documentNumber||"", category:result.category,
      net:Number(result.net)||0, vat:Number(result.vat)||0, gross:Number(result.gross)||0,
      currency:result.currency||"EUR", exchangeRate:1, businessShare:100,
      vatCase:result.vatCase, vatRate:Number(result.vatRate)||20, paid:result.paid,
      asset:false, usefulLife:3, depreciationMethod:"linear",
      firstUseDate:result.serviceDate||result.issueDate||today,
      attachmentName:file.name, attachmentId, source:"gemini",
      note:[result.reverseChargeEvidence,...result.warnings].filter(Boolean).join(" · "),
    });
    setSaved("Beleg, Kontakt und Buchung wurden gespeichert.");
    setResult(null); setFile(null);
  }
  function confirmContacts() {
    const selected = contactResults.filter(candidate => candidate.selected);
    let added = 0, skipped = 0;
    for (const candidate of selected) {
      const duplicate = contacts.some(contact =>
        (candidate.uid && contact.uid === candidate.uid) ||
        (candidate.email && contact.email.toLowerCase() === candidate.email.toLowerCase()) ||
        (candidate.company && contact.company.toLowerCase() === candidate.company.toLowerCase())
      );
      if (duplicate) { skipped++; continue; }
      addContact({
        kind:candidate.kind, company:candidate.company, firstName:candidate.firstName,
        lastName:candidate.lastName, email:candidate.email, phone:candidate.phone,
        street:candidate.street, zip:candidate.zip, city:candidate.city,
        country:candidate.country, uid:candidate.uid,
        paymentTerms:candidate.paymentTerms, language:candidate.language, notes:candidate.notes,
        customerNumber:`AI-${String(contacts.length+added+1).padStart(4,"0")}`,
      });
      added++;
    }
    setSaved(`${added} Kontakt${added===1?"":"e"} gespeichert${skipped?`, ${skipped} Duplikat${skipped===1?"":"e"} übersprungen`:""}.`);
    setContactResults([]); setFile(null);
  }
  function updateContact(index:number,patch:Partial<ContactCandidate>) {
    setContactResults(current => current.map((candidate,i) => i===index ? {...candidate,...patch} : candidate));
  }

  return <>
    <section className="subHero">
      <p className="eyebrow">Gemini Dokumenterkennung</p>
      <h1>Dokument hochladen. <em>Daten prüfen.</em></h1>
      <p>Importiere einen Beleg samt Buchung oder extrahiere einen oder mehrere Kunden und Lieferanten aus PDF oder Foto.</p>
    </section>
    <section className="card aiSetup">
      <div>
        <h2>1. Gemini API-Key</h2>
        <p>Der Key wird auf deinen Wunsch unverschlüsselt nur in diesem Browser gespeichert und ausschließlich für Gemini-Anfragen verwendet. Nicht auf gemeinsam genutzten Geräten verwenden.</p>
        <div className="keyRow">
          <input aria-label="Gemini API-Key" type="password" autoComplete="off" placeholder="AIza…" value={key} onChange={event=>setKey(event.target.value)}/>
          {key&&<button type="button" className="ghost danger" onClick={()=>setKey("")}>Key löschen</button>}
        </div>
        <small>{key ? "✓ Auf diesem Gerät gespeichert" : "Kein Key gespeichert"}</small>
        <a href="https://aistudio.google.com/app/apikey" target="_blank" rel="noreferrer">Gemini API-Key in Google AI Studio erstellen →</a>
      </div>
      <div className="aiSource">
        <h2>2. Importart wählen</h2>
        <div className="kindSwitch" role="tablist" aria-label="Gemini Importart">
          <button type="button" className={mode==="receipt"?"active":""} onClick={()=>clearResults("receipt")}>Beleg + Buchung</button>
          <button type="button" className={mode==="contacts"?"active":""} onClick={()=>clearResults("contacts")}>Kontakte</button>
        </div>
        <p>{mode==="receipt" ? "Erkennt Beträge, Steuerfall, Positionen sowie Kunde oder Lieferant." : "Erkennt alle sichtbaren Geschäftspartner; du wählst vor dem Speichern aus."}</p>
      </div>
      <label className="aiDrop">
        <input type="file" accept="application/pdf,image/jpeg,image/png,image/webp" onChange={event=>{setFile(event.target.files?.[0]||null);clearResults();}}/>
        <span>PDF oder Bild wählen</span><b>{file?.name||"Noch keine Datei"}</b>
        <small>max. ca. 12 MB · wird zur Analyse an Google gesendet</small>
      </label>
      <button className="primary" disabled={!key.trim()||!file||busy} onClick={()=>void analyze()}>
        {busy?"Gemini analysiert …":mode==="receipt"?"Beleg analysieren":"Kontakte erkennen"}
      </button>
      {error&&<p className="importError">{error}</p>}{saved&&<p className="importSuccess">{saved}</p>}
    </section>
    {result&&<section className="card aiReview">
      <div className="reviewHeader"><div><span>ERKANNT</span><h2>3. Beleg vor dem Speichern prüfen</h2></div><b className={result.confidence>=.8?"high":"low"}>{Math.round(result.confidence*100)} % Sicherheit</b></div>
      {result.warnings.length>0&&<div className="reviewWarnings">{result.warnings.map((warning,index)=><p key={index}>⚠ {warning}</p>)}</div>}
      <div className="formGrid">
        <label>Art<select value={result.kind} onChange={event=>setResult({...result,kind:event.target.value as EntryKind})}><option value="expense">Ausgabe</option><option value="income">Einnahme</option></select></label>
        <label className="wide">Beschreibung<input value={result.description} onChange={event=>setResult({...result,description:event.target.value})}/></label>
        <label>Belegnummer<input value={result.documentNumber} onChange={event=>setResult({...result,documentNumber:event.target.value})}/></label>
        <label>Firma / Partner<input value={result.partner.company} onChange={event=>setResult({...result,partner:{...result.partner,company:event.target.value}})}/></label>
        <label>Land<input maxLength={2} value={result.partner.country} onChange={event=>setResult({...result,partner:{...result.partner,country:event.target.value.toUpperCase()}})}/></label>
        <label>UID<input value={result.partner.uid} onChange={event=>setResult({...result,partner:{...result.partner,uid:event.target.value.toUpperCase()}})}/></label>
        <label>Rechnungsdatum<input type="date" value={result.issueDate} onChange={event=>setResult({...result,issueDate:event.target.value})}/></label>
        <label>Zahlungsdatum<input type="date" value={result.paymentDate} onChange={event=>setResult({...result,paymentDate:event.target.value})}/></label>
        <label>Netto<input type="number" step="0.01" value={result.net} onChange={event=>setResult({...result,net:Number(event.target.value)})}/></label>
        <label>USt<input type="number" step="0.01" value={result.vat} onChange={event=>setResult({...result,vat:Number(event.target.value)})}/></label>
        <label>Brutto<input type="number" step="0.01" value={result.gross} onChange={event=>setResult({...result,gross:Number(event.target.value)})}/></label>
        <label>Währung<input value={result.currency} onChange={event=>setResult({...result,currency:event.target.value.toUpperCase()})}/></label>
        <label>Kategorie<select value={result.category} onChange={event=>setResult({...result,category:event.target.value as CategoryId})}>{Object.entries(categories).filter(([,category])=>category.kind===result.kind).map(([id,category])=><option value={id} key={id}>{category.label}</option>)}</select></label>
        <label className="wide">Umsatzsteuerfall<select value={result.vatCase} onChange={event=>setResult({...result,vatCase:event.target.value as VatCase})}>{Object.entries(vatCaseLabels).map(([id,label])=><option value={id} key={id}>{label}</option>)}</select></label>
      </div>
      {result.reverseChargeEvidence&&<p className="evidence"><b>Reverse-Charge-Begründung:</b> {result.reverseChargeEvidence}</p>}
      <details><summary>{result.lineItems.length} erkannte Positionen anzeigen</summary>{result.lineItems.map((line,index)=><p key={index}>{line.quantity} {line.unit} · {line.description} · {line.netAmount.toFixed(2)} {result.currency} · {line.vatRate}%</p>)}</details>
      <div className="formFoot"><button className="secondaryBtn" onClick={()=>setResult(null)}>Verwerfen</button><button className="primary" onClick={()=>void confirmReceipt()}>Geprüft & als Buchung speichern</button></div>
    </section>}
    {contactResults.length>0&&<section className="card aiReview">
      <div className="reviewHeader"><div><span>ERKANNT</span><h2>3. Kontakte auswählen und prüfen</h2></div><b className="high">{contactResults.filter(contact=>contact.selected).length} ausgewählt</b></div>
      <div className="aiContactList">{contactResults.map((contact,index)=><article key={index} className={contact.selected?"selected":""}>
        <label className="checkLine full"><input type="checkbox" checked={contact.selected} onChange={event=>updateContact(index,{selected:event.target.checked})}/> Kontakt übernehmen</label>
        <div className="formGrid">
          <label>Art<select value={contact.kind} onChange={event=>updateContact(index,{kind:event.target.value as ContactKind})}><option value="customer">Kunde</option><option value="supplier">Lieferant</option><option value="both">Kunde & Lieferant</option></select></label>
          <label>Firma<input value={contact.company} onChange={event=>updateContact(index,{company:event.target.value})}/></label>
          <label>Vorname<input value={contact.firstName} onChange={event=>updateContact(index,{firstName:event.target.value})}/></label>
          <label>Nachname<input value={contact.lastName} onChange={event=>updateContact(index,{lastName:event.target.value})}/></label>
          <label>E-Mail<input value={contact.email} onChange={event=>updateContact(index,{email:event.target.value})}/></label>
          <label>Telefon<input value={contact.phone} onChange={event=>updateContact(index,{phone:event.target.value})}/></label>
          <label className="wide">Straße<input value={contact.street} onChange={event=>updateContact(index,{street:event.target.value})}/></label>
          <label>PLZ<input value={contact.zip} onChange={event=>updateContact(index,{zip:event.target.value})}/></label>
          <label>Ort<input value={contact.city} onChange={event=>updateContact(index,{city:event.target.value})}/></label>
          <label>Land<input maxLength={2} value={contact.country} onChange={event=>updateContact(index,{country:event.target.value.toUpperCase()})}/></label>
          <label>UID<input value={contact.uid} onChange={event=>updateContact(index,{uid:event.target.value.toUpperCase()})}/></label>
        </div>
        <small>{Math.round(contact.confidence*100)} % Sicherheit{contact.warnings.length?` · ${contact.warnings.join(" · ")}`:""}</small>
      </article>)}</div>
      <div className="formFoot"><button className="secondaryBtn" onClick={()=>setContactResults([])}>Verwerfen</button><button className="primary" disabled={!contactResults.some(contact=>contact.selected)} onClick={confirmContacts}>Ausgewählte Kontakte speichern</button></div>
    </section>}
    <section className="card privacyExplainer"><h2>Was die Automatik entscheidet – und was nicht</h2><div><p><b>Gemini extrahiert</b><span>sichtbare Rechnungs- und Kontaktdaten sowie mögliche Steuerhinweise.</span></p><p><b>Du bestätigst</b><span>Kontakte, Buchungsart, Beträge, Steuerfall und Zahlungsstatus.</span></p><p><b>Die Seite berechnet</b><span>E/A-Rechnung, USt/Reverse Charge, UVA, ZM und Jahreswerte aus den bestätigten Daten.</span></p></div></section>
  </>;
}
