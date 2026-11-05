import assert from "node:assert/strict";
import test from "node:test";
import {
  inspectFile,
  u30Xml,
  u13Xml,
  parseKalkuelExpenses,
  vatBalance,
  reportContribution,
  isoDate,
  domesticVatAllocations,
  domesticVatIssues,
  newManualExpense,
  withExpenseTaxDate,
  withPaymentDateMatchingTaxDate,
  type ExpenseDraft,
} from "../app/lib/tax.ts";
import {
  emptyReview,
  summarizeQuarter,
  mergeExpenses,
  expenseAffectedPeriods,
  expenseRelevantInPeriod,
} from "../app/lib/quarterly.ts";

test("Google resale margin is not an additional imported service fee", async () => {
  const file = new File(
    [
      `Transaction Date,Transaction Type,Buyer Country,Merchant Currency,Amount (Merchant Currency)\nApr 2,Charge,AT,EUR,100\nApr 2,Google fee,AT,EUR,-15\nApr 3,Charge,US,EUR,200\nApr 3,Google fee,US,EUR,-30\n`,
    ],
    "PlayApps_202604.csv",
  );
  const { record } = await inspectFile("google", file);
  assert.equal(record.contribution.googleZm, 85);
  assert.equal(record.contribution.kz057, 6);
  assert.equal(record.contribution.kz066, 6);
});

test("Apple July report assigns June transactions to Q2 and excludes its rollup", async () => {
  const file = new File(
    [
      `Vendor Name\tTest\nStart Date\t06/28/2026\nEnd Date\t08/01/2026\nTransaction Date\tSettlement Date\tCountry of Sale\tQuantity\tPartner Share\tExtended Partner Share\tPartner Share Currency\tSale or Return\n06/28/2026\t06/28/2026\tDE\t1\t7\t7\tEUR\tS\n07/03/2026\t07/03/2026\tDE\t1\t3\t3\tEUR\tS\nCountry Of Sale\tPartner Share Currency\tQuantity\tExtended Partner Share\nDE\tEUR\t2\t10\n`,
    ],
    "FD_test_0726.txt",
  );
  const { record } = await inspectFile("apple_financial", file);
  assert.equal(reportContribution(record, 2026, 2).appleZm, 7);
  assert.equal(reportContribution(record, 2026, 3).appleZm, 3);
  assert.equal(record.periodEnd, "2026-08-01");
});

test("identical content has the same digest even after renaming", async () => {
  const a = await inspectFile("attachment", new File(["evidence"], "a.txt"));
  const b = await inspectFile("attachment", new File(["evidence"], "copy.txt"));
  assert.equal(a.record.id, b.record.id);
});

test("expense inspection reuses text extracted during recognition", async () => {
  const result = await inspectFile(
    "expense",
    new File(["Already decoded"], "Invoice-0007.pdf"),
    {
      text: "Invoice OpenAI Ireland Limited Date of issue September 30, 2026 €19.17 due September 30, 2026 ChatGPT Plus Subscription Sep 30–Oct 30, 2026 Total €19.17 Tax to be paid on reverse charge basis",
    },
  );
  assert.equal(result.record.level, "warn");
  assert.equal(result.record.expenses?.length, 1);
  assert.equal(result.record.expenses?.[0].net, 19.17);
});

test("Apple inspection reports exchange-rate work and honours a cancelled request", async () => {
  const original = globalThis.fetch;
  const controller = new AbortController();
  const stages: string[] = [];
  globalThis.fetch = async (_input, init) => {
    controller.abort();
    assert.equal(init?.signal?.aborted, true);
    throw new DOMException("Cancelled", "AbortError");
  };
  try {
    const file = new File(
      [
        "Start Date\t07/01/2026\nEnd Date\t07/31/2026\nTransaction Date\tSettlement Date\tCountry of Sale\tQuantity\tPartner Share\tExtended Partner Share\tPartner Share Currency\tSale or Return\n07/10/2026\t07/10/2026\tGB\t1\t10\t10\tGBP\tS\n",
      ],
      "FD_progress_0726.txt",
    );
    await inspectFile("apple_financial", file, {
      signal: controller.signal,
      onProgress: (stage) => stages.push(stage),
    });
    assert.ok(stages.includes("exchange_rates"));
  } finally {
    globalThis.fetch = original;
  }
});

