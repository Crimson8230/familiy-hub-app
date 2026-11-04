# Frozen legacy test application

This is the pinned Kotlin source fixture for Android upgrade tests, not the active app.
Build only through `../../tools/prepare-legacy-fixtures.sh` from this directory.
The manifest at `../legacy/fixture-manifest.json` records original sources and additions.
Requires JDK 21, SDK 36, Build Tools 36.1.0 and an external synthetic test keystore.
Seed only on an isolated clean test installation with the instrumentation argument
`familyhubFixture=synthetic-only`. Pass `empty=true` for an empty database without a key.
Never use real register credentials. Both APK signatures must match before upgrade.
