import Link from "next/link";
export default function Apple() {
  return (
    <>
      <section className="platformHero appleBg">
        <div>
          <p className="eyebrow">Plattform 02</p>
          <h1>Apple App Store</h1>
          <p>
            Die FD-Reports enthalten die finalisierten Erlöse. Sales Reports
            sind nur eine zusätzliche Vergleichsmöglichkeit.
          </p>
        </div>
        <span></span>
      </section>
      <section className="card">
        <h2>Für Q2 sind deine drei FD-Dateien die Pflichtbasis</h2>
        <div className="appleMatrix">
          <div></div>
          <b>April</b>
          <b>Mai</b>
          <b>Juni</b>
          <strong>Financial Detailed</strong>
          <span>FD_…_0426.txt</span>
          <span>FD_…_0526.txt</span>
          <span>FD_…_0626.txt</span>
          <strong>Sales (optional)</strong>
          <span>S_M_…_202604.txt</span>
          <span>S_M_…_202605.txt</span>
          <span>S_M_…_202606.txt</span>
        </div>
        <p className="note">
          <code>FD_</code> ist der Financial-Detailed-Bericht und reicht als
          Apple-Basis für die Berechnung. <code>S_M_</code> ist ein anderer,
          freiwilliger Kontrollbericht. Wenn dein Download mit <code>FD_</code>{" "}
          beginnt und die Spalten <code>Transaction Date</code> sowie{" "}
          <code>Settlement Date</code> enthält, fehlt in dieser Datei nichts.
        </p>
      </section>
      <section className="twoCol">
        <article className="card">
          <h2>Optionalen Sales Report erkennen</h2>
          <ol>
            <li>
              Nicht über <b>Reports → Create Reports</b> gehen.
            </li>
            <li>
              Oben <b>Trends</b>, dann links <b>Sales and Trends Reports</b>{" "}
              öffnen.
            </li>
            <li>
              Im Bereich <b>Summary Sales Report</b> Vendor, <b>Monthly</b> und
              Zeitraum wählen.
            </li>
            <li>
              Nur eine entpackte Datei mit <code>S_M_</code> und erster Spalte{" "}
              <code>Provider</code> gehört hierher.
            </li>
          </ol>
          <pre>{`Provider\tProvider Country\tSKU\tUnits\tDeveloper Proceeds\tBegin Date\tEnd Date\tCountry Code\tCurrency of Proceeds\nAPPLE\tUS\tmy-app\t1\t2.37\t06/01/2026\t06/30/2026\tDE\tEUR`}</pre>
        </article>
        <article className="card">
          <h2>Financial Report finden</h2>
          <img
            className="guideImage"
            src="/guides/apple-reports.jpg"
            alt="Apple Payments and Financial Reports"
          />
          <ol>
            <li>
              <b>Reports</b> in App Store Connect öffnen.
            </li>
            <li>
              <b>Create Reports</b> wählen.
            </li>
            <li>
              <b>All Countries or Regions (Detailed)</b> auswählen.
            </li>
            <li>
              Fiskalmonat erstellen, GZIP entpacken und die <code>FD_…txt</code>{" "}
              laden.
            </li>
          </ol>
          <p>
            Eine FD-Datei beginnt nach Vendor Name, Start Date und End Date mit{" "}
            <code>Transaction Date</code> und <code>Settlement Date</code>.
          </p>
        </article>
      </section>
      <section className="card">
        <div className="sectionTitle">
          <span>01</span>
          <div>
            <h2>Welcher Bericht zählt?</h2>
          </div>
        </div>
        <div className="compare">
          <article>
            <b>Summary Sales (S_M_) – optional</b>
            <p>
              Enthält geschätzte beziehungsweise schnelle
              Sales-and-Trends-Daten. Dient nur als Monats- und
              Plausibilitätskontrolle und wird nicht zusätzlich zur
              Financial-Summe gerechnet.
            </p>
          </article>
          <article>
            <b>Financial Detailed (FD_) – maßgeblich</b>
            <p>
              Enthält finalisierte Transaktionen mit Transaction Date,
              Settlement Date, Country of Sale und Partner Share. Daraus
              berechnet die Website die automatische Apple-ZM-Zwischensumme.
            </p>
          </article>
        </div>
        <p>
          Apple weist selbst darauf hin, dass Sales and Trends und Payments and
          Financial Reports wegen Verarbeitung und Wechselkursen voneinander
          abweichen können. Deshalb ist S_M_ hier keine Pflichtdatei.
        </p>
      </section>
      <section className="card">
        <div className="sectionTitle">
          <span>02</span>
          <div>
            <h2>Konkrete Apple-ZM-Rechnung</h2>
          </div>
        </div>
        <div className="formulaSteps">
          <div>
            <b>1</b>
            <span>
              <strong>Financial-Datei</strong>
              <code>FD_… → Berichtsmonat und Partner Share prüfen</code>
            </span>
          </div>
          <div>
            <b>2</b>
            <span>
              <strong>Land/Entity</strong>
              <code>
                Country of Sale → vollständige offizielle Zuordnung zu allen
                sieben Apple-Vertragspartnern
              </code>
            </span>
          </div>
          <div>
            <b>3</b>
            <span>
              <strong>Erlös</strong>
              <code>
                Extended Partner Share; Returns negativ; jede Währung in EUR
              </code>
            </span>
          </div>
          <div>
            <b>4</b>
            <span>
              <strong>ZM</strong>
              <code>
                Σ finalisierte ADI-Erlöse → IE9700053D → sonstige Leistung
              </code>
            </span>
          </div>
        </div>
        <div className="callout">
          <b>Aktuelle Automatik</b>
          <span>
            Die Website ordnet alle derzeit von Apple veröffentlichten
            Storefront-Länder einem der sieben Vertragspartner zu. Nur Apple
            Distribution International in Irland fließt in die österreichische
            ZM; die sechs anderen Entities werden getrennt als nicht ZM
            ausgewiesen. Für Währungen ohne EZB-Referenzkurs wird der offizielle
            Monatskurs der Europäischen Kommission (InforEuro) verwendet. Neue
            unbekannte Ländercodes werden sichtbar zur Prüfung markiert und
            niemals still verworfen.
          </span>
        </div>
      </section>
      <section className="sourceLinks">
        <a
          href="https://developer.apple.com/support/downloads/terms/exhibits/Exhibits-to-Schedule-2-and-3-English.pdf"
          target="_blank"
          rel="noreferrer"
        >
          Apple: offizielle Vertragspartner-Länder ↗
        </a>
        <a
          href="https://developer.apple.com/help/app-store-connect/reference/reporting/financial-report-fields/"
          target="_blank"
          rel="noreferrer"
        >
          Apple: Financial Report Fields ↗
        </a>
        <a
          href="https://developer.apple.com/help/app-store-connect/getting-paid/download-financial-reports/"
          target="_blank"
          rel="noreferrer"
        >
          Apple: Financial Reports ↗
        </a>
        <a
          href="https://www.ris.bka.gv.at/NormDokument.wxe?Abfrage=Bundesnormen&amp;Gesetzesnummer=10004873&amp;Paragraf=20"
          target="_blank"
          rel="noreferrer"
        >
          RIS: § 20 UStG ↗
        </a>
      </section>
      <section className="nextCard">
        <div>
          <b>Nächster Schritt</b>
          <h2>Appodeal ist kein App-Store-Verkauf</h2>
        </div>
        <Link className="primary" href="/appodeal">
          Appodeal verstehen
        </Link>
      </section>
    </>
  );
}
