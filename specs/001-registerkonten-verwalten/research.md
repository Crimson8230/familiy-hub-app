# Research: Umstellung der Kontenverwaltung auf Expo

**Datum**: 2026-10-24. Entscheidungen für die Planung; noch keine Builds ausgeführt.
Die Primärquellen wurden für diesen Plan geprüft.

## 1. Plattform und Versionen

**Decision**: Expo SDK 58 mit React Native 0.88 und React 19.3; Node 22 LTS ab
22.13, TypeScript strict. Android 7+ und iOS 16.4+; native Abhängigkeiten über
`expo install` passend zum SDK auflösen und mit npm-Lockfile fixieren.

**Rationale**: Gemeinsame Oberfläche und Fachlogik erfüllen Constitution 2.0.0.
Die aktuelle SDK-Matrix bestimmt zusammenpassende Versionen und Plattformuntergrenzen.
Android API 23 wird gegenüber der alten Kotlin-App aufgegeben; dort keine
Deinstallation oder Datenlöschung veranlassen.

**Alternatives considered**: Kotlin-only erfüllt iOS nicht; getrennte native
Apps verdoppeln die Implementierung; ältere SDKs nur für API 23 erhalten keine
Planungspräferenz. Unabhängig gewählte React-/React-Native-Versionen vermeiden.

