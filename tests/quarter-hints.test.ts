import assert from "node:assert/strict";
import test from "node:test";
import { inspectFile, type StoredReport } from "../app/lib/tax.ts";
import {
  reportQuarterHint,
  summarizeReportQuarters,
} from "../app/lib/quarter-hints.ts";

test("Apple fiscal reports can contain transactions and cover dates from different quarters", async () => {
  const data = `Start Date\t06/28/2026\nEnd Date\t08/01/2026\nTransaction Date\tSettlement Date\tCountry of Sale\tQuantity\tPartner Share\tExtended Partner Share\tPartner Share Currency\tSale or Return\n06/28/2026\t07/01/2026\tDE\t1\t7\t7\tEUR\tS\n07/03/2026\t07/03/2026\tDE\t1\t3\t3\tEUR\tS\n`;
  const { record } = await inspectFile(
    "apple_financial",
    new File([data], "FD_test_0726.txt"),
  );
  const hint = reportQuarterHint(record);
  assert.deepEqual(hint.periods, [
    { year: 2026, quarter: 2 },
    { year: 2026, quarter: 3 },
  ]);
  assert.match(hint.label, /Buchungsdaten: Q2\/2026, Q3\/2026/);
  assert.match(hint.label, /Apple-Berichtszeitraum: Q2\/2026, Q3\/2026/);
});

test("Apple report coverage is distinguished from transaction dates", async () => {
  const data = `Start Date\t09/27/2026\nEnd Date\t10/31/2026\nTransaction Date\tSettlement Date\tCountry of Sale\tQuantity\tPartner Share\tExtended Partner Share\tPartner Share Currency\tSale or Return\n10/03/2026\t10/03/2026\tDE\t1\t3\t3\tEUR\tS\n`;
  const { record } = await inspectFile(
    "apple_financial",
    new File([data], "FD_test_1026.txt"),
  );
  const hint = reportQuarterHint(record);
  assert.match(hint.label, /Buchungsdaten: Q4\/2026/);
  assert.match(hint.label, /Apple-Berichtszeitraum: Q3\/2026, Q4\/2026/);
  assert.deepEqual(hint.periods, [
    { year: 2026, quarter: 3 },
    { year: 2026, quarter: 4 },
  ]);
});

test("expense hints follow corrected tax dates and can span years", async () => {
  const data = `Bezeichnung;Zahlungsdatum;Netto-Buchungsbetrag;Umsatzsteuer\nOffice;2026-12-20;10;0\nHosting;2027-01-02;20;0\n`;
  const { record } = await inspectFile(
    "kalkuel",
    new File([data], "Nur_Ausgaben.csv"),
  );
  assert.equal(record.expenses?.length, 2);
  const first = record.expenses![0];
  const hint = reportQuarterHint(record, {
    [first.id]: { ...first, date: "2027-02-02" },
  });
  assert.deepEqual(hint.periods, [{ year: 2027, quarter: 1 }]);
  assert.match(hint.label, /Steuerdatum.*prüfen/i);
});

test("file names are marked as guesses and unknown attachments are not invented", async () => {
  const dated = (
    await inspectFile("attachment", new File(["a"], "wise_2026-09.pdf"))
  ).record;
  const unknown = (
    await inspectFile("attachment", new File(["b"], "receipt.pdf"))
  ).record;
  assert.match(reportQuarterHint(dated).label, /Dateiname.*Q3\/2026/);
  assert.deepEqual(reportQuarterHint(unknown).periods, []);
  const summary = summarizeReportQuarters([dated, unknown]);
  assert.deepEqual(summary.groups, [{ year: 2026, quarter: 3, count: 1 }]);
  assert.equal(summary.unknown, 1);
});

test("quarter summary counts a multi-quarter report once in each relevant quarter", async () => {
  const { record } = await inspectFile(
    "google",
    new File(
      [
        "Transaction Date,Transaction Type,Buyer Country,Merchant Currency,Amount (Merchant Currency)\nJul 2,Charge,AT,EUR,100\n",
      ],
      "PlayApps_202607.csv",
    ),
  );
  const other: StoredReport = {
    ...record,
    id: "apple",
    source: "apple_financial",
    monthly: {
      "2026-06": { ...record.contribution },
      "2026-07": { ...record.contribution },
    },
    periodStart: "2026-06-28",
    periodEnd: "2026-08-01",
  };
  const summary = summarizeReportQuarters([record, other]);
  assert.deepEqual(summary.groups, [
    { year: 2026, quarter: 2, count: 1 },
    { year: 2026, quarter: 3, count: 2 },
  ]);
});
