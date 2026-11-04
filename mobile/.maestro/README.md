# Offline-Kontoanlage (T032)

`create-account.yaml` prüft zehn synthetische Konten mit beiden Schulen,
ihre Anzeige nach echtem Prozessstopp/-start und die Ablehnung eines Duplikats
mit anderer Großschreibung, Rand-Leerzeichen und anderer Schule.
Die Übersicht darf die synthetischen Zugangswerte nicht anzeigen.
Die exakte SQL-Kontoanzahl, Unicode-Normalisierung und Commit-Fehler werden
zusätzlich durch die Unit-/nativen Tests geprüft; der UI-Lauf ersetzt diese nicht.

## Voraussetzungen

- Maestro CLI und ein ausdrücklich ausgewähltes, isoliertes Testgerät bzw.
  ein iOS-Simulator. Keine echten Konten verwenden.
- Frische Installation des Profils `preview`, Kennung `com.familyhub.app`,
  mit eingebettetem Bundle. `native-test` und Development Client erfüllen T032 nicht.
- Metro beenden. Vor dem Lauf alle Internetverbindungen des Testgeräts
  abschalten (Flugmodus, WLAN und mobile Daten aus; im Simulator auch den
  Netzwerkzugang des Hosts abschalten). ADB/Simulator-Steuerung bleibt lokal.
- Der Start muss einen leeren Kontenbestand anzeigen. Der Flow bricht sonst ab.
  Er führt weder `clearState` noch `clearKeychain` aus. Für Wiederholungen einen
  neuen isolierten Testbestand bereitstellen; niemals eine Bestands-App löschen.

## Ausführung aus `mobile/`

Android lokal bauen (Node 22, JDK und Android SDK erforderlich):

```bash
FAMILYHUB_BUILD_PROFILE=preview npx expo prebuild --platform android --no-install
cd android
FAMILYHUB_BUILD_PROFILE=preview ./gradlew :app:assembleRelease -PreactNativeArchitectures=arm64-v8a
cd ..
adb -s SERIAL install android/app/build/outputs/apk/release/app-release.apk
```

Die Architektur an das Gerät anpassen. Auf macOS einen iOS-Release-Build des
Profils `preview` für den ausgewählten Simulator erzeugen/installieren:

```bash
FAMILYHUB_BUILD_PROFILE=preview npx expo prebuild --platform ios --no-install
FAMILYHUB_BUILD_PROFILE=preview npx expo run:ios --configuration Release --device UDID --no-bundler
```

Dann Metro und Netzwerk wie oben abschalten, bevor der eigentliche Test startet.
Nach Installation und Offline-Vorbereitung pro Plattform:

```bash
maestro check-syntax .maestro/create-account.yaml
mkdir -p tests/artifacts/preview
maestro --device SERIAL_OR_UDID test --format junit --output tests/artifacts/preview/create-account.xml .maestro/create-account.yaml
```

Nur die Hauptdatei starten; `helpers/` enthält parametrisierte Teilabläufe.
Ergebnisse für Android und iOS in getrennten Verzeichnissen aufbewahren.
Im Prüfbericht Gerät/OS, App-Version, Git-Commit, Maestro-Version, Profil,
Build-/Installationsbefehle, Offline-Vorbereitung und tatsächliches Ergebnis
festhalten. Artefakte bleiben unter dem ignorierten `tests/artifacts/`.

Separat im Profil `native-test` die Speicherprüfungen und in Jest die
Unit-/Komponententests ausführen, siehe `../README.md` und
`../../specs/001-registerkonten-verwalten/contracts/native-test-execution.md`.
T032 erst nach erfolgreichen Preview-Läufen auf **beiden** Plattformen und
den separat ausgeführten geforderten Testgruppen abhaken.

Maestro-Verträge: [Prozessstart](https://docs.maestro.dev/reference/commands-available/launchapp),
[Wiederholung](https://docs.maestro.dev/reference/commands-available/repeat),
[Teilabläufe](https://docs.maestro.dev/reference/commands-available/runflow).
