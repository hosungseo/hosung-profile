// @ts-check
import { existsSync, readdirSync } from 'node:fs';
import { defineConfig } from 'astro/config';
import sitemap from '@astrojs/sitemap';

const site = 'https://seohosung.com';
const factsDir = new URL('./public/facts/', import.meta.url);

// public/ files bypass Astro routing, so list the static facts pages here.
const factsPages = existsSync(factsDir)
  ? readdirSync(factsDir, { withFileTypes: true })
      .filter((entry) => entry.isDirectory() && existsSync(new URL(`${entry.name}/index.html`, factsDir)))
      .map((entry) => `${site}/facts/${entry.name}/`)
      .sort()
  : [];

export default defineConfig({
  site,
  integrations: [sitemap({ customPages: [...(factsPages.length ? [`${site}/facts/`, ...factsPages] : []), `${site}/supply/`, `${site}/signal/`] })],
});