Quelle: [Expo SDK-Matrix](https://docs.expo.dev/versions/latest/).

## 2. SQLite und sicherer Plattformzugriff

**Decision**: SQLCipher über expo-sqlite auf beiden Plattformen, SecureStore nur
für einen kleinen zufälligen Datenbankschlüssel. SQLCipher-Unterstützung vor jedem
ersten Datenzugriff über nichtleeres `PRAGMA cipher_version` nachweisen, Schlüssel
setzen, dann erst Schema lesen. Prepared Statements für Nutzereingaben;
serialisierte exklusive Transaktionen auf einer bereits geschlüsselten Verbindung
für Schreiboperationen und Migrationen.

**Implementierungsbefund**: In expo-sqlite 58.0.14 erzeugt
`withExclusiveTransactionAsync` über `Transaction.createAsync` eine weitere
Verbindung und übernimmt kein vorheriges `PRAGMA key`. Der App-Adapter öffnet
daher pro Operation eine eigene Verbindung mit `useNewConnection: true`, prüft
SQLCipher, setzt den Key und nutzt erst danach `BEGIN EXCLUSIVE`/Commit/Rollback.
Alle Abfragen bleiben in derselben seriellen Warteschlange. Der native Wrapper
wird nicht für ungeschlüsselte Transaktionsverbindungen verwendet. Die Option
unterbindet zugleich die Registrierung beim SQLite-Devtools-Inspektor.
Quelle: installierter, über Lockfile fixierter Code unter
`mobile/node_modules/expo-sqlite/src/SQLiteDatabase.ts`.

**Rationale**: Fachliche Entscheidung dieses Plans: Konto und Zugangsdaten liegen
in derselben verschlüsselten Transaktion. Anlage/Löschung brauchen dadurch keine
Kompensation zwischen Datenbank und Keychain. Zugangsstrings können größer als die
plattformabhängigen SecureStore-Wertegrenzen sein. Chiffrate werden nicht mehr
manuell im UI-/Repository-Code erzeugt.

**Alternatives considered**: Unverschlüsseltes SQLite/AsyncStorage mit Klartext
verletzt den Datenschutz. Je Konto ein SecureStore-Eintrag macht eine echte atomare
Änderung mit SQLite unmöglich. Eigene AES-Implementierung in JavaScript vergrößert
die Sicherheitsoberfläche ohne fachlichen Nutzen.

Quellen: [Expo SQLite/SQLCipher](https://docs.expo.dev/versions/latest/sdk/sqlite/),
[SecureStore](https://docs.expo.dev/versions/latest/sdk/securestore/).

## 3. Schlüssel, Sicherungen und Wiederherstellung

**Decision**: Kein biometrischer Prompt für Kontenoperationen. iOS-Schlüssel nur
auf diesem Gerät und im entsperrten Zustand verfügbar. Das private Verzeichnis
mit Datenbank, Journal/WAL/SHM, Installationsmarker und temporären Dateien wird aus
Backups ausgeschlossen. Android: `allowBackup=false` plus explizite Ausschlüsse
für Cloud- und Geräteübertragung, einschließlich SecureStore-Preferences.
iOS: lokales Expo-Modul setzt und überprüft `isExcludedFromBackup` am Verzeichnis
und nach Dateioperationen. Kein automatischer Export und kein Gerätewechsel.

**Rationale**: Betriebsentscheidung: Daten und Schlüssel sollen nicht getrennt
wiederhergestellt werden. SecureStore kann nach iOS-Neuinstallation alte Werte
enthalten. Ohne Datenbank werden alte bekannte Schlüssel nur nach eindeutigem
Neuinstallationsbefund ersetzt; mit vorhandener Datenbank bleibt ein fehlender
oder unlesbarer Schlüssel ein sichtbarer Fehler, kein Anlass zur Neuerzeugung.
Für F06 muss die dann nötige Verfügbarkeit bei gesperrtem Gerät gesondert geplant
und auf beiden Plattformen geprüft werden.

**Alternatives considered**: Schlüssel in der Datenbank schützt sie nicht;
Biometriepflicht behindert Offline-Bedienung und spätere Hintergrundarbeit;
SecureStore allein garantiert keine wiederherstellbare Sicherung.

Quellen: [SecureStore-Lebenszyklus und Backup](https://docs.expo.dev/versions/latest/sdk/securestore/),
[Apple Backup-Ausschluss](https://developer.apple.com/documentation/foundation/urlresourcekey/isexcludedfrombackupkey).

## 4. Bestehende Android-Konten

**Decision**: Verlustfreies Update auf demselben unterstützten Android-Gerät
über kleines Kotlin-Expo-Modul, welches die Room-Version 1 und Chiffratformate
1–3 liest. Ziel ist eine neue verschlüsselte Datei; die alte Datei wird niemals
als vermeintlich leere Expo-Datenbank geöffnet. Ablauf siehe Migrationsvertrag.

**Rationale**: Der vorhandene Schlüssel `family_hub_register_credentials_v1` ist
nicht exportierbar. Ein Update mit gleicher Identität und Signatur kann ihn im
alten App-Sandbox-Kontext zum Entschlüsseln verwenden. Eine neue Installation mit
anderer Kennung kann dies nicht. Ein CSV-/Klartext-Export wäre unnötig riskant und
Export/Import gehört laut Constitution nicht zu diesem Feature.

**Alternatives considered**: Alle Konten neu eingeben zu lassen wäre bei einem
gewöhnlichen Update ein vermeidbarer Datenverlust. Bloßes Kopieren der Room-Datei
macht weder ihre Zugangsdaten lesbar noch setzt es SQLCipher-Verschlüsselung um.
Ein vollständiges Weiterführen der alten Kotlin-App würde die Fachlogik duplizieren.

Quellen: vorhandene `app/src/main/java/com/familyhub/app/security/CredentialsCipher.kt`,
`FamilyHubApplication.kt`, `FamilyHubDatabase.kt` und `SchoolAccountEntity.kt`;
[Expo Modules API](https://docs.expo.dev/modules/overview/).

## 5. Eigene Builds und Nachweise

**Decision**: Development Builds mit expo-dev-client; zusätzlich eigenständig
startender Preview-Build mit eingebettetem JS-Bundle für Offline-Neustart und
Performanz. Android lokal; iOS lokal auf macOS oder optional EAS. Keine automatische
Veröffentlichung, kein Push-/Backend-Dienst erforderlich. Expo Go liefert keine
Abnahme für SQLCipher oder eigene Module.

**Rationale**: Native Konfiguration wird erst im eigenen Binary wirksam; ein
Metro-abhängiger Entwicklungsstart allein beweist keine Offline-Startfähigkeit.
Jest/Komponententests werden durch native Speicher-, Update- und Gerätetests ergänzt.

**Alternatives considered**: Nur Expo Go oder nur gemockte Speichertests würden
native Fehler und Backup-Verhalten übersehen. Store-Veröffentlichung ist kein
Bestandteil der Kontenverwaltung.

Quelle: [Expo Development Builds](https://docs.expo.dev/develop/development-builds/introduction/).

## 6. Eindeutiger Bootstrap nach Unterbrechungen (A1)

**Decision**: Installationsmarker mit Kennung und `provisioning` atomar VOR
Key-Schreiben anlegen; Key in SecureStore als kleinen versionierten Datensatz
mit derselben Kennung speichern. Ein vorhandener Zielbestand hat Vorrang und
wird nie aufgrund eines fehlenden Keys überschrieben. Nach DB-/Schema-Prüfung
Marker auf `ready` setzen, erst danach Konten schreiben oder Altdaten importieren.
Priorisierte Befunde und Absturzfälle stehen in `data-model.md`.

**Rationale**: Eigene Designentscheidung: Installationskennung unterscheidet
Keychain-Reste von einem zur begonnenen Initialisierung gehörenden Key.
Ein fertiger Marker ohne DB ist ein Fehler, kein Neuinstallationssignal.

**Alternatives considered**: „Key vorhanden“ allein kann eine abgebrochene
Initialisierung nicht von iOS-Keychain-Resten unterscheiden. Key vor Marker zu
schreiben erzeugt ein vermeidbares Fenster ohne dauerhafte Zuordnung.

Plattformgrundlage: [SecureStore-Lebenszyklus](https://docs.expo.dev/versions/latest/sdk/securestore/).
Die Markerzustände sind ein App-Vertrag und keine Zusage des Expo-SDK.

## 7. Tatsächliche Kotlin-Testausführung (U1)

**Decision**: Test-Config-Plugin bindet die versionierten androidTest-Quellen des
Legacy-Moduls in das SourceSet der erzeugten Host-App ein; AndroidJUnitRunner
führt sie über `:app:connectedDebugAndroidTest` aus. Der Hostrunner muss Kotlin-
und TS-Ergebnisse separat auswerten; fehlende Gruppen führen zum Fehler.
Profilgrenzen und konkrete Aufrufe: `contracts/native-test-execution.md`.

**Rationale**: Gradle führt Instrumentierungstests aus; ein TS-Runner im Expo-
Prozess tut das nicht automatisch. Der Host-App-Task ist bekannt, ohne den Namen
eines autoverlinkten Library-Projekts zu erraten.

**Alternatives considered**: Nur einen Testdateipfad anzulegen garantiert keinen
Testlauf. Kotlin-Tests allein durch einen npm-/TS-Runner zu benennen wäre kein
Nachweis. Ein zusätzlicher eigenständiger Modul-Beispielhost wäre mehr Aufwand.

Quellen: [AndroidJUnitRunner](https://developer.android.com/training/testing/instrumented-tests/androidx-test-libraries/runner),
[Gradle-Varianten und Modulaufrufe](https://developer.android.com/studio/test/command-line),
[Expo-Module im App-Host](https://docs.expo.dev/modules/get-started/).

## 8. Upgrade-Tests nach Entfernung der alten App (U2)

**Decision**: Eigenständig baubaren, eingefrorenen Quellstand der Kotlin-App unter
`mobile/tests/fixtures/legacy-app/` erhalten. Manifest pinnt Ausgangscommit und
Quellprüfsummen; Seeder erzeugt Daten und alte Keystore-Einträge ausschließlich
auf dem isolierten Gerät. Eigene Wrapper-/Builddateien ohne Abhängigkeit vom
aktiven Root-Projekt bleiben Bestandteil dieser Testfixture.

**Rationale**: Das später entfernte `app/` ist dann keine Voraussetzung des
Upgrade-Tests mehr. Die Fixture enthält keinen zweiten aktiven Produktzweig.
Erhalt bestehender Konten und Fehlerverhalten stehen zusätzlich als
FR-014/FR-015/SC-006 in der Spezifikation (C1).

**Alternatives considered**: Nur eine APK ohne reproduzierbaren Quellstand macht
Fixture-Änderungen und Seeder schwer prüfbar. Ein historischer Git-Checkout allein
setzt im CI vollständige Historie voraus. Die Testfixture bleibt auch in einem
flachen Checkout ausführbar; private Signatur und herunterzuladende Buildtools
sind weiterhin externe Voraussetzungen, keine vorgetäuschte Offline-Buildzusage.

Quelle: bestehender Commit `b7c62f8a80af78d54769a37c8f89b88234579b5e`,
`gradle/wrapper/gradle-wrapper.properties`, `gradle/libs.versions.toml` und
`app/build.gradle.kts`. Details: `contracts/legacy-account-migration.md`.

## Ergebnis

Keine offenen Designfragen. Kompatible Patchversionen, erzeugte Backup-Regeln,
konkrete Gerätematrix und Laufzeiten werden während der Implementierung
festgeschrieben beziehungsweise geprüft; der Plan behauptet keine bestandenen Tests.
