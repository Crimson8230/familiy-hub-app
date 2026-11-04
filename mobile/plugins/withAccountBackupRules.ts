import { withAndroidManifest, withDangerousMod, type ConfigPlugin } from 'expo/config-plugins';
import fs from 'node:fs';
import path from 'node:path';
const exclusions = ['root', 'file', 'database', 'sharedpref', 'external']
  .map(domain => `<exclude domain="${domain}" path="."/>`).join('');
const withAccountBackupRules: ConfigPlugin = config => {
  config = withAndroidManifest(config, mod => {
    const app = mod.modResults.manifest.application?.[0];
    if (!app) throw new Error('Missing Android application');
    app.$['android:allowBackup'] = 'false';
    app.$['android:fullBackupContent'] = '@xml/familyhub_backup_rules';
    app.$['android:dataExtractionRules'] = '@xml/familyhub_data_extraction_rules';
    return mod;
  });
  return withDangerousMod(config, ['android', async mod => {
    const directory = path.join(mod.modRequest.platformProjectRoot, 'app/src/main/res/xml');
    fs.mkdirSync(directory, { recursive: true });
    fs.writeFileSync(path.join(directory, 'familyhub_backup_rules.xml'),
      `<?xml version="1.0" encoding="utf-8"?><full-backup-content>${exclusions}</full-backup-content>`);
    fs.writeFileSync(path.join(directory, 'familyhub_data_extraction_rules.xml'),
      `<?xml version="1.0" encoding="utf-8"?><data-extraction-rules><cloud-backup>${exclusions}</cloud-backup><device-transfer>${exclusions}</device-transfer></data-extraction-rules>`);
    return mod;
  }]);
};
export default withAccountBackupRules;
