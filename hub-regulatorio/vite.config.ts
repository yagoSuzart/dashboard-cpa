import { defineConfig } from 'vite'

// Site estático: o build gera a pasta dist/, que o Cloudflare Worker publica como "static assets".
export default defineConfig({
  build: { outDir: 'dist', sourcemap: false },
})
