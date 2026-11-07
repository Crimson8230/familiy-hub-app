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

### Alternative bei blockierten App-Starts durch den Testtreiber

Die Hauptdatei verwendet drei gemeinsame UI-Phasen. Falls Android den App-Start
aus `dev.mobile.maestro` heraus blockiert, kann der ausdrücklich autorisierte Host
dieselben Phasen separat steuern. Es werden keine zusätzlichen App-Berechtigungen
erzwungen. Bei abgeschalteten Datenverbindungen und gestopptem Metro:

1. Die Preview über `adb -s SERIAL shell am force-stop com.familyhub.app` beenden,
   mit `pidof` den beendeten Prozess prüfen, dann mit
   `adb -s SERIAL shell am start -W -n com.familyhub.app/.MainActivity` starten.
2. `helpers/create-ten-accounts.yaml` mit Maestro ausführen.
3. Erneut über ADB beenden, Prozessende prüfen und starten; dann
   `helpers/check-duplicate.yaml` ausführen.
4. Zweiten Prozessneustart ebenso prüfen und
   `helpers/check-final-state.yaml` ausführen.

Jede Phase mit explizitem Ziel, `--no-reinstall-driver`, identischen `CHILD_PREFIX`-
und `REQUIRE_EMPTY`-Parametern sowie eigenem JUnit-Bericht ausführen. Die beiden
Neustarts zwischen den Phasen müssen echte Prozessenden/-starts sein; ein
Neurendern oder bloßes Wechseln der Ansicht genügt nicht. Nur drei tatsächlich
bestandene Phasen und zwei nachgewiesene Neustarts ergeben den vollständigen
Android-UI-Ablauf. Vorhandene Konten bleiben erhalten; keine automatischen Resets.

### iOS-Tastatur und Passwortangebot

Der gemeinsame Eingabehelfer wartet nach Kind und Benutzername auf den
vollständigen sichtbaren Feldwert. Unter iOS tippt er anschließend auf das
statische Feldlabel, um die Tastatur zu schließen; Android verwendet weiterhin
`hideKeyboard`. Das vermeidet die von Layout und Tastatur abhängigen iOS-Wischgesten
von [Maestro hideKeyboard](https://docs.maestro.dev/reference/commands-available/hidekeyboard).
Das Formular unterstützt außerdem Ausblenden beim Ziehen.

Ein optionaler iOS-Systemdialog „Passwort sichern?“ wird über
`helpers/dismiss-password-prompt.yaml` mit „Später“ abgelehnt. Synthetische
Zugangsdaten werden dabei nicht im Passwortmanager gespeichert. Der Helfer wird
vor der ersten Anlage, nach Speichern und nach Abbrechen des Duplikatversuchs
aufgerufen; er verändert keine Systemeinstellungen.

Bei Wiederholungen auf demselben isolierten iOS-Simulator bestehende synthetische
Konten erhalten und einen noch nicht verwendeten Präfix ausdrücklich wählen:
`-e REQUIRE_EMPTY=false -e CHILD_PREFIX="Offline Folge Neu"`.
Die Standardprüfung auf einen leeren Bestand bleibt aktiv. Jeder vollständige
Lauf muss zehn neue Namen und die beiden Neustarts mit demselben Präfix prüfen;
ein fehlgeschlagener Vorlauf zählt nicht als Abnahme.

Die Dateien werden auch von `create-account.yaml` eingebunden. So prüfen Host-
und direkter Maestro-Ablauf dieselben UI-Schritte. Ohne separat ausdrückliche
Freigabe bleibt die Regel bestehen, ausschließlich Emulatoren zu verwenden.

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
Profils `preview` für den ausdrücklich ausgewählten Simulator erzeugen/installieren.
Node 22 verwenden, Xcode auswählen und die Simulator-UDID aus `simctl list devices`
eintragen. Das folgende Beispiel baut für einen ARM64-Simulator auf Apple Silicon:

```bash
export DEVELOPER_DIR=/Applications/Xcode.app/Contents/Developer
export FAMILYHUB_BUILD_PROFILE=preview
export IOS_SIMULATOR_UDID=UDID
export IOS_PREVIEW_DERIVED_DATA=/private/tmp/familyhub-ios-preview-derived-data
npx expo prebuild --platform ios --no-install
(cd ios && pod install)
xcodebuild -workspace ios/FamilyHub.xcworkspace -scheme FamilyHub \
  -configuration Release -sdk iphonesimulator \
  -destination "id=$IOS_SIMULATOR_UDID" ONLY_ACTIVE_ARCH=YES \
  -derivedDataPath "$IOS_PREVIEW_DERIVED_DATA" -jobs 4 CODE_SIGN_IDENTITY=- build
xcrun simctl install "$IOS_SIMULATOR_UDID" \
  "$IOS_PREVIEW_DERIVED_DATA/Build/Products/Release-iphonesimulator/FamilyHub.app"
xcrun simctl launch "$IOS_SIMULATOR_UDID" com.familyhub.app
```

Die normale lokale Simulator-Signierung beibehalten; nicht mit
`CODE_SIGNING_ALLOWED=NO` bauen. Die Simulator-Entitlements sind für den Zugriff
auf den sicheren Speicher relevant. DerivedData außerhalb synchronisierter
Ordner ablegen: iCloud/FileProvider kann `.framework`- und `.bundle`-Verzeichnissen
Finder-Metadaten hinzufügen, die `codesign` zurückweist. Ein erfolgreicher Build
allein ersetzt den anschließenden Start- und Offline-Nachweis nicht.

Sind lokale Abhängigkeiten als `dataless` ausgelagert und hängen Werkzeuge beim
Lesen, die vorhandenen Dateien erhalten und mit Node 22 `npm ci` aus dem Lockfile
in einem vollständig lokal verfügbaren Arbeitsverzeichnis ausführen. Sicherungen
alter Abhängigkeiten außerhalb von `mobile/` aufbewahren, damit Autolinking und
Dateisuchen sie nicht als weitere Projektquellen erfassen.

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
