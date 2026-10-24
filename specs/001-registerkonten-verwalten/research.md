# Research: Registerkonten auf Android verwalten

**Date**: 2026-10-24

Die Recherche bezieht sich auf das erste, rein lokale Android-Feature. Externe
Registerendpunkte werden noch nicht angesprochen.

## Native App und Plattformversion

**Decision**: Kotlin mit Jetpack Compose in einem Android-App-Modul;
`minSdk 23`, `compileSdk 36`, `targetSdk 36`. Kotlin- und Gradle-Versionen werden
beim Anlegen des Projekts aus einer offiziell kompatiblen stabilen Kombination
festgeschrieben; keine Vorabversionen.

**Rationale**: Room 2.8.5 benötigt mindestens API 23. API 36 erfüllt die
aktuelle Play-Zielversion für neue Handy-Apps. Compose bietet native
Android-Oberflächen ohne Web-Laufzeit. Eine konkrete Kotlin-Patchversion ohne
passendes Android Gradle Plugin festzulegen würde eine Scheingenauigkeit erzeugen.

**Alternatives considered**: WebView/Flask und eigener Server widersprechen der
Constitution; `minSdk 21` ist mit der gewählten Room-Version nicht vereinbar;
eine Multiplattform-Architektur bringt für dieses Android-only-Feature keinen
Mehrwert.

**Sources**: [Compose setup](https://developer.android.com/develop/ui/compose/setup),
[Room releases](https://developer.android.com/jetpack/androidx/releases/room),
[Google Play target API requirements](https://developer.android.com/google/play/requirements/target-sdk),
[Android Gradle Plugin compatibility](https://developer.android.com/build/releases/about-agp),
[Kotlin releases](https://kotlinlang.org/docs/releases.html).

## Lokale Datenbank und Migrationen

**Decision**: Room 2.8.5 über SQLite mit einer `school_accounts`-Tabelle in
Schema-Version 1. Ein eindeutiger Index auf `child_key` erzwingt genau ein Konto
je Kind auch bei schnellen oder mehrfachen Speicherversuchen. Room-Schemas
werden exportiert und versioniert; spätere Änderungen verwenden explizite,
getestete Migrationen, keine destruktive Rückfallmigration.

**Rationale**: Room bietet eine überprüfbare SQLite-Schicht mit eindeutigen
Indizes, Fremdschlüsseln und Transaktionen. Die normalisierte Kinderkennung
entspricht der bestätigten Ein-Konto-Regel. Ein erstes Schema kann sofort
versioniert werden, auch wenn von Version 0 keine Daten migriert werden müssen.

**Alternatives considered**: Freies JSON/Preferences unterstützt die geforderte
lokale Datenbank und künftige Beziehungen schlechter; rohes SQLite verlagert
Validierung und Migrationen in mehr eigenen Code; Room 3 bringt hier keinen
Vorteil gegenüber der etablierten Android-only-Linie.

**Sources**: [Room entities and unique indices](https://developer.android.com/training/data-storage/room/defining-data),
[Room migration guide](https://developer.android.com/training/data-storage/room/migrating-db-versions),
[Room releases](https://developer.android.com/jetpack/androidx/releases/room),
[Room 3 releases](https://developer.android.com/jetpack/androidx/releases/room3).

## Geschützte Zugangsdaten und Backup

**Decision**: Benutzername und Passwort werden zusammen als versionierter
Credentials-Inhalt mit AES-GCM verschlüsselt. Der nicht exportierbare AES-Schlüssel
liegt im Android Keystore. Der Datensatz speichert nur Chiffrat und zufälliges IV,
nie Klartext-Zugangsdaten. Die Kontendatenbank wird ausdrücklich aus Cloud-Backup
und Geräteübertragung ausgeschlossen; Backup-Regeln werden für Android 12+ und
ältere unterstützte Versionen gesetzt. Ein späterer Gerätewechsel braucht eine
eigene Spezifikation.

**Rationale**: Ohne Keystore-Schlüssel wären wiederhergestellte Chiffrate auf
einem anderen Gerät unbrauchbar. Standard-Backup kann Datenbanken einschließen;
`allowBackup=false` allein deckt nicht alle Übertragungswege auf Android 12+ ab.
Verschlüsselung und Backup-Ausschluss schützen Zugangsdaten auch im Ruhemodus.

**Alternatives considered**: Klartext in Room verletzt die Constitution;
unverschlüsselter Export ist ausgeschlossen; eine vollständig verschlüsselte
Datenbank ist für die hier sichtbaren Kind-/Schulmetadaten schwerer zu migrieren
und ersetzt die Backup-Entscheidung nicht.

**Sources**: [Android Keystore](https://developer.android.com/privacy-and-security/keystore),
[Android cryptography](https://developer.android.com/privacy-and-security/cryptography),
[Auto Backup and data extraction rules](https://developer.android.com/identity/data/autobackup).

## Atomare Anlage und Löschung

**Decision**: Nach erfolgreicher Verschlüsselung erfolgt das Einfügen von
Metadaten und Chiffrat als eine Datenbankoperation. Die eindeutige Kinderkennung
fängt auch konkurrierende Versuche ab. Löschen entfernt die Kontenzeile und
später zugeordnete Einträge in einer Room-Transaktion mit Fremdschlüssel-Kaskade.
Bei einem Datenbankfehler bleibt der vorherige sichtbare Zustand erhalten; bei
Keystore-Fehlern beginnt keine Speicherung.

**Rationale**: Chiffrat und Kontometadaten können so nicht auseinanderfallen.
Die künftige Zuordnung von Registereinträgen über eine stabile Konto-ID erlaubt
das vollständige Entfernen abhängiger Daten.

**Alternatives considered**: Getrennte Speicherung in Preferences und Datenbank
würde Zwei-Speicher-Transaktionen erfordern und nach Abstürzen Inkonsistenzen
ermöglichen.

**Sources**: [Room transactions](https://developer.android.com/reference/kotlin/androidx/room/RoomDatabase),
[Room foreign keys](https://developer.android.com/reference/androidx/room/ForeignKey).

## Oberfläche und Verifikation

**Decision**: Eine Compose-Kontenübersicht mit Leerzustand, Anlegeformular und
Löschbestätigung. Für Passwort-Eingabe wird ein geschütztes Textfeld verwendet;
nach dem Speichern zeigt die UI nur Kind und Schule. Die UI exponiert eindeutige
Beschriftungen und Semantik für größere Schrift und UI-Tests. JUnit prüft
Namensnormalisierung; Instrumentierung prüft Room/Keystore/Offline-Neustart und
die Bedienabläufe.

**Rationale**: Die Spec verlangt wenige lokale Abläufe, keine Navigation zu
externen Diensten. Compose-Semantik verbindet Zugänglichkeit und überprüfbare
Bedienzustände. Der geschützte Passwort-Eingabetyp vermeidet sichtbare oder
kopierbare Passwortdarstellung.

**Alternatives considered**: Ein frei sichtbares Passwortfeld oder die Anzeige
gespeicherter Zugangsdaten verletzen die Spec; reine Unit-Tests könnten
Keystore, SQLite-Persistenz und Android-Schriftvergrößerung nicht belegen.

**Sources**: [Compose text input](https://developer.android.com/develop/ui/compose/text/user-input),
[Compose semantics](https://developer.android.com/develop/ui/compose/accessibility/semantics),
[Compose accessibility testing](https://developer.android.com/develop/ui/compose/accessibility/testing).
