import { expenseKey, type ExpenseDraft } from "./tax.ts";

// A JSON file is an untrusted draft, never a confirmation of a tax treatment.
export function parseExpenseJson(text: string): ExpenseDraft[] {
  const json: unknown = JSON.parse(text);
  if (!json || typeof json !== "object" || !Array.isArray((json as { expenses?: unknown }).expenses))
    throw new Error("JSON muss ein Objekt mit einer expenses-Liste enthalten.");
  const list = (json as { expenses: unknown[] }).expenses;
  if (list.length > 1000) throw new Error("Höchstens 1000 Ausgaben je Datei.");
  const ids = new Set<string>();
  return list.map((item, i) => {
    if (!item || typeof item !== "object" || Array.isArray(item)) throw new Error(`Ausgabe ${i + 1} ist ungültig.`);
    const x = item as Record<string, unknown>;
    const str = (k: string, required = false) => {
      const v = x[k] ?? "";
      if (typeof v !== "string" || v.length > 2000 || (required && !v.trim())) throw new Error(`Ausgabe ${i + 1}: ${k} ist ungültig.`);
      return v.trim();
    };
    const date = (k: string, required = false) => {
      const v = str(k, required);
      if (v && (!/^\d{4}-\d{2}-\d{2}$/.test(v) || !Number.isFinite(Date.parse(v)) || new Date(v).toISOString().slice(0, 10) !== v)) throw new Error(`Ausgabe ${i + 1}: ${k} ist ungültig.`);
      return v;
    };
    const amount = (k: string, max: number) => {
      const v = x[k];
      if (typeof v !== "number" || !Number.isFinite(v) || v < 0 || v > max) throw new Error(`Ausgabe ${i + 1}: ${k} ist ungültig.`);
      return v;
    };
    const title = str("title", true), taxDate = date("date", true), net = amount("net", 1e9);
    const vatCase = str("vatCase", true);
    if (!["domestic", "reverse_charge", "none", "review"].includes(vatCase)) throw new Error(`Ausgabe ${i + 1}: USt-Fall ungültig.`);
    const id = str("id") || expenseKey(title, taxDate, net);
    if (ids.has(id)) throw new Error(`Ausgabe ${i + 1}: doppelte ID.`);
    ids.add(id);
    return { id, title, sourceName: str("sourceName", true), date: taxDate, paymentDate: date("paymentDate"), serviceDate: date("serviceDate"), net, vat: amount("vat", 1e9), share: amount("share", 100), vatCase: vatCase as ExpenseDraft["vatCase"], confirmed: false, note: str("note") };
  });
}
