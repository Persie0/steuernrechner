import test from 'node:test';
import assert from 'node:assert/strict';
import { parseExpenseJson } from '../app/lib/expense-json.ts';

test('expense JSON retains amounts and source but requires fresh confirmation', () => {
  const row = {title:'OpenAI', sourceName:'invoice.pdf', date:'2026-06-30', serviceDate:'2026-07-30', paymentDate:'2026-06-30', net:19.17, vat:0, share:80, vatCase:'reverse_charge', confirmed:true, note:'Check payment'};
  const [expense] = parseExpenseJson(JSON.stringify({expenses:[row]}));
  assert.equal(expense.confirmed, false);
  assert.equal(expense.id, 'openai:2026-06-30:19.17');
  assert.equal(expense.serviceDate, '2026-07-30');
  assert.throws(() => parseExpenseJson(JSON.stringify({expenses:[row,row]})), /doppelte ID/);
  assert.throws(() => parseExpenseJson(JSON.stringify({expenses:[{...row,share:101}]})), /share/);
  assert.throws(() => parseExpenseJson(JSON.stringify({expenses:[{...row,date:'2026-02-31'}]})), /date/);
});
