# Quartalsleitfaden: UVA und ZM für App-Plattformen

**Arbeitsstand: 28. Oktober 2026 · Österreich**

Dieser Leitfaden dokumentiert den bisherigen Arbeitsstand und beschreibt, wie ich mit meinen Unterlagen und dem Steuernrechner künftig eine Umsatzsteuervoranmeldung (UVA) und gegebenenfalls eine Zusammenfassende Meldung (ZM) vorbereite. Persönliche Finanzdaten, Steuernummern und Einreichungsdateien gehören nicht in dieses öffentliche Repository.

**Wichtig für mich und jede später helfende Person:** Aus einer plausiblen Rechnung wird noch keine bestätigte Steuererklärung. Den tatsächlichen Leistungsort, Vertragspartner, Zeitraum, Betriebsanteil, Wechselkurs und die Vollständigkeit anhand der jeweiligen Belege überprüfen. Offene Punkte nicht als geklärt markieren und keine fehlenden Rechnungen oder Umsätze erfinden. Vor einer späteren Abgabe die aktuellen Regeln und Formate erneut prüfen.

## 1. Mein bisheriges Profil und die Grenzen dieses Leitfadens

Der bisherige Arbeitsstand geht von Folgendem aus:

- Österreichisches Einzelunternehmen mit Apps; gewöhnliches Store-Billing über Google Play und Apple, keine separat bestätigten alternativen Direktverkäufe.
- Regelbesteuerung mit Vorsteuerabzug; in den bisherigen Berechnungen Istbesteuerung und vierteljährliche UVA und ZM. Das muss zum eigenen steuerlichen Status und zum jeweiligen Jahr passen.
- Einnahmequellen: Google Play, Apple App Store und gegebenenfalls Appodeal. Die tatsächlichen Verträge und Abrechnungen bestimmen, wer mein Vertragspartner ist; eine Zahlung allein beweist das nicht.
- Geschäfts- und Privatnutzung einzelner Ausgaben können unterschiedlich sein. Den tatsächlichen Betriebsanteil je Beleg prüfen und dokumentieren.
- Meine Website: <https://steuernrechner.vercel.app/berechnung>. Sie ist eine Berechnungs- und Dokumentationshilfe und übermittelt nichts selbstständig an FinanzOnline.

Ändert sich etwas Wesentliches, beispielsweise Vorjahresumsatz, Rechtsform, Regelbesteuerung, Leistungsart, Wohnsitz, OSS, direkter Verkauf, ein neues Store-Billing-Modell, Vertragspartner oder Umsatzsteuersatz, muss der Ablauf und das Ergebnis neu geprüft werden. Die Website behandelt nicht automatisch jeden denkbaren Steuerfall.

### Die wichtigsten Begriffe

| Begriff | Was ich damit meine |
|---|---|
| UVA / U30 | Meldung meiner österreichischen Umsatzsteuer und Vorsteuer für einen Voranmeldungszeitraum. Sie kann eine Zahllast oder ein Guthaben ergeben. |
| ZM / U13 | Meldung bestimmter Leistungen an Unternehmen in anderen EU-Mitgliedstaaten, aufgeschlüsselt nach deren UID. Die gemeldete Summe ist **keine Steuerzahlung**. |
| KZ 000 | Bemessungsgrundlage für im Inland steuerbare Umsätze; nicht einfach sämtliche Einnahmen. |
| KZ 057 | Steuerbetrag für bestimmte auf mich übergehende Steuerschulden, insbesondere Reverse Charge. Es ist die Steuer, nicht der Netto-Rechnungsbetrag. |
| KZ 060 | Soweit berechtigt: inländische Vorsteuer, zum Beispiel korrekt ausgewiesene österreichische USt auf einer Rechnung. |
| KZ 066 | Soweit berechtigt: Vorsteuer aus der korrespondierenden Reverse-Charge-Steuer. |
| ZM-UID | UID des tatsächlichen Leistungsempfängers für die jeweilige Leistung, nicht meine eigene UID und nicht automatisch die UID des Zahlungsdienstleisters. |
| Steuerdatum im Rechner | Datum, nach dem diese konkrete Ausgabe im Rechner einem Quartal zugeordnet wird. Es ist bewusst zu prüfen; es ist nicht automatisch das Rechnungsdatum. |
| Leistungsende | Datum, bis zu dem eine konkret abgrenzbare Leistung reicht, soweit bekannt und für diesen Sachverhalt sinnvoll. |
| Bezahlt am | Tatsächliches Zahlungsdatum anhand meiner Aufzeichnungen, nicht automatisch das Fälligkeitsdatum. |
| XSD | Technische Formvorgabe für ein XML. Eine bestandene XSD-Prüfung beweist nicht, dass steuerliche Angaben richtig oder bei FinanzOnline eingebracht sind. |

