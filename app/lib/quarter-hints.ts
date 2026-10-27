import type { ExpenseDraft, StoredReport } from "./tax.ts";

export type QuarterPeriod = { year: number; quarter: number };
export type QuarterHint = { periods: QuarterPeriod[]; label: string };

function periodFromDate(value: string): QuarterPeriod | undefined {
  const match = /^(20\d{2})-(0[1-9]|1[0-2])(?:-\d{2})?$/.exec(value);
  return match
    ? { year: Number(match[1]), quarter: Math.ceil(Number(match[2]) / 3) }
    : undefined;
}

function periodsFromRange(start?: string, end?: string): QuarterPeriod[] {
  const from = start && periodFromDate(start),
    to = end && periodFromDate(end);
  if (!from || !to) return [];
  const first = from.year * 4 + from.quarter - 1;
  const last = to.year * 4 + to.quarter - 1;
  if (last < first || last - first > 40) return [];
  return Array.from({ length: last - first + 1 }, (_, index) => {
    const value = first + index;
    return { year: Math.floor(value / 4), quarter: (value % 4) + 1 };
  });
}

function uniquePeriods(
  periods: (QuarterPeriod | undefined)[],
): QuarterPeriod[] {
  const unique = new Map<string, QuarterPeriod>();
  for (const period of periods)
    if (period) unique.set(`${period.year}-${period.quarter}`, period);
  return [...unique.values()].sort(
    (a, b) => a.year - b.year || a.quarter - b.quarter,
  );
}

function formatPeriods(periods: QuarterPeriod[]) {
  return periods.map(({ year, quarter }) => `Q${quarter}/${year}`).join(", ");
}

function periodFromFilename(name: string): QuarterPeriod | undefined {
  const yearFirst = name.match(
    /(?:^|\D)(20\d{2})[-_]?(0[1-9]|1[0-2])(?:[-_]?(?:0[1-9]|[12]\d|3[01]))?(?=\D|$)/,
  );
  const monthFirst = name.match(/(?:^|\D)(0[1-9]|1[0-2])[-_](20\d{2})(?=\D|$)/);
  const year = yearFirst?.[1] || monthFirst?.[2];
  const month = yearFirst?.[2] || monthFirst?.[1];
  return year && month
    ? { year: Number(year), quarter: Math.ceil(Number(month) / 3) }
    : undefined;
}

// These hints are for navigation only. Existing tax calculations and user confirmations stay unchanged.
export function reportQuarterHint(
  report: StoredReport,
  overrides: Record<string, ExpenseDraft> = {},
): QuarterHint {
  if (report.source === "apple_financial") {
    const bookings = uniquePeriods(
      Object.keys(report.monthly || {}).map(periodFromDate),
    );
    const coverage = periodsFromRange(report.periodStart, report.periodEnd);
    const periods = uniquePeriods([...bookings, ...coverage]);
    if (periods.length) {
      const parts = [];
      if (bookings.length)
        parts.push(`Buchungsdaten: ${formatPeriods(bookings)}`);
      if (coverage.length)
        parts.push(`Apple-Berichtszeitraum: ${formatPeriods(coverage)}`);
      return { periods, label: parts.join(" · ") };
    }
  }
  if (report.expenses?.length) {
    const periods = uniquePeriods(
      report.expenses.map((expense) =>
        periodFromDate((overrides[expense.id] || expense).date),
      ),
    );
    if (periods.length)
      return {
        periods,
        label: `Ausgaben, Steuerdatum prüfen: ${formatPeriods(periods)}`,
      };
  }
  if (report.year && report.month && report.month >= 1 && report.month <= 12) {
    const periods = [
      { year: report.year, quarter: Math.ceil(report.month / 3) },
    ];
    return {
      periods,
      label: `Vermuteter Berichtsmonat: ${formatPeriods(periods)}`,
    };
  }
  const inferred = periodFromFilename(report.name);
  return inferred
    ? {
        periods: [inferred],
        label: `Vermutung aus Dateiname: ${formatPeriods([inferred])}`,
      }
    : { periods: [], label: "Quartal nicht erkannt – Beleg prüfen" };
}

export function summarizeReportQuarters(
  reports: StoredReport[],
  overrides: Record<string, ExpenseDraft> = {},
) {
  const groups = new Map<string, QuarterPeriod & { count: number }>();
  let unknown = 0;
  for (const report of reports) {
    const { periods } = reportQuarterHint(report, overrides);
    if (!periods.length) unknown++;
    for (const period of periods) {
      const key = `${period.year}-${period.quarter}`;
      const existing = groups.get(key);
      groups.set(key, { ...period, count: (existing?.count || 0) + 1 });
    }
  }
  return {
    groups: [...groups.values()].sort(
      (a, b) => a.year - b.year || a.quarter - b.quarter,
    ),
    unknown,
  };
}
