# Implementation Plan: Registerkonten auf Android und iOS verwalten

**Branch**: `main` (tatsächlicher Git-Branch; Setup meldet als Featurekennung
`001-registerkonten-verwalten`) | **Date**: 2026-10-24 | **Spec**: [spec.md](spec.md)

**Input**: `specs/001-registerkonten-verwalten/spec.md`; Constitution 2.0.0;
Umstellung auf React Native, Expo und TypeScript mit SQLite, sicherem
Plattformspeicher, Offline-Nutzung und eigenen Development Builds.

## Summary

Die vorhandene Kontenverwaltung wird mit React Native neu umgesetzt und auf iOS
erweitert. Kontenübersicht, Anlage, Löschbestätigung und die Ein-Konto-Regel bleiben
fachlich erhalten. Eine SQLCipher-verschlüsselte SQLite-Datenbank enthält Metadaten
und Zugangsdaten; nur ihr zufälliger Schlüssel liegt in Expo SecureStore, abgesichert
über Android Keystore beziehungsweise iOS Keychain. Dadurch bleiben Kontenänderungen
innerhalb einer Datenbanktransaktion atomar. Kein Backend und kein Registerzugriff.

Bestehende Android-Konten werden bei einem signaturgleichen Update über ein eng
begrenztes natives Kompatibilitätsmodul übernommen. Eine Neuinstallation auf iOS
beginnt leer; ein Gerätewechsel oder Export/Import wird hier nicht implementiert.
Details: [research.md](research.md), [Migrationsvertrag](contracts/legacy-account-migration.md).

## Technical Context

**Language/Version**: TypeScript im Strict-Modus; Expo SDK 58, React Native 0.88,
React 19.3, Node.js 22 LTS ab 22.13. Die SDK-kompatible TypeScript-Version und
sämtliche Paket-Patchversionen werden bei der Implementierung im Lockfile fixiert;
keine Beta-/Canary-Versionen. Versionsbasis siehe Research.

**Primary Dependencies**: Expo, Expo Router (Stack), expo-dev-client, expo-sqlite
mit `useSQLCipher: true` auf beiden Plattformen, expo-secure-store, expo-crypto;
React Native Core für die Oberfläche. Lokale Expo-Module für Android-Altdaten und
iOS-Backup-Ausschluss; Config Plugin für Backup-Regeln und native Konfiguration.

**Storage**: `family_hub_v2.db` in einem privaten, nicht gesicherten Verzeichnis;
SQLCipher mit zufälligem 256-Bit-Schlüssel aus expo-crypto. SecureStore-Schlüssel
`familyhub.database.key.v1`, eigener Service `familyhub.database`; iOS
`WHEN_UNLOCKED_THIS_DEVICE_ONLY`, `requireAuthentication: false`. Keine geheimen
Werte in AsyncStorage, Router-Parametern, globalem UI-State oder Logs.
Der Adapter serialisiert alle Operationen auf jeweils frisch geschlüsselten
Verbindungen und startet exklusive Transaktionen erst nach dem Key-Setup;
Begründung zum installierten Expo-Helper siehe `research.md`, Abschnitt 2.

**Testing**: jest-expo und React Native Testing Library für Validierung und UI;
Integrationstests gegen echte SQLCipher-/SecureStore-Instanzen in eigenen Builds,
Maestro für die gemeinsamen Benutzerabläufe. Native Android-Tests für
Legacy-Entschlüsselung und signaturgleiche Update-Installation. Mocks allein
belegen weder Verschlüsselung noch Offline-Persistenz oder Plattformschutz.
Der Host-Runner führt Kotlin-Instrumentierung und TS-Integration ausdrücklich
getrennt aus und wertet beide aus; Gradle-Einbindung, Buildprofile und Exitregeln
stehen im [Testvertrag](contracts/native-test-execution.md).

**Target Platform**: Android 7+ (API 24, compile SDK 37, target SDK 36),
iOS 16.4+; iOS-Builds mit macOS/Xcode 26.4+ oder EAS. Android 6/API 23 aus der
bisherigen App wird vom gewählten Stack nicht mehr unterstützt: vorhandene
Installation bleibt dort nutzbar, erhält aber diese neue App-Version nicht.

**Project Type**: Eine plattformübergreifende Mobile-App ohne Backend.

**Performance Goals**: Zehn Konten innerhalb einer Sekunde nach abgeschlossener
Speicherinitialisierung sichtbar; Speichern/Löschen jeweils höchstens zwei
Sekunden. Auf beiden Plattformen in einem Build ohne Dev-Overhead messen;
Start- und einmalige Migrationszeit separat protokollieren.

