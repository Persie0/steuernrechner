export type EngineVatCase =
  | "domestic"
  | "eu_b2b_service"
  | "reverse_charge_eu"
  | "reverse_charge_domestic"
  | "intra_community_supply"
  | "intra_community_acquisition"
  | "export_supply"
  | "import_vat"
  | "foreign_vat"
  | "third_country"
  | "exempt";

export type EngineEntry = {
  id: string;
  paymentDate: string;
  serviceDate?: string;
  kind: "income" | "expense";
  category: string;
  net: number;
  vat: number;
  businessShare: number;
  vatCase: EngineVatCase;
  vatRate?: number;
  paid: boolean;
  asset: boolean;
  usefulLife: number;
  depreciationMethod?: "linear" | "degressive" | "optimized";
  firstUseDate: string;
  currency?: string;
  exchangeRate?: number;
  uid?: string;
  description?: string;
  partner?: string;
  documentNumber?: string;
  source?: string;
  note?: string;
  country?: string;
};
export type EngineLine = {
  quantity: number;
  unitPrice: number;
  vatRate: number;
  discount: number;
};
export type EngineDocument = {
  id: string;
  type: string;
  number: string;
  contactId: string;
  issueDate: string;
  serviceDate: string;
  currency: string;
  exchangeRate: number;
  vatCase: EngineVatCase;
  lines: EngineLine[];
  discount: number;
  discountType: "percent" | "fixed";
  sourceDocumentId: string;
};
export type EnginePayment = {
  id: string;
  documentId: string;
  date: string;
  amount: number;
};
export type EngineContact = {
  id: string;
  company: string;
  firstName: string;
  lastName: string;
  country: string;
  uid: string;
};
export type CategoryMap = Record<string, { e1a: string }>;

export const roundMoney = (value: number) =>
  Math.round((value + Number.EPSILON) * 100) / 100;
const yearOf = (date: string) => Number(date?.slice(0, 4));
const shareOf = (entry: EngineEntry) =>
  Math.max(0, Math.min(100, entry.businessShare)) / 100;
export const eur = (amount: number, currency = "EUR", exchangeRate = 1) =>
  roundMoney(amount * (currency === "EUR" ? 1 : exchangeRate || 1));

export function documentTotals(
  document: EngineDocument,
  payments: EnginePayment[] = [],
) {
  const before = document.lines.reduce(
    (sum, line) =>
      sum + line.quantity * line.unitPrice * (1 - line.discount / 100),
    0,
  );
  const discount =
    document.discountType === "percent"
      ? (before * document.discount) / 100
      : document.discount;
  const factor = before ? Math.max(0, before - discount) / before : 1;
  const net = roundMoney(Math.max(0, before - discount));
  const vat = roundMoney(
    document.vatCase === "domestic"
      ? document.lines.reduce(
          (sum, line) =>
            sum +
            line.quantity *
              line.unitPrice *
              (1 - line.discount / 100) *
              (line.vatRate / 100) *
              factor,
          0,
        )
      : 0,
  );
  const gross = roundMoney(net + vat);
  const paid = roundMoney(
    payments
      .filter((payment) => payment.documentId === document.id)
      .reduce((sum, payment) => sum + payment.amount, 0),
  );
  return {
    net,
    vat,
    gross,
    paid,
    open: roundMoney(Math.max(0, gross - paid)),
    netEur: eur(net, document.currency, document.exchangeRate),
    vatEur: eur(vat, document.currency, document.exchangeRate),
    grossEur: eur(gross, document.currency, document.exchangeRate),
  };
}

export function annualDepreciation(entry: EngineEntry, year: number) {
  if (!entry.asset || entry.usefulLife <= 0 || !entry.firstUseDate) return 0;
  const base =
      entry.net *
      (entry.currency && entry.currency !== "EUR"
        ? entry.exchangeRate || 1
        : 1) *
      shareOf(entry),
    start = yearOf(entry.firstUseDate),
    elapsed = year - start;
  const fullCost =
    entry.net *
    (entry.currency && entry.currency !== "EUR" ? entry.exchangeRate || 1 : 1);
  if (fullCost <= 1000) return year === start ? roundMoney(base) : 0;
  if (elapsed < 0) return 0;
  const halfFirst = Number(entry.firstUseDate.slice(5, 7)) > 6;
  const linearAnnual = base / entry.usefulLife;
  if (entry.depreciationMethod === "linear" || !entry.depreciationMethod) {
    if (elapsed === 0) return roundMoney(linearAnnual * (halfFirst ? 0.5 : 1));
    const used =
      linearAnnual * (halfFirst ? 0.5 : 1) +
      linearAnnual * Math.max(0, elapsed - 1);
    return roundMoney(Math.max(0, Math.min(linearAnnual, base - used)));
  }
  let rest = base;
  for (let index = 0; index <= elapsed; index++) {
    const remainingYears = Math.max(
      0.5,
      entry.usefulLife - index + (halfFirst ? 0.5 : 0),
    );
    const degressive = rest * 0.3;
    const linearFromNow = rest / remainingYears;
    let amount =
      entry.depreciationMethod === "optimized"
        ? Math.max(degressive, linearFromNow)
        : degressive;
    if (index === 0 && halfFirst) amount *= 0.5;
    amount = Math.min(rest, amount);
    if (index === elapsed) return roundMoney(amount);
    rest -= amount;
  }
  return 0;
}

