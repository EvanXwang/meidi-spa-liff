import { readFileSync } from 'fs';
import { config } from 'dotenv';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
config({ path: resolve(__dirname, '../.env.local') });

const PAT = process.env.SUPABASE_PAT;
if (!PAT) { console.error('Missing SUPABASE_PAT in .env.local'); process.exit(1); }

const PROJECT_REF = 'lfyudeflciyekdoznmye';
const API = `https://api.supabase.com/v1/projects/${PROJECT_REF}/database/query`;

const label = '0004_check_in_booking.sql';
const path  = 'supabase/migrations/0004_check_in_booking.sql';

process.stdout.write(`  Deploying ${label}... `);
const query = readFileSync(path, 'utf-8');
const res = await fetch(API, {
  method: 'POST',
  headers: {
    'Authorization': `Bearer ${PAT}`,
    'Content-Type': 'application/json',
  },
  body: JSON.stringify({ query }),
});

if (!res.ok) {
  const body = await res.text();
  console.log(`✗ HTTP ${res.status}: ${body}`);
  process.exit(1);
}

console.log('✓');
console.log('\n✅ check_in_booking function deployed successfully!');
