# Contract: Übernahme bestehender Android-Konten

## Unterstützte Fälle und Grenze

Ein Update derselben App `com.familyhub.app` mit gleicher Signatur und höherer
versionCode auf Android API 24+ erhält die private Sandbox. Nur in diesem Kontext
ist eine automatische Übernahme von `family_hub.db` möglich. Die vorhandene
Keystore-Kennung lautet `family_hub_register_credentials_v1`; sie darf nicht neu
angelegt werden, wenn Altdaten einen vorhandenen Schlüssel erwarten.

Die Kotlin-App hat Room-Schema 1 und Zugangsdatenformate 1, 2 und 3. Ein kleines
lokales Expo-Modul liest das bekannte Schema und entschlüsselt mit dem bestehenden
Android-Key. Format 3 verwendet einen gewrappten Datenschlüssel; der bisherige
geprüfte Decoder wird hierfür erhalten. Keine Kotlin-UI und kein paralleles
aktives Repository bleiben bestehen.

Auf iOS gibt es keine bisherige App-Datenbank: Start leer. Bei abweichender
Android-App-ID/Signatur besteht kein Zugriff auf Altdaten. Eine Installation darf
keine Deinstallation der bisherigen App verlangen, um vermeintlich ein Update zu
ermöglichen. Auf Android 6 bleibt die alte App unverändert. Gerätewechsel und
Export/Import gehören nicht zu diesem Feature; bei bewusster Neuinstallation
müssen Konten neu eingerichtet werden.

## Ablauf und Wiederaufnahme

1. App-Start serialisiert Bootstrap und sperrt Kontenänderungen. Vor dem Import
   Quell-DB einschließlich vorhandener SQLite-Journale konsistent über die native
   SQLite-API lesen; kein rohes Kopieren einer laufenden WAL-Datenbank.
2. Quellschema, Schulwerte, Pflichtfelder, IDs und eindeutige normalisierte Keys
   prüfen. Alle Zugangsdaten mit dem vorhandenen Schlüssel entschlüsseln. Ist ein
   Format unbekannt, ein Konto beschädigt oder der Key nicht zugänglich: stoppen,
   Quelle unverändert erhalten und verständlichen Fehler mit Retry anzeigen.
   Eine bekannte leere Quell-DB ohne Zugangsdaten benötigt keinen Legacy-Key;
   sie darf nicht allein wegen eines noch nie angelegten Alias blockiert werden.
3. Neue Zielinstallation gemäß den priorisierten Bootstrap-Regeln in
   `../data-model.md` vorbereiten: Marker zuerst, passende Installationskennung
   im SecureStore-Key-Datensatz, neue SQLCipher-Datei separat öffnen und Schema
   prüfen; Marker MUSS vor Kontoimport auf `ready` stehen. In EINER exklusiven Transaktion alle Konten mit alten IDs und
   unveränderten Zugangswerten übernehmen und Status `imported` speichern.
   Kein partieller Import und keine Klartext-Zwischendateien.
4. Ziel schließen und mit SecureStore-Key neu öffnen. Integrität, Kontoanzahl,
   IDs, Namen, Schulen und exakte Zugangswerte mit der Quelle vergleichen.
   Bei Unterbrechung vor Commit wird neu importiert; bei Status `imported`
   wird geprüft und bereinigt, nicht erneut angehängt. Währenddessen keine
   Benutzeränderungen und keine zweite DB als normaler Fallback.
5. Erst nach erfolgreicher Prüfung Quelle über native DB-Löschung einschließlich
   Journal/WAL/SHM entfernen und anschließend alten Keystore-Alias löschen.
   Vor Bereinigung muss die Ziel-DB unabhängig von der Quelle lesbar sein.
   Status `complete` erst danach setzen. Fehlschlag sperrt Kontenänderungen und
   erlaubt einen erneuten Bereinigungsversuch, ohne den Zielbestand zu löschen.
6. Absturz zwischen DB-Entfernung, Alias-Entfernung und Status-Commit ist erlaubt:
   `imported` plus verifiziert lesbares Ziel und fehlende Quelle wird als
   Bereinigungsphase erkannt. Fehlende Quelldatei oder bereits entfernter Alias
   sind hier idempotent; fehlende Quelle vor einem Import ist kein Erfolg.
7. Nach `complete` aus der Ziel-DB anzeigen. Alte Daten dürfen später weder
   erneut importiert werden noch nach Kontolöschung wieder erscheinen.