test("English invoice dates keep their calendar day in Vienna", () => {
  process.env.TZ = "Europe/Vienna";
  assert.equal(isoDate("May 30, 2026"), "2026-05-30");
});

test("Kalkuel export uses each payment date and retains its already reduced business amount", () => {
  const [e] = parseKalkuelExpenses(
    "Kunde/Lieferant,Zahlungsdatum,Gesamter Netto-Betrag,Gesamter Brutto-Betrag,Netto-Buchungsbetrag,Steuerliche Besonderheit\nOpenAI,2026-06-30,-19.17,-19.17,-15.34,Reverse Charge\n",
    "Nur_Ausgaben.csv",
  );
  assert.equal(e.date, "2026-06-30");
  assert.equal(e.share, 80);
  assert.equal(e.businessNet, 15.34);
  const r = emptyReview();
  r.google = false;
  r.apple = false;
  r.appodeal = false;
  const result = summarizeQuarter([], { [e.id]: e }, r, 2026, 2);
  assert.equal(result.totals.kz057, 3.83);
  assert.equal(result.totals.kz066, 3.07);
  assert.ok(result.blockers.length);
});

test("review stays blocked without Apple tail report and without expense declaration", () => {
  const result = summarizeQuarter([], {}, emptyReview(), 2026, 3);
  assert.ok(result.blockers.some((x) => x.includes("2026-09-30")));
  assert.ok(result.blockers.some((x) => x.includes("Ausgaben")));
});

test("CSV and receipt drafts with same supplier, date and amount are only used once", () => {
  const [e] = parseKalkuelExpenses(
    "Kunde/Lieferant,Zahlungsdatum,Gesamter Netto-Betrag,Gesamter Brutto-Betrag,Netto-Buchungsbetrag\nOpenAI,2026-06-30,-19.17,-19.17,-15.34\n",
    "export.csv",
  );
  const expenseReport = (
    source: "expense" | "kalkuel",
    expenses: (typeof e)[],
  ) => ({ source, expenses }) as Parameters<typeof mergeExpenses>[0][number];
  const merged = mergeExpenses(
    [
      expenseReport("kalkuel", [e]),
      expenseReport("expense", [{ ...e, paymentDate: "", share: 100 }]),
    ],
    {},
  );
  assert.equal(merged.length, 1);
  assert.equal(merged[0].paymentDate, "2026-06-30");
  assert.equal(merged[0].businessNet, 15.34);
});

test("VAT balance applies the rate to domestic net turnover", () => {
  assert.equal(vatBalance({ kz000: 100, kz057: 5, kz060: 3, kz066: 5 }), 17);
});

test("domestic turnover is a tax base, and U30 includes the 20 percent output tax", () => {
  const xml = u30Xml(2026, 3, "123456789", "123456789", {
    kz000: 100,
    kz057: 0,
    kz060: 0,
    kz066: 0,
  });
  assert.match(xml, /<KZ022 type="kz">100.00<\/KZ022>/);
});

test("ZM sums by UID before dropping cents", () => {
  const xml = u13Xml(2026, 2, "123456789", "123456789", [
    { uid: "IE1234567A", name: "test", exact: 1.6 },
    { uid: "IE1234567A", name: "test", exact: 2.6 },
  ]);
  assert.equal((xml.match(/<ZM>/g) || []).length, 1);
  assert.match(xml, /<SUM_BGL type="kz">4<\/SUM_BGL>/);
});

