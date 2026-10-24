# Verifikation: Registerkonten auf Android verwalten

**Datum**: 2026-10-24

## Automatische Prüfungen

Mit Android Studio JBR 21, Android SDK 36 und dem Emulator `Pixel_8_Pro`
(Android API 36) wurden im Repository-Stamm ausgeführt:

```powershell
.\gradlew.bat testDebugUnitTest connectedDebugAndroidTest assembleDebug --no-daemon --quiet
```

Ergebnis: Build erfolgreich; 3 Unit-Tests und 23 instrumentierte Tests
bestanden, 0 Fehler und 0 übersprungene Tests. Das Debug-APK liegt unter
`app/build/outputs/apk/debug/app-debug.apk`. Die Berichte liegen unter
`app/build/test-results/testDebugUnitTest/` und
`app/build/reports/androidTests/connected/debug/`.

Die Tests decken Pflichtfelder, Namensnormalisierung, die Ein-Konto-Regel,
zehn dauerhaft gespeicherte Konten, Chiffrat und IV, Keystore-Roundtrip,
Löschung mit Rollback, Lese- und Speicherfehler, Backup-Regeln, Schema-Version 1
und UI-Beschriftungen bei vergrößerter Schrift ab.

Nach der Convergence-Umsetzung bestanden dieselben 23 Instrumentierungstests
auch auf einem Nexus-5X-Emulator mit Android API 23 (0 Fehler, 0 übersprungene
Tests). Der Test `AccountPerformanceTest` prüft zehn Konten bis zur sichtbaren
Übersicht gegen die Grenze von 1 Sekunde und Speichern und Löschen gegen je
2 Sekunden; alle drei Messungen lagen auf API 36 und API 23 innerhalb der
Grenzen. Der Keystore-Test prüft mehr als 65.535 UTF-Bytes pro Zugangswert,
Sonderzeichen, erneutes Öffnen der Datenbank und Lesbarkeit älterer Formate 1
und 2. Die Schriftgrößentests prüften Sichtbarkeit, Scroll-Erreichbarkeit und
Klickbarkeit bei zweifacher Schriftgröße zusätzlich auf einer 360 × 640-dp-
Ansicht (2/2 bestanden).

## Manuelle Prüfung im Flugmodus

Auf demselben Emulator wurde der Flugmodus aktiviert und sein Status `1`
bestätigt. Die App startete ohne Server und zeigte zunächst den Leerzustand.
Ein Konto für `Testkind` mit ausschließlich erfundenen Zugangsdaten wurde
gespeichert; die Übersicht zeigte Kind und Schule, aber weder Benutzername noch
Passwort. Nach `force-stop` und Neustart war das Konto weiterhin sichtbar.

Der Löschdialog nannte Kind und Schule. „Abbrechen“ erhielt das Konto;
bestätigtes Löschen führte zum Leerzustand. Danach ließ sich für `Testkind`
erneut ein Konto anlegen, weiterhin im Flugmodus.

Auf Android API 23 wurde derselbe Ablauf mit `API23Kind` und erfundenen
Zugangsdaten wiederholt: Flugmodusstatus `1`, sichtbares Kind und Schule ohne
Zugangsdaten nach `force-stop` und Neustart, Konto nach Abbruch unverändert,
nach bestätigtem Löschen auch nach Neustart verschwunden. Die erneute Anlage
für `API23Kind` gelang im Flugmodus.

## Sicherheits- und Schema-Prüfung

`AndroidManifest.xml` enthält keine Internet- oder andere `uses-permission`-
Deklaration. Die Kontendatenbank ist in den Backup-Regeln für ältere Android-
Versionen sowie in Cloud- und Geräteübertragungsregeln ab Android 12
ausgeschlossen. Der Quellcode enthält keine Klartext-Logs oder Register-Endpunkte.
Das exportierte erste Room-Schema liegt unter
`app/schemas/com.familyhub.app.data.accounts.FamilyHubDatabase/1.json`.

## Grenzen der Verifikation

- Die in `spec.md` genannten Nutzungstests mit zehn Personen wurden nicht
  durchgeführt. Die automatisierten und manuellen Prüfungen belegen die
  Funktion, nicht die geforderte Erfolgsquote echter Testpersonen.
- Schema-Version 1 ist die erste Version. Es gibt noch keine ältere Version,
  gegen die eine Upgrade-Migration getestet werden könnte.
- Echte Registerzugänge wurden nicht verwendet; deren Verifikation gehört zu
  einem späteren Feature.
