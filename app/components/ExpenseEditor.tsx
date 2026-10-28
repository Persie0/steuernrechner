"use client";

import { useUst } from "./UstProvider";
import { withExpenseTaxDate, withPaymentDateMatchingTaxDate, type ExpenseDraft } from "../lib/tax";

export default function ExpenseEditor({ expense }: { expense: ExpenseDraft }) {
  const { updateExpense, reports, downloadReport } = useUst();
  const paymentMatchesTaxDate = !!expense.date && expense.paymentDate === expense.date;
  const change = (patch: Partial<ExpenseDraft>) =>
    updateExpense({
      ...expense,
      ...patch,
      confirmed: false,
      ...("net" in patch || "share" in patch ? { businessNet: undefined } : {}),
    });
  return (
    <article
      className={`expenseEditor ${expense.confirmed ? "confirmed" : ""}`}
    >
      <div className="expenseHeading">
        <h3>{expense.title}</h3>
        <span>{expense.confirmed ? "Geprüft" : "Bitte prüfen"}</span>
      </div>
      <small>{expense.sourceName}</small>
      <label>Originalbeleg zuordnen
        <select value={expense.attachmentId || ""} onChange={(e) => change({ attachmentId: e.target.value || undefined })}>
          <option value="">Noch kein Original zugeordnet</option>
          {reports.map((report) => <option key={report.id} value={report.id}>{report.name}</option>)}
        </select>
      </label>
      {expense.attachmentId && <button type="button" className="secondaryBtn" onClick={() => void downloadReport(expense.attachmentId!)}>Zugeordneten Beleg herunterladen</button>}
      <label>
        Beschreibung / Lieferant
        <input
          value={expense.title}
          onChange={(e) => change({ title: e.target.value })}
        />
      </label>
      <label className="checkLine">
        <input
          type="checkbox"
          checked={!!expense.excluded}
          onChange={(e) =>
            updateExpense({
              ...expense,
              excluded: e.target.checked,
              confirmed: false,
            })
          }
        />{" "}
        Nicht berücksichtigen (privat / irrtümlich erfasst)
      </label>
      <div className="expenseFields">
        <label>
          Steuerdatum
          <input
            type="date"
            value={expense.date}
            onChange={(e) => updateExpense(withExpenseTaxDate(expense, e.target.value))}
          />
        </label>
        <label>
          Leistungsende
          <input
            type="date"
            value={expense.serviceDate}
            onChange={(e) => change({ serviceDate: e.target.value })}
          />
        </label>
        <div>
          <label>
            Bezahlt am
            <input
              type="date"
              value={expense.paymentDate}
              onChange={(e) => change({ paymentDate: e.target.value })}
            />
          </label>
          <label className="checkLine paymentSameDate">
            <input
              type="checkbox"
              disabled={!expense.date}
              checked={paymentMatchesTaxDate}
              onChange={(e) => updateExpense(withPaymentDateMatchingTaxDate(expense, e.target.checked))}
            />
            Zahlungsdatum ist gleich Steuerdatum
          </label>
        </div>
        <label>
          Netto gesamt · EUR
          <input
            type="number"
            step="0.01"
            min="0"
            value={expense.net}
            onChange={(e) => change({ net: +e.target.value })}
          />
        </label>
        <label>
          USt laut Rechnung · EUR
          <input
            type="number"
            step="0.01"
            min="0"
            value={expense.vat}
            onChange={(e) => change({ vat: +e.target.value })}
          />
        </label>
        <label>
          Betrieblich · %
          <input
            type="number"
            min="0"
            max="100"
            value={expense.share}
            onChange={(e) =>
              change({ share: Math.min(100, Math.max(0, +e.target.value)) })
            }
          />
        </label>
        <label>
          USt-Behandlung
          <select
            value={expense.vatCase}
            onChange={(e) =>
              change({ vatCase: e.target.value as ExpenseDraft["vatCase"] })
            }
          >
            <option value="review">Noch ungeklärt – nicht abgabefertig</option>
            <option value="domestic">
              Korrekte österreichische USt · KZ 060
            </option>
            <option value="reverse_charge">
              Ausländische Dienstleistung · RC 20 %
            </option>
            <option value="none">
              Keine UVA-Wirkung / kein Vorsteuerabzug
            </option>
          </select>
        </label>
      </div>
      <label>
        Prüfnotiz
        <input
          value={expense.note}
          onChange={(e) => change({ note: e.target.value })}
        />
      </label>
      <p className="hint">
        Bei RC zählt grundsätzlich das Leistungsende, bei bezahlter
        Vorauszahlung der frühere Zahlungstermin. Bei gewöhnlicher
        Einkaufs-Vorsteuer müssen Rechnung und Zahlung vorliegen. Steuerdatum
        entsprechend setzen. Bereits reduzierte Kalkül-Buchungsbeträge werden
        nicht nochmals gekürzt.
      </p>
      <label className="checkLine">
        <input
          type="checkbox"
          disabled={
            expense.excluded ||
            expense.vatCase === "review" ||
            !expense.date ||
            expense.net <= 0
          }
          checked={expense.confirmed}
          onChange={(e) =>
            updateExpense({ ...expense, confirmed: e.target.checked })
          }
        />{" "}
        Betrag, Steuerdatum, USt-Fall und Betriebsanteil mit dem Beleg geprüft
      </label>
    </article>
  );
}
