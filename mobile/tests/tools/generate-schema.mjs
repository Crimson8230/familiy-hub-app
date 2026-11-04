import { readFileSync, writeFileSync, mkdirSync } from 'node:fs';
const root = new URL('../../', import.meta.url);
const sql = readFileSync(new URL('migrations/001_accounts.sql', root), 'utf8');
mkdirSync(new URL('src/storage/generated/', root), { recursive: true });
writeFileSync(new URL('src/storage/generated/schema.ts', root),
  '// Generated from migrations/001_accounts.sql; regenerate with npm run generate:schema.\nexport const initialSchema = ' + JSON.stringify(sql) + ';\n');
