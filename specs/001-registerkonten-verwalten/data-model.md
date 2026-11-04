# Data Model: Registerkonten auf Android und iOS

## Persistenz und Grenze der Verschlüsselung

Eine SQLCipher-Datenbank `family_hub_v2.db` enthält das vollständige Kontenmodell.
Alle nachfolgenden Felder sind innerhalb der Datei verschlüsselt. Benutzername
und Passwort werden im geöffneten Prozess verarbeitet, aber niemals unverschlüsselt
in Dateien, Debug-Ausgaben, Router-Parameter oder persistenten UI-State geschrieben.
Keine zusätzliche selbst entwickelte Kryptografie. UI-Abfragen projizieren nur
Konto-ID, Kindername und Schule.

## SchoolAccount

| Feld | Typ / Regel |
|------|-------------|
| `id` | INTEGER PRIMARY KEY AUTOINCREMENT; bei Android-Übernahme alte ID erhalten |
| `child_display_name` | TEXT NOT NULL; getrimmter, nicht leerer Anzeigename |
| `child_key` | TEXT NOT NULL UNIQUE; kanonische Kinderkennung |
| `school_code` | TEXT NOT NULL; CHECK auf `grundschule` oder `mittelschule` |
| `username` | TEXT NOT NULL; nicht nur Leerzeichen, Eingabewert unverändert |
| `password` | TEXT NOT NULL; nicht nur Leerzeichen, Eingabewert unverändert |

Tabellenname: `school_accounts`. Kind ist eine lokale Bezeichnung am Konto,
kein zusätzliches Profil. Die Schulen heißen „Grundschule St. Martin“ und
„Mittelschule St. Martin“. Spätere Fachdaten referenzieren die ID mit
`ON DELETE CASCADE`; `foreign_keys=ON` an jeder Verbindung setzen.

## Validierung und Normalisierung

- Fehlende/blanke Angaben vor Speicherung am betroffenen Feld melden.
- Anzeigename außen trimmen. `child_key`: NFC, sprachunabhängige Kleinschreibung,
  erneut NFC; nicht `toLocaleLowerCase` mit Gerätelocale verwenden.
- Kotlin-Trim-/Whitespace- und Unicode-Fälle als gemeinsame Fixtures prüfen,
  insbesondere Umlaute, kombinierende Zeichen, I/İ und Unicode-Leerzeichen.
  Keine unbemerkte Identitätsänderung bei der Migration: alte Keys gegen neue
  Normalisierung prüfen; bei Konflikt gesamte Übernahme ohne Quelländerung stoppen.
- SQL-UNIQUE-Constraint entscheidet auch bei gleichzeitigem Speichern über
  Duplikate. Beliebige SQL-Fehler nicht pauschal als Duplikat melden.
- Benutzername und Passwort nur zur Prüfung auf leere Eingaben trimmen, ihre
  gespeicherten Werte einschließlich Randzeichen unverändert erhalten.

## Schema und Transaktionen

Neuer Schema-Strang beginnt bei `PRAGMA user_version=1`; er ist unabhängig von
Room-Version 1. Versionierte SQL-Dateien unter `mobile/migrations/` dokumentieren
jede Änderung. Migrationen laufen exklusiv in einer Transaktion; unbekannte neuere
Versionen oder Integritätsfehler blockieren den Start mit lesbarer Fehlermeldung.
Kein `DROP`/Reset als Fehlerbehandlung. Alte Schema-Fixtures werden mit echten
verschlüsselten Datenbanken auf beiden Plattformen geprüft.

Anlage: validieren, eine exklusive Transaktion mit INSERT, commit, erst dann
Erfolg anzeigen. Löschung: nach Bestätigung Konto und abhängige Daten in einer
Transaktion löschen; Fehler vor Commit rollen vollständig zurück. Keine
SecureStore-Änderung pro Konto. Bei Prozessabbruch nach Commit ist nach Neustart
der bestätigte Datenbankstand maßgeblich; Commit-Unklarheit durch erneutes Lesen
auflösen statt ein zweites Mal blind zu speichern.
Sämtliche Abfragen innerhalb einer exklusiven Transaktion verwenden deren
Transaktionsobjekt; keine parallelen Schreibzugriffe über die Hauptverbindung.

Löschen bezeichnet logisches Entfernen aus dem App-Datenbestand, keine Zusage
forensischer Löschung auf Flash-Speicher. `secure_delete=ON`, kontrollierte
WAL-Checkpoints und ausgeschlossene Sicherungen reduzieren verbleibende Kopien;
kein Logging von SQL-Parametern oder vollständigen Fehlerobjekten.

