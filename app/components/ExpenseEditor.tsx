"use client";

import { useUst } from "./UstProvider";
import { domesticVatIssues, roundCent, withExpenseTaxDate, withPaymentDateMatchingTaxDate, type ExpenseDraft } from "../lib/tax";

export default function ExpenseEditor({ expense }: { expense: ExpenseDraft }) {
  const { updateExpense, reports, downloadReport } = useUst();
  const isPartial = expense.payments !== undefined;
  const paymentMatchesTaxDate = !isPartial && !!expense.date && expense.paymentDate === expense.date;
  const paymentIssues = domesticVatIssues(expense);
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
          Rechnungs-/Steuerdatum
          <input
            type="date"
            value={expense.date}
            onChange={(e) => updateExpense(withExpenseTaxDate(expense, e.target.value))}
          />
        </label>
        <label>
          Leistungsende (falls bekannt)
          <input
            type="date"
            value={expense.serviceDate}
            onChange={(e) => change({ serviceDate: e.target.value })}
          />
        </label>
        <div className="paymentSchedule">
          {expense.vatCase === "domestic" && (
            <>
              <label>
                Rechnung erhalten am (falls später)
                <input type="date" value={expense.invoiceReceivedDate || ""}
                  onChange={(event) => change({ invoiceReceivedDate: event.target.value })} />
              </label>
              <label className="checkLine">
                <input type="checkbox" checked={!!expense.prepayment}
                  onChange={(event) => change({ prepayment: event.target.checked })} />
                Anzahlung mit gültiger Anzahlungsrechnung (vor Leistungsende)
              </label>
            </>
          )}
          <label className="checkLine">
            <input type="checkbox" checked={isPartial}
              onChange={(event) => change(event.target.checked
                ? { payments: [{ date: expense.paymentDate || expense.date, gross: 0 }], paymentDate: "" }
                : { payments: undefined, paymentDate: "" })} />
            Teilzahlungen einzeln erfassen
          </label>
          {isPartial ? (
            <>
              {(expense.payments || []).map((payment, index) => (
                <div key={index} className="paymentInstallment">
                  <label>Bezahlt am
                    <input type="date" value={payment.date}
                      onChange={(event) => change({ payments: expense.payments!.map((item, i) => i === index ? { ...item, date: event.target.value } : item) })} />
                  </label>
                  <label>Gezahlt brutto · EUR
                    <input type="number" min="0" step="0.01" value={payment.gross}
                      onChange={(event) => change({ payments: expense.payments!.map((item, i) => i === index ? { ...item, gross: Number(event.target.value) } : item) })} />
                  </label>
                  <button type="button" className="secondaryBtn"
                    onClick={() => change({ payments: expense.payments!.filter((_, i) => i !== index) })}>Entfernen</button>
                </div>
              ))}
              <button type="button" className="secondaryBtn"
                onClick={() => change({ payments: [...(expense.payments || []), { date: expense.date, gross: 0 }] })}>
                Weitere Teilzahlung
              </button>
              <small>Rechnungsbrutto: {roundCent(expense.net + expense.vat).toFixed(2)} EUR. Nur tatsächlich bezahlte Beträge eintragen.</small>
            </>
          ) : (
            <>
              <label>Bezahlt am (vollständig)
                <input type="date" value={expense.paymentDate}
                  onChange={(event) => change({ paymentDate: event.target.value })} />
              </label>
              <label className="checkLine paymentSameDate">
                <input type="checkbox" disabled={!expense.date} checked={paymentMatchesTaxDate}
                  onChange={(event) => updateExpense(withPaymentDateMatchingTaxDate(expense, event.target.checked))} />
                Zahlungsdatum = Rechnungs-/Steuerdatum
              </label>
            </>
          )}
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
        Für KZ 060 werden Rechnung, tatsächlicher Rechnungseingang,
        gegebenenfalls Leistungsende und bezahlter Betrag berücksichtigt.
        Eine manuelle Ausgabe wird mit identischem Rechnungs- und Zahlungsdatum
        angelegt: vor der Bestätigung bitte prüfen, ob tatsächlich bezahlt wurde.
        Bei Teilzahlungen wird die Vorsteuer anteilig den Zahlungsquartalen
        zugeordnet. Eine Anzahlung vor Leistungsende benötigt einen gültigen
        Anzahlungsbeleg. Reverse Charge verwendet weiterhin das Steuerdatum.
        Bereits reduzierte Kalkül-Buchungsbeträge werden nicht nochmals gekürzt.
      </p>
      {paymentIssues.length > 0 && (
        <ul className="hint" role="alert">
          {paymentIssues.map((issue) => <li key={issue}>{issue}</li>)}
        </ul>
      )}
      <label className="checkLine">
        <input
          type="checkbox"
          disabled={
            expense.excluded ||
            expense.vatCase === "review" ||
            !expense.date ||
            expense.net <= 0 ||
            paymentIssues.length > 0
          }
          checked={expense.confirmed}
          onChange={(e) =>
            updateExpense({ ...expense, confirmed: e.target.checked })
          }
        />{" "}
        Rechnung, Zahlung(en), Steuerdatum, USt-Fall und Betriebsanteil mit dem Beleg geprüft
      </label>
    </article>
  );
}
