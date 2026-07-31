"use client";

import {createContext, useContext, useEffect, useMemo, useState} from "react";

export type EntryKind = "income" | "expense";
export type VatCase =
  | "domestic" | "eu_b2b_service" | "reverse_charge_eu" | "reverse_charge_domestic"
  | "intra_community_supply" | "intra_community_acquisition" | "export_supply"
  | "import_vat" | "foreign_vat" | "third_country" | "exempt";
export type CategoryId =
  | "revenue" | "asset_sale" | "goods" | "staff" | "depreciation"
  | "travel" | "rent" | "advertising" | "svs" | "software" | "fees" | "other";
export type ContactKind = "customer" | "supplier" | "both";
export type DocumentType = "offer" | "order" | "delivery" | "invoice" | "credit_note" | "cancellation";
export type DocumentStatus = "draft" | "sent" | "accepted" | "open" | "partial" | "paid" | "overdue" | "cancelled";

export type Contact = {id:string; kind:ContactKind; company:string; firstName:string; lastName:string; email:string; phone:string; street:string; zip:string; city:string; country:string; uid:string; customerNumber:string; paymentTerms:number; language:"de"|"en"; notes:string; createdAt:string};
export type Product = {id:string; number:string; name:string; description:string; category:string; unit:string; netPrice:number; vatRate:number; active:boolean; createdAt:string};
export type DocumentLine = {id:string; productId:string; description:string; quantity:number; unit:string; unitPrice:number; vatRate:number; discount:number};
export type Payment = {id:string; documentId:string; date:string; amount:number; method:string; note:string; createdAt:string};
export type BusinessDocument = {id:string; type:DocumentType; number:string; contactId:string; issueDate:string; dueDate:string; serviceDate:string; currency:string; exchangeRate:number; vatCase:VatCase; status:DocumentStatus; lines:DocumentLine[]; discount:number; discountType:"percent"|"fixed"; notes:string; sourceDocumentId:string; createdAt:string};

export type BookEntry = {
  id: string; paymentDate: string; serviceDate: string; kind: EntryKind; description: string;
  partner: string; contactId?: string; country: string; uid: string; documentNumber: string;
  category: CategoryId; net: number; vat: number; gross?: number; currency?: string; exchangeRate?: number;
  businessShare: number; vatCase: VatCase; vatRate?: number; paid: boolean; asset: boolean;
  usefulLife: number; depreciationMethod?: "linear"|"degressive"|"optimized"; firstUseDate: string;
  attachmentName?: string; attachmentId?: string; source?: "manual"|"gemini"|"import"|"document";
  note: string; createdAt: string;
};

export const categories: Record<CategoryId, {label: string; e1a: string; kind: EntryKind}> = {
  revenue: {label: "Umsatzerlöse", e1a: "9040", kind: "income"}, asset_sale: {label: "Verkauf von Anlagevermögen", e1a: "9060", kind: "income"},
  goods: {label: "Waren / Fremdleistungen", e1a: "9100", kind: "expense"}, staff: {label: "Personal / Fremdlöhne", e1a: "9110", kind: "expense"},
  depreciation: {label: "AfA / GWG", e1a: "9130", kind: "expense"}, travel: {label: "Reise- und Fahrtkosten", e1a: "9160", kind: "expense"},
  rent: {label: "Miete / Leasing", e1a: "9180", kind: "expense"}, advertising: {label: "Werbung", e1a: "9200", kind: "expense"},
  svs: {label: "SVS / Pflichtversicherung", e1a: "9230", kind: "expense"}, software: {label: "Software / Online-Dienste", e1a: "9230", kind: "expense"},
  fees: {label: "Plattform- und Bankgebühren", e1a: "9230", kind: "expense"}, other: {label: "Sonstige Betriebsausgaben", e1a: "9230", kind: "expense"},
};

