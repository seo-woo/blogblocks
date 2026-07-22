import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  // GitHub Pages (project site): https://seo-woo.github.io/blogblocks/
  base: process.env.GITHUB_ACTIONS ? '/blogblocks/' : '/',
  // The project path contains a colon (…/Desktop/:/초안), which trips Vite's
  // dev file-serving allow-list. Disable the strict fs check so `npm run dev`
  // works in place. (Irrelevant to the production build in `dist/`.)
  server: {
    fs: { strict: false },
  },
})
