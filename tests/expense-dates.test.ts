import assert from "node:assert/strict";
import test from "node:test";
import * as tax from "../app/lib/tax.ts";

const expense = {
  id: "openai-july",
  title: "OpenAI ChatGPT Plus",
  sourceName: "invoice.pdf",
  date: "2026-07-30",
  paymentDate: "",
  serviceDate: "2026-08-30",
  net: 19.17,
  vat: 0,
  share: 80,
  vatCase: "reverse_charge" as const,
  confirmed: true,
  note: "",
};

test("copying and clearing the payment date invalidates the prior review", () => {
  assert.equal(typeof tax.withPaymentDateMatchingTaxDate, "function");
  const paid = tax.withPaymentDateMatchingTaxDate(expense, true);
  assert.equal(paid.paymentDate, "2026-07-30");
  assert.equal(paid.serviceDate, "2026-08-30");
  assert.equal(paid.confirmed, false);
  assert.equal(tax.withPaymentDateMatchingTaxDate(paid, false).paymentDate, "");
});

test("changing the tax date moves a matching payment date but leaves a distinct one intact", () => {
  assert.equal(typeof tax.withExpenseTaxDate, "function");
  assert.equal(tax.withExpenseTaxDate({ ...expense, paymentDate: "2026-07-30" }, "2026-07-31").paymentDate, "2026-07-31");
  assert.equal(tax.withExpenseTaxDate({ ...expense, paymentDate: "2026-07-28" }, "2026-07-31").paymentDate, "2026-07-28");
  assert.equal(tax.withExpenseTaxDate(expense, "2026-07-31").paymentDate, "");
});

test("OpenAI bulk action fills only missing dates, preserving existing and unrelated expenses", () => {
  assert.equal(typeof tax.openAiExpensesWithMissingPaymentDate, "function");
  const updated = tax.openAiExpensesWithMissingPaymentDate([
    expense,
    { ...expense, id: "september", date: "2026-09-30" },
    { ...expense, id: "different", paymentDate: "2026-07-29" },
    { ...expense, id: "apple", title: "Apple Developer" },
    { ...expense, id: "excluded", excluded: true },
    { ...expense, id: "no-tax-date", date: "" },
  ]);
  assert.deepEqual(updated.map((row) => [row.id, row.paymentDate, row.confirmed]), [
    ["openai-july", "2026-07-30", false],
    ["september", "2026-09-30", false],
  ]);
});
