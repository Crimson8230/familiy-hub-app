# Data Model: Registerkonten

## Übersicht

Für dieses Feature ist ein Kind eine lokale Bezeichnung am Schulkonto, kein
eigenständiger Datensatz. Die persistente Datenbank enthält genau eine
`school_accounts`-Zeile je normalisiertem Kindernamen. Spätere Aufgaben,
Termine und Mitteilungen können die stabile Konto-ID referenzieren.

## SchoolAccount

| Feld | Bedeutung | Regel |
|------|-----------|-------|
| `id` | Stabile lokale Konto-ID | Automatisch erzeugt; Primärschlüssel |
| `child_display_name` | Für die Familie sichtbarer Kindername | Getrimmt, nicht leer; einzige sichtbare Personenbezeichnung |
| `child_key` | Kanonische Kennung für die Ein-Konto-Regel | Eindeutig indexiert; aus `child_display_name` abgeleitet |
| `school_code` | Zugeordnete Schule | Nur `grundschule` oder `mittelschule` |
| `credentials_ciphertext` | Verschlüsselter Benutzername und verschlüsseltes Passwort | Nicht leer; niemals als UI-Feld geladen |
| `credentials_iv` | Zufälliges AES-GCM-IV | Pro Verschlüsselung neu; zusammen mit Chiffrat gespeichert |
| `credentials_format_version` | Format der verschlüsselten Zugangsdaten | Anfangswert `1`; ermöglicht spätere Formatmigration |

Die Bezeichnungen der Schulen in der UI sind „Grundschule St. Martin“ und
„Mittelschule St. Martin“. Der Inhalt des Chiffrats enthält Benutzername und
Passwort als getrennte Felder. Der nicht exportierbare Schlüssel liegt
ausschließlich im Android Keystore und gehört nicht zur Datenbank.

## Validierung und Identität

1. `child_display_name`, Benutzername und Passwort dürfen nach Prüfung nicht
   leer oder reine Leerzeichen sein. Die Benutzername-/Passwortwerte werden für
   spätere Registeranmeldung unverändert verschlüsselt; Anzeige und Schlüssel
   des Kindes verwenden den getrimmten Namen.
2. `child_key` entsteht aus Entfernen äußerer Leerzeichen, Unicode-NFC und
   Kleinschreibung mit einer sprachneutralen Locale. Der Schlüssel wird aus
   dem gespeicherten Anzeigenamen abgeleitet und ist innerhalb der Datenbank
   eindeutig. `Anna`, ` anna ` und `ANNA` sind dasselbe Kind.
3. Die Schule wird aus einer geschlossenen Auswahl gewählt. Ein unbekannter
   Wert ist ein Validierungsfehler und darf nicht gespeichert werden.
4. Die Übersicht liest nur `id`, `child_display_name` und `school_code`.
   Zugangsdaten werden erst für einen späteren Registerabgleich entschlüsselt;
   diese Operation gehört nicht zu diesem Feature.

## Beziehungen und Löschung

Aktuell besteht kein eigenständiger Kind-Datensatz. Künftige Registereinträge
referenzieren `SchoolAccount.id` über einen Fremdschlüssel mit `ON DELETE CASCADE`.
Beim bestätigten Löschen werden das Konto und sämtliche abhängigen lokalen
Einträge in einer Transaktion entfernt. Eine separate Liste gelöschter Konten
oder ein Papierkorb sind nicht vorgesehen.

## Zustandsübergänge

| Von | Aktion | Nach | Fehlerfall |
|-----|--------|------|------------|
| Nicht vorhanden | Gültige Eingaben verschlüsseln und speichern | Aktiv | Keystore-, Validierungs-, Duplikat- oder Datenbankfehler: kein Konto entsteht |
| Aktiv | App schließen oder Gerät offline nehmen | Aktiv | Konto bleibt lokal lesbar |
| Aktiv | Löschen auswählen, dann abbrechen | Aktiv | Keine Datenänderung |
| Aktiv | Löschung bestätigen | Nicht vorhanden | Bei Datenbankfehler bleibt Konto samt zugehörigen Daten aktiv |

Die Datenbank beginnt mit Schema-Version 1. Das Schema wird versioniert und
exportiert. Jede spätere Änderung braucht eine explizite Migration samt Test,
der bestehende Konten und Chiffrate erhält.
