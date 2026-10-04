import type { APIRoute } from 'astro';
import { getCollection } from 'astro:content';
import archive from '../data/threads.json';
import { NAV_GROUPS } from '../consts';

// A small static index for the ⌘K search: title, a little text, a type and a url per entry.
export const GET: APIRoute = async () => {
  const fmt = (d: Date) => d.toISOString().slice(0, 10);
  const writing = (await getCollection('writing', ({ data }) => !data.draft)).map((p) => ({
    type: 'writing', title: p.data.title, text: p.data.description ?? '', url: `/writing/${p.id}`, date: fmt(p.data.date),
  }));
  const notes = (await getCollection('notes')).map((n) => ({
    type: 'notes', title: (n.body ?? '').split('\n').find((l) => l.trim())?.replace(/^#+\s*/, '').slice(0, 80) ?? '단상',
    text: (n.body ?? '').slice(0, 200), url: '/notes', date: fmt(n.data.date),
  }));
  const press = (await getCollection('press')).map((p) => ({
    type: 'press', title: p.data.title, text: p.data.mine + ' ' + (p.data.description ?? ''), url: `/press/${p.id}/`, date: fmt(p.data.date),
  }));
  const work = (await getCollection('work')).map((w) => ({
    type: 'work', title: w.data.title, text: w.data.description, url: w.data.url ?? '/work', date: w.data.updated ? fmt(w.data.updated) : '',
  }));
  const threads = (archive.posts as { text: string; sentAt: string | null; url?: string | null; status: string }[])
    .filter((p) => (p.status === 'sent' || p.status === 'error') && p.sentAt)
    .map((p) => ({ type: 'threads', title: p.text.split('\n')[0].slice(0, 90), text: p.text.slice(0, 200), url: p.url ?? '/threads', date: (p.sentAt ?? '').slice(0, 10) }));
  const pages = NAV_GROUPS.flatMap((g) => g.items)
    .filter((i) => !('work' in i && i.work))
    .map((i) => ({ type: 'page', title: i.label, text: i.note ?? '', url: i.href, date: '' }));
  const items = [...pages, ...work, ...press, ...writing, ...notes, ...threads];
  return new Response(JSON.stringify(items), { headers: { 'Content-Type': 'application/json; charset=utf-8' } });
};
