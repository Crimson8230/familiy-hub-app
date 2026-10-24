# Family Hub App Constitution

## Zweck und Geltungsbereich

Family Hub App ist eine eigenständige Android-App für die private Übersicht über
Aufgaben, Termine und Mitteilungen der Grundschule und Mittelschule St. Martin. Sie
setzt fachlich auf dem bestehenden Family-Hub-Projekt auf. Diese Constitution gilt
für alle Android-Spezifikationen, Pläne, Implementierungen und Releases.

## Grundsätze

### I. Lokal und ohne eigenen Server

- Die Kernfunktionen MÜSSEN ohne Family-Hub-Server, Cloud-Datenbank, Aruba-Hosting
  und Google-Konto nutzbar sein.
- Registerdaten MÜSSEN auf dem Gerät gespeichert und ohne Netzverbindung lesbar sein.
- Netzwerkzugriffe DÜRFEN für den ausdrücklich konfigurierten Registerabgleich
  erfolgen. Ein Ausfall des Registers DARF vorhandene Daten nicht entfernen.
- Die App DARF keine Daten zwischen Geräten synchronisieren, solange dafür nicht
  eine eigene, ausdrücklich spezifizierte Funktion mit Daten- und
  Sicherheitskonzept beschlossen wurde.

### II. Datenschutz und sichere Zugangsdaten

- Register-Zugangsdaten MÜSSEN auf dem Gerät geschützt gespeichert werden; die
  Schlüsselverwaltung MUSS Android Keystore oder eine gleichwertige
  Plattformfunktion verwenden.
- Passwörter, Sitzungscookies und Antwortinhalte DÜRFEN nicht in Logs,
  Absturzberichte, Benachrichtigungen oder Quellcode gelangen.
- Backups und Exporte MÜSSEN ausdrücklich regeln, ob Zugangsdaten enthalten sind.
  Eine Wiederherstellung DARF keine ungeschützten Zugangsdaten erzeugen.
- Benachrichtigungen MÜSSEN eine datensparsame Sperrbildschirm-Darstellung
  ermöglichen. Nicht benötigte Android-Berechtigungen DÜRFEN nicht angefordert werden.
- Das Entfernen eines Registerkontos MUSS dessen Zugangsdaten und zugehörige
  lokale Einträge löschen.

### III. Lesender und nachvollziehbarer Registerabgleich

- Die App DARF im Digitalen Register nur lesen; sie DARF keine Aufgaben abhaken,
  Nachrichten verändern oder sonstige Schulserver-Daten schreiben.
- Die bestehende Implementierung in `register.py`, `classification.py`,
  `message_text.py` und `grouping.py` ist die fachliche Referenz für die erste
  Android-Version. Abweichungen MÜSSEN im jeweiligen Feature begründet werden.
- Der Abgleich MUSS Einträge pro Registerkonto eindeutig zuordnen und
  wiederholbar verarbeiten, ohne Duplikate zu erzeugen.
- Fehler, unerwartete Antworten und eine verlangte Zwei-Faktor-Anmeldung
  MÜSSEN sichtbar und verständlich gemeldet werden. Ein fehlgeschlagener
  Abgleich DARF den letzten erfolgreichen Stand nicht als aktuell ausgeben.
- Die Register-Endpunkte sind inoffiziell und noch nicht mit echten Konten
  verifiziert. Anpassungen an das reale Antwortformat MÜSSEN mit anonymisierten
  Beispielen und gezielten Tests belegt werden.

### IV. Ehrliche und nützliche Benachrichtigungen

- Die tägliche Übersicht MUSS als lokale Android-Benachrichtigung funktionieren;
  ein externer Push-Dienst ist dafür keine Voraussetzung.
- Die App MUSS den Zeitpunkt des letzten erfolgreichen Abgleichs anzeigen.
  Beruht eine Benachrichtigung auf älteren Daten oder scheitert der Abgleich,
  MUSS sie das erkennen lassen.
- Die gewünschte Uhrzeit ist eine Präferenz, keine zugesicherte minutengenaue
  Ausführung. Die App MUSS Android-Beschränkungen für Hintergrundarbeit und
  Benachrichtigungsberechtigungen respektieren.
- Bei deaktivierten Benachrichtigungen MUSS die Übersicht in der App weiterhin
  vollständig nutzbar sein.

### V. Kleine, überprüfbare Features

- Jedes Feature MUSS einen eigenständig prüfbaren Nutzwert, klare
  Akzeptanzkriterien und definierte Fehlerfälle haben.
- Für Register-Normalisierung, Priorisierung, lokale Datenmigration und
  Benachrichtigungsentscheidung MÜSSEN aussagekräftige automatisierte Tests
  vorhanden sein. Tests DÜRFEN keine echten Schul-Zugangsdaten verwenden.
- Netzwerkabhängige Tests MÜSSEN mit anonymisierten Beispielantworten oder
  Test-Doubles laufen. Änderungen am Registerformat MÜSSEN durch solche Tests
  nachvollziehbar sein.
- Release-Voraussetzung sind ein geprüfter Offline-Fall, ein fehlgeschlagener
  Abgleich, verweigerte Benachrichtigungsberechtigung und eine Neuinstallation
  beziehungsweise Wiederherstellung ohne Datenverlust oder Zugangsdatenleck.

## Produktgrenzen der ersten Version

- Die erste Version ist für Android und einzelne Geräte ausgelegt. Jedes Gerät
  hat seinen eigenen Datenstand und seine eigenen Register-Zugangsdaten.
- Google-Login, gemeinsam synchronisierte Familienkonten, Webserver und
  automatischer E-Mail-Versand gehören nicht zum ersten Release.
- Die App übernimmt keine Zuständigkeit für das Schulregister und verspricht
  keinen garantierten Zustellzeitpunkt für Benachrichtigungen.

## Governance

- Die Constitution hat Vorrang vor Feature-Spezifikationen und
  Implementierungsplänen. Ein Konflikt MUSS vor der Implementierung geklärt
  werden.
- Änderungen an Grundsätzen oder Produktgrenzen MÜSSEN mit Begründung,
  Auswirkung auf bestehende Features und Versionsanpassung dokumentiert werden.
- Versionierung: MAJOR für widersprechende oder entfernte Grundsätze, MINOR
  für neue Grundsätze oder Produktgrenzen, PATCH für Klarstellungen.

**Version**: 1.0.0 | **Beschlossen**: 2026-10-24 | **Zuletzt geändert**: 2026-10-24
