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

### Physische Xiaomi-Geräte

Zusätzlich zu USB-Debugging können gerätespezifische Freigaben nötig sein:
„Installieren über USB“ für Preview und Maestro-Testtreiber,
„USB-Debugging (Sicherheitseinstellungen)“ für simulierte Eingaben und bei der
App **Maestro** (`dev.mobile.maestro`) die Berechtigung zum Öffnen von Fenstern
im Hintergrund. Fehlendes `INJECT_EVENTS` bzw. `Abort background activity starts`
im Gerätelog kennzeichnen unterschiedliche Teststeuerungsprobleme.
Ein erfolgreicher direkter ADB-Start ersetzt keinen erfolgreichen Maestro-Lauf.

Installationsabfragen für den Testtreiber vor dem Offline-Lauf erledigen.
Bei Wiederholungen mit derselben Maestro-Version kann `test --no-reinstall-driver`
die vorhandenen Treiber wiederverwenden. Während des Flows das entsperrte Gerät
liegen lassen. Änderungen an diesen zusätzlichen Freigaben nach dem Test nach
Bedarf zurücknehmen; sie sind keine Berechtigungen der Family-Hub-App.

**Nutzerentscheidung 2026-11-04:** Der ausdrücklich freigegebene letzte Lauf auf
dem persönlichen Xiaomi-Gerät wurde ausgeführt (unvollständig, Exit 143).
Keine weiteren
Versuche oder zusätzlichen Automatisierungsfreigaben auf diesem Gerät anfordern.
Folgeprüfungen auf Emulator oder separatem Testgerät vorbereiten; ein erneuter
Einsatz des persönlichen Geräts braucht eine neue ausdrückliche Beauftragung.

**Aktualisierte Nutzerfreigabe 2026-11-04:** Für die aktuelle T032-Fortsetzung
hat der Nutzer das verbundene Smartphone erneut ausdrücklich freigegeben.
Die allgemeine Beschränkung für zukünftige Features bleibt bestehen. Bestehende
Konten nicht zurücksetzen. Der Flow behält standardmäßig die Leerzustandsprüfung;
für diesen vorhandenen synthetischen Testbestand kann explizit
`-e REQUIRE_EMPTY=false -e CHILD_PREFIX="T032 Folge 20261104"` verwendet werden.
Damit entstehen zehn weitere synthetische Konten, die nach Neustarts und gegen
eine normalisierte Duplikatkennung geprüft werden; die alten Konten bleiben
erhalten. Einen neuen ASCII-Präfix mit Groß-/Kleinbuchstaben wählen, der noch
nicht im Bestand vorkommt. Dies ist keine Freigabe zum Zurücksetzen oder Löschen.
Der Emulator-Starter bleibt weiterhin auf Emulatoren beschränkt; der konkrete
Smartphone-Lauf wird nur unter der separaten ausdrücklichen Nutzerfreigabe direkt
mit fest gewählter Seriennummer gestartet.

Maestro-Parameter und Standardwerte:
[offizielle Dokumentation](https://docs.maestro.dev/maestro-flows/flow-control-and-logic/parameters-and-constants).

## Ausführung aus `mobile/`

Automatisierte Android-Läufe verwenden einen explizit gewählten Emulator.
Das persönliche Handy erhält ausschließlich Preview-Versionen für manuelle Tests.
`npm run test:preview:android -- --device emulator-5554` prüft vor dem ersten
Maestro-Aufruf die Emulatoridentität, den abgeschlossenen Start, das vorhandene
Produktpaket und ausgeschaltetes WLAN/mobile Daten. Physische Seriennummern
werden bereits vor dem ersten ADB-Aufruf abgelehnt. Der Starter installiert oder
löscht nichts, ändert keine Netzwerkwerte und wiederholt keine Tests automatisch.
Das vorhandene Produktpaket allein belegt nicht das Buildprofil; deshalb nur die
explizit als `preview` gebaute APK installieren. Metro separat beenden.

Unter Linux/macOS müssen Node 22, `adb` und `maestro` im PATH liegen; alternativ
`ANDROID_HOME` und `FAMILYHUB_MAESTRO` auf die lokalen Werkzeuge setzen.
Die Laufzeitgrenze des Starters beträgt 45 Minuten. Ein abgebrochener Prozess
oder fehlender vollständiger JUnit-Bericht gilt weiterhin nicht als Abnahme.
Jeder Lauf schreibt in einen eigenen Zeitstempelordner unter
`tests/artifacts/preview/android/`, damit ältere Berichte nicht als neues Ergebnis
verwechselt werden. Der konkrete Pfad wird vor dem Maestro-Aufruf ausgegeben.

Für einen x86_64-Emulator statt des folgenden ARM64-Buildparameters
`-PreactNativeArchitectures=x86_64` verwenden. Die ARM64-APK ist für das physische
Handy zur manuellen Bedienungsprüfung bestimmt; beide Artefakte getrennt halten.

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
