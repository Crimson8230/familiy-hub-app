# Quickstart: Expo-Kontenverwaltung prüfen

Diese Anleitung beschreibt den Zielzustand NACH Umsetzung der an diesen
präzisierten Plan anzupassenden Expo-Tasks. Aktuell existiert weiterhin die Kotlin-App; die folgenden npm-Skripte,
Buildprofile und Testverzeichnisse werden erst implementiert. Die vorhandenen
Kotlin-Tasks und `verification.md` sind kein Expo-/iOS-Nachweis.

## Voraussetzungen

- Node 22 LTS ab 22.13 und npm; Paketversionen laut `mobile/package-lock.json`.
- Android SDK 37, JDK und Emulator/Gerät ab API 24 passend zum Expo-58-Template.
- Für lokale iOS-Builds macOS, Xcode 26.4+ und Simulator/Gerät ab iOS 16.4.
  Unter Linux kann iOS über EAS gebaut werden; eigener Apple-Zugang und passende
  Signierung für physische iPhones sind erforderlich. EAS ist optional.
- Nur erfundene Zugangsdaten; isoliertes Upgrade-Testgerät und passende
  Testsignatur der Kotlin-App. Kein Deinstallieren einer Bestands-App als Update.

## Automatische Prüfungen und Development Builds

Geplante Befehle aus `mobile/` nach Implementierung:

```bash
npm ci
npx expo install --check
npx expo-doctor
npm run typecheck
npm test -- --runInBand
npx expo run:android --device
npx expo start --dev-client
```

Auf macOS zusätzlich `npx expo run:ios --device`. Nach Änderungen an nativen
Abhängigkeiten oder Config Plugins neu bauen. Die Config muss SQLCipher auf
BEIDEN Plattformen aktivieren; `PRAGMA cipher_version` muss einen Wert liefern.
Ein reiner Expo-Go-Start ist keine gültige Prüfung dieser Konfiguration.

Die Implementierung stellt `test:native` für Integrationstests im installierten
eigenen Build bereit: `npm run test:native -- --platform android` und entsprechend
`--platform ios`. Der Runner muss SQLite, SecureStore, Fehlerpunkte und
Prozessneustart tatsächlich nativ ausführen; gemockte Tests getrennt ausweisen.
Für diese Läufe ein eigenes `native-test`-Profil mit Testentry verwenden.
Android muss zusätzlich die Kotlin-Instrumentierung ausführen. Nach Generierung
des native-test-Projekts lautet der Aufruf aus `mobile/android/`:

```bash
./gradlew :app:connectedDebugAndroidTest -Pandroid.testInstrumentationRunnerArguments.package=com.familyhub.legacy
```

`test:native` orchestriert diesen Lauf zusätzlich zur TS-Integration. Android
braucht beide Ergebnisgruppen mit tatsächlich ausgeführten Tests. Fehlende Gruppen
oder Fehler führen zu einem Exitcode ungleich 0. Das Test-Config-Plugin bindet die
versionierten Legacy-androidTest-Quellen in die Host-App ein. Profil-/Runnervertrag:
[native-test-execution.md](contracts/native-test-execution.md).
Maestro-Flows liegen unter `.maestro/` und werden pro Plattform gestartet:
`maestro test .maestro/`. Im Ergebnis Gerätekennung und Betriebssystem festhalten.

Für Netzwerk-unabhängigen Kaltstart ein `preview`-Profil ohne Development Client
und mit eingebettetem Bundle verwenden, etwa optional über:

```bash
npx eas-cli build --platform android --profile preview
npx eas-cli build --platform ios --profile preview
```

Ein separates `development`-Profil hat Dev Client und eigene App-ID. Ein
`upgrade-test`-Profil hat eingebettetes Bundle, alte Android-App-ID, höhere
versionCode und dieselbe Signatur wie die synthetische Kotlin-Testinstallation.
Diese Profile und native Artefakte gehören zur Umsetzung, nicht zu diesem Plan.

## Gemeinsame Offline-Abnahme auf Android und iOS

1. Preview-Build installieren, starten, Flugmodus aktivieren und Metro stoppen.
2. Konto mit Kind, unterstützter Schule und erfundenen Zugangsdaten anlegen.
   Kind/Schule genau einmal anzeigen, keine Zugangsdaten in der Übersicht.
3. App vollständig beenden und ohne Netz neu starten; zehn Konten müssen
   sichtbar bleiben. Kontenübersicht nach Initialisierung unter einer Sekunde;
   Speichern und Löschen jeweils unter zwei Sekunden separat messen.
4. Pflichtfelder, unbekannte Schule, `Anna`/` anna `/`ANNA`, kombinierende Zeichen
   und unterschiedliche Gerätelocales prüfen. Doppeltes Tippen erzeugt kein Duplikat.
5. Löschung abbrechen: unverändert. Bestätigen: dauerhaft entfernt, andere
   Konten unverändert. Dasselbe Kind danach erneut anlegen.
6. Systemschrift mindestens verdoppeln, kleines Display und offene Tastatur
   prüfen. Alle Aktionen bleiben erreichbar; TalkBack/VoiceOver beschriften
   Dialoge, Felder und Fehler verständlich.
7. Nutzungstests SC-001 und SC-005 je Plattform mit zehn Personen durchführen
   und Erfolgsquoten dokumentieren; automatisierte UI-Tests ersetzen dies nicht.

## Native Sicherheits- und Fehlerprüfungen

- Mit Testdaten DB, WAL/SHM, sonstige App-Dateien und Logs prüfen: keine
  Klartext-Zugangsdaten. DB lässt sich ohne Key nicht mit normalem SQLite lesen.
  Schlüssel nicht in Dateien/Logs außerhalb des sicheren Speichers ablegen.
