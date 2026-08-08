import { mkdir, writeFile } from 'node:fs/promises';
import * as cheerio from 'cheerio';
import TurndownService from 'turndown';

const PUB_HOST = 'gongpenclaw.substack.com';
const ARCHIVE_URL = `https://${PUB_HOST}/api/v1/archive?sort=new&limit=50&offset=0`;
const POST_URL = (slug) => `https://${PUB_HOST}/api/v1/posts/${slug}`;
const CONTENT_DIR = new URL('../src/content/writing/', import.meta.url);

const turndown = new TurndownService({
  headingStyle: 'atx',
  bulletListMarker: '-',
  emDelimiter: '*',
});

function yamlString(value) {
  return JSON.stringify(String(value).replaceAll('\u2028', ' ').replaceAll('\u2029', ' '));
}

async function fetchJson(url) {
  const response = await fetch(url, {
    headers: {
      accept: 'application/json',
      'user-agent': 'Mozilla/5.0 (compatible; hosung-profile-sync/1.0)',
    },
  });
  if (!response.ok) throw new Error(`${response.status} ${response.statusText}: ${url}`);
  return response.json();
}

async function listPosts() {
  const archive = await fetchJson(ARCHIVE_URL);
  return archive.filter((post) => post.type === 'newsletter' && post.audience === 'everyone');
}

function bodyToMarkdown(bodyHtml) {
  const $ = cheerio.load(bodyHtml || '', null, false);
  $('.subscription-widget-wrap-editor').remove();
  const cleaned = $.html();
  return turndown
    .turndown(cleaned)
    .replace(/\n{3,}/g, '\n\n')
    .trim();
}

async function importPost(summary) {
  const post = await fetchJson(POST_URL(summary.slug));
  const body = bodyToMarkdown(post.body_html);
  if (!body) throw new Error(`본문을 찾지 못했습니다: ${summary.slug}`);

  const description = post.subtitle || post.description || '';
  const sourceUrl = post.canonical_url || `https://${PUB_HOST}/p/${post.slug}`;

  const frontmatter = [
    '---',
    `title: ${yamlString(post.title)}`,
    `date: ${yamlString(post.post_date.slice(0, 10))}`,
    description && `description: ${yamlString(description)}`,
    'draft: false',
    'source: substack',
    `sourceUrl: ${yamlString(sourceUrl)}`,
    '---',
  ]
    .filter(Boolean)
    .join('\n');

  await writeFile(new URL(`substack-${post.slug}.md`, CONTENT_DIR), `${frontmatter}\n\n${body}\n`);
  console.log(`  ${post.slug}: ${post.title}`);
}

await mkdir(CONTENT_DIR, { recursive: true });

const posts = await listPosts();
console.log(`서브스택 공개 글 ${posts.length}편을 동기화합니다.`);

for (const post of posts.sort((a, b) => a.post_date.localeCompare(b.post_date))) {
  await importPost(post);
}

console.log(`완료: ${posts.length}편 (@${PUB_HOST})`);
