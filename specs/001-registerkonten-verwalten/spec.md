# Feature Specification: Registerkonten auf Android verwalten

**Feature Branch**: `main` (kein Feature-Branch durch Hook angelegt)

**Created**: 2026-10-24

**Status**: Draft

**Input**: User description: "Es wird eine Android-App erstellt, in der man Registerkonten verwalten kann. Man kann pro Kind ein Schulkonto einrichten. Dieses kann man speichern und löschen. Daten werden persistent am Handy in einer DB gespeichert."

## Clarifications

### Session 2026-10-24

- Q: Soll für jedes Kind genau ein Schulkonto gespeichert werden können, oder auch mehrere? → A: Genau ein Schulkonto je Kind.

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Schulkonto für ein Kind speichern (Priority: P1)

Ein Elternteil öffnet die Android-App, gibt einen unterscheidbaren Namen für das Kind,
die Schule und die Registerzugangsdaten ein und speichert das Konto. Das Konto ist
danach in der Übersicht dem richtigen Kind zugeordnet. Die Einrichtung funktioniert
auch ohne Internet, weil in diesem Schritt noch kein Registerabgleich stattfindet.

**Why this priority**: Ohne ein gespeichertes Konto kann die Familie spätere
Registerdaten keinem Kind zuordnen.

**Independent Test**: Ein Konto vollständig offline anlegen, die App schließen,
neu starten und das Konto erneut in der Übersicht finden.

**Acceptance Scenarios**:

1. **Given** die App enthält noch kein Konto für ein Kind, **When** ein Elternteil
   Kind, unterstützte Schule, Benutzername und Passwort eingibt und speichert,
   **Then** erscheint genau ein Konto mit Kind und Schule in der Übersicht.
2. **Given** ein Konto wurde gespeichert, **When** die App vollständig beendet und
   ohne Internet neu gestartet wird, **Then** ist das Konto weiterhin vorhanden.
3. **Given** Pflichtangaben fehlen, **When** das Speichern ausgelöst wird,
   **Then** zeigt die App die betroffenen Felder an und legt kein Konto an.
4. **Given** für das Kind besteht bereits ein Konto, **When** ein weiteres Konto
   für dasselbe Kind gespeichert werden soll, **Then** verhindert die App das
   Duplikat und erklärt die Ein-Konto-Regel.

---

### User Story 2 - Gespeicherte Konten überblicken (Priority: P2)

Ein Elternteil sieht in der App, für welche Kinder bereits ein Registerkonto
eingerichtet ist und zu welcher Schule es gehört. Die Übersicht zeigt keine
Passwörter und ist ohne Netz verfügbar.

**Why this priority**: Die Übersicht macht die Zuordnung sichtbar und ermöglicht
gezieltes Entfernen eines Kontos.

**Independent Test**: Mit zwei bereits gespeicherten Konten die App offline öffnen
und beide Kinder mit ihrer jeweiligen Schule erkennen, ohne Passwörter zu sehen.

**Acceptance Scenarios**:

1. **Given** zwei Konten für unterschiedliche Kinder sind gespeichert, **When**
   die Kontenübersicht geöffnet wird, **Then** erscheinen beide jeweils genau
   einmal mit Kind und Schule.
2. **Given** kein Konto ist gespeichert, **When** die Übersicht geöffnet wird,
   **Then** erklärt ein Leerzustand, wie das erste Konto angelegt wird.
3. **Given** gespeicherte Konten sind vorhanden, **When** das Handy offline ist,
   **Then** bleibt die Übersicht vollständig nutzbar und zeigt kein Passwort an.

---

### User Story 3 - Schulkonto löschen (Priority: P2)

Ein Elternteil kann ein nicht mehr benötigtes Schulkonto auswählen und nach einer
Bestätigung entfernen. Die Zugangsdaten und alle diesem Konto zugeordneten lokalen
Daten verschwinden dauerhaft aus der App.

**Why this priority**: Falsche oder nicht mehr benötigte Zugangsdaten dürfen nicht
auf dem Gerät verbleiben.

**Independent Test**: Ein gespeichertes Konto offline löschen, die App neu starten
und prüfen, dass es nicht mehr erscheint und ein neues Konto für dasselbe Kind
angelegt werden kann.

**Acceptance Scenarios**:

1. **Given** ein Konto ist gespeichert, **When** ein Elternteil Löschen auswählt
   und bestätigt, **Then** verschwinden Konto und zugehörige lokale Daten aus der
   App und bleiben nach einem Neustart entfernt.
2. **Given** die Löschbestätigung ist geöffnet, **When** ein Elternteil abbricht,
   **Then** bleibt das Konto unverändert gespeichert.
3. **Given** ein Konto wurde gelöscht, **When** für dasselbe Kind erneut ein Konto
   eingerichtet wird, **Then** kann es regulär gespeichert werden.

### Edge Cases

- Leere Eingaben und Eingaben nur aus Leerzeichen gelten als fehlende Angaben.
- Unterschiedliche Großschreibung oder zusätzliche Leerzeichen im Kindernamen
  dürfen die Ein-Konto-Regel nicht umgehen.
- Wird das Speichern unterbrochen oder schlägt die lokale Speicherung fehl,
  erscheint eine verständliche Fehlermeldung; es bleibt kein teilweise
  eingerichtetes Konto zurück.
- Wird das Löschen unterbrochen oder schlägt es fehl, darf kein teilweise
  gelöschtes Konto zurückbleiben. Die App meldet den tatsächlichen Zustand.
