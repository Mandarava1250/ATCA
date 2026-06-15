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
    sourcemap: true,
    // 消除 Three.js 550KB 体积警告
    chunkSizeWarningLimit: 1000,
    rollupOptions: {
      output: {
        manualChunks(id) {
          // Three.js 及其子模块统一拆包
          if (id.includes('node_modules/three')) {
            return 'three';
          }
          // ECharts（地图页专用）
          if (id.includes('node_modules/echarts')) {
            return 'echarts';
          }
          // Vue 核心生态
          if (
              id.includes('node_modules/vue') ||
              id.includes('node_modules/vue-router') ||
              id.includes('node_modules/pinia')
          ) {
            return 'vue-vendor';
          }
          // 其余第三方库
          if (id.includes('node_modules')) {
            return 'vendor';
          }
        },
      },
    },
  },
  css: {
    devSourcemap: true,
  },
});