export const vatCaseLabels: Record<VatCase,string> = {
  domestic:"Inland · USt laut Rechnung", eu_b2b_service:"EU-B2B-Dienstleistung · ZM", reverse_charge_eu:"EU-Eingangsleistung · Reverse Charge",
  reverse_charge_domestic:"Inland · Reverse Charge", intra_community_supply:"Innergemeinschaftliche Lieferung", intra_community_acquisition:"Innergemeinschaftlicher Erwerb",
  export_supply:"Steuerfreie Ausfuhrlieferung", import_vat:"Einfuhrumsatzsteuer", foreign_vat:"Ausländische Umsatzsteuer", third_country:"Drittland · nicht in AT steuerbar", exempt:"Steuerfrei / nicht steuerbar",
};

export type AnnualSummary = {income:number; expenses:number; depreciation:number; profitBeforeGfb:number; basicGfb:number; profitAfterBasicGfb:number; outputVat:number; inputVat:number; reverseChargeVat:number; reverseChargeDeductible:number; vatBalance:number; e1a:Record<string,number>; paidEntries:number; openEntries:number};
type Store = {year:number; entries:BookEntry[]; contacts:Contact[]; products:Product[]; documents:BusinessDocument[]; payments:Payment[]; quarterlyVat:boolean; regularVat:boolean; hasEmployees:boolean; usesOss:boolean; hasCashRegister:boolean; invoicePrefix:string; nextInvoiceNumber:number; companyName:string; companyAddress:string; companyUid:string; iban:string};
type ContextValue = Store & {ready:boolean; setYear:(year:number)=>void; setProfile:(patch:Partial<Omit<Store,"year"|"entries"|"contacts"|"products"|"documents"|"payments">>)=>void; addEntry:(entry:Omit<BookEntry,"id"|"createdAt">)=>BookEntry; updateEntry:(entry:BookEntry)=>void; removeEntry:(id:string)=>void; addContact:(contact:Omit<Contact,"id"|"createdAt">)=>Contact; updateContact:(contact:Contact)=>void; removeContact:(id:string)=>void; addProduct:(product:Omit<Product,"id"|"createdAt">)=>Product; updateProduct:(product:Product)=>void; removeProduct:(id:string)=>void; addDocument:(document:Omit<BusinessDocument,"id"|"createdAt"|"number"> & {number?:string})=>BusinessDocument; updateDocument:(document:BusinessDocument)=>void; removeDocument:(id:string)=>void; convertDocument:(id:string,type:DocumentType)=>BusinessDocument|undefined; addPayment:(payment:Omit<Payment,"id"|"createdAt">)=>Payment; removePayment:(id:string)=>void; documentTotals:(document:BusinessDocument)=>{net:number;vat:number;gross:number;paid:number;open:number}; clearBooks:()=>void; replaceStore:(data:Partial<Store>)=>void; summary:AnnualSummary; yearEntries:BookEntry[]};

const initial: Store = {year:2026,entries:[],contacts:[],products:[],documents:[],payments:[],quarterlyVat:true,regularVat:true,hasEmployees:false,usesOss:false,hasCashRegister:false,invoicePrefix:"RE",nextInvoiceNumber:1,companyName:"",companyAddress:"",companyUid:"",iban:""};
const Context = createContext<ContextValue|null>(null); const LS="steuernrechner-books-v2"; const LEGACY="steuernrechner-books-v1";
const round=(v:number)=>Math.round((v+Number.EPSILON)*100)/100; const yearOf=(d:string)=>Number(d?.slice(0,4));
const makeId=(prefix:string)=>globalThis.crypto?.randomUUID?.()||`${prefix}-${Date.now()}-${Math.random().toString(36).slice(2)}`;

