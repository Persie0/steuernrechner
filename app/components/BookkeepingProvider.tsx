"use client";

import {createContext, useContext, useEffect, useMemo, useState} from "react";
import {deriveDocumentAccrualEntries,deriveDocumentEntries, documentTotals as calculateDocumentTotals, summarizeEntries} from "../lib/bookkeeping-engine";
import {clearReceipts} from "../lib/receipts";

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
export type BusinessDocument = {id:string; type:DocumentType; number:string; contactId:string; issueDate:string; dueDate:string; serviceDate:string; currency:string; exchangeRate:number; vatCase:VatCase; status:DocumentStatus; lines:DocumentLine[]; discount:number; discountType:"percent"|"fixed"; cashDiscountPercent?:number; cashDiscountDays?:number; reminderLevel?:number; reminderFee?:number; notes:string; sourceDocumentId:string; createdAt:string};

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

export type AnnualSummary = {income:number; expenses:number; depreciation:number; profitBeforeGfb:number; basicGfb:number; profitAfterBasicGfb:number; outputVat:number; inputVat:number; reverseChargeVat:number; reverseChargeDeductible:number; vatBalance:number; e1a:Record<string,number>; paidEntries:number; openEntries:number; zm:Record<string,number>};
type Store = {year:number; entries:BookEntry[]; contacts:Contact[]; products:Product[]; documents:BusinessDocument[]; payments:Payment[]; quarterlyVat:boolean; regularVat:boolean; vatTaxation:"cash"|"accrual"; hasEmployees:boolean; usesOss:boolean; hasCashRegister:boolean; invoicePrefix:string; nextInvoiceNumber:number; companyName:string; companyAddress:string; companyUid:string; iban:string};
type ContextValue = Store & {ready:boolean; setYear:(year:number)=>void; setProfile:(patch:Partial<Omit<Store,"year"|"entries"|"contacts"|"products"|"documents"|"payments">>)=>void; addEntry:(entry:Omit<BookEntry,"id"|"createdAt">)=>BookEntry; updateEntry:(entry:BookEntry)=>void; removeEntry:(id:string)=>void; addContact:(contact:Omit<Contact,"id"|"createdAt">)=>Contact; updateContact:(contact:Contact)=>void; removeContact:(id:string)=>void; addProduct:(product:Omit<Product,"id"|"createdAt">)=>Product; updateProduct:(product:Product)=>void; removeProduct:(id:string)=>void; addDocument:(document:Omit<BusinessDocument,"id"|"createdAt"|"number"> & {number?:string})=>BusinessDocument; updateDocument:(document:BusinessDocument)=>void; removeDocument:(id:string)=>void; convertDocument:(id:string,type:DocumentType)=>BusinessDocument|undefined; addPayment:(payment:Omit<Payment,"id"|"createdAt">)=>Payment; removePayment:(id:string)=>void; documentTotals:(document:BusinessDocument)=>{net:number;vat:number;gross:number;paid:number;open:number;netEur:number;vatEur:number;grossEur:number}; clearBooks:()=>void; replaceStore:(data:Partial<Store>)=>void; summary:AnnualSummary; yearEntries:BookEntry[]; allEntries:BookEntry[]};

const initial: Store = {year:2026,entries:[],contacts:[],products:[],documents:[],payments:[],quarterlyVat:true,regularVat:true,vatTaxation:"cash",hasEmployees:false,usesOss:false,hasCashRegister:false,invoicePrefix:"RE",nextInvoiceNumber:1,companyName:"",companyAddress:"",companyUid:"",iban:""};
const Context = createContext<ContextValue|null>(null); const LS="steuernrechner-books-v2"; const LEGACY="steuernrechner-books-v1";
const yearOf=(d:string)=>Number(d?.slice(0,4));
const makeId=(prefix:string)=>globalThis.crypto?.randomUUID?.()||`${prefix}-${Date.now()}-${Math.random().toString(36).slice(2)}`;

