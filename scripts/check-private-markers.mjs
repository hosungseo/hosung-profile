#!/usr/bin/env node

import { readdir, readFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const writingRoot = path.join(root, 'src', 'content', 'writing');

const forbidden = [
  ['Kakao evidence id', /\bkw-[0-9a-f]{8,}\b/i],
  ['anonymous room id', /\broom-[0-9]{2}\b/i],
  ['private lineage filename', /lineage-private|evidence-redacted/i],
  [
    'private analysis field',
    /supporting_source_ids|counterevidence_source_ids|katok_chat_id|chat_id/i,
  ],
  ['local private path', /\/Users\/[^\s)]+|out\/intelligence\//i],
  ['redaction placeholder', /\[(?:식별자|전화번호|이메일|계정|인명)\]/],
];

async function markdownFiles(dir) {
  const entries = await readdir(dir, { withFileTypes: true });
  const files = [];
  for (const entry of entries) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) files.push(...(await markdownFiles(full)));
    else if (entry.isFile() && entry.name.endsWith('.md')) files.push(full);
  }
  return files;
}

const failures = [];
for (const file of await markdownFiles(writingRoot)) {
  const content = await readFile(file, 'utf8');
  for (const [label, pattern] of forbidden) {
    if (pattern.test(content)) {
      failures.push(`${path.relative(root, file)}: ${label}`);
    }
  }
}

if (failures.length > 0) {
  console.error('Private-source boundary failed:');
  for (const failure of failures) console.error(`- ${failure}`);
  process.exit(1);
}

console.log('Private-source boundary passed.');
