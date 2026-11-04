# Contract: Native Testausführung und Buildgrenzen

## Zweck

Die Tests belegen Plattformfunktionen mit realen Instanzen. Drei Läufe bleiben
getrennt: Jest/Komponenten mit Mocks, TS-Integration im eigenen Binary und
Kotlin-Instrumentierung auf Android. Ein grüner TS-Lauf ersetzt keinen Kotlin-Lauf.
Dieser Vertrag konkretisiert den Plan; alle genannten Skripte/Profile entstehen
in der Implementierung und sind heute noch nicht ausführbar.

## Buildprofile

| Profil | Kennung / Eigenschaften | Verwendung |
|--------|--------------------------|------------|
| development | `com.familyhub.app.dev`, Dev Client | Normale Entwicklung ohne Testschnittstellen |
| native-test | `com.familyhub.app.nativetest`, Debug/Dev Client; explizites Test-Flag | TS-Testentry, Fehler-/Neustartsteuerung, Android-Instrumentierung |
| preview | Produktkennung, Bundle eingebettet, kein Dev Client/Test-Flag | Offline-Kaltstart, UI-Abnahme und Performance ohne Metro |
| upgrade-test | Android `com.familyhub.app`, höhere versionCode, Fixture-Testsignatur, Bundle eingebettet; ausschließlich Testprofil | Signaturgleiches Update auf isolierten Geräten; notwendige Fehlersteuerung nur mit explizitem Test-Flag |

Unter iOS werden entsprechende eigene Bundle-IDs für development/native-test
verwendet. Produkt-/Preview-Builds dürfen weder Seeder noch Fehlersteuerung,
Testentry oder Instrumentierungs-SourceSets enthalten. Test-Builds werden nicht
veröffentlicht. Das Flag wird beim Erzeugen des Binary ausgewertet, nicht durch
einen von außen erreichbaren Laufzeit-Schalter im Produkt.

Native Modul-/TS-Integration kann während der Entwicklung Metro verwenden.
Der Offline-Produktnachweis erfolgt separat im Preview-Build ohne Metro und Netz.
Ein Testlauf darf diese Nachweise nicht miteinander verwechseln.

## Android-Kotlin-Instrumentierung

Testquellen bleiben versioniert unter
`mobile/modules/legacy-accounts/android/src/androidTest/java/com/familyhub/legacy/`.
Das Test-Config-Plugin `mobile/plugins/withNativeTestHarness.ts` ergänzt NUR im
native-test-Profil das `androidTest`-SourceSet der erzeugten Host-App `:app` um
diesen Pfad. Im Host werden `androidx.test.runner.AndroidJUnitRunner` als
`testInstrumentationRunner` und die kompatiblen AndroidX-Testabhängigkeiten
konfiguriert. Das eigentliche Legacy-Modul wird normal autoverlinkt. Es wird kein
unbekannter automatisch erzeugter Gradle-Libraryname vorausgesetzt.

Aus `mobile/android/` nach Erzeugen des native-test-Projekts:

```bash
./gradlew :app:assembleDebug :app:assembleDebugAndroidTest
```

Der Host installiert Host-/Test-APK nur bei abweichender SHA-256-Prüfsumme oder
fehlender Installation. Er startet die regulären Kotlin-Tests direkt mit
`adb -s SERIAL shell am instrument -w -r -e package com.familyhub.legacy
com.familyhub.app.nativetest.test/androidx.test.runner.AndroidJUnitRunner`.
Die Fehlerprobe läuft im selben installierten Binary mit explizitem Klassenfilter
und `familyhubIntentionalFailure=true`. Abgeschlossene Teststatus und Runner-Endstatus
werden ausgewertet; fehlende/leere/abgebrochene Läufe gelten nicht als Erfolg.
Damit bleiben beide APKs installiert, statt durch Gradles Connected-Testlauf
entfernt und vor jeder Probe erneut installiert zu werden. Tests
nutzen ausschließlich synthetische Daten der Test-App-ID. Sie setzen niemals
eine produktive Bestandsinstallation zurück. Kein Android-SourceSet wird unter
Expo Go oder in einem iOS-Lauf als geprüft verbucht.

## Host-Orchestrierung

`mobile/tests/tools/run-native-tests.mjs` ist der gemeinsame Einstieg über
`npm run test:native -- --platform android|ios` aus `mobile/`. Er muss:

