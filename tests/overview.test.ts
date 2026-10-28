import assert from "node:assert/strict";
import test from "node:test";
import * as quarterly from "../app/lib/quarterly.ts";
import { inspectFile, ZERO, type ExpenseDraft, type StoredReport } from "../app/lib/tax.ts";

test("Google earnings include charges, refunds, fees and taxes by actual transaction date", async () => {
  // Quoted dates preserve the comma in Google's CSV export.
  const report = new File([
    'Transaction Date,Transaction Type,Buyer Country,Merchant Currency,Amount (Merchant Currency)\n"Jul 2, 2026",Charge,AT,EUR,100\n"Jul 2, 2026",Google fee,AT,EUR,-15\n"Jul 2, 2026",Tax,AT,EUR,-5\n"Jul 3, 2026",Charge,US,EUR,50\n"Jul 3, 2026",Google fee,US,EUR,-7.5\n"Jul 3, 2026",Charge refund,US,EUR,-2\n',
  ], "PlayApps_202607.csv");
  const result = await inspectFile("google", report);
  assert.deepEqual(result.record.income, [
    { date: "2026-07-02", amount: 80, entity: "Google Play" },
    { date: "2026-07-03", amount: 40.5, entity: "Google Play" },
  ]);
});

test("Apple financial income includes non-Irish entities and returns without multiplying extended proceeds twice", async () => {
  const report = new File([
    "Start Date\t07/01/2026\nEnd Date\t07/31/2026\nTransaction Date\tSettlement Date\tCountry of Sale\tQuantity\tPartner Share\tExtended Partner Share\tPartner Share Currency\tSale or Return\n07/10/2026\t07/10/2026\tDE\t2\t3\t6\tEUR\tS\n07/11/2026\t07/11/2026\tUS\t1\t5\t5\tEUR\tS\n07/11/2026\t07/12/2026\tUS\t-1\t-1\t-1\tEUR\tR\n",
  ], "FD_test_0726.txt");
  const result = await inspectFile("apple_financial", report);
  assert.deepEqual(result.record.income, [
    { date: "2026-07-10", amount: 6, entity: "Apple Distribution International Ltd. (Irland)" },
    { date: "2026-07-11", amount: 5, entity: "Apple Inc. (USA)" },
    { date: "2026-07-12", amount: -1, entity: "Apple Inc. (USA)" },
  ]);
  assert.equal(result.record.contribution.appleZm, 6);
});

const makeReport = (id: string, source: StoredReport["source"], income: {date: string; amount: number; entity: string}[], month: number): StoredReport => ({
  id, source, name: `${id}.csv`, size: 10, type: "text/csv", lastModified: 0,
  year: 2026, month, level: "ok", message: "", rows: income.length,
  contribution: { ...ZERO }, createdAt: "2026-10-01T00:00:00Z", sha256: id, income,
});
const expense: ExpenseDraft = {id:"one",title:"Subscription",sourceName:"invoice.pdf",date:"2026-07-01",paymentDate:"2026-07-02",serviceDate:"2026-08-01",net:20,vat:0,share:80,vatCase:"reverse_charge",confirmed:true,note:""};

test("overview uses paid business expenses and report revenue without treating daily Apple summaries as income", () => {
  assert.equal(typeof quarterly.summarizeOverview, "function");
  const result = quarterly.summarizeOverview([
    makeReport("g", "google", [{date:"2026-07-02",amount:100,entity:"Google Play"}], 7),
    makeReport("a", "apple_financial", [{date:"2026-07-03",amount:50,entity:"Apple Inc."}], 7),
    makeReport("daily", "apple_sales", [{date:"2026-07-03",amount:50,entity:"Apple Inc."}], 7),
  ], [expense, {...expense,id:"unpaid",paymentDate:""}, {...expense,id:"private",excluded:true}], 2026, 3);
  assert.equal(result.incomeTotal, 150);
  assert.equal(result.expenseTotal, 16);
  assert.equal(result.balance, 134);
  assert.equal(result.unpaidExpenses, 1);
});

test("overview refuses to sum conflicting report versions for the same month", () => {
  assert.equal(typeof quarterly.summarizeOverview, "function");
  const result = quarterly.summarizeOverview([
    makeReport("g-one", "google", [{date:"2026-07-02",amount:100,entity:"Google Play"}], 7),
    makeReport("g-two", "google", [{date:"2026-07-02",amount:120,entity:"Google Play"}], 7),
    makeReport("other", "google", [{date:"2026-08-02",amount:10,entity:"Google Play"}], 8),
  ], [], 2026, 3);
  assert.equal(result.incomeTotal, 10);
  assert.ok(result.warnings.some((warning) => /2026-07/.test(warning)));
});

test("moving an expense between quarters marks both periods for review", () => {
  assert.equal(typeof quarterly.expenseAffectedPeriods, "function");
  assert.deepEqual(quarterly.expenseAffectedPeriods(expense, { ...expense, date: "2026-10-01" }), ["2026-Q3", "2026-Q4"]);
});

test("overview warns when Apple financial reports stop before the selected quarter ends", () => {
  const report = {...makeReport("apple", "apple_financial", [{date:"2026-09-20",amount:5,entity:"Apple"}], 9), periodStart:"2026-07-01", periodEnd:"2026-09-26"};
  const result = quarterly.summarizeOverview([report], [], 2026, 3);
  assert.ok(result.warnings.some((warning) => /2026-09-30/.test(warning)));
});

test("overview flags missing Google months in the selected quarter", () => {
  const report = makeReport("google-july", "google", [{date:"2026-07-02",amount:20,entity:"Google Play"}], 7);
  const result = quarterly.summarizeOverview([report], [], 2026, 3);
  assert.ok(result.warnings.some((warning) => /Google/.test(warning) && /8.*9/.test(warning)));
});

test("overview warns instead of silently treating a failed source report as zero", () => {
  const report = {...makeReport("bad-google", "google", [], 7), level:"error" as const, message:"Nicht lesbar"};
  const result = quarterly.summarizeOverview([report], [], 2026, 3);
  assert.ok(result.warnings.some((warning) => /bad-google\.csv/.test(warning) && /nicht/i.test(warning)));
});

test("Apple income warns when a transaction has no assignable country", async () => {
  const report = new File([
    "Start Date\t07/01/2026\nEnd Date\t07/31/2026\nTransaction Date\tSettlement Date\tCountry of Sale\tQuantity\tPartner Share\tExtended Partner Share\tPartner Share Currency\tSale or Return\n07/10/2026\t07/10/2026\t\t1\t3\t3\tEUR\tS\n",
  ], "FD_test_0726.txt");
  const result = await inspectFile("apple_financial", report);
  assert.ok(result.record.incomeWarnings?.some((warning) => /Land/.test(warning)));
});
