import { defineConfig } from 'vite'
import legacy from '@vitejs/plugin-legacy'

export default defineConfig({
  plugins: [
    legacy({
      targets: ['defaults', 'not IE 11']
    })
  ],
  build: {
    outDir: 'dist-admin',
    assetsDir: 'assets',
    sourcemap: true,
    rollupOptions: {
      input: {
        admin: './src/admin/index.html'
      }
    }
  },
  server: {
    port: 3001,
    host: true,
    open: '/src/admin/index.html'
  },
  root: '.',
  resolve: {
    alias: {
      '@': '/src',
      '@client': '/src/client',
      '@admin': '/src/admin',
      '@shared': '/src/shared'
    }
  }
})
