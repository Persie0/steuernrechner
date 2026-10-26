import Link from "next/link";
export default function Lernen() {
  return (
    <>
      <section className="subHero">
        <p className="eyebrow">Dein App-Einzelunternehmen</p>
        <h1>
          Die Regeln hinter <em>UVA und ZM</em>
        </h1>
        <p>
          Regelbesteuerung, Istbesteuerung und Einnahmen-Ausgaben-Rechnung haben
          unterschiedliche Zeitregeln.
        </p>
      </section>
      <section className="card">
        <table>
          <thead>
            <tr>
              <th>Vorgang</th>
              <th>Zuordnung</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td>EU-B2B-Dienstleistung an Google / Apple Irland</td>
              <td>
                Leistungszeitraum für die ZM; grundsätzlich kein
                österreichischer Umsatz in KZ 000. Tatsächlichen Vertragspartner
                prüfen.
              </td>
            </tr>
            <tr>
              <td>Ausländische Eingangsleistung mit RC</td>
              <td>
                Steuer in KZ 057, abzugsfähiger betrieblicher Anteil in KZ 066.
                Leistungszeitpunkt bzw. frühere bezahlte Vorauszahlung prüfen.
              </td>
            </tr>
            <tr>
              <td>Korrekte österreichische Einkaufsrechnung</td>
              <td>
                Abziehbare Vorsteuer in KZ 060. Bei deiner Istbesteuerung
                grundsätzlich auch Bezahlung erforderlich. Unrichtiger
                USt-Ausweis vermittelt keinen Vorsteuerabzug.
              </td>
            </tr>
            <tr>
              <td>Inländischer Umsatz zu 20 %</td>
              <td>
                Netto-Basis in KZ 000 und KZ 022; Ausgangsteuer = KZ 022 × 20 %.
              </td>
            </tr>
            <tr>
              <td>Appodeal Inc. / USA</td>
              <td>
                Unter dem B2B-Empfängerortmodell außerhalb der österreichischen
                UVA und ZM. Monatsguthaben, Werbeerlös und Zahlung
                unterscheiden.
              </td>
            </tr>
            <tr>
              <td>E/A-Rechnung</td>
              <td>
                Grundsätzlich Zufluss / Abfluss; Plattform-Verfügungsmacht und
                gesonderte Gebühren prüfen. Umsatz und Gebühr nicht doppelt
                berücksichtigen.
              </td>
            </tr>
          </tbody>
        </table>
      </section>
      <section className="card">
        <h2>Was der Rechner prüft</h2>
        <p>
          Er erkennt identische Dateien, trennt Apple-Finanzmonate von
          Kalenderquartalen und hält unbestätigte Ausgaben oder Umrechnungen
          offen. Fehlende Monatsrechnungen werden nicht automatisch kopiert.
          ZM-Beträge werden je UID summiert und anschließend ohne Cent
          ausgegeben.
        </p>
        <p>
          Bei Fremdwährungen wird der letzte verfügbare EZB-Kurs zum
          maßgeblichen Transaktionsdatum verwendet. Ersatzwerte von InforEuro
          sind ausschließlich Schätzungen. Für eine finale ZM sind dafür
          bestätigte EUR-Abrechnungen oder zulässige Kursbelege nötig.
        </p>
        <h2>Jährliche Aufgaben</h2>
        <p>
          E1 mit betrieblicher Beilage, U1 und Abgleich mit den
          Quartalsmeldungen; SVS, WKO, Gewinnfreibetrag und weitere Einkünfte
          separat prüfen. Die GWG-Grenze wird an den vollen Anschaffungskosten
          vor Privatanteil geprüft; nur der betriebliche Anteil ist absetzbar.
        </p>
        <Link className="primary" href="/berechnung">
          Quartal berechnen
        </Link>
      </section>
      <section className="sourceLinks">
        <a href="https://www.wko.at/steuern/reverse-charge-dienstleistungen-b2b">
          WKO Reverse Charge
        </a>
        <a href="https://www.usp.gv.at/themen/steuern-finanzen/umsatzsteuer-ueberblick/weitere-informationen-zur-umsatzsteuer/umsaetze-mit-auslandsbezug/zusammenfassende-meldung-zm.html">
          USP Zusammenfassende Meldung
        </a>
        <a href="https://www.ris.bka.gv.at/NormDokument.wxe?Abfrage=Bundesnormen&Gesetzesnummer=10004873&Paragraf=20">
          § 20 UStG · Umrechnung
        </a>
      </section>
    </>
  );
}
