import Link from "next/link";
export default function Lernen() {
  return (
    <>
      <section className="subHero">
        <p className="eyebrow">Lernbereich & Quellen</p>
        <h1>
          Die Steuerlogik <em>hinter den Zahlen</em>
        </h1>
        <p>
          Vom tatsächlichen Verkauf bis zur österreichischen UVA und ZM –
          speziell für einen österreichischen, regelbesteuerten App-Entwickler
          mit UID.
        </p>
      </section>
      <section className="lessonNav">
        <a href="#kette">Leistungskette</a>
        <a href="#ort">Leistungsort</a>
        <a href="#mor">Merchant of Record</a>
        <a href="#rc">Reverse Charge</a>
        <a href="#meldungen">UVA & ZM</a>
        <a href="#q2">Q2-Fall</a>
        <a href="#quellen">Quellen</a>
      </section>
      <section className="lesson" id="kette">
        <span className="lessonNo">01</span>
        <div>
          <h2>Nicht die Bankzahlung ist der Umsatz</h2>
          <p>
            Eine Auszahlung ist nur der Saldo aus Verkäufen, Rückerstattungen,
            Plattformgebühren, Quellensteuern und eventuell vorgetragenen
            Beträgen. Umsatzsteuerlich muss jede Leistung getrennt betrachtet
            werden.
          </p>
          <div className="flow">
            <div>
              <b>Endkunde</b>
              <span>kauft App/IAP</span>
            </div>
            <i>→</i>
            <div>
              <b>Plattform</b>
              <span>Google/Apple als Händler</span>
            </div>
            <i>→</i>
            <div>
              <b>Du</b>
              <span>erhältst Erlös abzüglich Gebühren</span>
            </div>
          </div>
          <div className="theory">
            <b>Warum?</b>
            <p>
              Die Umsatzsteuer knüpft an eine Lieferung oder sonstige Leistung
              an – nicht daran, wann Geld am Bankkonto ankommt. Deshalb zählt
              der Leistungs-/Berichtszeitraum April bis Juni, nicht das spätere
              Auszahlungsdatum.
            </p>
          </div>
        </div>
      </section>
      <section className="lesson" id="ort">
        <span className="lessonNo">02</span>
        <div>
          <h2>Leistungsort bei B2B-Dienstleistungen</h2>
          <p>
            Bei einer sonstigen Leistung an einen Unternehmer liegt der
            Leistungsort grundsätzlich dort, wo der Leistungsempfänger sein
            Unternehmen betreibt. Leistest du an Google Commerce Limited oder
            Apple Distribution International in Irland, liegt der Umsatz daher
            nicht in Österreich.
          </p>
          <div className="formula">
            <span>Österreichischer Entwickler</span>
            <b>→ B2B-Dienstleistung →</b>
            <span>Irisches Unternehmen</span>
            <strong>Leistungsort: Irland</strong>
          </div>
          <ul>
            <li>
              Keine österreichische Umsatzsteuer auf deine Ausgangsleistung.
            </li>
            <li>
              Umsatz grundsätzlich nicht in KZ000 der österreichischen UVA.
            </li>
            <li>
              Aber Meldung in der ZM mit irischer UID und „sonstige Leistung“.
            </li>
          </ul>
        </div>
      </section>
      <section className="lesson" id="mor">
        <span className="lessonNo">03</span>
        <div>
          <h2>Merchant of Record entscheidet die Kette</h2>
          <p>
            Merchant of Record (MoR) ist das Unternehmen, das gegenüber dem
            Endkunden als Verkäufer auftritt, die Zahlung verarbeitet und
            typischerweise die Endkunden-Umsatzsteuer abführt.
          </p>
          <div className="compare">
            <article>
              <b>Google/Apple ist MoR</b>
              <p>
                Du leistest umsatzsteuerlich an die Plattform. Für die irische
                Entity entsteht eine ZM-Leistung.
              </p>
            </article>
            <article>
              <b>Du bist selbst MoR</b>
              <p>
                Du verkaufst direkt an Endkunden. Dann können lokale B2C-Regeln
                beziehungsweise OSS relevant werden.
              </p>
            </article>
          </div>
          <p className="note">
            Darum wird nicht einfach jedes Käuferland als eigener Umsatz
            behandelt. Die Länder- und Entity-Zuordnung aus den Detailberichten
            ist entscheidend.
          </p>
        </div>
      </section>
      <section className="lesson" id="rc">
        <span className="lessonNo">04</span>
        <div>
          <h2>Reverse Charge bei eingekauften Leistungen</h2>
          <p>
            Berechnet dir ein ausländischer Unternehmer eine Plattform-, Cloud-
            oder Softwaregebühr ohne österreichische USt, geht die Steuerschuld
            in Österreich häufig auf dich über.
          </p>
          <div className="formula vertical">
            <code>Netto-Gebühr × 20 % = KZ057</code>
            <code>abzugsfähiger Nettoanteil × 20 % = KZ066</code>
          </div>
          <p>
            Bei 100 € vollständig betrieblicher Gebühr entstehen 20 € in KZ057
            und gleichzeitig 20 € Vorsteuer in KZ066. Zahllast-Effekt: 0 €. Bei
            50 % Privatanteil bleiben KZ057 20 €, aber KZ066 beträgt nur 10 €.
          </p>
          <div className="workedMini">
            <span>100 € netto</span>
            <span>+20 € KZ057</span>
            <span>−20 € KZ066</span>
            <b>= 0 € Effekt</b>
          </div>
        </div>
      </section>
      <section className="lesson" id="meldungen">
        <span className="lessonNo">05</span>
        <div>
          <h2>UVA und ZM erfüllen verschiedene Aufgaben</h2>
          <div className="compare">
            <article>
              <b>UVA · U30</b>
              <p>
                Berechnet österreichische Umsatzsteuer, Reverse-Charge-Steuer
                und Vorsteuer. Wichtige Felder hier: KZ000, KZ057, KZ060 und
                KZ066.
              </p>
            </article>
            <article>
              <b>ZM · U13</b>
              <p>
                Meldet B2B-Leistungen an Unternehmer in anderen
                EU-Mitgliedstaaten, je UID und Zeitraum. Für dich vor allem
                Google und Apple in Irland.
              </p>
            </article>
          </div>
          <p>
            Die ZM-Bemessungsgrundlage wird im XML in ganzen Euro übermittelt.
            Die Website bewahrt den Centbetrag im Prüfbericht auf und schneidet
            für das XML auf ganze Euro ab.
          </p>
          <div className="callout">
            <b>Merksatz</b>
            <span>
              Eigene Leistung an EU-Plattform → ZM. Ausländische Gebühr an dich
              → Reverse Charge in der UVA. Inländische Vorsteuer → KZ060.
            </span>
          </div>
        </div>
      </section>
      <section className="lesson" id="q2">
        <span className="lessonNo">06</span>
        <div>
          <h2>Der konkrete Q2-2026-Kontrollfall</h2>
          <p>
            Die vorbefüllten Werte sind kein allgemeines Muster, sondern der aus
            deinen April-, Mai- und Juni-Unterlagen rekonstruierte
            Kontrollstand. Der Assistent hält exakte Centbeträge und die davon
            abweichenden XML-Werte getrennt.
          </p>
          <div className="q2Case">
            <article>
              <b>UVA · U30</b>
              <dl>
                <div>
                  <dt>KZ000</dt>
                  <dd>0,00 €</dd>
                </div>
                <div>
                  <dt>KZ057</dt>
                  <dd>28,93 €</dd>
                </div>
                <div>
                  <dt>KZ060</dt>
                  <dd>101,20 €</dd>
                </div>
                <div>
                  <dt>KZ066</dt>
                  <dd>27,40 €</dd>
                </div>
                <div className="total">
                  <dt>KZ095 Kontrolle</dt>
                  <dd>−99,67 € Gutschrift</dd>
                </div>
              </dl>
            </article>
            <article>
              <b>ZM · U13</b>
              <dl>
                <div>
                  <dt>Google · IE9825613N</dt>
                  <dd>602,12 € → 602 €</dd>
                </div>
                <div>
                  <dt>Apple · IE9700053D</dt>
                  <dd>ca. 111,41 € → 111 €</dd>
                </div>
                <div className="total">
                  <dt>Gesamt</dt>
                  <dd>ca. 713,53 € → 713 €</dd>
                </div>
              </dl>
            </article>
          </div>
          <div className="theory">
            <b>Was steckt in den UVA-Zahlen?</b>
            <p>
              KZ057 enthält 21,26 € Reverse-Charge-Steuer aus
              Google-Ireland-Gebühren und 7,67 € aus OpenAI. KZ060 enthält 84,70
              € Vorsteuer aus dem betrieblichen MacBook-Anteil und 16,50 € aus
              dem Apple Developer Program – letzteres nur unter der
              Voraussetzung einer formal richtigen Rechnung mit österreichischer
              USt. KZ066 besteht aus 21,26 € Google-RC-Vorsteuer und 6,14 €
              abzugsfähigem OpenAI-Anteil.
            </p>
          </div>
          <p className="note">
            <b>Kontrollpunkt:</b> Der Apple-Wert wird aus allen Ländern mit
            Apple Distribution International als Vertragspartner neu berechnet.
            Verfügbare Fremdwährungen nutzen den letzten veröffentlichten
            EZB-Referenzkurs zum Monatsende; AED, SAR, TWD und andere Währungen
            ohne EZB-Referenzkurs nutzen den offiziellen Monatskurs der
            Europäischen Kommission (InforEuro). Appodeal ist bei der hier
            verwendeten US-Drittlandskonfiguration weder UVA- noch ZM-Wert.
          </p>
        </div>
      </section>
      <section className="lesson" id="quellen">
        <span className="lessonNo">07</span>
        <div>
          <h2>Primärquellen und was sie belegen</h2>
          <p>
            Die Links führen bewusst zu BMF, USP, RIS sowie den offiziellen
            Plattform-Dokumentationen. Die Website trennt gesetzliche Regeln von
            der fallbezogenen Auswertung deiner Reports.
          </p>
          <div className="sourceLibrary">
            <a
              href="https://www.bmf.gv.at/services/finanzonline/informationen-fuer-softwarehersteller/softwarehersteller-erklarungen-und-antraege.html"
              target="_blank"
              rel="noreferrer"
            >
              <b>BMF · XML-Strukturen U30/U13</b>
              <span>
                Technische FinanzOnline-Strukturen; Q2/2026 nutzt U30 „ab
                01/2022“, ab Q3/2026 schaltet der Generator auf „ab 07/2026“.
              </span>
            </a>
            <a
              href="https://www.bmf.gv.at/services/finanzonline/informationen-fuer-softwarehersteller/datenstromuebermittlung.html"
              target="_blank"
              rel="noreferrer"
            >
              <b>BMF · Datenstromübermittlung</b>
              <span>
                Technischer Ablauf, Test-/Produktionsübermittlung und
                Rückmeldungen.
              </span>
            </a>
            <a
              href="https://www.usp.gv.at/themen/steuern-finanzen/umsatzsteuer-ueberblick/weitere-informationen-zur-umsatzsteuer/umsaetze-mit-auslandsbezug/zusammenfassende-meldung-zm.html"
              target="_blank"
              rel="noreferrer"
            >
              <b>USP · Zusammenfassende Meldung</b>
              <span>
                Inhalt, elektronische Abgabe und Frist bis Ende des Folgemonats.
              </span>
            </a>
            <a
              href="https://www.usp.gv.at/themen/steuern-finanzen/umsatzsteuer-ueberblick/weitere-informationen-zur-umsatzsteuer/umsaetze-mit-auslandsbezug/grenzueberschreitende-dienstleistungen.html"
              target="_blank"
              rel="noreferrer"
            >
              <b>USP · Grenzüberschreitende Dienstleistungen</b>
              <span>
                B2B-Empfängerort, Reverse Charge und ZM für sonstige Leistungen.
              </span>
            </a>
            <a
              href="https://findok.bmf.gv.at/findok/volltext%28suche%3ABFG-Suche%29?dokumentId=63884245-6936-4f11-9f99-e166c14a9c92"
              target="_blank"
              rel="noreferrer"
            >
              <b>BMF Findok · UStR 2000</b>
              <span>
                ZM nur in ganzen Euro; Centbeträge werden weggelassen und nicht
                gerundet.
              </span>
            </a>
            <a
              href="https://www.ris.bka.gv.at/NormDokument.wxe?Abfrage=Bundesnormen&Gesetzesnummer=10004873&Paragraf=3a"
              target="_blank"
              rel="noreferrer"
            >
              <b>RIS · § 3a UStG</b>
              <span>
                Gesetzliche Grundlage für den Leistungsort sonstiger Leistungen.
              </span>
            </a>
            <a
              href="https://support.google.com/googleplay/android-developer/answer/6135870"
              target="_blank"
              rel="noreferrer"
            >
              <b>Google Play · Finanzberichte</b>
              <span>
                Offizielle Beschreibung der verfügbaren Earnings- und
                Auszahlungsberichte.
              </span>
            </a>
            <a
              href="https://developer.apple.com/help/app-store-connect/getting-paid/view-financial-reports/"
              target="_blank"
              rel="noreferrer"
            >
              <b>Apple · Financial Reports</b>
              <span>
                Offizielle Reportlogik und fiskalische Berichtszeiträume.
              </span>
            </a>
          </div>
          <p className="sourceStamp">
            Quellenstand: 23.07.2026 · Rechen- und Lernhilfe, keine
            Steuerberatung.
          </p>
        </div>
      </section>
      <section className="nextCard">
        <div>
          <b>Nächster Schritt</b>
          <h2>Uploads und Berechnung in einem Ablauf starten</h2>
        </div>
        <Link className="primary" href="/berechnung">
          Zum Berechnungsassistenten
        </Link>
      </section>
    </>
  );
}
