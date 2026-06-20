import { defineConfig } from 'vite';
import vue from '@vitejs/plugin-vue';
import { resolve } from 'path';

export default defineConfig({
  plugins: [vue()],
  resolve: {
    alias: {
      '@': resolve(__dirname, 'src'),
      '@shared': resolve(__dirname, '../shared'),
    },
  },
  server: {
    port: 3000,
    host: '127.0.0.1',
    strictPort: false,
  },
  build: {
    outDir: 'dist',
    sourcemap: false,
    chunkSizeWarningLimit: 1500,
    assetsDir: 'assets',
    // 使用esbuild进行压缩
    minify: 'esbuild',
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (id.includes('node_modules/three')) {
            return 'three';
          }
          if (id.includes('node_modules/echarts')) {
            return 'echarts';
          }
          if (
              id.includes('node_modules/vue') ||
              id.includes('node_modules/vue-router') ||
              id.includes('node_modules/pinia') ||
              id.includes('node_modules/vue-i18n')
          ) {
            return 'vue-vendor';
          }
          if (id.includes('node_modules/axios')) {
            return 'axios';
          }
          if (id.includes('node_modules')) {
            return 'vendor';
          }
        },
        assetFileNames: 'assets/[name]-[hash][extname]',
        chunkFileNames: 'assets/[name]-[hash].js',
        entryFileNames: 'assets/[name]-[hash].js',
      },
    },
  },
  optimizeDeps: {
    include: ['vue', 'vue-router', 'pinia', 'axios', 'three'],
    exclude: [],
  },
});