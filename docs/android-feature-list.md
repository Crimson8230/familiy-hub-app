# Family Hub App – Feature-Liste

**Projektname:** Family Hub App  
**App-Name:** Family Hub  
**Repository-Name bei Auslagerung:** `family-hub-app`

Die Android-App übernimmt die fachliche Logik des bestehenden Projekts, nicht
dessen Flask-Oberfläche oder Docker-Betrieb. Die Features sind in der Reihenfolge
angeordnet, in der sie für eine nutzbare erste Version gebraucht werden.

## MVP

### F01 – Android-Grundgerüst und lokale Datenhaltung

Native Android-App mit Startbildschirm, Navigation und lokaler Datenbank für
Registerkonten, Aufgaben, Termine, Mitteilungen und Abgleichstatus. Die Übersicht
zeigt bereits gespeicherte Daten auch ohne Internet. Die Datenbank hat
nachvollziehbare Schema-Migrationen.

**Fertig, wenn:** Die App startet ohne Server; nach Neustart und offline sind
gespeicherte Einträge noch lesbar.

### F02 – Registerkonten verwalten

Pro Kind ein oder mehrere Konten für Grundschule oder Mittelschule St. Martin
anlegen und löschen. Zugangsdaten werden lokal geschützt gespeichert. Die App
zeigt Schule, Kind, letzten erfolgreichen Abgleich und den letzten Fehler.

**Fertig, wenn:** Ein angelegtes Konto nach App-Neustart vorhanden ist; beim
Löschen verschwinden Zugangsdaten und zugehörige Einträge.

### F03 – Manueller Registerabgleich

Ein Konto oder alle Konten auf Knopfdruck abgleichen. Anmeldung und Abruf von
Dashboard sowie Mitteilungen entsprechend `register.py`; Antworten validieren,
normalisieren und ohne Duplikate speichern. Für Fehlerfälle wie falsche
Zugangsdaten, Netzfehler, geändertes Antwortformat und verlangten zweiten Faktor
verständliche Hinweise anzeigen.

**Fertig, wenn:** Ein zweiter Abgleich keine Duplikate erzeugt und ein Fehler
den letzten erfolgreichen Datenstand erhält und als veraltet kennzeichnet.

### F04 – Aufgaben und Termine als Familienübersicht

Offene Einträge der nächsten sieben Tage anzeigen. Nach Datum, Typ und Kind
gruppieren; innerhalb eines Tages hohe Priorität zuerst. Die Regeln für
Schularbeit, Test, Prüfung, Hausaufgabe und normalen Termin aus
`classification.py` übernehmen. Titel, Fach und Details lesbar darstellen.

**Fertig, wenn:** Die Anzeige für anonymisierte Beispieldaten dieselben
Kategorien und Reihenfolgen wie das bestehende Projekt ergibt.

### F05 – Mitteilungen lesen

Neue Mitteilungen anzeigen, nach Tag und Kind gruppieren und ihren vollständigen
Inhalt öffnen. Platzhalter und Formatierungsartefakte wie im bestehenden
Projekt herausfiltern. Bei fehlendem Netz den gespeicherten Stand zeigen.

**Fertig, wenn:** Eine Mitteilung eindeutig dem richtigen Kind zugeordnet ist
und auch offline geöffnet werden kann.

### F06 – Täglicher automatischer Abgleich und lokale Benachrichtigung

Eine einstellbare Tageszeit und einen aktivierbaren täglichen Abgleich anbieten.
Nach dem Abgleich eine lokale Benachrichtigung mit Anzahl und Kurzüberblick der
anstehenden Aufgaben/Termine und neuen Mitteilungen zeigen. Bei Fehlschlag
oder älteren Daten den Stand ehrlich kennzeichnen. Benachrichtigungen auf dem
Sperrbildschirm datensparsam halten. Benachrichtigungsberechtigung erklären
und ihre Ablehnung respektieren.

**Fertig, wenn:** Eine tägliche Übersicht ohne Family-Hub-Server und ohne
E-Mail ankommt, sobald Android die geplante Hintergrundarbeit ausführt; bei
Fehlern wird kein aktueller Datenstand vorgetäuscht.

### F07 – Verifikation mit echten Registerkonten

Mit Zustimmung der Kontoinhaber die beiden Schulzugänge gegen die realen
Antworten prüfen. Nur anonymisierte Testdaten übernehmen; Abweichungen im
Parser und in der Mitteilungsdarstellung vor dem ersten Release korrigieren.

**Fertig, wenn:** Aufgaben und Mitteilungen beider Schulen korrekt erscheinen
oder eine nicht unterstützte Antwort ausdrücklich als Fehler angezeigt wird.

## Danach

### F08 – Bedienung und Zugänglichkeit

Filter nach Kind, gut lesbare Detailansichten, Leerzustände, sichtbarer
Offline-Status sowie skalierbare Schrift und verständliche Beschriftungen.

### F09 – Sicherung und Gerätewechsel

Ein bewusst ausgelöster Export und Import der lokalen Daten mit klarer
Entscheidung über Zugangsdaten. Verschlüsselung, Wiederherstellbarkeit und
Fehlerfälle vor Umsetzung spezifizieren. Alternativ können Registerkonten auf
dem neuen Gerät erneut eingerichtet werden.

### F10 – Benachrichtigungseinstellungen

Auswahl, ob nur der Tagesüberblick oder zusätzlich Hinweise auf neu erkannte
Mitteilungen angezeigt werden. Doppelte Benachrichtigungen vermeiden.

## Bewusst außerhalb des MVP

- Gemeinsame Synchronisierung zwischen mehreren Handys
- Google-Login und eigener Webserver
- E-Mail-Bericht und Gmail-App-Passwort
- Schreiben oder Abhaken im Digitalen Register
- Garantiert minutengenaue Hintergrundaktualisierung

## Spec-Kit-Reihenfolge

Für jedes Feature einzeln die Spec-Kit-Schritte `specify`, `plan`, `tasks` und
`implement` ausführen. Die genaue Befehlsform hängt vom verwendeten Agenten
ab. F01 bis F07 bilden den ersten nutzbaren Release. Die Constitution unter
`.specify/memory/constitution.md` gilt für alle Feature-Spezifikationen.
