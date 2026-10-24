# Implementation Plan: Registerkonten auf Android verwalten

**Branch**: `main` (kein `before_plan`-Branch-Hook vorhanden) | **Date**: 2026-10-24 | **Spec**: [spec.md](spec.md)

**Input**: Feature specification from `specs/001-registerkonten-verwalten/spec.md`

## Summary

Eine einzelne native Android-App bietet eine offline verfügbare Kontenübersicht,
ein Formular zum Anlegen und eine bestätigte Löschaktion. Pro Kind ist genau ein
Schulkonto erlaubt. Kontometadaten und verschlüsselte Zugangsdaten liegen in einer
lokalen Datenbank; der Schlüssel bleibt im Android Keystore. Der Registerabgleich
und jede Serverkomponente sind nicht Teil dieses Features. Die Entscheidungen und
Alternativen stehen in [research.md](research.md).

## Technical Context

**Language/Version**: Kotlin 2.x; beim Anlegen des Gradle-Projekts eine stabile,
zum Android Gradle Plugin und Compose Compiler passende Version festschreiben

**Primary Dependencies**: AndroidX Compose, Lifecycle ViewModel, Kotlin Coroutines,
Room 2.8.5, Android Keystore; KSP für die Room-Codegenerierung

**Storage**: Room über SQLite für Kind und Schule sowie AES-GCM-Chiffrat für
Benutzername und Passwort mit IV in derselben Kontenzeile; nicht exportierbarer
AES-Schlüssel im Android Keystore

**Testing**: JUnit für Validierung und Namensnormalisierung; Android-Instrumentierung
für Room, Keystore, Migration, Offline-Neustart und Compose-Oberfläche

**Target Platform**: Android, `minSdk 23`, `compileSdk 36`, `targetSdk 36`;
ein Android-Handy oder Emulator für Instrumentierung

**Project Type**: einzelne native Android-App ohne Backend

**Performance Goals**: Kontenübersicht mit zehn Konten lokal in höchstens
einer Sekunde sichtbar; Speichern oder Löschen in höchstens zwei Sekunden auf
einem unterstützten Testgerät

**Constraints**: offline nutzbar; genau ein Konto je normalisiertem Kindernamen;
kein Register-Netzwerkzugriff in diesem Feature; keine Klartext-Zugangsdaten auf
dem Datenträger, in Logs oder in Backups; Anlage und Löschung atomar

**Scale/Scope**: ein Gerät und ein Haushalt; mindestens zehn Kinderkonten;
Kontenübersicht, Anlegeformular, Löschbestätigung; keine Bearbeitung oder
Synchronisierung

## Constitution Check

*GATE: vor Phase 0 geprüft und nach Phase 1 erneut geprüft; beide Prüfungen bestanden.*

| Vorgabe | Umsetzung und Prüfnachweis | Ergebnis |
|--------|----------------------------|----------|
| I. Native Android-App und Offline-Nutzung | Ein App-Modul ohne Server; Room bleibt nach Neustart/offline lesbar; versioniertes Schema und Migrationstests für spätere Versionen | Pass |
| II. Schutz von Familien- und Zugangsdaten | AES-GCM mit Keystore-Schlüssel; kein Passwort in UI/Logs; Datenbank aus Cloud- und Geräteübertragungs-Backup ausgeschlossen; Löschung entfernt Konto und abhängige Daten | Pass |
| III. Lesender und robuster Registerzugriff | Dieses Feature verbindet sich noch nicht mit dem Register und fordert keine Internet-Berechtigung an; spätere Anbindung bleibt getrennt | Pass |
| IV. Verlässliche Daten und ehrlicher Abgleichstatus | Kein Abgleich und keine Benachrichtigung in diesem Feature; die UI behauptet keinen Abgleichstatus | Pass |
| V. Fachliche Treue und Verifikation | Schulwerte entsprechen der Feature-Liste; fachliche Registerverarbeitung bleibt bei F03 bis F07 und wird hier nicht vorweggenommen | Pass |
| Produktgrenzen und Qualitätsnachweise | Ein Konto je Kind gemäß bestätigter Klärung; zugängliche Beschriftungen und Schriftgrößen; Tests für Speicherung, Duplikate, Löschung und Fehlerfälle | Pass |

Die bestätigte Ein-Konto-Regel der aktuellen Spec geht für dieses Feature der
älteren Feature-Liste mit mehreren Konten je Kind vor. Es gibt keine
Constitution-Verletzung und keine offene technische Klärung.

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
│   └── account-management-ui.md
├── checklists/
│   └── requirements.md
└── tasks.md                 # entsteht erst mit $speckit-tasks
```

### Source Code (repository root)

```text
settings.gradle.kts
build.gradle.kts
gradle/libs.versions.toml
gradlew.bat
app/
├── build.gradle.kts
├── schemas/                # versionierte Room-Schemas
└── src/
    ├── main/
    │   ├── AndroidManifest.xml
    │   └── java/com/familyhub/app/
    │       ├── MainActivity.kt
    │       ├── data/accounts/   # Room-Entity, DAO, Datenbank, Repository
    │       ├── security/        # Keystore und AES-GCM
    │       └── ui/accounts/     # Übersicht, Formular, Dialog, ViewModel
    ├── test/                # Validierung und Namensnormalisierung
    └── androidTest/         # Datenbank, Keystore, Migration und UI
```

**Structure Decision**: Eine Android-App als einziges Laufzeitmodul im
Repository. `app/` trennt Oberfläche, lokale Kontendaten und Kryptografie nach
Verantwortung; ein API- oder Servermodul wäre für die spezifizierten Abläufe ohne
Nutzen. Alle angegebenen Source-Pfade sind geplante Pfade und werden erst bei
der Implementierung angelegt.

## Phase 0: Research

Die Entscheidungen in [research.md](research.md) lösen Plattformversion,
Persistenz, Verschlüsselung, Backup, Transaktionen, UI und Teststrategie auf.
Für Phase 1 bleibt keine technische Entscheidung offen.

## Phase 1: Design and Contracts

- [data-model.md](data-model.md) definiert genau eine Kontenzeile pro
  normalisiertem Kindernamen, gültige Schulwerte und die Lebenszyklen.
- [contracts/account-management-ui.md](contracts/account-management-ui.md)
  definiert die sichtbaren Zustände und Aktionen der Android-Oberfläche.
- [quickstart.md](quickstart.md) beschreibt automatische und manuelle
  Ende-zu-Ende-Prüfungen nach der Implementierung.

**Constitution Check nach Design**: bestanden. Das Modell setzt die Ein-Konto-Regel
mit einem eindeutigen Schlüssel durch; Chiffrat und Kontometadaten werden
gemeinsam gespeichert und gelöscht. Der UI-Vertrag legt keine Zugangsdaten offen
und benötigt für keinen seiner Abläufe einen Server. Die Validierung deckt
Offline-Betrieb, Neustart, Löschung, Fehler und vergrößerte Schrift ab.
