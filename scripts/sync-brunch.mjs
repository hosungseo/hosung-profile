import { mkdir, writeFile } from 'node:fs/promises';
import { extname } from 'node:path';
import * as cheerio from 'cheerio';
import TurndownService from 'turndown';

const PROFILE_ID = 'tigercastle';
const API_URL = `https://api.brunch.co.kr/v2/article/@${PROFILE_ID}`;
const CONTENT_DIR = new URL('../src/content/writing/', import.meta.url);
const IMAGE_ROOT = new URL('../public/images/brunch/', import.meta.url);

const turndown = new TurndownService({
  headingStyle: 'atx',
  bulletListMarker: '-',
  emDelimiter: '*',
});

turndown.addRule('brunchOpenGraph', {
  filter: (node) => node.nodeType === 1 && node.classList?.contains('item_type_opengraph'),
  replacement: (_content, node) => {
    const anchor = node.querySelector('a');
    if (!anchor) return '';
    const title = node.querySelector('.title')?.textContent?.trim() || anchor.href;
    return `\n\n[${title}](${anchor.href})\n\n`;
  },
});

turndown.addRule('brunchCaption', {
  filter: (node) => node.nodeType === 1 && node.classList?.contains('text_caption'),
  replacement: (content) => (content.trim() ? `\n*${content.trim()}*\n` : ''),
});

function yamlString(value) {
  return JSON.stringify(String(value).replaceAll('\u2028', ' ').replaceAll('\u2029', ' '));
}

function normalizeImageUrl(src) {
  if (src.startsWith('//')) return `https:${src}`;
  if (src.startsWith('http://')) return `https://${src.slice(7)}`;
  return src;
}

function extensionFor(contentType, url) {
  const byType = {
    'image/jpeg': '.jpg',
    'image/png': '.png',
    'image/gif': '.gif',
    'image/webp': '.webp',
    'image/svg+xml': '.svg',
  }[contentType.split(';')[0]];
  if (byType) return byType;
  const ext = extname(new URL(url).pathname).toLowerCase();
  return /^\.(jpe?g|png|gif|webp|svg)$/.test(ext) ? ext : '.jpg';
}

async function fetchJson(url) {
  const response = await fetch(url, { headers: { accept: 'application/json' } });
  if (!response.ok) throw new Error(`${response.status} ${response.statusText}: ${url}`);
  const payload = await response.json();
  if (payload.code !== 200) throw new Error(`${payload.code}: ${payload.desc || url}`);
  return payload.data;
}

async function listArticles() {
  const articles = [];
  let lastTime = 0;
  let hasMore = true;

  while (hasMore) {
    const url = new URL(API_URL);
    url.searchParams.set('lastTime', String(lastTime));
    url.searchParams.set('listSize', '20');
    url.searchParams.set('thumbnail', 'Y');
    url.searchParams.set('membershipContent', 'false');
    url.searchParams.set('status', 'home');
    const data = await fetchJson(url);
    articles.push(...data.list.filter((article) => article.published && !article.private));
    hasMore = data.moreList && data.list.length > 0;
    lastTime = data.list.at(-1)?.publishTimestamp ?? 0;
  }

  return [...new Map(articles.map((article) => [article.no, article])).values()];
}

async function downloadImages($, articleNo) {
  const imageDir = new URL(`${articleNo}/`, IMAGE_ROOT);
  await mkdir(imageDir, { recursive: true });

  const images = $('.wrap_body > astro-island > .wrap_item img').toArray();
  for (const [index, image] of images.entries()) {
    const src = $(image).attr('src');
    if (!src) continue;
    const remoteUrl = normalizeImageUrl(src);
    const response = await fetch(remoteUrl);
    if (!response.ok) {
      console.warn(`  image skipped (${response.status}): ${remoteUrl}`);
      continue;
    }
    const extension = extensionFor(response.headers.get('content-type') || '', remoteUrl);
    const filename = `${String(index + 1).padStart(2, '0')}${extension}`;
    await writeFile(new URL(filename, imageDir), Buffer.from(await response.arrayBuffer()));
    $(image).attr('src', `/images/brunch/${articleNo}/${filename}`);
    $(image).removeAttr('data-phocus-index').removeAttr('width').removeAttr('height');
  }
}

async function downloadCover(article, articleNo) {
  if (!article.articleImageForHome) return undefined;
  const remoteUrl = normalizeImageUrl(article.articleImageForHome);
  const response = await fetch(remoteUrl);
  if (!response.ok) {
    console.warn(`  cover skipped (${response.status}): ${remoteUrl}`);
    return undefined;
  }
  const extension = extensionFor(response.headers.get('content-type') || '', remoteUrl);
  const imageDir = new URL(`${articleNo}/`, IMAGE_ROOT);
  const filename = `cover${extension}`;
  await mkdir(imageDir, { recursive: true });
  await writeFile(new URL(filename, imageDir), Buffer.from(await response.arrayBuffer()));
  return `/images/brunch/${articleNo}/${filename}`;
}

async function importArticle(article) {
  const sourceUrl = `https://brunch.co.kr/@${PROFILE_ID}/${article.no}`;
  const response = await fetch(sourceUrl);
  if (!response.ok) throw new Error(`${response.status} ${response.statusText}: ${sourceUrl}`);
  const html = await response.text();
  const $ = cheerio.load(html);
  const articleData = JSON.parse($('#ARTICLE_DATA').text());
  const published = $('meta[property="article:published_time"]').attr('content');
  const bodyItems = $('.wrap_body > astro-island > .wrap_item');

  if (!bodyItems.length) throw new Error(`본문을 찾지 못했습니다: ${sourceUrl}`);
  await downloadImages($, article.no);
  const cover = await downloadCover(article, article.no);

  const bodyHtml = bodyItems.map((_, element) => $.html(element)).get().join('\n');
  const body = turndown
    .turndown(bodyHtml)
    .replace(/\n{3,}/g, '\n\n')
    .replace(/\n[ \t]+\n/g, '\n\n')
    .replace(/\\([<>])/g, '$1')
    .trim();
  const description = articleData.subTitle || articleData.contentSummary?.replace(/\s+/g, ' ').trim() || '';
  const tags = (articleData.articleKeywords || []).map(({ keyword }) => keyword);
  const frontmatter = [
    '---',
    `title: ${yamlString(articleData.title)}`,
    `date: ${yamlString((published || new Date(article.publishTime).toISOString()).slice(0, 10))}`,
    description && `description: ${yamlString(description)}`,
    'draft: false',
    'source: brunch',
    `sourceUrl: ${yamlString(sourceUrl)}`,
    `brunchId: ${article.no}`,
    cover && `cover: ${yamlString(cover)}`,
    tags.length && `tags: [${tags.map(yamlString).join(', ')}]`,
    '---',
  ].filter(Boolean).join('\n');

  await writeFile(new URL(`brunch-${article.no}.md`, CONTENT_DIR), `${frontmatter}\n\n${body}\n`);
  console.log(`  ${article.no}: ${articleData.title}`);
}

await mkdir(CONTENT_DIR, { recursive: true });
await mkdir(IMAGE_ROOT, { recursive: true });

const articles = await listArticles();
console.log(`브런치 공개 글 ${articles.length}편을 동기화합니다.`);

for (const article of articles.sort((a, b) => a.no - b.no)) {
  await importArticle(article);
}

console.log(`완료: ${articles.length}편 (@${PROFILE_ID})`);
