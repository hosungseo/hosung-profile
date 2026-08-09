// PGR21 posts import — converts browser-extracted JSON into writing collection markdown.
//
// ppt21.com sits behind an Anubis anti-bot challenge, so this cannot fetch pages
// headlessly like sync-brunch/sync-substack. Workflow instead:
//   1. In a real browser session, extract each post as JSON:
//      { title, dateMatch, html } from `div.articleArea` (see repo history)
//   2. Save as pgr-<articleNo>.json in the repo root
//   3. Run: node scripts/import-pgr.mjs <articleNo> [<articleNo> ...]
import { readFile, writeFile } from 'node:fs/promises';
import TurndownService from 'turndown';

const CONTENT_DIR = new URL('../src/content/writing/', import.meta.url);
const LINE_SEP = String.fromCharCode(0x2028);
const PARA_SEP = String.fromCharCode(0x2029);

const turndown = new TurndownService({
  headingStyle: 'atx',
  bulletListMarker: '-',
  emDelimiter: '*',
});

function yamlString(value) {
  return JSON.stringify(String(value).replaceAll(LINE_SEP, ' ').replaceAll(PARA_SEP, ' '));
}

const articleNos = process.argv.slice(2);
if (articleNos.length === 0) {
  console.error('usage: node scripts/import-pgr.mjs <articleNo> [<articleNo> ...]');
  process.exit(1);
}

for (const no of articleNos) {
  const raw = await readFile(new URL(`../pgr-${no}.json`, import.meta.url), 'utf8');
  const data = JSON.parse(JSON.parse(raw));

  const title = data.title.replace(/^\[[^\]]+\]\s*/, '').trim();
  const date = data.dateMatch.match(/\d{4}\/\d{2}\/\d{2}/)[0].replaceAll('/', '-');
  const sourceUrl = `https://ppt21.com/freedom/${no}`;
  const body = turndown
    .turndown(data.html)
    .replace(/\n{3,}/g, '\n\n')
    .trim();

  const frontmatter = [
    '---',
    `title: ${yamlString(title)}`,
    `date: ${yamlString(date)}`,
    'draft: false',
    'source: pgr21',
    `sourceUrl: ${yamlString(sourceUrl)}`,
    '---',
  ].join('\n');

  await writeFile(new URL(`pgr-${no}.md`, CONTENT_DIR), `${frontmatter}\n\n${body}\n`);
  console.log(`  ${no}: ${title}`);
}
