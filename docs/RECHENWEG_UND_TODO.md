# Interner Rechenweg und Aufgaben für künftige Quartale

Dieser Ablauf ist für die Person oder den Assistenten gedacht, die bzw. der die österreichische UVA und ZM des App-Einzelunternehmens vorbereitet. Er ergänzt [den Quartalsleitfaden](Quartalsleitfaden_UVA_ZM.md). Diese Datei steht in einem öffentlichen Repository: keine echten Quartalsbeträge, Belege, Steuernummern, API-Schlüssel, Kontoauszüge oder Steuerprotokolle eintragen. Die konkreten Q2-/Q3-Werte und ihre offenen Punkte stehen ausschließlich in der persönlichen Anleitung und den jeweiligen Originalen.

## Vor jeder Berechnung

- [ ] Für den tatsächlichen Zeitraum prüfen, ob Regelbesteuerung, Istbesteuerung und vierteljährliche UVA/ZM weiterhin gelten. Bei neuer Rechtslage oder abweichendem Geschäft nicht die alte Methode ungeprüft übernehmen.
- [ ] Vorhandene Abgaben, XML und positive **Produktionsprotokolle** samt Stand und Zahlung überprüfen. Eine lokal erstellte XML oder XSD-Prüfung ist noch keine Einreichung.
- [ ] Originale inventarisieren, Dateinamen, Inhalts-Hashes, Berichtszeiträume und erkennbare Lücken auflisten. Niemals fehlende Abos, Zahlungen, Leistungsenden, Steuersätze, Kurse oder Umsätze erfinden.
- [ ] Store-Modell, Vertragspartner und Rolle prüfen: Standard-Store-Billing war bisher die Arbeitsannahme. Geltende Verträge, Gebiete, UID und Leistung sind für jeden Zeitraum entscheidend.
- [ ] Für jeden Rechenwert eine nachvollziehbare Brücke zur Quelle, zum Zeitraum, zur Währung, zur Steuerbehandlung und zur verwendeten Rundung festhalten. Offene Belegfragen ausdrücklich nennen.

## Einnahmen aus Plattformberichten aufteilen

### Google Play