**Constraints**: Offline und nach Prozessneustart nutzbar; genau ein Konto je
normalisiertem Kindernamen; atomare Anlage/Löschung; keine destruktive
Fehlerbehandlung bei fehlendem Schlüssel; keine automatische Sicherung oder
Übertragung von Konten. Zugriff bei gesperrtem iOS-Gerät ist hier nicht erforderlich.

**Scale/Scope**: Ein Haushalt pro Gerät, mindestens zehn Konten; Übersicht,
Anlage und Löschdialog sowie Erhalt vorhandener Android-Konten. Abgleichstatus,
Registerabgleich, Aufgaben, Mitteilungen und Benachrichtigungen bleiben spätere
Features. Dies schließt F01 noch nicht vollständig ab.

## Constitution Check

*Gate vor Research und nach Design: bestanden, keine begründungsbedürftige Abweichung.*

| Prinzip | Entscheidung und Nachweisplan | Ergebnis |
|---------|-------------------------------|----------|
| I. Android/iOS und offline | Expo/TypeScript, eigene Builds beider Plattformen, persistente SQLite-Daten und explizite Migrationen; Neustart im Flugmodus testen | Pass |
| II. Datenschutz | SQLCipher + Keystore/Keychain, kein Klartext-Fallback; atomare Kontolöschung, Backup-Ausschluss und Fehlerfälle auf beiden Plattformen prüfen | Pass |
| III. Registerzugriff | Kein Registerzugriff in diesem Feature, lokale Einrichtung prüft keine echte Anmeldung | Pass |
| IV. Verlässlicher Status | Kein behaupteter Abgleich, keine Benachrichtigungen oder Hintergrundarbeit; deren Berechtigungsprüfungen folgen mit dem jeweiligen Feature | Pass |
| V. Fachliche Treue | Schulen und Ein-Konto-Regel erhalten; Normalisierung gegen Kotlin-Fälle prüfen | Pass |
| Qualitätsnachweise | Separate Plattformberichte; sichere Speicherung und Migration nativ prüfen, bisherige Kotlin-Tests gelten nicht als Expo-Nachweis | Pass |

Nach Phase 1 erneut geprüft: Die Verträge vermeiden verteilte Transaktionen
zwischen SecureStore und SQLite pro Konto und erhalten Altdaten bei Fehlern.
Die Analysebefunde A1/U1/U2/C1 wurden im Design nachgeschärft: priorisierte
Bootstrap-Regeln mit Installationskennung, konkrete Kotlin-Instrumentierung,
eigenständige Legacy-Testfixture und FR-014/FR-015/SC-006 samt Akzeptanzszenarien.
Vor Research und nach diesen Änderungen ist die Constitution-Prüfung bestanden;
keine Ausnahme ist erforderlich. Builds und Gerätenachweise bleiben ausstehend.

## Project Structure

### Documentation (this feature)

```text
specs/001-registerkonten-verwalten/
├── spec.md
├── plan.md
├── research.md
├── data-model.md
├── quickstart.md
├── contracts/
│   ├── account-management-ui.md
│   ├── legacy-account-migration.md
│   └── native-test-execution.md
├── tasks.md             # 59 Aufgaben, Implementierungsstatus in tasks.md
├── tasks-kotlin-archive.md # historischer Kotlin-Aufgabenstand
└── verification.md      # historischer Nachweis ausschließlich der Kotlin-App
```

### Source Code (repository root)

```text
mobile/                         # geplantes neues Expo-Projekt
├── package.json
├── package-lock.json
├── app.config.ts
├── eas.json
├── src/
│   ├── app/                    # Router: Layout, Kontenübersicht, Anlage
│   ├── features/accounts/      # Screens, Hooks, Validierung und Repository
│   └── storage/                # Bootstrap, Schlüsselzugriff, SQLite-Migrationen
├── modules/
│   ├── legacy-accounts/        # Android-Kompatibilität; iOS meldet keine Altdaten
│   └── storage-policy/         # iOS-Verzeichnis aus Backups ausschließen
├── plugins/                    # Android-Backup-Konfiguration
├── migrations/                 # versionierte SQL-Migrationen
├── tests/                      # Unit-, Komponenten- und native Integrationstests
│   ├── fixtures/legacy-app/    # eigenständig baubare, eingefrorene Kotlin-Testfixture
│   └── tools/                 # TS-/Instrumentierungs- und Upgrade-Hostrunner
└── .maestro/                    # gemeinsame Ende-zu-Ende-Szenarien
app/                            # vorhandene Kotlin-App während Übergangsphase
```

**Structure Decision**: Expo liegt in `mobile/`, damit bestehendes `app/` nicht
mit Expo-Routen oder generierten Android-Projekten kollidiert. `mobile/android/`
und `mobile/ios/` werden aus Config Plugins/Modulen erzeugt, Änderungen dort sind
keine alleinige Quelle der Konfiguration. Native Module bleiben versioniert.

