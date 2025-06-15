// @ts-check
import { defineConfig } from 'astro/config';
import sitemap from '@astrojs/sitemap';
import node from '@astrojs/node';

import react from '@astrojs/react';

// https://astro.build/config
export default defineConfig({
  site: 'https://getclarity.win',
  integrations: [sitemap(), react()],
  output: "server",
  adapter: node({ mode: 'standalone' }), // Enables self-contained output
});
