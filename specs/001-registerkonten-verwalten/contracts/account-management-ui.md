# UI Contract: Registerkonten verwalten

Dieser Vertrag beschreibt sichtbare Android-Aktionen und Zustände. Er ist keine
Netzwerk-API; das Feature arbeitet vollständig lokal.

## Kontenübersicht

**Eingang**: App-Start oder Rückkehr aus dem Anlegeformular.

**Anzeige**: Jedes gespeicherte Konto erscheint genau einmal mit Kind und
Schule. Benutzername, Passwort und Chiffrat werden nicht gezeigt. Ohne Konten
erscheint eine Erklärung mit der Aktion „Schulkonto hinzufügen“.

**Aktionen**: „Schulkonto hinzufügen“ öffnet das Formular. „Schulkonto löschen“
öffnet für das ausgewählte Konto eine Bestätigung mit Kind und Schule.

**Fehlerzustand**: Kann die lokale Datenbank nicht gelesen werden, erscheint
eine verständliche Meldung mit erneutem Versuch; die UI zeigt keine leere Liste
als scheinbar korrekten Datenstand.

## Schulkonto anlegen

| Feld | Sichtbares Verhalten |
|------|---------------------|
| Kind | Freitext für eine unterscheidbare lokale Bezeichnung |
| Schule | Auswahl: Grundschule St. Martin oder Mittelschule St. Martin |
| Benutzername | Eingabe, die nach dem Speichern nicht in der Übersicht erscheint |
| Passwort | Geschütztes Eingabefeld; Inhalt bleibt verdeckt und wird nicht in einer Bestätigung wiedergegeben |

**Erfolg**: „Speichern“ legt ein Konto an und führt zur Übersicht zurück, die
Kind und Schule genau einmal zeigt. Ein erfolgreicher lokaler Speichervorgang
behauptet nicht, dass die Zugangsdaten am Schulregister gültig sind.

**Validierungsfehler**: Fehlende Angaben werden am jeweiligen Feld angezeigt;
das Formular bleibt mit den vorhandenen Eingaben geöffnet. Bei bereits
vorhandenem `child_key` erklärt die UI: Für dieses Kind ist schon ein
Schulkonto gespeichert. Eine zweite Zeile entsteht nicht.

**Speicherfehler**: Die UI meldet, dass das Konto nicht gespeichert wurde. Nach
erneutem Öffnen der Übersicht erscheint kein teilweise angelegtes Konto.
Keystore-Fehler werden ohne Offenlegung von Zugangsdaten gemeldet.

## Schulkonto löschen

**Bestätigung**: Der Dialog benennt Kind und Schule und erklärt, dass Konto,
Zugangsdaten und zugehörige lokale Daten entfernt werden. Er bietet „Abbrechen“
und „Löschen“ als klar unterscheidbare Aktionen.

**Abbrechen**: Der Dialog schließt; die Übersicht und Daten bleiben gleich.

**Erfolg**: Nach „Löschen“ verschwindet das ausgewählte Konto. Andere Konten
bleiben erhalten. Für dasselbe Kind kann danach erneut ein Konto angelegt werden.

**Fehler**: Die UI meldet eine fehlgeschlagene Löschung und zeigt den weiterhin
vorhandenen Datensatz. Es gibt keinen teils gelöschten Zustand.

## Gemeinsame Regeln

- Alle Aktionen funktionieren ohne Internet und ohne Family-Hub-Server.
- Bedienelemente und Fehlermeldungen haben verständliche, für Hilfstechnologien
  zugängliche Beschriftungen und bleiben bei vergrößerter Schrift nutzbar.
- Der Kontenbildschirm zeigt keinen Abgleichstatus und fordert keine
  Netzwerk- oder Benachrichtigungsberechtigung an.
