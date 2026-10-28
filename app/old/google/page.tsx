import Link from "next/link";
export default function Google() {
  return (
    <>
      <section className="subHero">
        <p className="eyebrow">Import-Hilfe</p>
        <h1>
          Google Play <em>richtig zuordnen</em>
        </h1>
        <p>
          Für das gewählte Quartal die drei Earnings-CSV-Dateien laden. Jeweils
          „Amount (Merchant Currency)“ in EUR verwenden; Käuferwährungen nicht
          nochmals umrechnen.
        </p>
      </section>
      <section className="card">
        <h2>Zwei verschiedene Leistungsbeziehungen</h2>
        <table>
          <thead>
            <tr>
              <th>Teil</th>
              <th>Berechnung im regionalen Standardmodell</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td>Wiederverkaufsgebiete / GCL</td>
              <td>
                Charges + Charge refunds + Google fee + Google fee refund
                ergeben den Erlös nach Marge für die ZM an IE9825613N.
              </td>
            </tr>
            <tr>
              <td>Separat bezogene Google-Dienste außerhalb dieser Gebiete</td>
              <td>
                −(Google fee + Google fee refund) ergibt die mögliche RC-Basis;
                20 % Steuer in KZ 057 und betrieblicher Vorsteuerabzug in KZ
                066.
              </td>
            </tr>
            <tr>
              <td>Gebühren-PDFs</td>
              <td>
                Vertragspartner, Betrag und Leistungszeitraum abgleichen; nicht
                ein zweites Mal auf die bereits berücksichtigten
                Earnings-Gebühren addieren.
              </td>
            </tr>
            <tr>
              <td>Tax / IRRF / CIDE / Auszahlung</td>
              <td>
                Separater Steuer- und Zahlungsabgleich. Keine automatische
                österreichische Vorsteuer und keine zusätzliche ZM.
              </td>
            </tr>
          </tbody>
        </table>
        <p className="callout">
          Dieses Modell muss zu den für den Zeitraum gültigen Verträgen passen.
          Die auszahlende Bankgesellschaft, das Käuferland und die reine
          Inkassofunktion beweisen den steuerlichen Leistungsempfänger nicht
          allein. Alternative Abrechnung oder Direktverkäufe separat prüfen.
        </p>
      </section>
      <section className="card">
        <h2>Quelle und Belegabgleich</h2>
        <p>
          <a href="https://play.google/developer-distribution-agreement.html">
            Google Developer Distribution Agreement
          </a>{" "}
          ·{" "}
          <a href="https://support.google.com/googleplay/android-developer/answer/7645364">
            Google-Wiederverkaufsgebiete
          </a>{" "}
          ·{" "}
          <a href="https://www.wko.at/steuern/reverse-charge-dienstleistungen-b2b">
            WKO: RC und Kennzahlen
          </a>
        </p>
        <Link className="primary" href="/berechnung">
          Zum Quartalsdurchlauf
        </Link>
      </section>
    </>
  );
}