export function BookkeepingProvider({children}:{children:React.ReactNode}){const[store,setStore]=useState<Store>(initial),[ready,setReady]=useState(false);useEffect(()=>{queueMicrotask(()=>{try{const raw=localStorage.getItem(LS)||localStorage.getItem(LEGACY);if(raw){const parsed=JSON.parse(raw);setStore({...initial,...parsed,contacts:parsed.contacts||[],products:parsed.products||[],documents:parsed.documents||[],payments:parsed.payments||[]});}}catch{}setReady(true);});},[]);useEffect(()=>{if(ready){localStorage.setItem(LS,JSON.stringify(store));try{const key="steuernrechner-auto-backups",today=new Date().toISOString().slice(0,10),items=JSON.parse(localStorage.getItem(key)||"[]") as {date:string;data:Store}[];if(items[0]?.date!==today)localStorage.setItem(key,JSON.stringify([{date:today,data:store},...items].slice(0,5)));}catch{}}},[ready,store]);const documentEntries=useMemo(()=>deriveDocumentEntries(store.documents,store.payments,store.contacts) as BookEntry[],[store.documents,store.payments,store.contacts]);const allEntries=useMemo(()=>[...store.entries,...documentEntries],[store.entries,documentEntries]);const vatEntries=useMemo(()=>store.vatTaxation==="accrual"?[...store.entries,...deriveDocumentAccrualEntries(store.documents,store.contacts) as BookEntry[]]:allEntries,[store.vatTaxation,store.entries,store.documents,store.contacts,allEntries]);const summary=useMemo(()=>summarizeEntries(allEntries,store.year,categories,store.regularVat,vatEntries) as AnnualSummary,[allEntries,store.year,store.regularVat,vatEntries]);const yearEntries=useMemo(()=>allEntries.filter(e=>yearOf(e.paymentDate)===store.year).sort((a,b)=>b.paymentDate.localeCompare(a.paymentDate)),[allEntries,store.year]);
  const addEntry=(entry:Omit<BookEntry,"id"|"createdAt">)=>{const made={...entry,id:makeId("entry"),createdAt:new Date().toISOString()};setStore(c=>({...c,entries:[...c.entries,made]}));return made;};
  const addContact=(contact:Omit<Contact,"id"|"createdAt">)=>{const made={...contact,id:makeId("contact"),createdAt:new Date().toISOString()};setStore(c=>({...c,contacts:[...c.contacts,made]}));return made;};
  const addProduct=(product:Omit<Product,"id"|"createdAt">)=>{const made={...product,id:makeId("product"),createdAt:new Date().toISOString()};setStore(c=>({...c,products:[...c.products,made]}));return made;};
  const addDocument=(doc:Omit<BusinessDocument,"id"|"createdAt"|"number">&{number?:string})=>{const number=doc.number||`${doc.type==="invoice"?store.invoicePrefix:doc.type.toUpperCase().slice(0,3)}-${new Date(doc.issueDate||Date.now()).getFullYear()}-${String(store.nextInvoiceNumber).padStart(4,"0")}`;const made={...doc,number,id:makeId("doc"),createdAt:new Date().toISOString()};setStore(c=>({...c,documents:[...c.documents,made],nextInvoiceNumber:c.nextInvoiceNumber+1}));return made;};
  const convertDocument=(id:string,type:DocumentType)=>{const source=store.documents.find(d=>d.id===id);if(!source)return;return addDocument({...source,type,status:type==="invoice"?"open":"draft",sourceDocumentId:source.id,lines:source.lines.map(l=>({...l,id:makeId("line")})),number:undefined});};
  const addPayment=(payment:Omit<Payment,"id"|"createdAt">)=>{const made={...payment,id:makeId("payment"),createdAt:new Date().toISOString()};setStore(c=>({...c,payments:[...c.payments,made]}));return made;};
  const value:ContextValue={...store,ready,setYear:year=>setStore(c=>({...c,year})),setProfile:patch=>setStore(c=>({...c,...patch})),addEntry,updateEntry:e=>setStore(c=>({...c,entries:c.entries.map(x=>x.id===e.id?e:x)})),removeEntry:id=>setStore(c=>({...c,entries:c.entries.filter(e=>e.id!==id)})),addContact,updateContact:x=>setStore(c=>({...c,contacts:c.contacts.map(v=>v.id===x.id?x:v)})),removeContact:id=>setStore(c=>({...c,contacts:c.contacts.filter(x=>x.id!==id)})),addProduct,updateProduct:x=>setStore(c=>({...c,products:c.products.map(v=>v.id===x.id?x:v)})),removeProduct:id=>setStore(c=>({...c,products:c.products.filter(x=>x.id!==id)})),addDocument,updateDocument:x=>setStore(c=>({...c,documents:c.documents.map(v=>v.id===x.id?x:v)})),removeDocument:id=>setStore(c=>({...c,documents:c.documents.filter(x=>x.id!==id),payments:c.payments.filter(p=>p.documentId!==id)})),convertDocument,addPayment,removePayment:id=>setStore(c=>({...c,payments:c.payments.filter(p=>p.id!==id)})),documentTotals:d=>calculateDocumentTotals(d,store.payments),clearBooks:()=>{localStorage.removeItem(LS);localStorage.removeItem(LEGACY);localStorage.removeItem("steuernrechner-auto-backups");localStorage.removeItem("steuernrechner-close-all");localStorage.removeItem("steuernrechner-gemini-key-v1");void clearReceipts();setStore(initial);},replaceStore:data=>setStore({...initial,...data}),summary,yearEntries,allEntries};return <Context.Provider value={value}>{children}</Context.Provider>;}
export function useBooks(){const v=useContext(Context);if(!v)throw new Error("BookkeepingProvider missing");return v;}
export function csvDownload(filename:string,rows:string[][]){const csv=rows.map(r=>r.map(c=>`"${String(c??"").replaceAll('"','""')}"`).join(";")).join("\n");const blob=new Blob(["\ufeff",csv],{type:"text/csv;charset=utf-8"}),url=URL.createObjectURL(blob),a=document.createElement("a");a.href=url;a.download=filename;a.click();setTimeout(()=>URL.revokeObjectURL(url),1000);}