function annualDepreciation(entry:BookEntry,year:number){if(!entry.asset||entry.usefulLife<=0||!entry.firstUseDate)return 0;const share=Math.max(0,Math.min(100,entry.businessShare))/100,base=entry.net*share,start=yearOf(entry.firstUseDate);if(base<=1000)return year===start?base:0;const annual=base/entry.usefulLife,first=Number(entry.firstUseDate.slice(5,7))>6?.5:1,elapsed=year-start;if(elapsed<0)return 0;if(elapsed===0)return annual*first;return Math.max(0,Math.min(annual,base-(annual*first+annual*(elapsed-1))));}
function summarize(entries:BookEntry[],year:number):AnnualSummary{const e1a:Record<string,number>={};let income=0,expenses=0,depreciation=0,outputVat=0,inputVat=0,reverseChargeVat=0,reverseChargeDeductible=0,paidEntries=0,openEntries=0;for(const e of entries){const share=Math.max(0,Math.min(100,e.businessShare))/100,inYear=yearOf(e.paymentDate)===year;if(inYear&&!e.paid)openEntries++;if(!inYear||!e.paid)continue;paidEntries++;const net=e.net*(e.kind==="expense"?share:1);if(e.kind==="income"){income+=net;e1a[categories[e.category].e1a]=(e1a[categories[e.category].e1a]||0)+net;if(e.vatCase==="domestic")outputVat+=e.vat;}else{const gwg=e.asset&&e.net*share<=1000;if(!e.asset||gwg){expenses+=net;const key=gwg?"9130":categories[e.category].e1a;e1a[key]=(e1a[key]||0)+net;}if(e.vatCase==="domestic"||e.vatCase==="import_vat")inputVat+=e.vat*share;if(["reverse_charge_eu","reverse_charge_domestic","intra_community_acquisition"].includes(e.vatCase)){const rc=e.net*((e.vatRate??20)/100);reverseChargeVat+=rc;reverseChargeDeductible+=rc*share;}}}for(const e of entries){const afa=annualDepreciation(e,year),share=Math.max(0,Math.min(100,e.businessShare))/100;if(!afa||e.net*share<=1000)continue;depreciation+=afa;expenses+=afa;e1a["9130"]=(e1a["9130"]||0)+afa;}const profit=income-expenses,basic=Math.max(0,Math.min(profit,33000)*.15);return{income:round(income),expenses:round(expenses),depreciation:round(depreciation),profitBeforeGfb:round(profit),basicGfb:round(basic),profitAfterBasicGfb:round(profit-basic),outputVat:round(outputVat),inputVat:round(inputVat),reverseChargeVat:round(reverseChargeVat),reverseChargeDeductible:round(reverseChargeDeductible),vatBalance:round(outputVat+reverseChargeVat-inputVat-reverseChargeDeductible),e1a:Object.fromEntries(Object.entries(e1a).map(([k,v])=>[k,round(v)])),paidEntries,openEntries};}
function totals(d:BusinessDocument,payments:Payment[]){const before=d.lines.reduce((s,l)=>s+l.quantity*l.unitPrice*(1-l.discount/100),0);const discount=d.discountType==="percent"?before*d.discount/100:d.discount;const factor=before?Math.max(0,before-discount)/before:1;const net=round(Math.max(0,before-discount));const taxable=d.vatCase==="domestic";const vat=round(taxable?d.lines.reduce((s,l)=>s+l.quantity*l.unitPrice*(1-l.discount/100)*(l.vatRate/100)*factor,0):0);const gross=round(net+vat),paid=round(payments.filter(p=>p.documentId===d.id).reduce((s,p)=>s+p.amount,0));return{net,vat,gross,paid,open:round(Math.max(0,gross-paid))};}

