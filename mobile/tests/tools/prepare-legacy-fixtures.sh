#!/usr/bin/env bash
set -euo pipefail
fixture_tools_dir="$(cd -- "$(dirname -- "${BASH_SOURCE[0]}")" && pwd)"
fixture_mobile_dir="$(cd -- "$fixture_tools_dir/../.." && pwd)"
fixture_project_dir="$fixture_mobile_dir/tests/fixtures/legacy-app"
python3 - "$fixture_project_dir" "$fixture_mobile_dir/tests/fixtures/legacy/fixture-manifest.json" <<'VERIFY'
import hashlib,json,sys
from pathlib import Path
root=Path(sys.argv[1]); manifest=json.loads(Path(sys.argv[2]).read_text())
for name,expected in manifest['sourceFilesSha256'].items():
    if hashlib.sha256((root/name).read_bytes()).hexdigest() != expected:
        raise SystemExit('Legacy fixture differs from pinned source: '+name)
print('Pinned legacy fixture verified.')
VERIFY
if [[ "${1:-}" == "--verify-only" ]]; then exit 0; fi
: "${FAMILYHUB_TEST_KEYSTORE:?External synthetic test keystore required}"
: "${FAMILYHUB_TEST_STORE_PASSWORD:?Test signing password required}"
: "${FAMILYHUB_TEST_KEY_ALIAS:?Test signing alias required}"
: "${FAMILYHUB_TEST_KEY_PASSWORD:?Test signing key password required}"
cd "$fixture_project_dir"
exec bash ./gradlew --init-script fixture-signing.gradle :app:assembleDebug :app:assembleDebugAndroidTest --no-daemon