Klartext existiert beim Import vorübergehend im Speicher des nativen Moduls und
im eng begrenzten Importaufruf. Keine Events, Analytics oder Debug-Logs mit
Payloads. UI sieht ausschließlich Status und Kontenzusammenfassungen.

## Fehler- und Testvertrag

- Fehlender/falscher Legacy-Key, unbekanntes Format, beschädigte DB, ungültige
  Schule und kollidierende Kinderkeys: keine Quelländerung, kein stiller Leerstart.
- Fehler vor Ziel-Commit: kein teilweise sichtbarer Zielbestand.
- Fehler/Prozessabbruch nach Commit und vor/nach jeder Bereinigungsoperation:
  erneuter Start beendet Übernahme ohne Duplikate oder Datenverlust.
- Alle drei alten Chiffratformate, Unicode, Randzeichen und Zugangswerte mit
  mehr als 65.535 UTF-Bytes in synthetischen Fixtures prüfen.
- Update mit mindestens zehn Konten offline installieren; ID/Zuordnung und
  Zugangswerte vor/nach Update vergleichen, Neustart prüfen, Konto löschen und
  nochmals starten: kein Wiederauftauchen aus Altdaten.
- Abweichende Signatur, separate Development-ID, iOS-Neuinstallation und Android
  API 23 ausdrücklich getrennt dokumentieren, nicht als erfolgreiche Übernahme.

## Dauer der Kompatibilität

Der Legacy-Leser bleibt für direkte Updates von der alten Kotlin-Version erhalten,
auch wenn das eigenständige Kotlin-Projekt entfernt wurde. Ein späterer Abbau
braucht eine eigene begründete Entscheidung über unterstützte Upgradepfade.
Historische Kotlin-Prüfberichte bleiben erhalten; neue Nachweise separat ablegen.
Der Android-Updatepfad erfüllt FR-014/FR-015 und SC-006; reine Neuinstallationen
auf iOS und Android bleiben separate Fälle.

## Reproduzierbare alte Testinstallation

Vor Entfernung der aktiven Kotlin-App wird eine eigenständig baubare Kopie des
bekannten Ausgangsstands unter `mobile/tests/fixtures/legacy-app/` versioniert.
Sie enthält nur Quellcode, Ressourcen, Schema und erforderliche Builddateien samt
Wrapper; weder APKs, echte Daten, lokale Pfade noch private Signaturschlüssel.
Das ist eine eingefrorene Testfixture, keine zweite Produktimplementierung.

`mobile/tests/fixtures/legacy/fixture-manifest.json` hält den Ausgangscommit
`b7c62f8a80af78d54769a37c8f89b88234579b5e`, Prüfsummen des unveränderten
Quell-/Schemasnapshots und die separat nachvollziehbaren Testergänzungen fest.
Buildbasis: Gradle 8.14.3, AGP 8.13.2, Kotlin 2.3.20, Room 2.8.5,
compile/target SDK 36, Build Tools 36.1.0; für den Fixture-Build JDK 21 nutzen.
Die Fixture hat ihren eigenen Versionskatalog und keine relativen Includes in
das aktive Root-`app/`, Root-Gradle oder Git-Historie als Laufzeitvoraussetzung.

Ein ausschließlich instrumentierter Seeder unter
`mobile/tests/fixtures/legacy-app/app/src/androidTest/` legt synthetische Konten
mit Formaten 1–3 auf dem isolierten Gerät an. Für lange Zugangswerte kommen
Format 2/3 zum Einsatz; Format 1 wird innerhalb seiner alten UTF-Längengrenze
getestet. Keine Debug-Seed-Schnittstelle in Produkt-Builds.

`prepare-legacy-fixtures.sh` baut aus dieser Fixture die alte Test-App plus
Test-APK; `verify-android-upgrade.sh` installiert sie, führt den Seeder per
AndroidJUnitRunner aus und installiert das neue signaturgleiche APK mit höherer
versionCode OHNE Deinstallation. Der Testschlüssel liegt außerhalb des Repos;
Fingerprint der tatsächlichen APKs wird vor dem Update verglichen und im Bericht
protokolliert. Keine Forderung bitidentischer APKs bei unterschiedlichen Signaturen.

Ein Test aus frischem Checkout ohne aktive Root-Kotlin-Buildkette muss bereits
vor ihrer Entfernung bestanden haben und danach wiederholt werden. Fehlende
SDKs/Signatur oder nicht bestandene Fixture-/Upgrade-Tests lassen das
Entfernungsgate geschlossen. Beide Skripte verwenden nur erhaltene Testpfade.
