export type ApplePeriod = { start: string; end: string };

function date(value: string): string | undefined {
  const us = /^(\d{1,2})\/(\d{1,2})\/(\d{4})$/.exec(value.trim());
  const iso = us
    ? `${us[3]}-${us[1].padStart(2, "0")}-${us[2].padStart(2, "0")}`
    : value.trim();
  if (!/^20\d{2}-\d{2}-\d{2}$/.test(iso)) return undefined;
  const parsed = new Date(`${iso}T00:00:00Z`);
  return Number.isFinite(parsed.getTime()) && parsed.toISOString().slice(0, 10) === iso
    ? iso
    : undefined;
}

export function appleFinancialPeriod(text: string): ApplePeriod | undefined {
  const start = date(text.match(/^(?:\uFEFF)?Start Date\t([^\r\n]+)/im)?.[1] || "");
  const end = date(text.match(/^End Date\t([^\r\n]+)/im)?.[1] || "");
  if (!start || !end || end < start) return undefined;
  if (Date.parse(end) - Date.parse(start) > 62 * 86400000) return undefined;
  return { start, end };
}

export function applePeriodMonth(period: ApplePeriod) {
  const midpoint = new Date((Date.parse(period.start) + Date.parse(period.end)) / 2);
  return { year: midpoint.getUTCFullYear(), month: midpoint.getUTCMonth() + 1 };
}

export function firstUncoveredDate(periods: ApplePeriod[], from: string, to: string) {
  let next = from;
  for (const period of [...periods].sort((a, b) => a.start.localeCompare(b.start))) {
    if (period.end < next) continue;
    if (period.start > next) break;
    const after = new Date(`${period.end}T00:00:00Z`);
    after.setUTCDate(after.getUTCDate() + 1);
    next = after.toISOString().slice(0, 10);
    if (next > to) return undefined;
  }
  return next <= to ? next : undefined;
}
