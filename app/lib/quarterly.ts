import {
  ZERO,
  expenseContribution,
  periodKey,
  reportContribution,
  roundCent,
  type Contribution,
  type ExpenseDraft,
  type Source,
  type StoredReport,
} from "./tax.ts";

export type QuarterReview = {
  google: boolean;
  apple: boolean;
  appodeal: boolean;
  expenses: "" | "yes" | "no";
  expensesComplete: boolean;
  modelConfirmed: boolean;
  appleExact: string;
  appleEvidence: string;
  reviewed: boolean;
  submittedUva: boolean;
  submittedZm: boolean;
};
export const emptyReview = (): QuarterReview => ({
  google: true,
  apple: true,
  appodeal: true,
  expenses: "",
  expensesComplete: false,
  modelConfirmed: false,
  appleExact: "",
  appleEvidence: "",
  reviewed: false,
  submittedUva: false,
  submittedZm: false,
});
export function quarterDates(year: number, quarter: number) {
  return {
    from: `${year}-${String(quarter * 3 - 2).padStart(2, "0")}-01`,
    to: new Date(Date.UTC(year, quarter * 3, 0)).toISOString().slice(0, 10),
  };
}
export function mergeExpenses(
  reports: StoredReport[],
  overrides: Record<string, ExpenseDraft>,
) {
  const map = new Map<string, ExpenseDraft>();
  // The export already contains the booked private share and payment date.
  for (const report of [...reports].sort(
    (a, b) => Number(a.source === "kalkuel") - Number(b.source === "kalkuel"),
  )) {
    for (const expense of report.expenses || []) map.set(expense.id, expense);
  }
  for (const expense of Object.values(overrides)) map.set(expense.id, expense);
  return [...map.values()].sort((a, b) => a.date.localeCompare(b.date));
}
export function summarizeQuarter(
  reports: StoredReport[],
  overrides: Record<string, ExpenseDraft>,
  review: QuarterReview,
  year: number,
  quarter: number,
) {
  const totals: Contribution = { ...ZERO },
    blockers: string[] = [],
    { from, to } = quarterDates(year, quarter);
  const months = [quarter * 3 - 2, quarter * 3 - 1, quarter * 3];
  const selected = reports.filter((r) =>
    r.monthly
      ? Object.keys(r.monthly).some(
          (m) => +m.slice(0, 4) === year && months.includes(+m.slice(5, 7)),
        )
      : r.year === year && r.month !== null && months.includes(r.month),
  );
  const seen = new Set<string>();
  for (const report of reports) {
    if (report.sha256 && seen.has(report.sha256)) continue;
    if (report.sha256) seen.add(report.sha256);
    if (
      (report.source === "google" && !review.google) ||
      (report.source === "apple_financial" && !review.apple) ||
      (report.source === "appodeal" && !review.appodeal)
    )
      continue;
    if (report.expenses?.length) continue;
    const c = reportContribution(report, year, quarter);
    for (const key of Object.keys(ZERO) as (keyof Contribution)[])
      totals[key] += c[key];
  }
  // Round the platform subtotal and the expense subtotal separately, then add.
  // This keeps the component amounts visible and reconciles with prior filings.
  for (const key of Object.keys(ZERO) as (keyof Contribution)[])
    totals[key] = roundCent(totals[key]);
  const expenseTotals: Contribution = { ...ZERO };
  const expenses = mergeExpenses(reports, overrides).filter(
    (e) => e.date >= from && e.date <= to,
  );
  for (const e of expenses) {
    if (e.excluded) continue;
    const c = expenseContribution(e);
    for (const key of Object.keys(ZERO) as (keyof Contribution)[])
      expenseTotals[key] += c[key];
    if (!e.confirmed || e.vatCase === "review")
      blockers.push(
        `${e.title}: USt-Fall, Steuerdatum, Betrag und Betriebsanteil noch offen.`,
      );
    if (e.vatCase === "domestic" && !e.paymentDate)
      blockers.push(`${e.title}: Zahlungsdatum für Vorsteuer fehlt.`);
  }
  for (const key of Object.keys(ZERO) as (keyof Contribution)[])
    totals[key] += roundCent(expenseTotals[key]);
  const missing = (source: Source) =>
    months.filter(
      (m) =>
        !reports.some(
          (r) =>
            r.source === source &&
            r.year === year &&
            r.month === m &&
            r.level !== "error",
        ),
    );
  if (review.google && missing("google").length)
    blockers.push(
      `Google Earnings fehlen: ${missing("google").join(", ")}/${year}.`,
    );
  if (review.apple) {
    const apple = reports.filter(
      (r) =>
        r.source === "apple_financial" &&
        r.periodStart &&
        r.periodEnd &&
        r.periodStart <= to &&
        r.periodEnd >= from,
    );
    let end = from;
    for (const report of apple.sort((a, b) =>
      a.periodStart!.localeCompare(b.periodStart!),
    )) {
      if (report.periodStart! > end) break;
      const next = new Date(`${report.periodEnd}T00:00:00Z`);
      next.setUTCDate(next.getUTCDate() + 1);
      if (next.toISOString().slice(0, 10) > end)
        end = next.toISOString().slice(0, 10);
    }
    if (end <= to)
      blockers.push(
        `Apple: Kalenderzeitraum bis ${to} nicht lückenlos abgedeckt. Auch den folgenden FD-Bericht hochladen.`,
      );
    const override =
      review.appleExact !== "" &&
      Number.isFinite(Number(review.appleExact)) &&
      review.appleEvidence.trim().length > 5;
    if (override) totals.appleZm = Number(review.appleExact);
    if (!override && reports.some((r) => r.source === "apple_financial" && (r.missingAppleDates || 0) > 0))
      blockers.push("Apple: Ein maßgebliches Datum fehlt. Quartalszuordnung anhand der Unterlagen klären oder eine bestätigte Quartalssumme mit Belegreferenz ergänzen.");
    if (
      !override &&
      selected.some(
        (r) =>
          r.source === "apple_financial" &&
          (r.indicativeFx ||
            r.parserVersion === 0 ||
            r.unresolvedAppleCountries?.length),
      )
    )
      blockers.push(
        "Apple: ungeklärte Währungen/Entities. Bestätigte EUR-Gesamtsumme mit Belegreferenz ergänzen; InforEuro ist nur eine Schätzung.",
      );
  }
  if (review.expenses === "")
    blockers.push("Bitte angeben, ob du zusätzliche Ausgaben hattest.");
  if (review.expenses === "no" && expenses.some((e) => !e.excluded))
    blockers.push(
      "Es sind Ausgabenbelege vorhanden; die Antwort „keine Ausgaben“ passt nicht dazu.",
    );
  if (!review.expensesComplete)
    blockers.push(
      "Vollständigkeit der Ausgaben und wiederkehrenden Abos noch bestätigen.",
    );
  if (!review.modelConfirmed)
    blockers.push(
      "Vertragspartner und Plattformmodell noch prüfen (Standard-Store-Billing, keine alternativen Direktverkäufe).",
    );
  for (const source of ["google", "apple_financial"] as Source[]) {
    const same = new Set<string>();
    for (const r of selected.filter((r) => r.source === source)) {
      const key = `${r.year}-${r.month}`;
      if (same.has(key))
        blockers.push(
          `${source}: mehrere verschiedene Reports für ${key}; Überschneidung vor Abgabe klären.`,
        );
      same.add(key);
    }
  }
  for (const key of Object.keys(ZERO) as (keyof Contribution)[])
    totals[key] = roundCent(totals[key]);
  return {
    totals,
    expenses,
    selected,
    blockers: [...new Set(blockers)],
    key: periodKey(year, quarter),
  };
}
export function detectSource(name: string, text = ""): Source {
  if (
    /^PlayApps_.*\.csv$/i.test(name) ||
    text.includes("Amount (Merchant Currency)")
  )
    return "google";
  if (
    /^FD_.*\.(txt|csv)$/i.test(name) ||
    /^Transaction Date\tSettlement Date\t/m.test(text)
  )
    return "apple_financial";
  if (/^S_[DM]_/i.test(name) || /^Provider\tProvider Country\t/m.test(text))
    return "apple_sales";
  if (
    /Nur.Ausgaben.*\.csv$/i.test(name) ||
    text.includes("Netto-Buchungsbetrag")
  )
    return "kalkuel";
  if (
    /^report_\d{2}_\d{4}.*\.pdf$/i.test(name) ||
    /Ad\s+revenue\s*\$/i.test(text)
  )
    return "appodeal";
  if (
    /OpenAI Ireland|APPLE DEVELOPER PROGRAM/i.test(text) ||
    /Invoice-.*\.pdf|mediamarkt|appstore\.pdf/i.test(name)
  )
    return "expense";
  return "attachment";
}
