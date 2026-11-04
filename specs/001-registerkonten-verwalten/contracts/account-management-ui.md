# UI Contract: Registerkonten auf Android und iOS verwalten

Das Feature arbeitet vollständig lokal. Gleiche fachliche Zustände gelten auf
Android und iOS; Zurück-Navigation folgt den jeweiligen Plattformkonventionen.

## Start und Kontenübersicht

Nach sicherer Speicherinitialisierung erscheint die Kontenübersicht. Während einer
Altdatenübernahme wird ein verständlicher Fortschrittszustand angezeigt; bis zum
Abschluss sind Änderungen gesperrt. Ein Fehler zeigt „Gespeicherte Konten konnten
nicht geöffnet werden“ mit erneutem Versuch. Ein Speicher-/Migrationsfehler darf
niemals als erfolgreicher Leerzustand erscheinen. Kein automatischer Reset.

Jedes Konto erscheint genau einmal mit Kind und Schule. Keine Zugangsdaten,
Chiffrate oder Schlüssel in der Ansicht. Ohne Konten erklärt ein Leerzustand die
Aktion „Schulkonto hinzufügen“. „Schulkonto löschen“ öffnet die Bestätigung mit
Kind und Schule. Nach erfolgreichen Änderungen wird aus der Datenbank neu gelesen;
beim Zurückkehren in den Vordergrund ebenfalls den aktuellen Stand laden.

## Schulkonto anlegen

| Feld | Sichtbares Verhalten |
|------|---------------------|
| Kind | Lokale unterscheidbare Bezeichnung |
| Schule | Grundschule St. Martin oder Mittelschule St. Martin |
| Benutzername | Nach Speichern nicht in der Übersicht anzeigen |
| Passwort | Verdecktes Eingabefeld; nicht in Bestätigungen wiedergeben |

Speichern verhindert Doppelklicks während des laufenden Vorgangs. Nach Commit
kehrt die App zur Übersicht zurück; das bedeutet keine Prüfung am Register.
Fehlende Angaben erscheinen am jeweiligen Feld; Duplikate erklären die Ein-Konto-Regel.
Speicherfehler erhalten das Formular und melden den tatsächlichen Zustand ohne
Geheimnisse. Nicht gespeicherte Eingaben liegen ausschließlich im lokalen
Formular-State und werden nach Erfolg oder Verlassen verworfen.

## Schulkonto löschen

Der Dialog nennt Kind und Schule und erklärt das Entfernen von Konto,
Zugangsdaten und zugehörigen lokalen Daten. „Abbrechen“ ändert nichts.
„Löschen“ ist während einer laufenden Operation gegen Mehrfachauslösung geschützt.
Erst nach Commit verschwindet das Konto; bei Fehler bleibt der vorherige Bestand
und die UI bietet einen erneuten Versuch. Danach ist eine Neueinrichtung für
dasselbe Kind möglich. Andere Konten bleiben unverändert.

## Gemeinsame Regeln und Abnahme

Alle Aktionen offline und ohne Server. Keine Registeranmeldung, kein behaupteter
Abgleichstatus, keine Netzwerk-/Benachrichtigungs-Berechtigungsabfrage. Technisch
benötigte Development-Netzwerkverbindungen sind keine Produktvoraussetzung.
Systemschrift mindestens zweifach vergrößert prüfen; Formular und Aktionen müssen
mit Tastatur und auf kleinen Displays erreichbar bleiben. VoiceOver und TalkBack
bekommen verständliche Labels und Fokusführung für Dialoge und Feldfehler.
Akzeptanzszenarien aus `spec.md` auf beiden Plattformen ausführen; native
Speichernachweise siehe `../quickstart.md`.
