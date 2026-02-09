import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { resolve } from 'path'

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    react()
  ],
  css: {
    postcss: './postcss.config.js',
    devSourcemap: true,
  },
  server: {
    port: 5173,
    open: true,
  },
  resolve: {
    alias: {
      '@': resolve(__dirname, './src')
    },
  },
  define: {
    'process.env': {},
    'process.platform': JSON.stringify('browser'),
    'process.version': JSON.stringify(''),
    global: 'globalThis',
  },
  // ✅ SEGURANÇA: Remover console.log em produção
  esbuild: {
    drop: ['console', 'debugger'],
  }
})
