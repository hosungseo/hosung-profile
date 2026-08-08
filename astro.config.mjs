// @ts-check
import { defineConfig } from 'astro/config';
import sitemap from '@astrojs/sitemap';

export default defineConfig({
  site: 'https://hosung-profile.vercel.app',
  integrations: [sitemap()],
});