- Weder fehlendes Internet noch ein nicht erreichbares Schulregister verhindern
  das Anlegen, Anzeigen oder Löschen lokaler Konten.
- Zugangsdaten dürfen in Übersicht, Fehlermeldungen und Bestätigungsdialogen
  nicht offengelegt werden.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: Die App MUST auf Android ohne Family-Hub-Server starten und einen
  Zugang zur Registerkontenübersicht anbieten.
- **FR-002**: Die App MUST das Anlegen eines Kontos mit unterscheidbarem
  Kindernamen, Schule, Registerbenutzernamen und Registerpasswort ermöglichen.
- **FR-003**: Die Schule MUST aus Grundschule St. Martin und Mittelschule
  St. Martin auswählbar sein; freie oder unbekannte Schulwerte dürfen nicht
  gespeichert werden.
- **FR-004**: Die App MUST fehlende Pflichtangaben vor dem Speichern benennen und
  darf unvollständige Konten nicht anlegen.
- **FR-005**: Die App MUST genau ein gespeichertes Schulkonto pro Kind zulassen;
  Kindernamen, die sich nur durch Großschreibung oder äußere Leerzeichen
  unterscheiden, gelten für diese Regel als gleich.
- **FR-006**: Die App MUST Konto und Zugangsdaten dauerhaft auf dem Handy in
  einer lokalen Datenbank speichern, sodass sie nach App-Neustart offline verfügbar
  sind. Das Datenschema MUST spätere Migrationen ohne Verlust bestehender Konten
  ermöglichen.
- **FR-007**: Zugangsdaten MUST geschützt gespeichert werden. Das Passwort darf
  nach dem Speichern weder in der Oberfläche noch in Protokollen,
  Absturzberichten oder ungeschützten Sicherungen erscheinen.
- **FR-008**: Die Übersicht MUST jedes gespeicherte Konto genau einmal mit Kind
  und Schule zeigen; ohne Konten MUST sie einen verständlichen Leerzustand zeigen.
- **FR-009**: Die App MUST vor dem Löschen eines Kontos eine Bestätigung einholen
  und bei Abbruch alle Daten erhalten.
- **FR-010**: Nach bestätigtem Löschen MUST die App das Konto, seine
  Zugangsdaten und alle ihm zugeordneten lokalen Einträge entfernen.
- **FR-011**: Anlegen und Löschen MUST jeweils vollständig gelingen oder den
  vorherigen Zustand erhalten; ein Fehler MUST verständlich angezeigt werden.
- **FR-012**: Anlegen, Anzeigen und Löschen MUST ohne Internetverbindung und
  ohne Prüfung der Zugangsdaten am Schulregister funktionieren.
- **FR-013**: Die App MUST Kind und Schule auch mit vergrößerter Android-Schrift
  lesbar und die Aktionen eindeutig beschriftet darstellen.

### Key Entities *(include if feature involves data)*

- **Kind**: Lokale, unterscheidbare Bezeichnung einer Person, der genau ein
  Schulkonto zugeordnet ist. Ein eigenständiges Kinderprofil ist hier nicht
  erforderlich.
- **Schulkonto**: Zuordnung zu Kind und unterstützter Schule mit
  Registerbenutzername, geschütztem Passwort und dauerhaftem lokalen Bestand.
  Zugehörige Registereinträge können in späteren Features an dieses Konto
  gebunden werden.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: In einem Nutzungstest können mindestens 9 von 10 Personen ohne
  Anleitung innerhalb von drei Minuten ein Konto für ein Kind einrichten.
- **SC-002**: Bei Tests mit mindestens zehn Konten für unterschiedliche Kinder
  bleiben 100 % der erfolgreich gespeicherten Konten nach App-Neustart und ohne
  Internet in der Übersicht sichtbar.
- **SC-003**: In allen geprüften Fällen erscheinen gespeicherte Konten genau
  einmal; ein zweites Konto für dasselbe Kind wird in 100 % der Versuche
  abgewiesen.
- **SC-004**: In allen geprüften Löschfällen bleibt ein abgebrochener Vorgang
  folgenlos; ein bestätigter Vorgang entfernt das ausgewählte Konto dauerhaft
  und erlaubt anschließend eine Neueinrichtung für dieses Kind.
- **SC-005**: Bei vergrößerter Android-Schrift können mindestens 9 von 10
  Testpersonen Kind, Schule, Speichern und Löschen eindeutig erkennen;
  Passwörter sind in keiner Kontoübersicht oder Löschbestätigung sichtbar.

## Assumptions

- Die bestätigte Vorgabe ist genau ein aktives Schulkonto je Kind. Sie ersetzt
  für dieses Feature die ältere Feature-Liste, die mehrere Konten pro Kind vorsah.
- Die App ist für die private Nutzung auf einem einzelnen Handy gedacht.
- Die Eingabe des Kindernamens dient der lokalen Zuordnung. Für zwei Kinder mit
  gleichem Rufnamen werden unterscheidbare Bezeichnungen eingegeben.
- Das Speichern prüft nur Vollständigkeit und unterstützte Schule, nicht die
  Gültigkeit der Zugangsdaten beim Register. Abgleich, Aufgaben, Termine,
  Mitteilungen und Benachrichtigungen sind spätere Features.
- Bearbeiten eines bestehenden Kontos, Export, Import und geräteübergreifender
  Abgleich gehören nicht zu diesem Feature. Ein falsches Konto kann gelöscht
  und erneut angelegt werden.
