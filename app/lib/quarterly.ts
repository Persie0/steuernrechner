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
  submittedZmSnapshot?: { uid: string; name: string; exact: number }[];
};
export const emptyReview = (): QuarterReview => ({
  google: true,
  apple: true,
  appodeal: true,
  expenses: "",
  expensesComplete: false,
  modelConfirmed: true,
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
export function expenseAffectedPeriods(previous: ExpenseDraft | undefined, next: ExpenseDraft): string[] {
  return [...new Set([previous?.date, next.date].flatMap((date) => {
    if (!date || !/^\d{4}-(0[1-9]|1[0-2])-\d{2}$/.test(date)) return [];
    return [periodKey(Number(date.slice(0, 4)), Math.ceil(Number(date.slice(5, 7)) / 3))];
  }))];
}

// Report values are not bank receipts. Keep the two bases explicit in the UI.
export function summarizeOverview(
  reports: StoredReport[],
  expenses: ExpenseDraft[],
  year: number | null,
  quarter: number | null,
) {
  const matches = (date: string) => /^\d{4}-\d{2}-\d{2}$/.test(date) &&
    (!year || Number(date.slice(0, 4)) === year) &&
    (!quarter || Math.ceil(Number(date.slice(5, 7)) / 3) === quarter);
  const candidates = reports.filter((r) => ["google", "apple_financial", "appodeal"].includes(r.source) && r.level !== "error");
  const hashes = new Set<string>();
  const unique = candidates.filter((r) => {
    const key = r.sha256 || r.id;
    if (hashes.has(key)) return false;
    hashes.add(key);
    return true;
  });
  const conflicts = new Set<string>();
  for (let i = 0; i < unique.length; i++) for (let j = i + 1; j < unique.length; j++) {
    const a = unique[i], b = unique[j];
    if (a.source !== b.source) continue;
    const sameMonth = a.source !== "apple_financial" && a.year && a.month && a.year === b.year && a.month === b.month;
    const overlappingApple = a.source === "apple_financial" && a.periodStart && a.periodEnd && b.periodStart && b.periodEnd && a.periodStart <= b.periodEnd && b.periodStart <= a.periodEnd;
    if (sameMonth || overlappingApple) { conflicts.add(a.id); conflicts.add(b.id); }
  }
  const warnings = new Set<string>();
  if (year && quarter && reports.some((report) => report.source === "google")) {
    const missing = [quarter * 3 - 2, quarter * 3 - 1, quarter * 3].filter((month) => !unique.some((report) => report.source === "google" && report.year === year && report.month === month && !conflicts.has(report.id)));
    if (missing.length) warnings.add(`Google-Earnings fehlen oder sind ungeklärt: ${missing.join(", ")}/${year}.`);
  }
  if (year && quarter && reports.some((report) => report.source === "apple_financial")) {
    const { from, to } = quarterDates(year, quarter);
    const periods = unique.filter((report) => report.source === "apple_financial" && !conflicts.has(report.id) && report.periodStart && report.periodEnd && report.periodStart <= to && report.periodEnd >= from).sort((a, b) => a.periodStart!.localeCompare(b.periodStart!));
    let coveredUntil = from;
    for (const report of periods) {
      if (report.periodStart! > coveredUntil) break;
      const next = new Date(`${report.periodEnd}T00:00:00Z`);
      next.setUTCDate(next.getUTCDate() + 1);
      if (next.toISOString().slice(0, 10) > coveredUntil) coveredUntil = next.toISOString().slice(0, 10);
    }
    if (coveredUntil <= to) warnings.add(`Apple-Finanzberichte decken den Zeitraum bis ${to} nicht vollständig ab; Sales-Tagesberichte werden nicht zusätzlich eingerechnet.`);
  }
  const relevant = (report: StoredReport) => {
    if (!year && !quarter) return true;
    if (report.income?.some((item) => matches(item.date))) return true;
    if (Object.keys(report.monthly || {}).some((month) => matches(`${month}-01`))) return true;
    if (year && report.periodStart && report.periodEnd) {
      const range = quarter ? quarterDates(year, quarter) : { from: `${year}-01-01`, to: `${year}-12-31` };
      return report.periodStart <= range.to && report.periodEnd >= range.from;
    }
    if (report.year && report.month) return matches(`${report.year}-${String(report.month).padStart(2, "0")}-01`);
    if (year && report.year) return report.year === year;
    return true;
  };
  for (const report of reports) {
    if (["google", "apple_financial", "appodeal"].includes(report.source) && report.level === "error" && relevant(report))
      warnings.add(`${report.name}: Bericht konnte nicht ausgewertet werden; Werte fehlen in der Übersicht.`);
  }
  const incomeRows: { date: string; amount: number; entity: string; source: string; reportId: string; reportName: string }[] = [];
  for (const report of unique) {
    if (!relevant(report)) continue;
    if (conflicts.has(report.id)) {
      const period = report.periodStart && report.periodEnd ? `${report.periodStart}–${report.periodEnd}` : `${report.year}-${String(report.month || 0).padStart(2, "0")}`;
      warnings.add(`${report.source}: Überschneidende Berichte für ${period} sind nicht im Ergebnis enthalten; bitte abgleichen.`);
      continue;
    }
    if (report.source === "appodeal") {
      if (report.year && report.month) {
        const date = new Date(Date.UTC(report.year, report.month, 0)).toISOString().slice(0, 10);
        if (matches(date) && report.contribution.appodealEur) incomeRows.push({ date, amount: report.contribution.appodealEur, entity: "Appodeal", source: "appodeal", reportId: report.id, reportName: report.name });
        if (matches(date) && report.contribution.appodealUsd && !report.contribution.appodealEur) warnings.add(`${report.name}: Appodeal-Betrag ohne EUR-Kurs nicht enthalten.`);
      } else warnings.add(`${report.name}: Appodeal-Berichtsmonat fehlt.`);
      continue;
    }
    if (!report.income) {
      warnings.add(`${report.name}: Einnahmen werden noch aus dem Original ermittelt oder konnten nicht gelesen werden.`);
      continue;
    }
    for (const warning of report.incomeWarnings || []) warnings.add(`${report.name}: ${warning}`);
    for (const item of report.income) if (matches(item.date)) incomeRows.push({ ...item, source: report.source, reportId: report.id, reportName: report.name });
  }
  incomeRows.sort((a, b) => b.date.localeCompare(a.date) || a.entity.localeCompare(b.entity));
  const includedExpenses = expenses.filter((e) => !e.excluded && matches(e.paymentDate || e.date));
  const paidExpenses = includedExpenses.filter((e) => !!e.paymentDate);
  const unpaidExpenses = includedExpenses.length - paidExpenses.length;
  const expenseTotal = roundCent(paidExpenses.reduce((sum, e) => sum + (e.businessNet ?? e.net * e.share / 100), 0));
  const incomeTotal = roundCent(incomeRows.reduce((sum, item) => sum + item.amount, 0));
  const incomeBySource = {
    google: roundCent(incomeRows.filter((item) => item.source === "google").reduce((sum, item) => sum + item.amount, 0)),
    apple: roundCent(incomeRows.filter((item) => item.source === "apple_financial").reduce((sum, item) => sum + item.amount, 0)),
    appodeal: roundCent(incomeRows.filter((item) => item.source === "appodeal").reduce((sum, item) => sum + item.amount, 0)),
  };
  return { incomeTotal, incomeBySource, incomeRows, expenseTotal, balance: roundCent(incomeTotal - expenseTotal), unpaidExpenses, unconfirmedExpenses: includedExpenses.filter((e) => !e.confirmed).length, warnings: [...warnings] };
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
  // Different versions of the same platform period can overlap. Never silently
  // treat both as additive: require the user to remove the obsolete version.
  const periods = new Map<string, StoredReport>();
  for (const report of selected) {
    if (report.source !== "google" && report.source !== "apple_financial") continue;
    const period = report.source === "apple_financial" && report.periodStart && report.periodEnd
      ? `${report.periodStart}/${report.periodEnd}` : `${report.year}-${report.month}`;
    const key = `${report.source}:${period}`;
    const prior = periods.get(key);
    if (prior && prior.sha256 !== report.sha256)
      blockers.push(`Mehrere unterschiedliche ${report.source === "google" ? "Google" : "Apple"}-Berichte für ${period}: ältere Version prüfen und entfernen, um Doppelzählungen zu vermeiden.`);
    else periods.set(key, report);
  }
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
        "Apple: ungeklärte Währungen/Entities. Banca-d’Italia-Kurse und ihre steuerliche Anwendung prüfen; bestätigte EUR-Gesamtsumme mit Belegreferenz ergänzen.",
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
