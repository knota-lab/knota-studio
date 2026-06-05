import { defineConfig } from '@rsbuild/core';
import { pluginReact } from '@rsbuild/plugin-react';

export default defineConfig({
  plugins: [pluginReact()],
  html: {
    tags: [
      {
        tag: 'script',
        innerHTML: `try{var d=JSON.parse(localStorage.getItem('knota-theme-dark'));if(d)document.documentElement.classList.add('dark')}catch(e){}`,
        appendTo: 'head',
        inject: 'prepend',
      },
    ],
  },
  resolve: {
    alias: {
      '@': './src',
    },
  },
  server: {
    proxy: {
      '/api/': {
        target: 'http://localhost:5150/',
        changeOrigin: true,
      },
    },
  },
});
