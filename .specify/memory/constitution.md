<!--
Sync Impact Report
- Version: 1.0.0 (letzte beschlossene Fassung im Git-Verlauf; Arbeitsdatei war Vorlage) -> 1.1.0
- Geänderte Prinzipien: I. Lokal und ohne eigenen Server -> I. Native Android-App und
  Offline-Nutzung; II. Datenschutz und sichere Zugangsdaten -> II. Schutz von Familien-
  und Zugangsdaten; III. Lesender und nachvollziehbarer Registerabgleich ->
  III. Lesender und robuster Registerzugriff; IV. Ehrliche und nützliche
  Benachrichtigungen -> IV. Verlässliche Daten und ehrlicher Abgleichstatus;
  V. Kleine, überprüfbare Features -> V. Fachliche Treue und Verifikation
- Neue Abschnitte: Android- und Produktgrenzen; Entwicklungsablauf und Qualitätsnachweise
- Entfernte Abschnitte: keine (nur Vorlagenplatzhalter ersetzt)
- Offene TODOs: keine
-->
# Family Hub App Constitution

## Core Principles

### I. Native Android-App und Offline-Nutzung

Family Hub MUST als native Android-App ohne eigenen Family-Hub-Server nutzbar sein.
Gespeicherte Aufgaben, Termine und Mitteilungen MUST nach App-Neustart und ohne
Internet lesbar bleiben. Netzwerkzugriffe MUST die lokale Anzeige ergänzen, nicht
blockieren. Änderungen am lokalen Datenschema MUST nachvollziehbare Migrationen
haben, die bestehende Familiendaten erhalten. So bleibt die Übersicht auch bei
fehlender Verbindung zum Schulregister brauchbar.

### II. Schutz von Familien- und Zugangsdaten

Registerzugangsdaten MUST auf dem Gerät geschützt gespeichert werden; die
Schlüsselverwaltung MUST Android Keystore oder eine gleichwertige Plattformfunktion
verwenden. Passwörter, Sitzungscookies und rohe Antwortinhalte dürfen nicht in
Logs, Absturzberichte, Benachrichtigungen, Quellcode oder ungeschützte Sicherungen
gelangen. Personenbezogene Schul- und Familiendaten MUST auf das für die Funktion
nötige Maß begrenzt bleiben. Das Löschen eines Registerkontos MUST
seine Zugangsdaten und zugehörigen lokalen Einträge entfernen. Benachrichtigungen
auf dem Sperrbildschirm MUST datensparsam sein; eine verweigerte Berechtigung MUST
respektiert werden. Echte Registerdaten dürfen nur mit Zustimmung der Kontoinhaber
zur Prüfung verwendet werden; dauerhaft übernommene Beispiele MUST anonymisiert
sein. Diese Regeln schützen besonders die Daten von Kindern.

### III. Lesender und robuster Registerzugriff

Die App MUST das Digitale Register ausschließlich lesend verwenden und darf dort
keine Aufgaben, Termine oder Mitteilungen verändern. Antworten der Grundschule und
Mittelschule St. Martin MUST vor dem Speichern validiert und normalisiert werden.
Nicht unterstützte Antwortformate, Anmeldefehler, Netzfehler und ein verlangter
zweiter Faktor MUST als erkennbare Fehler behandelt werden; die App darf daraus
keine scheinbar erfolgreichen Ergebnisse ableiten. Da die Registerendpunkte
inoffiziell und veränderlich sind, MUST der Zugriff so gekapselt sein, dass
Formatänderungen ohne Eingriff in die lokale Darstellung bearbeitet werden können.
`register.py`, `classification.py`, `message_text.py` und `grouping.py` im
bestehenden Family Hub sind dafür die fachliche Referenz der ersten Version.

### IV. Verlässliche Daten und ehrlicher Abgleichstatus

Ein wiederholter Abgleich MUST ohne doppelte Einträge möglich sein. Ein Fehler
MUST den letzten erfolgreichen Datenstand erhalten und dessen Alter beziehungsweise
den letzten erfolgreichen Abgleich sichtbar machen. Die App MUST zwischen
gespeicherten, aktuellen und fehlgeschlagenen Abgleichen unterscheiden;
Benachrichtigungen dürfen veraltete Daten nicht als frisch ausgeben. Geplante
Hintergrundarbeit MUST Androids Ausführungsbedingungen respektieren und darf keine
minutengenaue Zustellung versprechen. Die tägliche Übersicht MUST als lokale
Benachrichtigung ohne externen Push-Dienst funktionieren; bei verweigerter
Benachrichtigungsberechtigung MUST die Übersicht in der App nutzbar bleiben. So
können Familien die Übersicht richtig einordnen.

