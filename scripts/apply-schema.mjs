/**
 * apply-schema.mjs
 *
 * 使用 Supabase Management API 執行 migrations 與 seed SQL。
 * 需要設定環境變數 SUPABASE_ACCESS_TOKEN（Personal Access Token）。
 *
 * 若沒有 Access Token，腳本會輸出 SQL 內容供手動在 SQL Editor 執行。
 *
 * 用法：
 *   node scripts/apply-schema.mjs
 *   SUPABASE_ACCESS_TOKEN=sbp_xxxx node scripts/apply-schema.mjs
 */

import { readFileSync } from 'fs';
import { dirname, join } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));

const PROJECT_REF = 'lfyudeflciyekdoznmye';
const ACCESS_TOKEN = process.env.SUPABASE_ACCESS_TOKEN;

const files = [
  { label: '0001_init.sql',  path: '../supabase/migrations/0001_init.sql' },
  { label: '0002_rls.sql',   path: '../supabase/migrations/0002_rls.sql' },
  { label: 'seed.sql',       path: '../supabase/seed.sql' },
];

async function runViaApi(label, sql) {
  const url = `https://api.supabase.com/v1/projects/${PROJECT_REF}/database/query`;
  const res = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${ACCESS_TOKEN}`,
    },
    body: JSON.stringify({ query: sql }),
  });

  if (!res.ok) {
    const body = await res.text();
    throw new Error(`HTTP ${res.status}: ${body}`);
  }

  return await res.json();
}

async function main() {
  if (!ACCESS_TOKEN) {
    console.log('');
    console.log('SUPABASE_ACCESS_TOKEN 未設定。');
    console.log('請至 https://supabase.com/dashboard/account/tokens 產生 Personal Access Token，');
    console.log('再以 SUPABASE_ACCESS_TOKEN=sbp_xxxx node scripts/apply-schema.mjs 執行。');
    console.log('');
    console.log('或直接將以下 SQL 複製到 Supabase Dashboard > SQL Editor > New Query 執行：');
    console.log('（建議依序執行：先 0001_init.sql，再 0002_rls.sql，最後 seed.sql）');
    console.log('');

    for (const { label, path } of files) {
      const sql = readFileSync(join(__dirname, path), 'utf-8');
      console.log(`\n${'='.repeat(60)}`);
      console.log(`  ${label}`);
      console.log('='.repeat(60));
      console.log(sql);
    }

    console.log('\n完成後即可啟動 Next.js 開發伺服器。');
    return;
  }

  for (const { label, path } of files) {
    const sql = readFileSync(join(__dirname, path), 'utf-8');
    console.log(`Running ${label}...`);
    try {
      const result = await runViaApi(label, sql);
      console.log(`  ✓ ${label} done`, result);
    } catch (err) {
      console.error(`  ✗ ${label} failed: ${err.message}`);
      process.exit(1);
    }
  }

  console.log('\nAll migrations applied successfully.');
}

main();
