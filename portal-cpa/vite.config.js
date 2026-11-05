import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { resolve } from 'node:path'

export default defineConfig({
  plugins: [react()],
  build: {
    rollupOptions: {
      // Duas páginas: o Portal (com login) e a página pública das perguntas da próxima CPA (/perguntas/, sem login)
      input: {
        main: resolve(import.meta.dirname, 'index.html'),
        perguntas: resolve(import.meta.dirname, 'perguntas/index.html'),
      },
    },
  },
})