export function deriveDocumentEntries(
  documents: EngineDocument[],
  payments: EnginePayment[],
  contacts: EngineContact[],
): EngineEntry[] {
  const results: EngineEntry[] = [];
  for (const document of documents) {
    if (!["invoice", "credit_note", "cancellation"].includes(document.type))
      continue;
    const total = documentTotals(document, payments),
      contact = contacts.find((item) => item.id === document.contactId);
    if (document.type === "cancellation" && document.sourceDocumentId) {
      const source = documents.find(
        (item) => item.id === document.sourceDocumentId,
      );
      if (source) {
        const sourceTotal = documentTotals(source, payments),
          recognized = Math.min(sourceTotal.paid, sourceTotal.gross);
        if (recognized > 0)
          results.push(
            makeDocumentEntry(
              document,
              contact,
              `storno-${document.id}`,
              document.issueDate,
              recognized,
              sourceTotal,
              -1,
            ),
          );
      }
      continue;
    }
    const sign = document.type === "credit_note" ? -1 : 1;
    for (const payment of payments.filter(
      (item) => item.documentId === document.id,
    )) {
      results.push(
        makeDocumentEntry(
          document,
          contact,
          `docpay-${payment.id}`,
          payment.date,
          Math.min(payment.amount, total.gross),
          total,
          sign,
        ),
      );
    }
  }
  return results;
}

export function deriveDocumentAccrualEntries(
  documents: EngineDocument[],
  contacts: EngineContact[],
): EngineEntry[] {
  return documents
    .filter((document) =>
      ["invoice", "credit_note", "cancellation"].includes(document.type),
    )
    .map((document) => {
      const total = documentTotals(document),
        contact = contacts.find((item) => item.id === document.contactId),
        sign = ["credit_note", "cancellation"].includes(document.type) ? -1 : 1;
      return makeDocumentEntry(
        document,
        contact,
        `docvat-${document.id}`,
        document.serviceDate || document.issueDate,
        total.gross,
        total,
        sign,
      );
    });
}

function makeDocumentEntry(
  document: EngineDocument,
  contact: EngineContact | undefined,
  id: string,
  date: string,
  paidNative: number,
  total: ReturnType<typeof documentTotals>,
  sign: number,
): EngineEntry {
  const ratio = total.gross ? paidNative / total.gross : 0;
  return {
    id,
    paymentDate: date,
    serviceDate: document.serviceDate || document.issueDate,
    kind: "income",
    category: "revenue",
    net: eur(
      total.net * ratio * sign,
      document.currency,
      document.exchangeRate,
    ),
    vat: eur(
      total.vat * ratio * sign,
      document.currency,
      document.exchangeRate,
    ),
    businessShare: 100,
    vatCase: document.vatCase,
    vatRate: document.lines[0]?.vatRate ?? 20,
    paid: true,
    asset: false,
    usefulLife: 0,
    firstUseDate: date,
    currency: "EUR",
    exchangeRate: 1,
    uid: contact?.uid,
    description: `${document.type === "credit_note" ? "Gutschrift" : document.type === "cancellation" ? "Storno" : "Zahlung"} ${document.number}`,
    partner:
      contact?.company ||
      `${contact?.firstName || ""} ${contact?.lastName || ""}`.trim(),
    country: contact?.country || "",
    documentNumber: document.number,
    source: "document",
    note: "Automatisch aus Dokument und Zahlung erzeugt.",
  };
}