Für die ZM ist bei sonstigen Leistungen grundsätzlich der maßgebliche Leistungszeitpunkt relevant, auch wenn ich meine übrigen Umsätze nach Istbesteuerung versteuere; bei bereits erfassten Anzahlungen gelten Besonderheiten. Zeitpunkt und Teilbarkeit bei Abos sowie der Vertrag mit der Plattform müssen im Einzelfall passen. Quelle: [BMF: ZM bei Istbesteuerung](https://findok.bmf.gv.at/findok/resources/pdf/14cf1f83-db85-46f5-a64d-190e1a29a664/45907.1.1.0.pdf).

## 2. Persönliche Quartalswerte

Die konkreten Quartalswerte, Abrechnungen, Steuerkennzeichen und Protokolle gehören in die geschützte persönliche Dokumentation und nicht in dieses öffentliche Repository. Den tatsächlichen Abgabestand und offene Berichtigungen anhand dieser Unterlagen prüfen.

## 3. Fristen für weitere Quartale

Bei vierteljährlicher Meldung sind dies die **grundsätzlichen** Termine vor einer möglichen Verschiebung durch Wochenende oder Feiertag:

| Zeitraum | ZM: Ende des Folgemonats | UVA und Zahlung: 15. des zweitfolgenden Monats |
|---|---|---|
| Q1, Jänner–März | 30. April | 15. Mai |
| Q2, April–Juni | 31. Juli | 15. August |
| Q3, Juli–September | 31. Oktober | 15. November |
| Q4, Oktober–Dezember | 31. Jänner des Folgejahres | 15. Februar des Folgejahres |

Für 2026/Anfang 2027 ergibt das nach dem allgemeinen Wochenendkalender:

| Zeitraum | ZM | UVA und Zahlung |
|---|---|---|
| Q1/2026 | 30.04.2026 | 15.05.2026 |
| Q2/2026 | 31.07.2026 | 17.08.2026 |
| Q3/2026 | 02.11.2026 | 16.11.2026 |
| Q4/2026 | 01.02.2027 | 15.02.2027 |

Fristen, die auf Wochenenden oder relevante gesetzliche Feiertage fallen, können sich verschieben; den konkreten Termin und meinen tatsächlichen Meldezeitraum jeweils überprüfen. Bei einem Vorjahresumsatz über der aktuell maßgeblichen Grenze kann eine monatliche statt vierteljährliche UVA gelten. Die ZM-Periodizität separat prüfen. Quellen: [USP: UVA](https://www.usp.gv.at/themen/steuern-finanzen/umsatzsteuer-ueberblick/umsatzsteuervoranmeldung-und-umsatzsteuererklaerung.html), [USP: ZM](https://www.usp.gv.at/themen/steuern-finanzen/umsatzsteuer-ueberblick/weitere-informationen-zur-umsatzsteuer/umsaetze-mit-auslandsbezug/zusammenfassende-meldung-zm.html), [BMF: Fristen](https://www.bmf.gv.at/themen/steuern/fristen-verfahren/fristen-faelligkeiten.html).

Die Jahreserklärungen, Einkommensteuer-Vorauszahlungen und SVS sind eigenständige Themen; sie werden durch diese Quartalsdateien nicht erledigt.

## 4. Was ich pro neuem Quartal sammle

Ich lege einen Quartalsordner an und sammle die Originale. Dateinamen dürfen sich ändern; für die Prüfung zählen Inhalt und Zeitraum.

1. **Google:** Die drei tatsächlichen monatlichen Earnings-Berichte des Quartals, inklusive zusätzlicher Korrektur- oder Adjustment-Berichte, falls Google solche ausstellt. Die Gebührenrechnungen und Auszahlungsnachweise zusätzlich für den Abgleich aufbewahren.
2. **Apple:** Alle Financial-Detailed-FD-Berichte, deren Apple-Finanzperioden das Kalenderquartal schneiden, einschließlich des Folge-Berichts, wenn erst dieser die letzten Kalendertage abdeckt. Bei später Verfügbarkeit zusätzlich Tagesberichte und, falls hilfreich, Monats-Summary-Sales-Berichte zum Abgleich sichern.
3. **Appodeal:** Vorhandene Monatsreports, Abrechnungen und Auszahlungsnachweise; Vertragspartner anhand des Vertrags/Belegs prüfen.
4. **Ausgaben:** Originalrechnungen und Quittungen, Zahlungsnachweise, SVS-/WKO-Vorschreibungen, bei Bedarf mein vollständiger Jahres-ZIP-Ordner und der Kalkül-Ausgabenexport. Nur tatsächlich vorhandene Belege verwenden.
5. **Wechselkurse:** Für nicht in EUR vorliegende maßgebliche Werte den Kurs, Tag, Währungspaar, Quelle und Beleg dokumentieren; die rechtliche Anwendbarkeit und das passende Umrechnungsdatum prüfen.
6. **Frühere Meldungen:** Letzte XML-Dateien, das positive Produktionsprotokoll und meine Berechnungsnotiz – besonders wichtig, wenn später eine Berichtigung erforderlich sein könnte.

Nicht erforderlich ist, private API-Schlüssel oder Passwörter in den Chat, in die Ausgaben-JSON oder in eine XML-Steuererklärung zu kopieren.

## 5. Auf der Website: ein vollständiger Quartalsdurchlauf

Die folgenden Bezeichnungen beschreiben den Stand der Website am 28.10.2026 und können sich nach späteren Änderungen ändern.

### Schritt 1: Zeitraum und Quellen

1. <https://steuernrechner.vercel.app/berechnung> öffnen.
2. Jahr und Kalenderquartal einstellen. Beispiel Q3/2026: 01.07.–30.09.2026.
3. Bei „Welche Einnahmequellen waren aktiv?“ Google Play und Apple App Store nur auswählen, soweit sie im jeweiligen Quartal tatsächlich relevant waren. Appodeal wird separat unter `/appodeal` verwaltet.
4. Wenn ich das Quartal wechsle, sicherstellen, dass ich vor Import, Kontrolle und Export noch das gewünschte Quartal sehe.

### Schritt 2: Apple und Google per Knopfdruck abrufen

1. „2 · Belege“ öffnen.
2. Unter „Apple und Google abrufen“ die Zugänge einmalig hinterlegen, falls sie in diesem Browser nicht bereits gespeichert sind.
3. **Apple:** Issuer-ID, Key-ID, Vendor-Nummer und privaten Team-API-Schlüssel `.p8` eingeben bzw. auswählen. Die Berechtigung für Finanzberichte muss passen. Der Zugang kann lokal im Browser gespeichert werden. [Apple: App Store Connect API](https://developer.apple.com/help/app-store-connect/get-started/app-store-connect-api/).
4. **Google:** Die Cloud-Storage-URI aus Play Console → Berichte herunterladen → Finanzen und den passenden Service-Account-Schlüssel als `.json` auswählen. Für den Service Account die nötigen Play-Console-Berechtigungen prüfen. Bucket-Bezeichnungen können `pubsite_prod_…` oder `pubsite_prod_rev_…` sein. Beispiel einer Berichtstruktur: `gs://BUCKET/earnings/earnings_YYYYMM_BERICHTSNUMMER.zip`; meinen tatsächlichen Pfad aus der Konsole kopieren, nicht diese Platzhalter verwenden. [Google: Berichte herunterladen](https://support.google.com/googleplay/android-developer/answer/6135870?hl=de).
5. „Apple und Google für Q… abrufen“ drücken. Der kombinierte Knopf setzt beide vollständigen Zugänge voraus; sonst den Einzelabruf im jeweiligen Abschnitt verwenden. **Nichts startet allein durch das Öffnen der Seite.**
6. Fortschritt und Importmeldungen abwarten. „Import abgeschlossen“ bedeutet, dass der technische Import verarbeitet wurde, nicht, dass alle erwarteten Berichte vorliegen oder deren Steuerbehandlung bestätigt ist.
7. Für Google prüfen, ob alle drei Monate und gegebenenfalls zusätzlich ausgewiesene Anpassungen vorhanden sind. Für Apple die durch die FD-Dateien tatsächlich abgedeckten **Kalendertage**, nicht nur die Anzahl der Dateien, prüfen.
8. Bei Fehlern die konkrete Fehlermeldung lesen. „Nicht vorhanden oder noch nicht verfügbar“ bedeutet nicht automatisch falsche Zugangsdaten. Zuerst Datum und Dateiverfügbarkeit prüfen, dann bei Bedarf manuell in der jeweiligen Konsole herunterladen.
9. Der „Debug-ZIP“-Knopf sichert empfangene Dateien und ein Sitzungsprotokoll. Diese ZIP kann sensible Finanzdaten enthalten. Laut Website werden Schlüssel, Tokens und Anmeldeantworten nicht protokolliert; die Datei trotzdem vertraulich behandeln und ihren Inhalt vor Weitergabe prüfen.

Bei einem Abruf werden Berichte und Berechtigungsdaten beziehungsweise Tokens über den Server weitergeleitet; sie liegen nicht ausschließlich während jedes Netzwerkschritts im eigenen Browser. Die Website beschreibt die Speicherung der Zugänge im Browser. Wer Zugriff auf dieses Browserprofil hat, kann gespeicherte Zugangsdaten möglicherweise auslesen.

### Schritt 2: Manuell importieren

1. Berichte oder Originale als ZIP bzw. einzelne unterstützte Dateien auswählen oder in die Ablage ziehen.
2. Ein manuell von Apple heruntergeladenes `.txt.gz` bei Bedarf zuerst entpacken und die enthaltene `.txt` hochladen. Der direkte API-Abruf entpackt Apple-Berichte; für einen manuellen `.gz`-Upload nicht voraussetzen, dass er als TXT verarbeitet wird.
3. Apple-Dateien `FD_…` sind Financial Detailed. Dateien `S_D_…` sind Tages-Summary-Sales; `S_M_…` sind Monats-Summary-Sales.
4. Importmeldungen lesen: „identischer Inhalt bereits vorhanden“ heißt, dass eine Byte-Kopie nicht doppelt gespeichert werden soll. Zwei unterschiedliche Dateien mit demselben Zeitraum können trotzdem überlappen oder eine echte zusätzliche Korrektur enthalten; ihren Inhalt prüfen.
5. Google kann bei Korrekturen zusätzliche Earnings-Dateien erzeugen, die nur Anpassungen enthalten. Nicht pauschal beide addieren oder eine löschen, bevor klar ist, ob sie Ersatz oder Ergänzung ist. Bei einer Website-Warnung über mehrere Berichte denselben Zeitraum anhand der Inhalte und Google-Mitteilung auflösen.
6. Appodeal-Berichte und die Statistik-Funktion sind separat unter `/appodeal` erreichbar. Ein Statistik-Abruf ersetzt nicht automatisch eine Abrechnung oder Bankbewegung. Jahres-ZIP-Dateien können trotzdem Appodeal-Originale enthalten.
7. Optional „gespeicherte Originale anzeigen“ und zugehörige Dateien herunterladen. Ein Dateiname allein ist kein Nachweis für eine richtige steuerliche Quartalszuordnung.

### Schritt 3: Ausgaben aus JSON und Originalbelegen

1. „3 · Ausgaben“ öffnen.
2. Für jedes Quartal meine echten Belege sammeln. Ich kann sie einem Assistenten zusammen mit einem aktualisierten Jahres-ZIP geben und ihn um eine **Ausgaben-JSON** bitten; diese JSON enthält keine API-Zugänge und keine erfundenen Belege.
3. „ZIP mit Originalbelegen hochladen“ verwenden, wenn mein ZIP die Belege in passenden `Expenses`-, `WKO`- oder `SVS`-Ordnern enthält. Die aktuelle Funktion findet in diesen Ordnern PDF- und gängige Bilddateien. Werden Belege nicht gefunden, einzelne Dateien in Schritt 2 importieren und anschließend manuell zuordnen.
4. Die JSON unter „Ausgaben-JSON hochladen“ auswählen oder den JSON-Inhalt einfügen und „JSON importieren“ drücken.
5. Bei jedem Eintrag „Originalbeleg zuordnen“ kontrollieren; bei eindeutiger Namensübereinstimmung kann die Zuordnung automatisch erfolgen. Doppelte Dateinamen oder unklare Treffer manuell auflösen.
6. Je Ausgabe Lieferant, Steuerdatum, Leistungsende soweit bekannt, **tatsächliches** Zahlungsdatum, Netto, Rechnungsteuer, Betriebsanteil, USt-Behandlung und Notiz prüfen.
7. Das Häkchen „Zahlungsdatum ist gleich Steuerdatum“ nur setzen, wenn es tatsächlich stimmt. Bei gesetztem Häkchen wird ein anschließend geändertes Steuerdatum auch als Zahlungsdatum übernommen. Ein manuell eingegebenes anderes Zahlungsdatum bleibt möglich.
8. Wenn die OpenAI-Zahlungen im ausgewählten Quartal tatsächlich alle am jeweiligen Steuerdatum erfolgten, kann der Knopf „Fehlende OpenAI-Zahlungsdaten wie Steuerdatum setzen“ leere Daten ergänzen. Bereits vorhandene andere Zahlungsdaten werden durch diese Sammelaktion nicht überschrieben. Zukunftszahlungen nicht aus Gewohnheit ohne Prüfung unterstellen.
9. Änderungen setzen die Prüfung der betreffenden Ausgabe zurück. Danach die einzelnen Ausgaben und die Vollständigkeit bewusst bestätigen.
10. „Alle Ausgaben dieses Quartals löschen“ entfernt die Ausgabenzuordnung des gewählten Quartals, nicht einfach nur einen Filter; vorher Backup anlegen. Nicht mit „Alle Originale löschen“ verwechseln.

### Schritt 4: Zuordnung und offene Punkte

1. Google-ZM, Google-/Ausgaben-Reverse-Charge und Apple-ADI-Entwurf lesen.
2. Bestätigen, dass das für den Zeitraum gültige Store-Modell und die Vertragspartner zu meiner Nutzung passen. Ein gesetztes Häkchen ersetzt die Prüfung nicht.
3. Bei Apple werden die vom Rechner ermittelten EUR-Beträge als Entwurf angezeigt. Ein „bestätigter ADI-Betrag“ mit Belegreferenz ist nur für eine tatsächlich belegte, auf **dieses Kalenderquartal** passende Gesamtsumme geeignet. Eine Bankauszahlung oder ein grober Schätzwert ist nicht automatisch ein solcher Beleg.
4. Einen fehlenden FD-Bericht am Quartalsende ersetzt das Feld laut Website nicht. Wenn die Website deshalb den Export sperrt, darf ich nicht einfach eine unbelegte Zahl als „bestätigt“ ausgeben, um die Sperre zu umgehen. Offen dokumentieren und die Lage vor der Frist klären.
5. Warnungen zu Banca-d’Italia-Kursen, fehlenden Zeitpunkten, nicht zuordenbaren Ländern, doppelten Perioden und offenen Ausgaben einzeln auflösen. Erst danach die Quartalskontrolle bestätigen.

### Schritt 5: Prüfen und exportieren

1. KZ 000, 057, 060, 066 und Zahllast/Guthaben mit der unabhängigen Rechnung vergleichen; prüfen, ob mein Fall zusätzliche Kennzahlen benötigt.
2. ZM-Zeilen je tatsächlichem Empfänger und UID vergleichen. Cent werden je Empfänger erst nach der Summenbildung weggelassen.
3. Unter „Begründete manuelle Korrektur“ kann ich Werte ändern. Nur nach belegtem Rechenweg; die Anpassung bleibt für das Quartal gespeichert und muss erneut geprüft werden. Eine manuelle Zahl repariert keine fehlenden Belege.
4. „Originale + Quartalsstand als ZIP“ herunterladen und sicher ablegen. Der Stand kann sensible Daten enthalten.
5. Über „Weiter zur Abgabevorbereitung“ die XML-Seite öffnen. Bei offenen Prüfungen ist der dortige Export gesperrt; den Grund im Quartalsdurchlauf prüfen.
6. Erst nach einer tatsächlich positiven **Produktions**bestätigung und nach Sicherung des FinanzOnline-Protokolls die entsprechenden „eingebracht“-Häkchen setzen. Die Markierung speichert bei der ZM den damaligen Vergleichsstand; sie ist keine eigenständige Abgabe und kein Ersatz für das amtliche Protokoll.

### Weitere Ansichten: Überblick, Ausgaben, Dateien und Appodeal

- **Übersicht (`/`):** Zeigt aus Google-/Apple-Berichten und vorhandenen Appodeal-Berichten ermittelte Berichtsumsätze, bezahlte betriebliche Nettoausgaben und die Differenz als vorläufigen Überschuss. Jahr und Quartal können gefiltert werden. Berichtsumsätze sind keine bestätigten Bankzuflüsse; fehlende Auszahlungen, Abschreibungen, Steuern und offene Belege verhindern einen endgültigen steuerlichen Gewinn. Google-Gebühren im Bericht nicht ein zweites Mal als Ausgabe abziehen.
- **Alle Ausgaben (`/ausgaben`):** Ausgaben sämtlicher Quartale nach Steuerdatum sortiert ansehen, nach Jahr/Quartal oder Text filtern und je Eintrag öffnen und bearbeiten. Änderungen können die Prüfung des alten und des neuen Quartals zurücksetzen. Eine Zahlung ohne Datum zählt nicht als bezahlte Ausgabe in der Übersicht.
- **Alle Dateien (`/dateien`):** Originale aller Quartale nach Berichts- oder Belegdatum durchsuchen, nach Quelle/Jahr/Quartal filtern und herunterladen. Die farbigen Quellen- und Quartalsangaben sind Orientierung; insbesondere Apple-Dateien können mehrere Quartale betreffen. Unbekannte Daten bleiben als unbekannt markiert.
- **Appodeal (`/appodeal`):** Monats-PDFs manuell importieren oder optional die Reporting-API separat abrufen. Statistik und Abrechnung ersetzen keinen Zahlungsnachweis; die Zuordnung zum Vertragspartner bleibt zu prüfen.

## 6. Google Play: Wie ich die Berichte kontrolliere

### 6.1 Bericht finden und lesen

- In Play Console über „Berichte herunterladen“ → „Finanzen“ die Earnings-Berichte öffnen. Google nennt sie monatliche Berichte und stellt sie typischerweise bis zum fünften Tag des Folgemonats bereit; Ausnahmen und spätere Anpassungsdateien sind möglich. [Google: monatliche Berichte](https://support.google.com/googleplay/android-developer/answer/6135870?hl=en-GB).
- Einen Monatsbericht für jeden Kalendermonat des Quartals sichern und die im Bericht verwendete Händlerwährung beachten.
- Zeilentypen wie `Charge`, `Charge refund`, `Google fee`, `Google fee refund` untersuchen. Negative Refunds und Erstattungen nicht als positive Einnahmen zählen. Einen Erlös nicht nochmals aus der Bankauszahlung hinzufügen.
- Der Standort des App-Kunden ist nicht automatisch der Vertragspartner meiner Leistung. Maßgeblich ist das geltende Händler-/Wiederverkaufsmodell für den jeweiligen Markt.

### 6.2 Mein bisher angenommener Ansatz

Für die bislang angesetzten Wiederverkaufsgebiete wird ein nach den zutreffenden Gebühren saldierter Umsatz Google Commerce Limited zugeordnet; nur soweit die konkrete Leistung an die irische Gesellschaft so einzuordnen ist, erscheint sie in ihrer ZM-Zeile. Separate Google-Dienstleistungsgebühren außerhalb dieser Gebiete werden im bisherigen Modell auf Reverse Charge geprüft.

Der Rechner zeigt diese Aufteilung an. Ich kontrolliere sie gegen die zum Umsatzzeitpunkt geltenden Verträge, die aktuelle Google-Länderliste und meine Rechnungen. Gebühren-PDFs nicht nochmals addieren, wenn dieselben Gebühren bereits in den Earnings-CSV angesetzt wurden. Bei geändertem Store-Modell, alternativer Zahlungsabwicklung, direktem Verkauf, abweichendem Vertragspartner oder zusätzlichen Google-Anpassungsdateien ist dieser Ansatz neu zu prüfen. [Google: Wiederverkaufsgebiete](https://support.google.com/googleplay/android-developer/answer/7645364).

## 7. Apple: Kalenderquartal, Finanzmonat und fehlende Tage

### 7.1 Welche Dateien wofür?

| Datei | Verwendung | Grenze |
|---|---|---|
| `FD_…txt` – Financial Detailed | Abgerechnete Einzelzeilen, Transaktions-/Settlementdatum, Partner Share, Währung, Land. | Apple-Finanzmonat ist nicht zwingend der Kalendermonat; Zahlungen können später abgeschlossen werden. |
| `S_D_…txt` – Summary Sales, täglich | Vergleich für einen Tag, besonders an der Quartalsgrenze und zum Finden möglicher noch offener Verkäufe. | Verkaufsdaten/Proceeds sind kein Ersatz für die endgültige Finanzabrechnung und dürfen nicht blind zusätzlich zu FD gezählt werden. |
| `S_M_…txt` – Summary Sales, monatlich | Plausibilisierung der Gesamtsummen und Stückzahlen des Kalendermonats. | Aggregiert: Das Einzelgeschäft und seine genaue Zuordnung lassen sich nicht immer identifizieren. |
| Payments and Financial Reports / Auszahlungsnachweis | Abgleich von Apples Abrechnung, Zahlung und Kursen. | Eine Auszahlung betrifft Apples Abrechnungszeitraum und belegt nicht allein die kalenderbezogene ZM-Summe. |

Apple erstellt Finanzberichte nach seinem eigenen Kalender. Der Bericht für einen Finanzmonat kann Kalendertage aus zwei Monaten oder Quartalen enthalten. Bei einer Quartalsberechnung die **Zeilen** anhand des für den steuerlichen Sachverhalt maßgeblichen Zeitpunkts einordnen, nicht nur nach Dateiname oder Auszahlungsmonat. Prüfen, ob eine Rückerstattung eine nachträgliche Entgeltänderung oder die Berichtigung eines ursprünglichen Fehlers ist; daraus kann sich ein anderer Meldezeitraum ergeben.

Apple dokumentiert: Das Transaktionsdatum bezeichnet den Kaufzeitpunkt, das Settlementdatum den Zeitpunkt, zu dem die Zahlung verarbeitet/eingezogen und eine Rechnung ausgestellt wurde. Es können Zeiträume und Einzelfälle ohne Transaktionsdatum vorkommen. [Apple: Financial Report Fields](https://developer.apple.com/help/app-store-connect/reference/reporting/financial-report-fields/).

### 7.2 So gehe ich am Quartalsende vor

1. Zuerst ermitteln, bis zu welchem Datum der **letzte vorhandene FD-Bericht** reicht.
2. Berichte über die Quartalsgrenze hinaus anfordern, wenn der letzte FD-Bericht das Kalenderquartal nicht abdeckt. Fehlende Daten bei Grenztagen sind nicht automatisch null.
3. Verfügbare Tagesberichte der verbleibenden Tage prüfen. Aus ihnen nur Vorgänge als mögliche Ergänzung kennzeichnen, die im FD-Gesamtbestand nicht bereits enthalten sind. Gleiche Produktnamen, Länder und Beträge beweisen keine Identität einzelner Transaktionen.
4. Den Monatsbericht – falls vorhanden – nach Land, Produkt, Anzahl, Vorzeichen und Währung mit den FD- und Tagesdaten abstimmen. Ein Summenvergleich kann Überlappungen sichtbar machen, beweist aber ohne Einzelidentifikation nicht jede Zuordnung.
5. `Extended Partner Share` ist bereits der erweiterte Betrag einer FD-Zeile; nicht nochmals automatisch mit der Anzahl multiplizieren. Bei Sales-Summary-Zeilen ist `Units × Developer Proceeds` relevant; negative Mengen und Rückerstattungen beachten.
6. Nur soweit die Vertragsunterlagen die irische Apple Distribution International als Leistungsempfängerin bestätigen, dieser UID den betreffenden Wert zuordnen. Nicht alle weltweit sichtbaren Apple-Gesellschaften gehören automatisch zur irischen ZM-Zeile; Kauf-Land allein ist kein vollständiger Vertragsnachweis.
7. Für jeden Fremdwährungswert die passende rechtliche Methode, Datum, Kursquelle und EUR-Betrag dokumentieren.
8. Wenn die endgültige FD-Datei noch nicht existiert, keine Vollständigkeit behaupten. Fehlende Informationen und Annahmen schriftlich festhalten, vor Frist klären und den späteren Abgleich terminieren.
9. Nach der Veröffentlichung des nächsten Finanzberichts prüfen, welche Transaktionen zum ursprünglichen Quartal gehören, ob ein zuvor angesetzter Tageswert bereits enthalten war und ob ein gemeldeter Betrag berichtigt werden muss.

Sales-and-Trends-Berichte verwenden laut Apple Pacific Time. Eine Tagesgrenze im Bericht kann daher bei grenznahen Vorgängen von anderen verwendeten Zeitangaben abweichen. Für wesentliche Grenzfälle nicht allein aus einem Dateinamen den steuerlichen Tag ableiten. [Apple: Sales Reports](https://developer.apple.com/help/app-store-connect/measure-app-performance/download-and-view-reports/).

## 8. Fremdwährungen und Kursnachweise

### 8.1 Welche Kursmethode?

Nach der gesetzlichen Regelung kommen die vom BMF festgesetzten Durchschnittskurse oder unter den gesetzlichen Voraussetzungen belegte Tageskurse in Betracht. Die Umsatzsteuerrichtlinien erlauben auch den letzten von der EZB veröffentlichten Umrechnungskurs. **Das maßgebliche Datum hängt vom konkreten Steuersachverhalt ab**; Leistungszeitpunkt, Vorauszahlung, Vereinnahmung und Vorsteuer sind nicht pauschal austauschbar. Der steuerliche ZM-Zeitraum und der Umrechnungskurs-Zeitpunkt müssen nicht ausnahmslos identisch sein. [BMF: Umrechnung, Rz 2731](https://findok.bmf.gv.at/findok/volltext?segmentId=fe52c00e-847e-4555-a06a-51bc4c2e8610), [§ 20 Abs. 6 UStG im RIS](https://www.ris.bka.gv.at/GeltendeFassung.wxe?Abfrage=Bundesnormen&Gesetzesnummer=10004873).

Die Website bevorzugt EZB-Werte und verwendet für nicht verfügbare Währungen Tageskurse der Banca d’Italia; sie kann dazu PDF-Kursnachweise speichern. **Ein vorhandenes Banca-PDF belegt den veröffentlichten Kurs, aber die Zulässigkeit dieses Kurses, die Methode und das einschlägige Datum müssen für den konkreten Fall geprüft werden.** Das gilt ebenso bei Wochenenden/Feiertagen und wenn eine Ersatzquelle verwendet wird. Die automatische Umrechnung auf ein im Report sichtbares Transaktionsdatum ist eine Rechenhilfe, keine Prüfung aller rechtlichen Zeitpunkte.

### 8.2 Umrechnung richtig herum

Wenn ein Kurs **Fremdwährung pro 1 EUR** lautet:

`EUR-Betrag = Fremdwährungsbetrag / Kurs`.

Fiktives Rechenbeispiel:

- Fiktives Beispiel: 10 GBP bei 1 EUR = 0,85 GBP ergeben `10 / 0,85 ≈ 11,76 EUR`. Dies ist kein historischer Kursbeleg.

Wenn eine Quelle den **EUR-Betrag pro 1 Fremdwährungseinheit** angibt, kann Multiplikation statt Division richtig sein. Immer die Einheiten lesen. Vor der abschließenden Summenbildung ausreichend genaue Dezimalstellen behalten; die für die Meldung erforderliche Rundung/Weglassung erst an der richtigen Stelle vornehmen.

### 8.3 Was ich aufbewahre

Pro verwendeter Währung/Zeitraum: Originalwert und Währung, steuerlich maßgeblicher Zeitpunkt und dessen Begründung, Kursdatum, veröffentlichender Anbieter, Verhältnis der Währungen, Ergebnis und PDF/CSV oder sonstigen nachvollziehbaren Kursbeleg. Bei einem manuellen Ersatzkurs dessen Quelle und Auswahl dokumentieren. Apples Auszahlungskurs kann für den Zahlungsabgleich relevant sein, ist aber nicht automatisch der richtige Kurs für die ZM des Kalenderquartals.

## 9. Ausgaben: Daten, Beleg und Steuerbehandlung

### 9.1 Was die Felder bedeuten

| Website-Feld | Eintragung / Kontrolle |
|---|---|
| Beschreibung / Lieferant | Tatsächlicher Lieferant und Leistung, anhand des Belegs. |
| Originalbeleg zuordnen | Rechnung/Beleg; bei mehreren gleichnamigen Dateien konkret prüfen. |
| Steuerdatum | Das im Rechner für die **UVA-Zuordnung** verwendete Datum. Unter Berücksichtigung des Steuersachverhalts festlegen. |
| Leistungsende | Tatsächliches Ende eines abgrenzbaren Leistungszeitraums, sofern bekannt und relevant. Ein unbekanntes Ende nicht erfinden. |
| Bezahlt am | Mein tatsächliches Zahlungsdatum; bei fehlendem Nachweis offen lassen bzw. beschaffen. Eine bloße Fälligkeit ist kein Zahlungsbeweis. |
| Netto gesamt · EUR | Voller relevanter Nettobetrag der Rechnung, soweit das JSON nicht bereits eine dokumentiert reduzierte Buchung darstellt. |
| USt laut Rechnung · EUR | Die tatsächlich ausgewiesene Steuer, nicht eine bloß rechnerische RC-Steuer. Ein Ausweis allein begründet noch keinen Vorsteuerabzug. |
| Betrieblich · % | Tatsächlicher, nachvollziehbarer Unternehmensanteil; keine pauschale Übernahme aus einer anderen Rechnung. |
| USt-Behandlung | Prüffall, korrektes Inland, Reverse Charge oder keine UVA-Wirkung nach tatsächlichem Sachverhalt auswählen. |
| Prüfnotiz | Belegreferenz, Zuordnungsbegründung, Privatanteil und offene Fragen dokumentieren. |

**Nicht einfach „Bezahlt am = Steuerdatum“ setzen, weil es bequemer ist.** Bei jedem Beleg anhand eines geeigneten Nachweises prüfen, ob beide Daten übereinstimmen. Bei Vorauszahlung über eine noch nicht abgeschlossene Dienstleistung können für Reverse Charge und Vorsteuer besondere Zeitpunkte gelten; bei einer gewöhnlichen Eingangsrechnung unter Istbesteuerung ist die Zahlung regelmäßig eine Voraussetzung für den Vorsteuerabzug. Die tatsächliche Rechtsanwendung anhand des jeweiligen Sachverhalts prüfen. [WKO: Istbesteuerung](https://www.wko.at/steuern/soll-ist-besteuerung), [WKO: Reverse Charge](https://www.wko.at/steuern/reverse-charge-dienstleistungen-b2b).

### 9.2 Einordnung typischer Belege

- **OpenAI-Abonnement:** Rechnung und Anbieter prüfen; für das jeweilige B2B-Modell Reverse Charge, den Steuersatz und den belegten Betriebsanteil prüfen. Jedes Abo nur aufnehmen, wenn ein entsprechender Beleg tatsächlich vorliegt. Servicezeitraum, Zahlung und Steuerdatum gesondert prüfen.
- **OpenAI-Credits:** Nicht automatisch wie ein Monatsabo behandeln. Rechnung, erworbene Leistung/Gutschrift, etwaige Nutzung/Einlösung und steuerlichen Zeitpunkt prüfen. Die richtige Behandlung bleibt sachverhaltsabhängig.
- **Österreichischer Einkauf mit USt**, z. B. ein Laptop: zutreffenden Beleg, die tatsächliche Zahlung, korrekten Steuerausweis, Unternehmenszuordnung und Privatanteil prüfen. Bei Anschaffungskosten zusätzlich die ertragsteuerlichen Regeln zu GWG/AfA betrachten; diese werden nicht durch eine UVA-XML erledigt.
- **WKO/SVS:** Vorschreibung und Zahlungsnachweis prüfen. Ein Jahresbeitrag ohne ausgewiesenes konkretes Leistungsende bekommt kein erfundenes Enddatum. Bei meinen bisher betrachteten WKO-/SVS-Belegen wurde keine abziehbare USt angesetzt; andere Dokumente einzeln beurteilen.
- **Apple Developer:** Den Steuerausweis und den tatsächlichen Vertragspartner prüfen. Nicht allein deshalb Vorsteuer abziehen, weil ein Steuerbetrag auf der Rechnung steht. Eine mögliche RC-Pflicht unabhängig davon prüfen.
- **Privat oder doppelt erfasst:** Nicht unbemerkt löschen oder doppelt rechnen; eindeutig ausschließen bzw. den doppelten Datensatz nach Kontrolle entfernen. Originaldokumente für die Nachvollziehbarkeit sichern.

### 9.3 JSON-Format für die Website

Das nachfolgende Beispiel ist fiktiv und zeigt nur das technische Format. Es ist keine Rechnung und darf nicht importiert werden, als wäre es ein tatsächlicher Beleg.

```json
{
  "expenses": [
    {
      "title": "OpenAI ChatGPT Plus",
      "sourceName": "beispiel/RECHNUNG.pdf",
      "date": "2026-07-01",
      "serviceDate": "2026-07-31",
      "paymentDate": "2026-07-01",
      "net": 20.00,
      "vat": 0,
      "share": 80,
      "vatCase": "reverse_charge",
      "note": "Fiktives Formatbeispiel, kein tatsächlicher Beleg."
    }
  ]
}
```

Regeln des aktuellen Importers:

- Oberstes Element ist ein Objekt mit einer Liste `expenses`. Pro Ausgabe ein eigenes Objekt.
- `title`, `sourceName`, `date`, `net`, `vat`, `share` und `vatCase` sind erforderlich; `serviceDate`, `paymentDate`, `note` und `id` dürfen fehlen bzw. Datumsfelder leer sein. `date` muss ein echtes Datum im Format `JJJJ-MM-TT` sein.
- Beträge und Prozente sind JSON-Zahlen mit Punkt, z. B. `20.00`, keine Texte wie `"20,00 €"`. Ein negativer Rechnungsbetrag wird von diesem Ausgaben-Importer nicht einfach als normale Ausgabe akzeptiert; Gutschriften gesondert prüfen.
- Erlaubte `vatCase`-Werte: `review`, `domestic`, `reverse_charge`, `none`. `review` bedeutet offen; nicht raten. Ein Import bestätigt die Behandlung nicht automatisch: Die Website setzt neue Einträge auf „Bitte prüfen“.
- Ohne explizite `id` erzeugt die Website eine Kennung aus Lieferant, Datum und Betrag. Bestehende Bearbeitungen mit gleicher Kennung werden beim erneuten Import beibehalten. Bei geänderten Belegen und doppelten Namen prüfen, ob ein Eintrag absichtlich ersetzt, aktualisiert oder doppelt erfasst wurde.
- `sourceName` verweist auf die Originaldatei; die JSON enthält nicht automatisch das PDF/Bild. ZIP bzw. Originale zusätzlich importieren. Die eindeutige Zuordnung prüfen.
- Falls ein Kalkül-Export bereits einen auf den Betriebsanteil reduzierten Buchungsbetrag enthält, nicht diesen reduzierten Betrag nochmals mit dem Privatanteil kürzen. In der obigen JSON ist `net` der gesamte Nettobetrag, `share` der Anteil.

## 10. Appodeal und Wise

1. Unter `/appodeal` die Appodeal-Berichte je Monat sichern; den tatsächlichen Vertragspartner und die Vertragsleistung prüfen. Optional kann die Website mit User-ID und Reporting-API-Key einen Statistikabruf durchführen; der Statistikbericht ersetzt keinen Auszahlungsbeleg.
2. Unter dem bisher angenommenen Modell einer Werbeleistung an **Appodeal Inc. in den USA** wurde keine irische ZM-Zeile und keine zusätzliche österreichische UVA-Position für diese Einnahme angesetzt. Ändert sich der Vertragspartner oder Leistungsort, neu beurteilen.
3. Eine Appodeal-Auszahlung, ein Wise-Eingang und eine anschließende Wise-Eigenüberweisung können zusammenhängen. Nicht jeden dieser Schritte nochmals als neuen Umsatz behandeln.
4. Für die Einnahmen-Ausgaben-Rechnung den tatsächlichen Zufluss und gegebenenfalls Fremdwährung separat prüfen. Die Plattformstatistik ist nicht automatisch der zugeflossene Gewinn; Ausgaben, Gebühren und Steuerregeln sind getrennt zu beurteilen.

## 11. UVA und ZM unabhängig nachrechnen

### 11.1 UVA-Schema für das bisherige einfache Modell

1. Inländisch steuerbare Umsätze und den passenden Steuersatz feststellen. KZ 000 ist ein **Netto-Bemessungsbetrag**, keine automatisch errechnete Steuer. Falls Umsätze unter verschiedene Steuersätze oder andere Sonderfälle fallen, reicht die einfache 20-%-Kurzform nicht aus.
2. Für zutreffende Reverse-Charge-Eingangsleistungen den korrekten Steuerbetrag ermitteln und in KZ 057 zusammenfassen.
3. Abzugsfähige inländische Vorsteuer für KZ 060 gesondert prüfen; bei strittigem oder unrichtigen Steuerausweis keine automatische Vorsteuer behaupten.
4. Abzugsfähige Vorsteuer aus Reverse Charge in KZ 066 gesondert berechnen. Geschäftliche Zuordnung und Privatnutzung prüfen.
5. Unter dem vereinfachten Fall ohne andere Kennzahlen: `20-%-Steuer aus den entsprechenden Inlandsumsätzen + KZ057 − KZ060 − KZ066` = Zahllast; ein negativer Wert ergibt rechnerisch ein Guthaben.
6. Beträge centgenau mit dokumentierter Rundungsmethode kontrollieren. Software-Summen und Einzelrechnungen können um einen Cent abweichen; Ursache klären statt Centwerte frei anzupassen.

### 11.2 ZM-Schema

1. Für jede meldepflichtige Leistung den richtigen EU-Unternehmer als Empfänger und dessen gültige UID feststellen.
2. Pro UID die für den Meldezeitraum zuzuordnenden Bemessungsgrundlagen mit zutreffenden Vorzeichen und dokumentierten EUR-Werten zusammenfassen.
3. Erst **nach** der Summenbildung pro UID die Cent für FinanzOnline weglassen; das BMF nennt z. B. aus 2.708.892,75 € den Meldewert 2.708.892 €. Nicht jede Einzelzeile vorher auf ganze Euro kürzen. [BMF: ZM ohne Cent](https://www.bmf.gv.at/rechtsnews/steuern-rechtsnews/aktuelle-infos-und-erlaesse/fachinformationen---umsatzsteuer/finanzonline-zm-und-vorsteuerrueckerstattungen-im-eu--ausland.html).
4. Die Zahl in der ZM ist keine an das Finanzamt zu überweisende Steuer. Keine ZM-Zeile erfinden, wenn die Leistung nicht meldepflichtig ist.

## 12. XML erstellen und bei FinanzOnline einreichen

### 12.1 Vorbereitung und Daten

- U30 = Umsatzsteuervoranmeldung; U13 = Zusammenfassende Meldung. Es sind getrennte Erklärungsarten und normalerweise getrennte Übermittlungen.
- Das XML enthält meine **neunstellige Finanzamts-Steuernummer** als `FASTNR`; das ist nicht meine mit `ATU` beginnende UID. Bei eigener Übermittlung entspricht die Übermittler-Steuernummer grundsätzlich meiner eigenen Steuernummer. Übermittler und Erklärungsempfänger bei Vertretung korrekt unterscheiden.
- Zeitraum `ZRVON` und `ZRBIS` müssen das richtige Jahr und die drei Kalendermonate enthalten. Q3/2026 ist `2026-07` bis `2026-09`.
- U30 enthält die maßgeblichen Kennzahlen; ein optionaler Nullwert kann – wie KZ 060 in der vorbereiteten Q3-Datei – nach Schema auszulassen sein.
- U13 enthält pro betroffener UID eine `ZM`-Zeile, `SUM_BGL` in ganzen Euro und für die hier angenommenen sonstigen Leistungen `SOLEI` mit `J`.
- `PAKET_NR`, Erstellungsdatum und -zeit sowie Satznummer müssen den aktuellen BMF-Vorgaben entsprechen. Für unterschiedliche Dateien geeignete Paketkennungen vergeben.
- Die U30-Struktur ab **07/2026** war für Q3/2026 maßgeblich. Bei späteren Quartalen nicht blind unterstellen, dass sie unverändert gilt: aktuelle [BMF-Strukturen und XSD-Schemas](https://www.bmf.gv.at/services/finanzonline/informationen-fuer-softwarehersteller/softwarehersteller-erklarungen-und-antraege.html) für U30 und U13 kontrollieren.
- Eine XSD-Prüfung bestätigt die formale Struktur, nicht meinen Vertrag, die Vollständigkeit meiner Belege oder die erfolgreiche Annahme durch FinanzOnline.

### 12.2 Export auf der Website

1. Quartal vollständig prüfen und die ausgewiesenen Blocker klären.
2. Auf „UVA/ZM · Abgabe“ die eigene Steuernummer ohne Trennzeichen eingeben. Bei eigener Übermittlung kann das Übermittler-Feld gemäß Website leer bleiben und die eigene Nummer verwendet werden.
3. Die beiden Bestätigungen nur setzen, wenn sie zutreffen.
4. „U30 · UVA XML“ und – falls eine meldepflichtige ZM vorhanden ist – „U13 · ZM XML“ herunterladen. Den „Prüfbericht CSV“ und das Quartalsbackup ebenfalls sichern.
5. Falls die Website wegen fehlender Daten sperrt, ist das ein offener Prüfpunkt. Einen Schätzwert nicht als bestätigte EUR-Abrechnung deklarieren, nur damit der Export freigeschaltet wird. Eine eventuell gesondert erzeugte Arbeitsdatei muss ihre Annahmen außerhalb des XML klar dokumentieren.

### 12.3 Test und Produktionsübermittlung

1. In FinanzOnline anmelden und **Eingaben → Übermittlung** öffnen. Die tatsächlichen Menübezeichnungen können sich ändern.
2. Zunächst zur **Testübermittlung** wechseln, die passende Erklärungsart auswählen und die jeweilige XML-Datei senden. Das U30 und das U13 getrennt behandeln.
3. Unter **Nachrichten → Übermittlungsprotokoll** die inhaltliche Rückmeldung zum Test kontrollieren. Ein Test reicht nicht als Abgabe.
4. Werte, Zeitraum und Identifikation nochmals überprüfen; insbesondere bei einer Schätzung die offenen Punkte vor einer Produktionseinreichung klären.
5. Für die tatsächliche Einreichung die passende Erklärungsart in der **Produktionsübermittlung** auswählen, die jeweilige XML senden und das **positive Produktionsprotokoll** abwarten. Eine grüne Eingangsbestätigung allein beweist noch nicht die positive inhaltliche Verarbeitung.
6. XML und Produktionsprotokoll dauerhaft gemeinsam ablegen. Erst jetzt auf der Website „eingebracht und positives Produktionsprotokoll gespeichert“ markieren.
7. Eine etwaige Zahllast bis zur Fälligkeit zahlen, soweit nicht durch vorhandenes Guthaben am Abgabenkonto gedeckt. Zahlung und Guthabenstand in FinanzOnline prüfen.

Quellen: [BMF: Datenstromübermittlung und Protokoll](https://www.bmf.gv.at/services/finanzonline/informationen-fuer-softwarehersteller/datenstromuebermittlung.html), [FinanzOnline: Test-/Produktionsübermittlung](https://finanzonline.bmf.gv.at/fon/a/hilfe.do?pageId=0e336bf61a539e4dabb76959fbb98137).

### 12.4 Nach der Übermittlung: Erfolg kontrollieren und Unterlagen speichern

**Vor der Produktion:** Ein Test prüft die technische Einbringung, ist aber keine tatsächliche Abgabe. Die UVA und die ZM sind unterschiedliche Erklärungsarten; jedes erzeugte und gesendete Datenpaket hat ein eigenes Protokoll. Die folgenden Schritte für beide einzeln durchführen.

#### Wo sehe ich, ob die Erklärung wirklich eingebracht ist?

1. Nach der **Produktionsübermittlung** bestätigt eine grüne Meldung zunächst, dass das XML gesendet bzw. übernommen wurde. Das ist noch nicht das Ergebnis der nachfolgenden Verarbeitung. Eine rote Meldung bedeutet einen formalen Fehler: die Datei wurde nicht übernommen. In beiden Fällen die Meldung aufmerksam lesen.
2. In FinanzOnline oben **„Nachrichten“ → „Eingehend“** öffnen. In älteren Anleitungen wird dieser Nachrichtenbereich auch „DataBox“ genannt. Der Menütext kann sich mit der Oberfläche ändern.
3. Die Nachrichten nach **Produktionsübermittlungsprotokoll** und Sendedatum durchsuchen und den Betreff anklicken. Die Verarbeitung erfolgt asynchron; wenn das Protokoll noch nicht da ist, später aktualisieren und erneut nachsehen. Bei ausbleibender Rückmeldung, besonders kurz vor Fristablauf, FinanzOnline-Hotline bzw. Finanzamt kontaktieren. Nicht ohne Prüfung einfach nochmals senden.
4. Das Protokoll dem richtigen XML zuordnen: Übermittlungsdatum/-zeit, Übermittler und möglichst `PAKET_NR` im XML und im Protokoll vergleichen. Das XML kann als Textdatei geöffnet werden; die Paketnummer steht im Element `<PAKET_NR>`. Auch Erklärungstyp und Zeitraum anhand des übermittelten XML und der gegebenenfalls im Protokoll angezeigten Einzelsätze zuordnen. Die Steuernummer vertraulich behandeln.
5. Auf den Inhalt achten: Bei **„PRODUKTIONS-Übermittlung … zur Gänze eingebracht“** wurde das betreffende Paket vollständig verarbeitet. Bei **„nicht eingebracht“** oder **„nicht (vollständig) eingebracht“** die Fehlertexte und Satznummern lesen. Wenn mehrere Sätze im Paket stehen, können fehlerfreie Sätze bereits eingebracht sein; nur nicht übernommene Sätze nach Korrektur erneut übermitteln. Nicht versehentlich bereits angenommene Erklärungen doppelt senden.
6. Das zweite Produktionsprotokoll für die andere Erklärungsart genauso kontrollieren. Ein **TEST**-Protokoll – selbst ein positives – bestätigt keine Abgabe. „XML erfolgreich gesendet“ und „Produktion zur Gänze eingebracht“ sind ebenfalls nicht dasselbe.
7. Die positive Verarbeitung bestätigt die Einbringung, aber nicht, dass die erklärte Rechnung oder Schätzung steuerlich vollständig und richtig ist. Bei einer später erkannten ursprünglichen Unrichtigkeit die Berichtigung für den ursprünglichen Zeitraum prüfen; bei einer ZM die korrigierte Gesamtmeldung übermitteln (Abschnitt 13).

Unter **„Nachrichten → Ausgehend“** lassen sich laut FinanzOnline-Hilfe übermittelte Anträge/Erklärungen ebenfalls ansehen und gegebenenfalls öffnen und speichern. Für die erfolgreiche Datenstrom-Einbringung bleibt das passende positive **eingehende Produktionsprotokoll** maßgeblich. Eine Anzeige unter „Ausgehend“ oder eine Testnachricht ist kein Ersatz dafür.

#### Was und wo herunterladen?

1. Das gefundene Protokoll in **Eingehend** über seinen **Betreff** öffnen. Die angezeigte Nachricht mit der angebotenen Speichern-/Downloadfunktion sichern; wenn die Ansicht nur Druck unterstützt, die Druckfunktion des Browsers und **„Als PDF speichern“** nutzen. Den verfügbaren Originalinhalt bevorzugen; eine browsererzeugte PDF-Kopie als solche behandeln.
2. Alternativ bietet die Nachrichtenansicht die Schaltfläche **„ZIP-Datei erstellen“** für Nachrichten-Inhalte. Die ZIP-Datei herunterladen, entpacken und kontrollieren, ob die beiden richtigen Produktionsprotokolle tatsächlich enthalten und lesbar sind. Die ZIP kann weitere vertrauliche Nachrichten enthalten.
3. Die **genau verwendete UVA-XML und ZM-XML** bereits beim Export aus der Website oder nach dem Herunterladen aus dem Chat im eigenen Quartalsordner aufbewahren. Die ursprünglichen Dateien nicht nachträglich überschreiben. FinanzOnline-„Ausgehend“ kann eine weitere lesbare Kopie bieten; nicht voraussetzen, dass dort immer die ursprüngliche XML-Datei verfügbar ist.
4. Außerdem auf der Website den **Prüfbericht CSV** sowie **„Originale + Quartalsstand als ZIP“** herunterladen. Die Website-Sicherung ist ein eigener Datenstand und **kein** FinanzOnline-Übermittlungsprotokoll.
5. Praktische Ablage, etwa `2026/Q3/FinanzOnline/`: UVA-XML, UVA-Produktionsprotokoll, ZM-XML, ZM-Produktionsprotokoll, Prüfbericht, Quartalsbackup und gegebenenfalls Zahlungsnachweis. Korrekturen später zusätzlich mit Datum, neuer XML und neuem Protokoll ablegen. Kein API-Schlüssel in diese Dateien aufnehmen.
6. Dokumente zeitnah sichern: FinanzOnline führt für **gelesene Produktionsübermittlungsprotokolle eine automatische Löschung nach 31 Tagen ab Auslesen** an; ungelesene Produktionsprotokolle werden nach sechs Monaten entfernt. Testprotokolle haben eigene kürzere Aufbewahrungszeiten. Die Zustellhistorie kann nach der Löschung Informationen über eine Nachricht zeigen, ist aber kein verlässlicher Ersatz für die gesicherte Nachricht.
7. Wenn die UVA eine Zahlung ergibt, das **Steuerkonto / die Buchungen** in FinanzOnline und gegebenenfalls die eigene Zahlungsbestätigung zusätzlich prüfen. Die ZM-Summe ist keine zu bezahlende Steuer. Eine Einreichungsbestätigung allein ist kein Zahlungsnachweis.

Quellen: [BMF: Datenstrom und Protokoll](https://www.bmf.gv.at/services/finanzonline/informationen-fuer-softwarehersteller/datenstromuebermittlung.html), [FinanzOnline: Nachrichten und Speichern](https://finanzonline.bmf.gv.at/fon/a/hilfe.do?pageId=e82eb4ed20057c44857edc791e9d743d), [FinanzOnline: ZIP-Datei erstellen und Löschfristen](https://finanzonline.bmf.gv.at/fon/a/hilfe.do?pageId=ff0bb4b915826fff43236fac6f8cac9e), [BMF: mögliche Protokolltexte](https://www.bmf.gv.at/dam/jcr%3A204076c5-2d07-4ebe-88a6-88d2a6cfd4bd/BMF_Allgemeines_Protokolle.pdf), [FinanzOnline: Steuerkonto](https://finanzonline.bmf.gv.at/fon/a/hilfe.do?pageId=f759be715a440dc938d4ece6ed58ef6c).

## 13. Was tun, wenn nach der Abgabe neue Berichte kommen?

### 13.1 ZM – ursprünglicher Fehler oder fehlender Umsatz

1. Den ursprünglichen Zeitraum, die übermittelte XML, die je UID gemeldeten Werte und das **positive Produktionsprotokoll** öffnen.
2. Neuen Apple-FD- oder Google-Korrekturbericht inhaltlich mit den ursprünglichen Daten abgleichen; Doppelzählung ausschließen und die richtigen Zeitpunkte und Währungen prüfen.
3. Feststellen, ob die ursprünglich eingereichte ZM tatsächlich **bereits bei Abgabe unrichtig oder unvollständig** war. Eine spätere echte Entgeltänderung oder Rückerstattung ist davon zu unterscheiden; sie kann nach anderen Regeln dem Zeitraum der Änderung zuzuordnen sein.
4. Bei einer ursprünglichen Unrichtigkeit/Unvollständigkeit den betroffenen Zeitraum **innerhalb eines Monats ab Erkennen** berichtigen. Eine über FinanzOnline abgegebene ZM wird dort berichtigt: die **gesamte korrigierte Meldung** des betroffenen Zeitraums übermitteln, nicht bloß die Differenz. Das Ausstellungsdatum der ursprünglichen Meldung bereithalten.
5. Eine berichtigte Gesamtmeldung enthält alle zutreffenden Empfängerzeilen, nicht nur den Unterschiedsbetrag.
6. Nicht eine ursprüngliche fehlerhafte Q3-Zahl einfach in die ZM von Q4 schieben. Ein neues Produktionsprotokoll herunterladen und zusammen mit ursprünglicher Meldung, neuer Meldung, neuem Bericht und Rechenweg ablegen.

Quelle: [BMF UStR 4203–4204](https://findok.bmf.gv.at/findok/volltext?segmentId=fc6d7aae-69fa-48eb-938b-fe353c1a84e6).

### 13.2 UVA

1. Prüfen, ob sich tatsächlich eine UVA-Kennzahl oder Zahllast/Gutschrift ändert. Eine andere ZM-Bemessungsgrundlage führt unter dem bisherigen Auslandsleistungsmodell nicht automatisch zu einer anderen UVA-Zahllast.
2. Bei falscher oder unvollständiger UVA die Berichtigung für den **ursprünglichen Zeitraum** über den passenden FinanzOnline-Weg prüfen. Die berichtigte UVA enthält grundsätzlich sämtliche Daten einschließlich der korrigierten Werte, nicht nur die Differenz. Falls bereits ein Bescheid vorliegt oder das System eine erneute Übermittlung zurückweist, den konkreten Verfahrensweg beim Finanzamt klären.
3. Produktionsprotokoll, Abgabenkonto und etwaige Zahlung/Nachforderung oder Gutschrift prüfen und aufbewahren. Das BMF weist darauf hin, dass eine elektronische Berichtigung mit sämtlichen Daten möglich ist: [BMF: FinanzOnline für Unternehmer](https://www.bmf.gv.at/dam/jcr%3A97fbcacc-6532-4936-821d-0f25767c0da7/BMF-BR-EGov_FinanzOnline_Unternehmer_2020.pdf).

## 14. Sicherung, Datenschutz und Aufbewahrung

1. Nach jedem Quartalsdurchlauf in Schritt 5 **„Originale + Quartalsstand als ZIP“** herunterladen. Diese Sicherung enthält die im Rechner gespeicherten Originale und den Quartalsstand; sie kann Dateien und Finanzinformationen aus mehreren Quartalen enthalten.
2. Zusätzlich die beiden eingereichten XML-Dateien, den Prüfbericht, die tatsächlichen Produktionsprotokolle, Kursbelege und gegebenenfalls die Zahlungsbestätigung in meinem Quartalsordner sichern. API-Zugänge gehören nicht in diese Belegsammlung.
3. Den ZIP an einem geschützten Ort außerhalb des Browsers aufbewahren; ein zweiter geschützter Sicherungsort verringert das Risiko eines Geräteverlusts. Die lokale Browserablage allein ist keine dauerhafte Datensicherung.
4. Wiederherstellung des Quartalsstands: In Schritt 2 die passende Quartalsbackup-ZIP importieren. Die aktuelle Website prüft die Backup-/Parserversion, importiert Originale neu und setzt Prüfbestätigungen zurück. Ergebnisse und Verknüpfungen nach der Wiederherstellung kontrollieren. Gespeicherte API-Zugänge sind separat und gegebenenfalls neu einzurichten. Ein anderes Backup aus dem älteren allgemeinen Buchhaltungsbereich ist nicht automatisch dieselbe Quartalssicherung.
5. Nicht ohne Sicherung auf „Lokale Daten löschen“ oder „Alle Originale löschen“ drücken. Diese Funktionen entfernen mehr als eine einzelne Datei. „Alle Ausgaben dieses Quartals löschen“ wirkt auf die Ausgaben des gewählten Quartals.
6. Der Debug-ZIP kann sensible Berichte und Protokolle enthalten; Zugangsdaten gehören nicht in Screenshots, Chats, öffentliche Git-Repositories oder die Anleitung.
7. Buchhaltungsunterlagen grundsätzlich sieben Jahre ab Ende des betreffenden Kalenderjahres geordnet, vollständig und lesbar aufbewahren; in besonderen Fällen oder bei laufenden Verfahren können längere Pflichten gelten. Für normale 2026er Unterlagen ist das grundsätzlich bis Ende **2033**, sofern keine längere Frist einschlägig ist. [USP: Aufbewahrungspflicht](https://www.usp.gv.at/themen/steuern-finanzen/steuerliche-gewinnermittlung/weitere-informationen-zur-steuerlichen-gewinnermittlung/betriebliches-rechnungswesen/aufbewahrungspflicht.html).

## 15. Vorlage für die nächste Anfrage an einen Assistenten

Ich kann den folgenden Text zusammen mit den tatsächlichen Dateien verwenden und die eckigen Platzhalter ersetzen:

> Bitte berechne meine österreichische UVA und ZM für **[Jahr und Quartal]** anhand der hochgeladenen Originale. Mein bisheriges Profil und meine bisherigen Annahmen stehen im Quartalsleitfaden. Prüfe zuerst, ob sie für dieses Quartal weiterhin gelten. Nutze nur vorhandene Belege; erfinde keine Abos oder fehlenden Umsätze. Erstelle eine Ausgaben-JSON passend zum Steuernrechner, mit Originaldateinamen, tatsächlichem Zahlungsdatum, belegtem Leistungsende, Netto, Rechnungsteuer, Betriebsanteil und begründetem USt-Fall. Vergleiche Google Earnings, Apple Financial Detailed, Apple-Tages-/Monatsberichte und Appodeal ohne Doppelzählung. Weise fehlende Zeiträume, unklare Vertragspartner, Wechselkurse und Credits-Behandlung konkret aus. Rechne jede ZM-UID sowie KZ 000/057/060/066 unabhängig nach, nenne Fristen und markiere Annahmen. Erstelle nach der Kontrolle U30- und U13-XML für den richtigen Zeitraum und validiere sie gegen die aktuellen BMF-XSD-Dateien. Sage ausdrücklich, wenn eine Meldung geschätzt oder eine Korrektur der bereits eingebrachten Meldung nötig ist. Führe keine FinanzOnline-Übermittlung selbst aus, sofern ich sie nicht ausdrücklich beauftrage.

**Sinnvolle Dateien zur Anfrage:** Jahres- oder Quartals-ZIP mit Belegen; aktueller Website-Quartalsbackup-ZIP; alle drei Google-Earnings-Berichte plus Anpassungen; Apple-FD für alle berührten Finanzzeiträume und bei Bedarf Sales-Berichte; Appodeal-Abrechnungen und Zahlungshinweise; Kursbelege; bei einer Berichtigung die tatsächlich eingebrachte XML und das positive Protokoll. Keine API-Geheimnisse mitschicken.

### Vorgehen für den Assistenten

- Zuerst Zeitraum, Stammdaten, vorhandene Dateien, tatsächlichen Abgabestatus und gegebenenfalls bereits akzeptierte Werte feststellen.
- Belege aus den hochgeladenen Dateien extrahieren und jeden Betrag seiner Quelle zuordnen; keine Kontoauszüge, Zahlungsdaten oder offenen Quartale erfinden.
- Relevante österreichische Vorschriften, Fristen, Plattformbedingungen und XSD-Versionen mit aktuellen Primärquellen prüfen. Ergebnisse aus diesem Leitfaden sind historischer Kontext, kein Ersatz für eine aktuelle Prüfung.
- Financial Detailed und Sales Summary nicht blind addieren. Fehlende Abschlüsse, ungeklärte Doppelzählungen, die steuerliche Eignung von Wechselkursen und den Status der Credits sichtbar lassen.
- Den Unterschied zwischen Steuerzahlung, ZM-Bemessungsgrundlage und E/A-Gewinn erklären. Bei Istbesteuerung die Regeln für Ausgangsumsätze, ZM, RC und Vorsteuer nicht unbesehen gleichsetzen.
- XML erst mit überprüften Kennzahlen und dem richtigen Zeitraum erzeugen; eigenes Finanzamt-Steuerkennzeichen aus einer verlässlichen vorhandenen Quelle übernehmen, nicht eine UID an dessen Stelle schreiben. Keine Geheimnisse veröffentlichen.
- Vorhandene Erklärungsart, Schema, UID-Zeilen, Vorzeichen, Beträge, Berechnungen, Test und Produktionsprotokoll voneinander trennen. Eine XSD-Prüfung oder eine Testübermittlung nie als tatsächliche Abgabe bezeichnen.
- Bei einer nachträglichen Korrektur zunächst klären, ob ein ursprünglicher Fehler, eine spätere Entgeltänderung oder eine neue Erklärung vorliegt. Keine falsche Korrekturfrist oder automatisches Recht auf eine Schätzung behaupten.

## 16. Abschluss-Checkliste je Quartal

- [ ] Das richtige Jahr/Quartal und mein tatsächlicher Meldezeitraum sind gewählt.
- [ ] Google: alle drei Monate und mögliche Anpassungsdateien vorhanden; Gebühren nicht doppelt.
- [ ] Apple: alle berührten FD-Zeiträume geprüft; fehlende Tage und mögliche nachlaufende Transaktionen dokumentiert.
- [ ] Sales-Summary-Dateien und Financial Detailed auf Überschneidung geprüft, bevor Werte zusammengezählt werden.
- [ ] Vertragspartner, UID, Leistung und Zeitraum anhand der Unterlagen geprüft.
- [ ] Fremdwährungsquelle, maßgeblicher Zeitpunkt und Kursnachweis festgehalten.
- [ ] Appodeal-Bericht, Vertragspartner und Zufluss/Überträge abgeglichen.
- [ ] Alle tatsächlichen Ausgaben und wiederkehrenden Belege erfasst; keine erfundenen Rechnungen.
- [ ] Zahlungsdaten, Servicezeiträume, USt-Behandlung und Betriebsanteile geprüft; Originale zugeordnet.
- [ ] KZ und ZM-Werte unabhängig kontrolliert, je UID erst zum Schluss Cent weggelassen.
- [ ] UVA und ZM als getrennte XML-Dateien mit richtiger Steuernummer und korrektem Zeitraum erzeugt.
- [ ] XML-Struktur gegen die aktuellen BMF-Schemas und nach Möglichkeit mit FinanzOnline-Testübermittlung geprüft.
- [ ] Produktionsübermittlung getrennt durchgeführt; positive inhaltliche Protokolle für jede Meldung gesichert.
- [ ] Zahllast fristgerecht gezahlt oder ausreichendes Guthaben überprüft.
- [ ] ZIP-Backup, XML, Protokolle, Kursnachweise und Berechnung dauerhaft abgelegt.
- [ ] Fehlende spätere Berichte und nötige ursprüngliche Berichtigungen mit Termin für den Nachvergleich notiert.