test("Apple uses the last rate on the transaction day rather than financial month end", async () => {
  const original = globalThis.fetch;
  globalThis.fetch = async () =>
    Response.json({
      rates: {
        GBP: [
          { date: "2026-06-28", rate: 2 },
          { date: "2026-07-31", rate: 4 },
        ],
      },
      sources: { GBP: "EZB" },
    });
  try {
    const file = new File(
      [
        `Start Date\t06/28/2026\nEnd Date\t08/01/2026\nTransaction Date\tSettlement Date\tCountry of Sale\tQuantity\tPartner Share\tExtended Partner Share\tPartner Share Currency\tSale or Return\n06/29/2026\t06/29/2026\tGB\t1\t10\t10\tGBP\tS\n`,
      ],
      "FD_test_0726.txt",
    );
    const { record } = await inspectFile("apple_financial", file);
    assert.equal(reportContribution(record, 2026, 2).appleZm, 5);
  } finally {
    globalThis.fetch = original;
  }
});


test("Apple sales without transaction dates stay blocked until their quarter is established", async () => {
  const data = "Start Date\t07/01/2026\nEnd Date\t07/31/2026\nTransaction Date\tSettlement Date\tCountry of Sale\tQuantity\tPartner Share\tExtended Partner Share\tPartner Share Currency\tSale or Return\n\t07/20/2026\tDE\t1\t5\t5\tEUR\tS\n";
  const { record } = await inspectFile("apple_financial", new File([data], "FD_test_0726.txt"));
  assert.equal((record as typeof record & { missingAppleDates?: number }).missingAppleDates, 1);
  assert.equal(record.level, "warn");
  assert.equal(reportContribution(record, 2026, 3).appleZm, 0);
  assert.match(record.message, /Datum fehlt/i);
  const result = summarizeQuarter([record], {}, emptyReview(), 2026, 3);
  assert.ok(result.blockers.some((message) => /Apple.*Datum fehlt/i.test(message)));
});

// --- Domestic KZ 060: invoice + payment, with explicit partial payments ---
const vatExpense = (patch: Partial<ExpenseDraft> = {}): ExpenseDraft => ({
  id: "receipt-1", title: "Laptop", sourceName: "laptop.pdf",
  date: "2026-06-20", paymentDate: "2026-07-05", serviceDate: "2026-06-20",
  net: 1000, vat: 200, share: 100, vatCase: "domestic",
  confirmed: true, note: "", ...patch,
});
const expenseQuarter = (expense: ExpenseDraft, quarter: number) =>
  summarizeQuarter([], { [expense.id]: expense },
    { ...emptyReview(), google: false, apple: false, appodeal: false, expenses: "yes", expensesComplete: true },
    2026, quarter);

test("manually added invoices default to the same date for payment, but are unconfirmed", () => {
  const expense = newManualExpense("manual-1", "2026-06-20");
  assert.equal(expense.paymentDate, expense.date);
  assert.equal(expense.confirmed, false);
  assert.equal(withExpenseTaxDate(expense, "2026-07-01").paymentDate, "2026-07-01");
  assert.equal(withPaymentDateMatchingTaxDate(expense, false).paymentDate, "");
  assert.equal(withExpenseTaxDate({ ...expense, paymentDate: "2026-06-28" }, "2026-07-01").paymentDate, "2026-06-28");
});

test("domestic invoice in Q2 paid completely in Q3 has KZ 060 only in Q3", () => {
  const expense = vatExpense();
  const q2 = expenseQuarter(expense, 2), q3 = expenseQuarter(expense, 3);
  assert.equal(q2.totals.kz060, 0);
  assert.equal(q3.totals.kz060, 200);
  assert.ok(q2.notes.some((n) => /späteren Zahlungsquartalen/.test(n)));
  assert.ok(q3.notes.some((n) => /Rechnung vom/.test(n)));
  assert.deepEqual(expenseAffectedPeriods(undefined, expense).sort(), ["2026-Q2", "2026-Q3"]);
});

