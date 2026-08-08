#!/usr/bin/env node
/**
 * Sync Threads posts from Buffer MCP into src/data/threads.json
 *
 * Env:
 *   BUFFER_API_TOKEN   — Bearer token (or full "Bearer …" value)
 *   BUFFER_ORG_ID      — optional, default from OpenClaw-linked org
 *   BUFFER_CHANNEL_ID  — optional, Threads channel id
 *
 * Usage:
 *   BUFFER_API_TOKEN=… npm run sync:threads
 */

import { writeFile, mkdir, readFile } from 'node:fs/promises';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, '..');
const OUT = join(ROOT, 'src/data/threads.json');

const MCP_URL = 'https://mcp.buffer.com/mcp';
const ORG = process.env.BUFFER_ORG_ID || '6a185c6b9c30eeddb4563f5b';
const CHANNEL = process.env.BUFFER_CHANNEL_ID || '6a185cb3c687a22dd4369dec';
const PROFILE = 'https://www.threads.com/@gongpenclaw';

function authHeader() {
  const raw = process.env.BUFFER_API_TOKEN;
  if (!raw) {
    console.error('Missing BUFFER_API_TOKEN');
    process.exit(1);
  }
  return raw.startsWith('Bearer ') ? raw : `Bearer ${raw}`;
}

let reqId = 1;
async function mcp(method, params) {
  const body = { jsonrpc: '2.0', id: reqId++, method };
  if (params !== undefined) body.params = params;
  const res = await fetch(MCP_URL, {
    method: 'POST',
    headers: {
      Authorization: authHeader(),
      'Content-Type': 'application/json',
      Accept: 'application/json, text/event-stream',
    },
    body: JSON.stringify(body),
  });
  if (!res.ok) {
    throw new Error(`MCP HTTP ${res.status}: ${await res.text()}`);
  }
  return res.json();
}

async function tool(name, args) {
  const r = await mcp('tools/call', { name, arguments: args });
  const text = r?.result?.content?.[0]?.text;
  if (text == null) return r;
  try {
    return JSON.parse(text);
  } catch {
    return { _raw: text };
  }
}

function sleep(ms) {
  return new Promise((r) => setTimeout(r, ms));
}

function normalizeMedia(assets = []) {
  return assets.map((a) => {
    const m = {
      type: a.type || 'unknown',
      mimeType: a.mimeType || null,
    };
    if (a.thumbnail) m.thumbnail = a.thumbnail;
    // Prefer Buffer-hosted assets; skip long-lived fragile IG video CDN urls
    if (a.source && (String(a.source).includes('buffer') || a.type === 'image')) {
      m.source = a.source;
    }
    return m;
  });
}

async function main() {
  await mcp('initialize', {
    protocolVersion: '2024-11-05',
    capabilities: {},
    clientInfo: { name: 'hosung-profile-sync', version: '1.0' },
  });

  const listed = await tool('list_posts', {
    organizationId: ORG,
    channelId: CHANNEL,
    first: 100,
  });
  const edges = listed?.edges || [];
  console.log(`listed ${edges.length} posts`);

  const posts = [];
  for (let i = 0; i < edges.length; i++) {
    const node = edges[i].node || edges[i];
    const id = node.id;
    let detail = await tool('get_post', { postId: id });
    if (!detail || detail._raw || String(detail).includes('MCP error')) {
      detail = node;
    }
    const post = {
      id,
      text: (detail.text || '').trim(),
      sentAt: detail.sentAt || detail.dueAt || detail.createdAt || null,
      createdAt: detail.createdAt || null,
      status: detail.status || 'sent',
      via: detail.via || null,
      url: detail.externalLink || null,
      media: normalizeMedia(detail.assets || node.assets || []),
    };
    posts.push(post);
    console.log(
      `${i + 1}/${edges.length} ${id.slice(0, 8)} url=${post.url ? 'yes' : 'no'} media=${post.media.length}`
    );
    await sleep(150);
  }

  posts.sort((a, b) => String(b.sentAt || '').localeCompare(String(a.sentAt || '')));

  // Skip rewrite when post content is unchanged (ignore syncedAt churn for daily CI).
  try {
    const prev = JSON.parse(await readFile(OUT, 'utf8'));
    if (JSON.stringify(prev.posts) === JSON.stringify(posts)) {
      console.log(`no post changes (${posts.length}); skip write`);
      process.exit(0);
    }
  } catch {
    // first run or unreadable file — write below
  }

  const archive = {
    syncedAt: new Date().toISOString().replace(/\.\d{3}Z$/, 'Z'),
    source: 'buffer',
    profileUrl: PROFILE,
    channelService: 'threads',
    count: posts.length,
    posts,
  };

  await mkdir(dirname(OUT), { recursive: true });
  await writeFile(OUT, JSON.stringify(archive, null, 2) + '\n', 'utf8');
  console.log(`wrote ${OUT} (${posts.length} posts)`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