## Schlüssel und Bootstrap

Ein zufälliger 32-Byte-Schlüssel pro Installation in SecureStore, nicht je Konto.
Schlüssel nie im Quellcode, Konfigurations-Environment oder in Backups ablegen.
Initialisierung serialisieren, damit parallele Screens keine Schlüssel erzeugen.

Der atomar geschriebene Marker `installation.json` enthält `format_version=1`,
eine zufällige `installation_id` und `phase` (`provisioning` oder `ready`), keine
Geheimnisse. SecureStore enthält unter der bestehenden Schlüsselkennung einen
kleinen versionierten Datensatz mit derselben Installationskennung und dem
32-Byte-Key. Beide Formate werden vor Nutzung validiert.

Die Regeln werden von oben nach unten ausgewertet; eine passende Regel beendet
die Auswahl. Legacy-Erkennung erfolgt vor einem frischen Initialisierungspfad.

| Priorität / Befund | Verhalten |
|-------------------|-----------|
| 1. Ziel-DB vorhanden | Lesbaren, zur Markerkennung passenden Key verlangen; SQLCipher-Version prüfen, Key setzen, Integrität/Schema prüfen. Fehlender/beschädigter Marker oder fehlender/falscher/unzugänglicher Key: Fehler, Dateien erhalten, keinen Key neu erzeugen. Bei `provisioning` nur Schema-Initialisierung beenden, danach Marker auf `ready` setzen. |
| 2. Keine Ziel-DB; Marker beschädigt oder `ready` | Inkonsistenter Bestand: sichtbarer Fehler, keine automatische Neuanlage/Bereinigung. |
| 3. Keine Ziel-DB; gültiger Marker `provisioning` | Bei zur Installationskennung passendem Key genau diesen wiederverwenden. Fehlt der Key oder gehört er zu einer anderen Installation, neuen passenden Key sicher speichern und zurücklesen. Temporärer Zugriffsfehler: Retry ohne Änderung. Ziel-DB initialisieren/prüfen und Marker atomar auf `ready` setzen. |
| 4. Keine Ziel-DB, kein Marker; Legacy-DB vorhanden | Zuerst Quellbestand gemäß Migrationsvertrag validieren, niemals Quelle/Alias zurücksetzen. Danach neue Installationskennung mit `provisioning` schreiben und ausschließlich das neue Ziel wie in Regel 5 initialisieren. |
| 5. Keine Ziel-DB, kein Marker, keine Legacy-DB | Eindeutig frische Installation: ZUERST Marker mit neuer Kennung und `provisioning` atomar schreiben. Dann nur einen bekannten alten SecureStore-Datensatz einer anderen Kennung ersetzen, neuen Key schreiben/zurücklesen, Ziel-DB samt Schema initialisieren/prüfen und Marker atomar auf `ready` setzen. |

**Reihenfolge-Invariante**: Kein neuer SecureStore-Key vor dauerhaft geschriebenem
`provisioning`-Marker; keine Kontoanlage und kein Legacy-Import vor dauerhaftem
`ready`-Marker. Bis dahin darf die neue DB nur Schema enthalten. Dadurch kann
Regel 3 ohne existierende DB keine bereits importierten Konten überschreiben.
`ready` bezeichnet ausschließlich den fertig initialisierten Zielspeicher;
Legacy-Import/Bereinigung haben ihren eigenen Status und sperren die UI weiter.
Dateibefunde schließen Nebendateien ein: verwaiste WAL-/Journaldateien ohne
Hauptdatei sind kein eindeutig frischer Bestand und führen zum Fehler.

Marker und DB liegen im nicht gesicherten App-Verzeichnis. iOS-Keychain-Reste
allein sind kein wiederhergestelltes Konto. Ein Absturz nach Marker-Schreiben,
Key-Speichern, DB-Erstellung oder vor/nach `ready` ist je als Neustartfall zu testen.
Bei Deinstallation/Neugerät ist keine Wiederherstellung zugesagt. Ein Key wird
nicht beim Löschen des letzten Kontos entfernt, damit die leere DB lesbar bleibt.

## Interner Migrationsstatus

`legacy_migration` enthält einen einzigen Datensatz: Quellversion, Quellkontoanzahl
und Status `imported` oder `complete`; keine Zugangsdaten oder Kontonamen. Import
und Status `imported` werden gemeinsam mit allen Konten committed. Der Status
steuert idempotentes Wiederaufnehmen und Bereinigung gemäß Migrationsvertrag.