test("a later receipt of the invoice delays domestic input VAT", () => {
  const expense = vatExpense({ paymentDate: "2026-06-20", invoiceReceivedDate: "2026-07-03" });
  assert.equal(expenseQuarter(expense, 2).totals.kz060, 0);
  assert.equal(expenseQuarter(expense, 3).totals.kz060, 200);
});

test("later completion delays ordinary VAT, while qualifying advance payments can be earlier", () => {
  const expense = vatExpense({ paymentDate: "2026-06-25", serviceDate: "2026-08-01" });
  assert.equal(expenseQuarter(expense, 2).totals.kz060, 0);
  assert.equal(expenseQuarter(expense, 3).totals.kz060, 200);
  const advance = { ...expense, prepayment: true };
  assert.equal(expenseQuarter(advance, 2).totals.kz060, 200);
  assert.equal(expenseQuarter(advance, 3).totals.kz060, 0);
});

test("two partial gross payments split KZ 060 between Q2 and Q3", () => {
  const expense = vatExpense({
    paymentDate: "",
    payments: [
      { date: "2026-06-25", gross: 600 },
      { date: "2026-07-05", gross: 600 },
    ],
  });
  assert.deepEqual(domesticVatAllocations(expense), [
    { date: "2026-06-25", vat: 100 },
    { date: "2026-07-05", vat: 100 },
  ]);
  assert.equal(expenseQuarter(expense, 2).totals.kz060, 100);
  assert.equal(expenseQuarter(expense, 3).totals.kz060, 100);
  assert.equal(expenseQuarter(expense, 4).totals.kz060, 0);
  assert.equal(expenseRelevantInPeriod(expense, "2026-07-01", "2026-09-30"), true);
});

test("a partially paid invoice only deducts its paid share", () => {
  const expense = vatExpense({ payments: [{ date: "2026-07-05", gross: 300 }], paymentDate: "" });
  assert.equal(expenseQuarter(expense, 3).totals.kz060, 50);
  assert.equal(expenseQuarter(expense, 2).totals.kz060, 0);
});

test("payment before invoice is recognized no earlier than invoice readiness", () => {
  const expense = vatExpense({ date: "2026-07-03", paymentDate: "2026-06-28", serviceDate: "2026-09-15", prepayment: true });
  assert.equal(expenseQuarter(expense, 2).totals.kz060, 0);
  assert.equal(expenseQuarter(expense, 3).totals.kz060, 200);
});

test("missing, impossible, and excessive payment records never create KZ 060", () => {
  for (const expense of [
    vatExpense({ paymentDate: "" }),
    vatExpense({ paymentDate: "", payments: [{ date: "2026-07-05", gross: 1500 }] }),
    vatExpense({ paymentDate: "", payments: [{ date: "", gross: 500 }] }),
    vatExpense({ paymentDate: "", payments: [{ date: "2026-07-05", gross: -1 }] }),
  ]) {
    assert.ok(domesticVatIssues(expense).length > 0);
    assert.equal(expenseQuarter(expense, 2).totals.kz060, 0);
    assert.equal(expenseQuarter(expense, 3).totals.kz060, 0);
    assert.ok(expenseQuarter(expense, 2).blockers.length > 0);
  }
});

test("editing partial payments invalidates old and new payment quarters", () => {
  const before = vatExpense({ paymentDate: "", payments: [{ date: "2026-07-05", gross: 600 }] });
  const after = { ...before, payments: [{ date: "2026-10-02", gross: 600 }] };
  assert.deepEqual(expenseAffectedPeriods(before, after).sort(), ["2026-Q2", "2026-Q3", "2026-Q4"]);
});

test("reverse charge remains in Steuerdatum quarter despite later payment", () => {
  const expense = vatExpense({ vatCase: "reverse_charge", vat: 0, net: 100 });
  assert.equal(expenseQuarter(expense, 2).totals.kz057, 20);
  assert.equal(expenseQuarter(expense, 2).totals.kz066, 20);
  assert.equal(expenseQuarter(expense, 3).totals.kz057, 0);
});