- SecureStore-Zugriff verweigern, Key fehlen/falsch sein lassen, SQLCipher
  deaktivieren sowie Datenbank-/Commit-/Migrationsfehler injizieren. Kein
  Klartext-Fallback, kein destruktiver Reset, kein falscher Leerzustand.
- Bootstrap nach jedem Initialisierungsschritt abbrechen: vor/nach Marker,
  Key-Schreiben, DB-/Schema-Erstellung und `ready`. Vorhandener Zielbestand mit
  fehlendem Key bleibt erhalten; `provisioning` mit passendem Key verwendet ihn
  wieder, fertiger Marker ohne DB meldet Inkonsistenz. Bekannte iOS-Keychain-Reste
  nur im eindeutig frischen Initialisierungspfad ersetzen.
- Schreibabbruch vor/nach Commit und Prozessneustart testen: vorheriger oder
  vollständig neuer Zustand, nie teilweise angelegtes/gelöschtes Konto.
- Versionierte Schema-Fixtures mit zehn Konten auf beiden Plattformen migrieren;
  Inhalte/Zuordnung erhalten, neuere unbekannte Version verständlich ablehnen.
- Generierte Android-Manifest-/Backup-Regeln und tatsächliche Ausschlüsse für
  Cloud und Geräteübertragung prüfen. iOS-Backup-Flag am Verzeichnis und an
  Datenbank-/Journaldateien kontrollieren, auch nach erneutem Öffnen/Schreiben.
- Deinstallation/Neuinstallation mit synthetischen Daten: Android beginnt leer;
  iOS-Keychain-Reste erzeugen keine alten Konten. Vorhandene DB ohne Key bleibt
  erhalten und wird als Fehler angezeigt. Kein automatisches Geräte-Restore.

## Android-Updateprüfung

Kotlin-Testbuild aus der eigenständigen Fixture
`mobile/tests/fixtures/legacy-app/` bauen, deren Ausgangsstand und Prüfsummen in
`mobile/tests/fixtures/legacy/fixture-manifest.json` prüfen. Dafür JDK 21,
Android SDK 36 und Build Tools 36.1.0 zusätzlich zur Expo-Buildumgebung
bereitstellen. Testsignatur extern zuführen und Fingerprints der APKs vergleichen.

Nach Implementierung aus `mobile/` die Host-Skripte ausführen:

```bash
bash tests/tools/prepare-legacy-fixtures.sh
bash tests/tools/verify-android-upgrade.sh
```

Sie bauen/installieren die alte Fixture samt Test-APK und erzeugen über den
instrumentierten Seeder zehn synthetische Konten mit Formaten 1–3 und
Unicode-/Langwerten. Diese Skripte dürfen weder aktive Root-`app/`-Quellen noch
Git-Historie zur Laufzeit benötigen. Formate 2/3 decken Werte über 65.535 UTF-Bytes
ab; Format 1 bleibt innerhalb seiner alten Längengrenze. Ohne Deinstallation signaturgleichen
`upgrade-test`-Build installieren und offline starten. Den vollständigen
[Migrationsvertrag](contracts/legacy-account-migration.md) einschließlich Abbruch
an jedem Commit-/Bereinigungsschritt prüfen. Nach Erfolg Ziel neu öffnen,
Quelldateien und alten Alias auf Entfernung prüfen. Gelöschtes Konto darf nach
Neustart nicht erneut aus der Altdatei erscheinen. Getrennte App-ID ist ein
frischer Testbestand, keine Migration. Zusätzlich die bekannte leere Quell-DB
ohne bisher angelegten Keystore-Alias prüfen.

Die Upgrade-Abnahme belegt FR-014/FR-015 und SC-006. Vor Entfernung der alten
Buildkette einen frischen Checkout nur mit Expo-Projekt und erhaltenen Fixtures
prüfen; den vollständigen Fixture-/Upgrade-Lauf danach erneut ausführen. Kann die
Fixture ohne das Root-Kotlin-Projekt nicht gebaut werden, bleibt das
Entfernungsgate geschlossen.

## Ergebnisablage

Neue Nachweise unter `verification-expo.md` mit SDK-/Paketversionen, Buildprofil,
Gerät, Betriebssystem, Testergebnissen und verbleibenden Grenzen dokumentieren.
`verification.md` als historischen Kotlin-Nachweis beibehalten. Beide Plattformen
und der Android-Upgradepfad müssen bestanden haben, bevor der Ersatz freigegeben
wird; dieser Planungsschritt behauptet keine ausgeführten App-Tests.

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

### Aktualisierung: T087 bestanden (2026-11-04)

Die zuvor vertagte iOS-Grundlagenprüfung ist auf macOS/Xcode abgeschlossen:
31/31 anwendbare TS-Szenarien, 7 echte Prozessneustarts und die absichtliche
Fehlerprobe bestanden. Android-Legacy/Kotlin sind auf iOS nicht anwendbar.
Frische native-test-Generierung und Builds erfolgten; der abschließende Lauf
verwendete nach reinen Hostkorrekturen `--reuse-native-project` mit erneutem Build.
Der iOS-Host baut ohne GUI-Aktivierung und startet die App mit `simctl launch`
und Expos `--initialUrl`, um interaktive URL-Dialoge zu vermeiden.
`--reuse-native-project` unterstützt jetzt auch ein bereits erzeugtes iOS-Testprojekt;
nach nativen Konfigurationsänderungen weiterhin frisch generieren.
Details und bereinigte Build-/Simulatornachweise: [Prüfbericht](verification-expo.md).
T032 ist der nächste sequenzielle Schritt; die übrigen Abnahme-/Releasegates bleiben offen.