export function BookkeepingProvider({children}:{children:React.ReactNode}){const[store,setStore]=useState<Store>(initial),[ready,setReady]=useState(false);useEffect(()=>{queueMicrotask(()=>{try{const raw=localStorage.getItem(LS)||localStorage.getItem(LEGACY);if(raw){const parsed=JSON.parse(raw);setStore({...initial,...parsed,contacts:parsed.contacts||[],products:parsed.products||[],documents:parsed.documents||[],payments:parsed.payments||[]});}}catch{}setReady(true);});},[]);useEffect(()=>{if(ready)localStorage.setItem(LS,JSON.stringify(store));},[ready,store]);const summary=useMemo(()=>summarize(store.entries,store.year),[store.entries,store.year]);const yearEntries=useMemo(()=>store.entries.filter(e=>yearOf(e.paymentDate)===store.year).sort((a,b)=>b.paymentDate.localeCompare(a.paymentDate)),[store.entries,store.year]);
  const addEntry=(entry:Omit<BookEntry,"id"|"createdAt">)=>{const made={...entry,id:makeId("entry"),createdAt:new Date().toISOString()};setStore(c=>({...c,entries:[...c.entries,made]}));return made;};
  const addContact=(contact:Omit<Contact,"id"|"createdAt">)=>{const made={...contact,id:makeId("contact"),createdAt:new Date().toISOString()};setStore(c=>({...c,contacts:[...c.contacts,made]}));return made;};
  const addProduct=(product:Omit<Product,"id"|"createdAt">)=>{const made={...product,id:makeId("product"),createdAt:new Date().toISOString()};setStore(c=>({...c,products:[...c.products,made]}));return made;};
  const addDocument=(doc:Omit<BusinessDocument,"id"|"createdAt"|"number">&{number?:string})=>{const number=doc.number||`${doc.type==="invoice"?store.invoicePrefix:doc.type.toUpperCase().slice(0,3)}-${new Date(doc.issueDate||Date.now()).getFullYear()}-${String(store.nextInvoiceNumber).padStart(4,"0")}`;const made={...doc,number,id:makeId("doc"),createdAt:new Date().toISOString()};setStore(c=>({...c,documents:[...c.documents,made],nextInvoiceNumber:c.nextInvoiceNumber+1}));return made;};
  const convertDocument=(id:string,type:DocumentType)=>{const source=store.documents.find(d=>d.id===id);if(!source)return;return addDocument({...source,type,status:type==="invoice"?"open":"draft",sourceDocumentId:source.id,lines:source.lines.map(l=>({...l,id:makeId("line")})),number:undefined});};
  const addPayment=(payment:Omit<Payment,"id"|"createdAt">)=>{const made={...payment,id:makeId("payment"),createdAt:new Date().toISOString()};setStore(c=>({...c,payments:[...c.payments,made]}));return made;};
  const value:ContextValue={...store,ready,setYear:year=>setStore(c=>({...c,year})),setProfile:patch=>setStore(c=>({...c,...patch})),addEntry,updateEntry:e=>setStore(c=>({...c,entries:c.entries.map(x=>x.id===e.id?e:x)})),removeEntry:id=>setStore(c=>({...c,entries:c.entries.filter(e=>e.id!==id)})),addContact,updateContact:x=>setStore(c=>({...c,contacts:c.contacts.map(v=>v.id===x.id?x:v)})),removeContact:id=>setStore(c=>({...c,contacts:c.contacts.filter(x=>x.id!==id)})),addProduct,updateProduct:x=>setStore(c=>({...c,products:c.products.map(v=>v.id===x.id?x:v)})),removeProduct:id=>setStore(c=>({...c,products:c.products.filter(x=>x.id!==id)})),addDocument,updateDocument:x=>setStore(c=>({...c,documents:c.documents.map(v=>v.id===x.id?x:v)})),removeDocument:id=>setStore(c=>({...c,documents:c.documents.filter(x=>x.id!==id),payments:c.payments.filter(p=>p.documentId!==id)})),convertDocument,addPayment,removePayment:id=>setStore(c=>({...c,payments:c.payments.filter(p=>p.id!==id)})),documentTotals:d=>totals(d,store.payments),clearBooks:()=>{localStorage.removeItem(LS);localStorage.removeItem(LEGACY);setStore(initial);},replaceStore:data=>setStore({...initial,...data}),summary,yearEntries};return <Context.Provider value={value}>{children}</Context.Provider>;}
export function useBooks(){const v=useContext(Context);if(!v)throw new Error("BookkeepingProvider missing");return v;}
export function csvDownload(filename:string,rows:string[][]){const csv=rows.map(r=>r.map(c=>`"${String(c??"").replaceAll('"','""')}"`).join(";")).join("\n");const blob=new Blob(["\ufeff",csv],{type:"text/csv;charset=utf-8"}),url=URL.createObjectURL(blob),a=document.createElement("a");a.href=url;a.download=filename;a.click();setTimeout(()=>URL.revokeObjectURL(url),1000);}
