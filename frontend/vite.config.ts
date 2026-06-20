import { defineConfig } from 'vite';
import vue from '@vitejs/plugin-vue';
import { resolve } from 'path';
import { visualizer } from 'rollup-plugin-visualizer';
import cssnano from 'cssnano';

// ============================================
// Vite 生产环境配置
// 针对 2核2GiB 服务器优化
// ============================================

export default defineConfig({
  plugins: [
    vue(),
    // 构建分析工具（仅在生产环境）
    ...(process.env.NODE_ENV === 'production' ? [visualizer()] : []),
  ],
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
    minify: 'terser',
    terserOptions: {
      compress: {
        drop_console: true,
        drop_debugger: true,
        pure_funcs: ['console.log', 'console.debug', 'console.warn'],
        // 针对 2核2GiB 服务器优化：更激进的压缩
        passes: 2,  // 多次压缩以获得更小的文件
      },
      format: {
        comments: false,  // 移除所有注释
      },
    },
    rollupOptions: {
      output: {
        // 更细粒度的代码分割
        manualChunks(id) {
          // Three.js 大库单独分割
          if (id.includes('node_modules/three')) {
            return 'three';
          }
          // ECharts 单独分割
          if (id.includes('node_modules/echarts')) {
            return 'echarts';
          }
          // Vue 核心库合并
          if (
              id.includes('node_modules/vue') ||
              id.includes('node_modules/vue-router') ||
              id.includes('node_modules/pinia') ||
              id.includes('node_modules/vue-i18n')
          ) {
            return 'vue-vendor';
          }
          // Axios 单独分割（较小）
          if (id.includes('node_modules/axios')) {
            return 'axios';
          }
          // 其他第三方库合并
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
  css: {
    devSourcemap: false,
    postcss: {
      plugins: [
        cssnano({
          preset: ['default', {
            // 更激进的 CSS 优化
            discardComments: { removeAll: true },
            normalizeWhitespace: true,
            colormin: true,
            minifyFontValues: true,
          }],
        }),
      ],
    },
  },
  optimizeDeps: {
    include: ['vue', 'vue-router', 'pinia', 'axios', 'three'],
    exclude: [],
  },
});