### V. Fachliche Treue und Verifikation

Die Android-App MUST die fachlichen Regeln des bestehenden Family Hub für
Klassifizierung, Priorisierung, Gruppierung und Mitteilungstexte übernehmen.
Schularbeiten, Tests und Prüfungen haben hohe, Hausaufgaben mittlere und sonstige
Termine normale Priorität. Änderungen an diesen Regeln MUST anhand anonymisierter
Beispiele mit dem bestehenden Verhalten verglichen und bewusst begründet werden.
Parser und Darstellung für beide Schulen MUST vor dem ersten Release mit Zustimmung
der Kontoinhaber gegen echte Antworten geprüft werden; nicht unterstützte Fälle
MUST ausdrücklich sichtbar bleiben. Damit bleiben Aussagen der App fachlich
nachvollziehbar.

## Android- und Produktgrenzen

- Der erste nutzbare Release umfasst die Features F01 bis F07 aus
  `docs/android-feature-list.md`. Spätere Features MUST separat spezifiziert
  werden; die Feature-Liste bestimmt die Reihenfolge, diese Constitution die
  übergreifenden Regeln.
- Die App MUST ohne Flask-Oberfläche, Docker-Betrieb, eigenen Webserver,
  Google-Login und E-Mail-Bericht funktionieren. Eine Synchronisierung mehrerer
  Geräte gehört nicht zum ersten Release und braucht vor einer Umsetzung eine
  eigene Spezifikation mit Datenschutz- und Sicherheitskonzept.
- Bedienflächen MUST den zugeordneten Kindern, den Datenstand und Fehler in
  verständlicher Sprache zeigen. Texte und Bedienelemente MUST mit skalierter
  Android-Schrift lesbar und zugänglich bleiben.
- Export, Import und Gerätewechsel dürfen erst nach einer eigenen Spezifikation
  umgesetzt werden, die Schutz der Zugangsdaten und Wiederherstellbarkeit klärt.
- Die App MUST nur die für ihre Funktionen benötigten Android-Berechtigungen
  anfordern. Benachrichtigungsberechtigungen MUST verständlich erklärt werden.

## Entwicklungsablauf und Qualitätsnachweise

- Jedes Feature MUST als eigene Speckit-Spezifikation mit überprüfbaren
  Akzeptanzkriterien geplant werden. Plan und Tasks MUST die betroffenen
  Constitution-Prinzipien benennen und Abweichungen begründen.
- Änderungen an Speicherung, Migrationen, Registerparsern, Klassifizierung und
  Abgleichlogik MUST durch passende automatisierte Tests belegt werden. Tests
  MUST Fehlerfälle, verweigerte Benachrichtigungsberechtigung und Datenbestand
  nach einem fehlgeschlagenen Abgleich prüfen. Netzwerkabhängige Tests MUST mit
  anonymisierten Antworten oder Test-Doubles ohne echte Zugangsdaten laufen.
- Die Verifikation mit echten Konten MUST auf das Nötige begrenzt sein; Zugangsdaten
  und rohe personenbezogene Antworten dürfen nicht in das Repository gelangen.
  Ergebnisse und verbleibende Einschränkungen MUST vor einem Release dokumentiert
  werden.
- Ein Release MUST ohne Family-Hub-Server starten, gespeicherte Daten offline
  anzeigen und verständliche Zustände für fehlendes Netz, ungültige Anmeldung und
  veraltete Daten bieten.

## Governance

Diese Constitution gilt für alle Speckit-Artefakte und Implementierungen der
Family Hub App. Änderungen MUST als Amendment in dieser Datei erfolgen und
Prinzip, Begründung, betroffene bestehende Features und nötige Anpassungen der
Spezifikationen benennen. Vor einer Änderung oder Freigabe MUST die Einhaltung
der betroffenen Prinzipien geprüft werden; Ausnahmen brauchen eine dokumentierte
Begründung und einen Plan zur Auflösung.

Die Version folgt Semantic Versioning: MAJOR für inkompatible Änderungen oder
Entfernung von Grundsätzen, MINOR für neue Grundsätze oder wesentlich erweiterte
Vorgaben und PATCH für redaktionelle Klarstellungen ohne neue Pflichten. Das
Änderungsdatum MUST bei jedem Amendment aktualisiert werden. Die erste Fassung
übernimmt den fachlichen Kontext aus `docs/android-feature-list.md` und dem
bestehenden Family-Hub-Projekt.

**Version**: 1.1.0 | **Ratified**: 2026-10-24 | **Last Amended**: 2026-10-24