export type EngineSummary = {
  income: number;
  expenses: number;
  depreciation: number;
  profitBeforeGfb: number;
  basicGfb: number;
  profitAfterBasicGfb: number;
  outputVat: number;
  inputVat: number;
  reverseChargeVat: number;
  reverseChargeDeductible: number;
  vatBalance: number;
  e1a: Record<string, number>;
  paidEntries: number;
  openEntries: number;
  zm: Record<string, number>;
};
export function summarizeEntries(
  entries: EngineEntry[],
  year: number,
  categories: CategoryMap,
  regularVat = true,
  vatEntries: EngineEntry[] = entries,
): EngineSummary {
  const e1a: Record<string, number> = {},
    zm: Record<string, number> = {};
  let income = 0,
    expenses = 0,
    depreciation = 0,
    outputVat = 0,
    inputVat = 0,
    reverseChargeVat = 0,
    reverseChargeDeductible = 0,
    paidEntries = 0,
    openEntries = 0;
  for (const entry of entries) {
    const inYear = yearOf(entry.paymentDate) === year;
    if (inYear && !entry.paid) openEntries++;
    if (!inYear || !entry.paid) continue;
    paidEntries++;
    const share = shareOf(entry),
      factor =
        entry.currency && entry.currency !== "EUR"
          ? entry.exchangeRate || 1
          : 1;
    const rawNet = entry.net * factor,
      net = rawNet * (entry.kind === "expense" ? share : 1);
    if (entry.kind === "income") {
      income += net;
      const key = categories[entry.category]?.e1a || "9040";
      e1a[key] = (e1a[key] || 0) + net;
    } else {
      const gwg = entry.asset && rawNet <= 1000;
      if (!entry.asset || gwg) {
        expenses += net;
        const key = gwg ? "9130" : categories[entry.category]?.e1a || "9230";
        e1a[key] = (e1a[key] || 0) + net;
      }
    }
  }
  for (const entry of vatEntries) {
    const performanceBased =
      (entry.kind === "income" &&
        ["eu_b2b_service", "intra_community_supply"].includes(entry.vatCase)) ||
      (entry.kind === "expense" &&
        ["reverse_charge_eu", "reverse_charge_domestic"].includes(
          entry.vatCase,
        ));
    const taxDate = performanceBased
      ? entry.serviceDate || entry.paymentDate
      : entry.paymentDate;
    if (yearOf(taxDate) !== year || (!performanceBased && !entry.paid))
      continue;
    const share = shareOf(entry),
      factor =
        entry.currency && entry.currency !== "EUR"
          ? entry.exchangeRate || 1
          : 1,
      net = entry.net * factor,
      vat = entry.vat * factor;
    if (entry.kind === "income") {
      if (entry.vatCase === "domestic" && regularVat) outputVat += vat;
      if (
        ["eu_b2b_service", "intra_community_supply"].includes(entry.vatCase) &&
        entry.uid
      )
        zm[entry.uid] = (zm[entry.uid] || 0) + net;
    } else {
      if (
        regularVat &&
        (entry.vatCase === "domestic" || entry.vatCase === "import_vat")
      )
        inputVat += vat * share;
      if (
        [
          "reverse_charge_eu",
          "reverse_charge_domestic",
          "intra_community_acquisition",
        ].includes(entry.vatCase)
      ) {
        const rc = net * ((entry.vatRate ?? 20) / 100);
        reverseChargeVat += rc;
        if (regularVat) reverseChargeDeductible += rc * share;
      }
    }
  }
  for (const entry of entries) {
    const afa = annualDepreciation(entry, year),
      base =
        entry.net *
        (entry.currency && entry.currency !== "EUR"
          ? entry.exchangeRate || 1
          : 1);
    if (!afa || base <= 1000) continue;
    depreciation += afa;
    expenses += afa;
    e1a["9130"] = (e1a["9130"] || 0) + afa;
  }
  const profit = income - expenses,
    basic = Math.max(0, Math.min(profit, 33000) * 0.15);
  const rounded = (record: Record<string, number>) =>
    Object.fromEntries(
      Object.entries(record).map(([key, value]) => [key, roundMoney(value)]),
    );
  return {
    income: roundMoney(income),
    expenses: roundMoney(expenses),
    depreciation: roundMoney(depreciation),
    profitBeforeGfb: roundMoney(profit),
    basicGfb: roundMoney(basic),
    profitAfterBasicGfb: roundMoney(profit - basic),
    outputVat: roundMoney(outputVat),
    inputVat: roundMoney(inputVat),
    reverseChargeVat: roundMoney(reverseChargeVat),
    reverseChargeDeductible: roundMoney(reverseChargeDeductible),
    vatBalance: roundMoney(
      outputVat + reverseChargeVat - inputVat - reverseChargeDeductible,
    ),
    e1a: rounded(e1a),
    paidEntries,
    openEntries,
    zm: rounded(zm),
  };
}