- [ ] Die drei Earnings-CSV des Kalenderquartals und gegebenenfalls zusätzliche Anpassungen beschaffen. Gleiche Inhalte nicht doppelt zählen; bei unterschiedlichen Berichten für denselben Monat zuerst feststellen, ob Ersatz oder Ergänzung vorliegt.
- [ ] Unter dem geprüften Wiederverkaufsmodell die Umsätze in den zutreffenden Gebieten und die zugehörigen Google-Gebühren/Erstattungen mit Vorzeichen summieren. Soweit Google Commerce Limited die Leistung empfängt, bildet dieser Saldo den Google-ZM-Betrag. Die geltende Gebietsliste anhand der [Google-Dokumentation](https://support.google.com/googleplay/android-developer/answer/7645364) kontrollieren.
- [ ] Separate bezogene Google-Dienstleistungsgebühren außerhalb dieser Gebiete und ihre Erstattungen bestimmen. Bisher wurden dafür unter der jeweiligen B2B-Annahme Reverse-Charge-Steuer und gegebenenfalls Vorsteuer in KZ 057/066 gerechnet. Vertrag, Leistungsort und Vorsteuerberechtigung prüfen.
- [ ] Gebühren, die im Earnings-Bericht enthalten sind, nicht durch die zusätzlich vorliegenden Gebühren-PDFs oder eine als Ausgabe erfasste Kopie nochmals ansetzen.
- [ ] Die Übersichtsseite addiert unterstützte Google-Charges, Erstattungen, Gebühren, Steuern und Anpassungen nach Transaktionsdatum. Unbekannte Zeilentypen bleiben mit Hinweis offen. Das ist ein Berichtsstand, kein bestätigter Bankzufluss.

### Apple App Store

- [ ] Alle Financial-Detailed-FD-Dateien nutzen, deren Apple-Finanzperioden das Kalenderquartal schneiden; ihre Anfangs- und Endtage kontrollieren. Dateiname, Finanzmonat und tatsächliches Kalenderquartal nicht gleichsetzen.
- [ ] `Extended Partner Share` verwenden, wenn vorhanden; ihn nicht erneut mit `Quantity` multiplizieren. Erstattungen korrekt mit Vorzeichen und dem jeweils einschlägigen Zeitraum beurteilen. Die automatische Datumsauswahl bei jeder relevanten Zeile gegen Leistungszeitpunkt und die Umstände prüfen.
- [ ] Länder und Apple-Gesellschaften anhand der geltenden Verträge zuordnen. Nur tatsächlich der irischen Apple-Gesellschaft zurechenbare sonstige Leistungen in deren ZM-Zeile aufnehmen; weltweite Apple-Einnahmen nicht pauschal der irischen UID zuordnen.
- [ ] Für Fremdwährung je Zeile das rechtlich maßgebliche Datum und die Kursmethode festlegen. Die Website verwendet zuerst die EZB und andernfalls veröffentlichte Tageskurse der Banca d’Italia und speichert verfügbare PDF-Belege. Die bloße Verfügbarkeit eines Kurses beweist seine steuerliche Zulässigkeit noch nicht. Kursrichtung, Datum, Wochenenden und belegte Ersatzmethode prüfen. [BMF zur Umrechnung](https://findok.bmf.gv.at/findok/volltext?segmentId=fe52c00e-847e-4555-a06a-51bc4c2e8610).
- [ ] Tages-/Monats-Sales-Berichte nur nach Abgleich als Anhaltspunkt für fehlende Daten verwenden. Nicht blind auf FD addieren: Eine bereits im Finanzbericht enthaltene oder periodenübergreifende Transaktion wäre sonst doppelt. Die Übersicht zählt diese Sales-Dateien bewusst nicht als zusätzliche Einnahmen.
- [ ] Die Abdeckung bis zum letzten Kalendertag und später nachlaufende Geschäfte prüfen. Vorläufige Ergänzungen samt Unsicherheit und Abgleichtermin dokumentieren. Den endgültigen FD-Bericht nach Verfügbarkeit erneut holen und mit dem gespeicherten tatsächlichen Abgabestand vergleichen.

### Appodeal

- [ ] Appodeal separat unter `/appodeal` importieren. Die Monatsabrechnung, tatsächlichen Vertragspartner und erhaltene Zahlung beurteilen. Ein Statistik-Abruf ist kein Auszahlungsbeleg.
- [ ] Ein USD-Berichtswert wird in der Übersicht als Schätzung in EUR umgerechnet. Auszahlungen und Weiterüberweisungen nicht zusätzlich als neue Umsätze erfassen. Steuerliche Zuordnung anhand des Vertrags prüfen.

## Ausgaben und UVA

- [ ] Aus jedem tatsächlich vorhandenen Beleg Lieferant, Betrag, Rechnungsteuer, Steuerdatum, soweit belegtes Leistungsende, Zahlungsdatum und betrieblichen Anteil erfassen. Originaldatei zuordnen und veränderte Einträge erneut prüfen.
- [ ] Zahlungsdatum nur gleich Steuerdatum setzen, wenn es für die betreffende Rechnung tatsächlich stimmt. Das unbekannte Leistungsende leer lassen; ein Fälligkeitsdatum ist kein Zahlungsbeweis.
- [ ] Inlandsvorsteuer nur bei den tatsächlich erfüllten Voraussetzungen ansetzen. Ein unrichtiger USt-Ausweis verschafft keinen automatischen Vorsteuerabzug. Die offene Apple-Developer-Rechnung anhand von Apples Antwort und den Originalunterlagen erneut prüfen; eine mögliche Reverse-Charge-Schuld davon getrennt beurteilen.
- [ ] B2B-Reverse-Charge, Steuersatz, Zeitpunkt und Umfang der Vorsteuerberechtigung prüfen. Private Anteile und Besonderheiten von Credits/Anzahlungen gesondert beurteilen. WKO-/SVS-Dokumente und Anlagegüter nicht pauschal wie ein gewöhnliches Abo behandeln.
- [ ] Berechnungsbrücke: KZ 000 = inländisch steuerbare Bemessungsgrundlage; KZ 057 = geschuldete Reverse-Charge-Steuer; KZ 060 = berechtigte inländische Vorsteuer; KZ 066 = berechtigte Reverse-Charge-Vorsteuer. Nur im einfachen Fall ohne weitere Kennzahlen: zutreffende Umsatzsteuer + 057 − 060 − 066 = Zahllast bzw. negatives Guthaben. Einzelfälle können weitere Kennzahlen erfordern.
- [ ] Ergebnis unabhängig centgenau nachrechnen. Rechnungssteuer, Vorsteuerabzug, Steuer auf die Leistung und ZM-Bemessungsgrundlage nicht verwechseln.

## ZM, XML, Übermittlung und Nachkontrolle

- [ ] Leistungen nach dem steuerlich maßgeblichen Zeitraum und der gültigen Empfänger-UID aggregieren. Bei Istbesteuerung die Besonderheiten der ZM beachten; Vorauszahlungen und Leistungsänderungen getrennt prüfen. [BMF: ZM bei Istbesteuerung](https://findok.bmf.gv.at/findok/resources/pdf/14cf1f83-db85-46f5-a64d-190e1a29a664/45907.1.1.0.pdf).
- [ ] Für jeden Empfänger erst nach der Summenbildung die Cent für die ZM weglassen. Google und Apple sind getrennte Empfänger; der ZM-Betrag ist keine Steuerzahlung. [BMF: ganze Euro](https://www.bmf.gv.at/rechtsnews/steuern-rechtsnews/aktuelle-infos-und-erlaesse/fachinformationen---umsatzsteuer/finanzonline-zm-und-vorsteuerrueckerstattungen-im-eu--ausland.html).
- [ ] Etwaige Abweichungen zwischen unabhängiger Berechnung, Website und bereits eingebrachter Erklärung auflösen. Keine Schätzung als belegten Endwert kennzeichnen und keine Sperre mit einem erfundenen Beleg umgehen.
- [ ] Für U30 und U13 jeweils korrekte Identifikation und Zeiträume aus geschützten Unterlagen übernehmen, die aktuellen [BMF-XSDs](https://www.bmf.gv.at/services/finanzonline/informationen-fuer-softwarehersteller/softwarehersteller-erklarungen-und-antraege.html) nutzen und technisch validieren. Eine XML-Prüfung bestätigt weder fachliche Richtigkeit noch tatsächliche Abgabe.
- [ ] Fristen je Meldeart und Feiertage nachprüfen, FinanzOnline-Test und Produktionsübermittlung unterscheiden, für beide Erklärungen das positive Protokoll sichern und eine etwaige Zahllast fristgerecht bezahlen. Nur tatsächlich erfolgte Abgaben auf der Website markieren.
- [ ] Nach jeder getrennten U30-/U13-Produktionsübermittlung in **Nachrichten → Eingehend** das passende Produktionsprotokoll anhand von Paketnummer und Datum identifizieren. Nur „zur Gänze eingebracht“ bzw. der fehlerfreie betreffende Satz bestätigt die Verarbeitung; eine grüne Sendemeldung oder ein Testprotokoll genügt nicht.
- [ ] Beide Protokolle über den Betreff speichern oder als Nachrichten-ZIP herunterladen; zusätzlich die tatsächlich übermittelten XML-Dateien, den Prüfbericht, das Website-Backup und gegebenenfalls den Zahlungsnachweis privat ablegen. Gelesene Produktionsprotokolle werden laut FinanzOnline nach 31 Tagen aus Nachrichten entfernt. Einzelheiten und Quellen: [Quartalsleitfaden Abschnitt 12.4](Quartalsleitfaden_UVA_ZM.md#124-nach-der-übermittlung-erfolg-kontrollieren-und-unterlagen-speichern).
- [ ] Sobald fehlende Apple-Berichte verfügbar sind, mit den tatsächlich eingereichten Werten und Schätzungen vergleichen. Bei ursprünglich unrichtiger oder unvollständiger Meldung die Berichtigung für den betroffenen Zeitraum prüfen; spätere Entgeltänderung davon unterscheiden. Dokumentation und Protokolle sichern.

## Übersicht: Was der Rechner derzeit nicht abschließend kann

- [ ] Berichtssummen und bezahlte betriebliche Nettoausgaben ergeben **einen vorläufigen Überschuss**, nicht automatisch einen steuerlichen Gewinn. Bankzufluss, nicht belegte Zahlungen, AfA/GWG und weitere Steuerfälle müssen getrennt berücksichtigt werden.
- [ ] Appodeal-Statistik nicht als automatisch bestätigte Rechnung oder Zahlung ausgeben; Fremdwährungs- und Apple-Lücken sichtbar halten.
- [ ] Google-Gebühren, die sowohl im Bericht als auch in einer Ausgabe vorkommen, aktiv abgleichen. Unterschiedliche Berichte für denselben Zeitraum auf Ersatz versus Ergänzung prüfen.
- [ ] Falls sich eine Ausgabe in ein anderes Quartal verschiebt, beide betroffenen Quartale erneut prüfen; Abgaben und Änderungsstand aufbewahren.
- [ ] Vor jedem späteren Quartal Rechtsquellen, Plattformbedingungen, verwendete API und XML-Schemas erneut aktualitätsbezogen prüfen. Dieser Arbeitsablauf ist keine pauschale Bestätigung künftiger Steuerwerte.
