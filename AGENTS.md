# Projektregeln für Implementierungen

## Feature-Branches und Commits

- Jedes neue Feature wird vor seiner Implementierung auf einem eigenen,
  aussagekräftig benannten Branch `feature/<kurzer-name>` begonnen. Das gilt
  auch für `$speckit-implement`. Nicht direkt auf `main` oder `master` arbeiten.
- Zusammengehörige Aufgaben eines Features bleiben auf demselben Branch.
  Bei Fortsetzung den bestehenden Feature-Branch weiterverwenden; nicht pro
  Task oder erneutem Implementierungsaufruf einen neuen Branch anlegen.
- Ein fachlich eigenständiges Folgefeature bekommt einen neuen Branch.
  Wenn es auf noch nicht zusammengeführten Änderungen aufbaut, den benötigten
  Feature-Branch als Ausgangspunkt verwenden und diese Abhängigkeit nennen.
- Vor einem Branchwechsel vorhandene Änderungen prüfen und erhalten.
  Fremde oder sachfremde Änderungen nicht ungefragt in den Feature-Commit aufnehmen.
- Nach einem abgeschlossenen, erfolgreich geprüften Implementierungsschritt
  die zugehörigen Änderungen einschließlich Tests, Taskstatus und Dokumentation
  automatisch committen. Dafür ist keine zusätzliche Bestätigung erforderlich.
- Nur tatsächlich abgeschlossene Aufgaben als erledigt markieren. Offene
  Plattformprüfungen und Abnahmegrenzen im Commit beziehungsweise Prüfbericht
  kenntlich machen. Ein Commit ersetzt keine ausstehende Abnahme.
- Im Abschluss Branch, Commit und Prüfergebnis nennen. Push, Merge und
  Veröffentlichung nur bei entsprechender ausdrücklicher Beauftragung ausführen.
