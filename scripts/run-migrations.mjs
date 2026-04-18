import pg from 'pg';
import { readFileSync } from 'fs';
import { dirname, join } from 'path';
import { fileURLToPath } from 'url';

const { Client } = pg;
const __dirname = dirname(fileURLToPath(import.meta.url));

const PASSWORD = '-000Kersbh@';
const PROJECT_REF = 'lfyudeflciyekdoznmye';

const POOLER_HOST = 'aws-0-ap-southeast-1.pooler.supabase.com';

const configs = [
  {
    label: 'Session pooler 5432 – postgres.ref – explicit SNI',
    host: POOLER_HOST,
    port: 5432,
    user: `postgres.${PROJECT_REF}`,
    ssl: { rejectUnauthorized: false, servername: POOLER_HOST },
  },
  {
    label: 'Transaction pooler 6543 – postgres.ref – explicit SNI',
    host: POOLER_HOST,
    port: 6543,
    user: `postgres.${PROJECT_REF}`,
    ssl: { rejectUnauthorized: false, servername: POOLER_HOST },
  },
  {
    label: 'Session pooler 5432 – no SSL',
    host: POOLER_HOST,
    port: 5432,
    user: `postgres.${PROJECT_REF}`,
    ssl: false,
  },
];

const files = [
  join(__dirname, '../supabase/migrations/0001_init.sql'),
  join(__dirname, '../supabase/migrations/0002_rls.sql'),
  join(__dirname, '../supabase/seed.sql'),
];

let connected = false;

for (const config of configs) {
  const client = new Client({
    host: config.host,
    port: config.port,
    database: 'postgres',
    user: config.user,
    password: PASSWORD,
    ssl: config.ssl ?? { rejectUnauthorized: false },
    connectionTimeoutMillis: 10000,
  });

  console.log(`Trying ${config.label} (${config.host}:${config.port})...`);
  try {
    await client.connect();
    console.log('Connected!\n');

    for (const file of files) {
      const sql = readFileSync(file, 'utf-8');
      const label = file.split(/[/\\]/).slice(-2).join('/');
      process.stdout.write(`  Running ${label}... `);
      await client.query(sql);
      console.log('✓');
    }

    await client.end();
    connected = true;
    console.log('\n✅ All migrations applied successfully!');
    break;
  } catch (e) {
    console.log(`✗ ${e.message}`);
    try { await client.end(); } catch {}
  }
}

if (!connected) {
  console.log('\n❌ Could not connect. Paste the DB connection string from:');
  console.log('https://supabase.com/dashboard/project/lfyudeflciyekdoznmye/settings/database');
}