1. Gerät/Simulator, Plattform, App-ID, Testprofil und Paketversionen bestimmen;
   bei mehreren Geräten eine explizite Auswahl verlangen, bei fehlenden Geräten
   mit erklärendem Fehler statt scheinbarem Erfolg abbrechen.
2. Für Android das native-test-Projekt über die dokumentierte Profilkonfiguration
   erzeugen und den obigen Kotlin-Instrumentierungslauf starten; Ergebnisse als
   eigene Gruppe `android-instrumentation` einsammeln.
3. Danach TS-Integration im passenden installierten Testbinary über
   `mobile/tests/native/NativeTestRunner.tsx` ausführen. Der Host steuert
   Prozessbeendigung/Neustart über adb beziehungsweise auf iOS den ausgewählten
   Simulator oder das eingerichtete physische Testgerät. Keine Simulation eines
   Prozessneustarts durch bloßes Neurendern einer Komponente.
4. Bei iOS nur die dort anwendbaren TS-/Plattformtests ausführen;
   Android-spezifische Migration als „nicht anwendbar“ getrennt ausweisen.
5. Testnamen, Soll-/Ist-Anzahlen, Fehler und Build-/Gerätekennung unter
   `mobile/tests/artifacts/native/` protokollieren. Keine Zugangswerte, Keys oder
   SQL-Parameter im Report; rohe Runner-Ausgaben vor Ablage prüfen/redigieren.
6. Nur dann Exitcode 0 liefern, wenn alle auf dieser Plattform geforderten
   Gruppen tatsächlich liefen und bestanden. Fehlende/leer gefilterte Gruppen,
   Buildfehler, Timeouts oder unerwartet übersprungene Tests sind ein Fehlschlag.

Kein Jest-CLI-Lauf wird als Test im nativen Prozess ausgegeben. Der TS-Testentry
braucht einen eigenen ausführbaren, in das Testbinary integrierten Runner;
Jest-APIs sind dort nicht automatisch verfügbar. Gemeinsame Testfälle erhalten
Adapter für diesen Runner oder werden ausdrücklich als native Suites geschrieben.
Der Android-Upgrade-Hostlauf aus `legacy-account-migration.md` bleibt ein eigener
zusätzlicher Nachweis; Instrumentierung allein belegt kein Update der alten App.

## Gezielte Entwicklungsläufe

`--installed` ist ein Android-Diagnoselauf mit vorhandener debuggbarer Test-App:
keine Projektgenerierung, kein Gradle, keine Installation und keine Kotlin-Gruppe.
`--case NAME` benötigt `--installed` und wählt genau ein Manifest-Szenario;
die Auswahl muss bei Prozessneustarts erhalten bleiben. Nach nativen Änderungen
ist zuerst ein neuer vollständiger Build erforderlich.

Ein Diagnoselauf darf bei bestandenem ausgewähltem Umfang Exit 0 liefern, muss
aber eigene `android-diagnostic-*`-Berichte mit `diagnostic: true` und
`complete: false` schreiben. Er erfüllt weder die vollständige Android-Abnahme
noch den Android-Umfang von T023. Die vollständigen Gruppen-/Fallzahlen bleiben
Voraussetzung der jeweiligen Plattformabnahme. Die iOS-Abnahme ist gemäß der
unten dokumentierten Prüfsequenz nach T087 verschoben. Die Exitcode-Regel oben gilt für vollständige Läufe.

## Abnahme der Testinfrastruktur

Aus sauberer nativer Generierung nachweisen: bekannte positive und absichtlich
fehlschlagende Kotlin-/TS-Proben erreichen jeweils den passenden Host-Exitcode;
beide Android-Gruppen sind im Bericht vorhanden. iOS weist die richtige
Plattformgruppe aus. Nach Wechsel auf Preview werden Testquellen/-steuerung nicht
mitgebaut. Offline-Kaltstart und Upgrade danach über ihre eigenen Profile prüfen.

Grundlagen: [AndroidJUnitRunner](https://developer.android.com/training/testing/instrumented-tests/androidx-test-libraries/runner),
[Gradle-Testaufrufe](https://developer.android.com/studio/test/command-line),
[lokale Expo-Module](https://docs.expo.dev/modules/get-started/).

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