## Phase 0: Research

[research.md](research.md) dokumentiert Versionen, sichere Speicherung,
Transaktionen, Build-/Teststrategie und den Erhalt alter Konten samt Alternativen.

## Phase 1: Design and Contracts

[data-model.md](data-model.md) beschreibt Schema, Validierung, Schlüssel-Lebenszyklus
und atomare Änderungen. Die Verträge definieren UI und Altdatenübernahme;
[quickstart.md](quickstart.md) legt die Plattformnachweise fest.

## Ersatz der Kotlin-Implementierung

1. Expo-Projekt parallel aufbauen; bestehende App, Gradle-Dateien und Nachweise
   bis zur erfolgreichen Umstellung unverändert als Referenz behalten.
2. Compose-Screens und ViewModels durch React-Native-Screens/Hooks ersetzen;
   Validator und Repository in TypeScript neu umsetzen. Room wird durch
   SQLCipher mit versionierten SQL-Migrationen ersetzt.
3. Nur den geprüften Legacy-Leser samt Entschlüsselung der Formate 1, 2 und 3
   als kleines Android-Expo-Modul übernehmen. Kotlin ist danach keine zweite
   Oberfläche oder zweite Fachlogik, sondern ausschließlich Update-Kompatibilität.
4. Android-Identität `com.familyhub.app`, Signaturschlüssel und erhöhte versionCode
   für echte Updates erhalten. Separates Development-Profil nutzt
   `com.familyhub.app.dev`; ein eigenes Upgrade-Testprofil verwendet die alte
   Identität und passende Testsignatur auf einem isolierten Testgerät.
5. Erst nach Android-/iOS-Nachweisen und erfolgreichen Upgrade-/Fehlertests
   die bisherige Android-App und ihre eigenständige Gradle-Buildkette in einer
   reviewbaren Änderung entfernen. Zuvor muss die eigenständig baubare
   Legacy-Testfixture unter `mobile/tests/fixtures/legacy-app/` aus einem frischen
   Checkout ohne das aktive Root-Projekt gebaut und für den Upgrade-Test verwendet
   worden sein. Historische Verifikation bleibt erhalten. Kein Löschen oder
   App-Umbau findet im Plan-Schritt statt.

## Auswirkungen auf die vorhandenen Tasks

Die Kotlin-Häkchen bleiben in `tasks-kotlin-archive.md` historisch erhalten.
Die 59 Expo-Tasks in `tasks.md` wurden mit `$speckit-tasks` auf diesen
präzisierten Plan abgestimmt. Ihre IDs bleiben erhalten. Folgende Ergänzungen
sind übernommen:

| Aufgaben | Übernommene Präzisierung |
|--------------------|-----------------------------|
| T006, T054, T058, T059 | Eigenständige eingefrorene Kotlin-Testfixture, Manifest und Seeder; Upgrade-Nachweis auch ohne Root-`app/` |
| T007, T009, T010, T015 | Markerformat, Key-Datensatz mit Installationskennung, priorisierte Regeln und Absturzfälle |
| T008, T012, T021, T023 | Separates Test-Plugin, konkreter AndroidJUnitRunner-Aufruf, native-test-Profil und beide Ergebnisgruppen |
| T034, T041, T049, T054 | FR-014/FR-015/SC-006 und neue Migrations-Akzeptanzszenarien zuordnen |

Vor `$speckit-implement` nun `$speckit-analyze` erneut ausführen. Die Constitution und der App-Code
werden durch diesen Plan nicht geändert.

## Prüfsequenz ab 2026-11-04: Android zuerst, iOS im Folgeschritt

Der Nutzer hat am 2026-11-04 die zeitliche Verschiebung der iOS-Grundlagenprüfung
freigegeben. Begründung: Entwicklung in einer Linux-VM auf Windows, kein Mac mit
Xcode verfügbar. Als dokumentierte zeitliche Ausnahme gemäß Constitution-Governance
schließt der vollständige Android-Nachweis T023/T060/T073 nur im Android-Umfang ab
und gibt T024 ff. zur Implementierung frei. Der gesamte bisherige iOS-Prüfumfang
bleibt als T087 offen: nach T031, vor T032/T034 (bei verfügbarer Mac-Umgebung früher).
Ein iOS-Simulator auf macOS genügt; ein physisches iPhone ist nicht erforderlich.
Keine iOS- oder vollständige Feature-/Releasefreigabe ohne diesen Nachweis;
Entfernung der alten Kotlin-App bleibt an sämtliche bisherigen Gates gebunden.
Dies ändert die Reihenfolge, nicht die plattformübergreifenden Produktanforderungen.
