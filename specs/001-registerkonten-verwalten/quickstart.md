# Quickstart: Registerkonten prüfen

Diese Anleitung gilt nach Umsetzung von `specs/001-registerkonten-verwalten/tasks.md`.
Der Android-Quellcode und Gradle-Wrapper sind zum Zeitpunkt dieser Planung noch
nicht vorhanden. Für Daten und UI gilt der Vertrag in
[contracts/account-management-ui.md](contracts/account-management-ui.md); die
Feldregeln stehen in [data-model.md](data-model.md).

## Voraussetzungen

- Android SDK mit API 36, JDK in einer zur festgeschriebenen Android-Gradle-
  Plugin-Version passenden Version und ein Android-Gerät oder Emulator ab API 23.
- Gradle-Wrapper und App-Modul aus der Implementierungsphase.
- Ein frisches Testprofil ohne echte Registerzugangsdaten. Ausschließlich
  erfundene Werte wie `kind-a`, `test-user-a` und `test-pass-a` verwenden.

## Automatische Prüfungen

Im Repository-Stamm unter PowerShell:

```powershell
.\gradlew.bat testDebugUnitTest
.\gradlew.bat connectedDebugAndroidTest
.\gradlew.bat assembleDebug
```

Die Tests müssen Namensnormalisierung, eindeutige Kinderkennung,
Eingabevalidierung, Datenbank-Persistenz nach Neustart, Keystore-Verschlüsselung,
atomare Anlage/Löschung, Backup-Regeln, Compose-Zustände und größere Schrift
abdecken. Der Build muss ohne Serverkonfiguration funktionieren.

## Manuelle Ende-zu-Ende-Prüfung

1. App auf einem Testgerät installieren und starten. Erwartung: Eine
   Kontenübersicht mit erklärtem Leerzustand erscheint; keine Serveranmeldung
   wird verlangt.
2. Flugmodus aktivieren. „Schulkonto hinzufügen“ öffnen und für `Kind A`
   die Grundschule St. Martin mit erfundenen Zugangsdaten speichern. Erwartung:
   `Kind A` und die Schule erscheinen genau einmal, ohne Benutzername oder
   Passwort in der Übersicht.
3. Die App vollständig schließen und neu starten, weiterhin im Flugmodus.
   Erwartung: Das Konto ist unverändert sichtbar. Für mindestens zehn
   unterschiedliche Kindernamen wiederholen oder mit Testdaten vorbereiten.
4. ` kind a ` als neues Konto versuchen. Erwartung: Eine verständliche
   Duplikatmeldung erscheint, und die Übersicht enthält weiterhin nur eine
   Zeile für dieses Kind.
5. Ein Formular mit leeren Pflichtfeldern speichern. Erwartung: Felder werden
   benannt; kein neues Konto erscheint. Eine unbekannte Schule darf nicht
   auswählbar oder speicherbar sein.
6. „Schulkonto löschen“ für `Kind A` öffnen und abbrechen. Erwartung: Das
   Konto bleibt bestehen. Den Dialog erneut öffnen und bestätigen. Erwartung:
   Konto und zugehörige lokale Daten verschwinden; nach Neustart bleibt es
   entfernt. Ein neues Konto für `Kind A` lässt sich anlegen.
7. Android-Schriftgröße deutlich vergrößern und die Übersicht sowie das
   Formular erneut bedienen. Erwartung: Kind, Schule und Aktionen bleiben
   lesbar und eindeutig beschriftet.

## Sicherheits- und Fehlerprüfung

- Datenbank und App-Protokolle mit ausschließlich erfundenen Zugangsdaten
  prüfen: Benutzername und Passwort dürfen dort nicht im Klartext stehen.
- Cloud-Backup und Geräteübertragung müssen die Kontendatenbank ausschließen.
  Die entsprechenden Regeln für Android 12+ und ältere Versionen im
  App-Manifest und in den Backup-Konfigurationsdateien kontrollieren.
- Einen Datenbank- oder Keystore-Fehler in einem Instrumentierungstest
  auslösen. Erwartung: verständliche Meldung, keine teilweise gespeicherten
  oder gelöschten Konten und keine Zugangsdaten in der Fehlermeldung.
- Vor einer Veröffentlichung die versionierte Schema-Datei und einen
  Migrationstest für jede später hinzugefügte Schema-Version prüfen.
