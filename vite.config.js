import { defineConfig } from 'vite'
import path from 'path'
import { viteStaticCopy } from 'vite-plugin-static-copy'

export default defineConfig({
  // 基础路径配置
  base: './', // 使用相对路径，这样部署到任何位置都能正常工作

  // 服务器配置
  server: {
    host: '0.0.0.0', // 允许外部访问
    port: 5173, // 指定端口
    open: true, // 自动打开浏览器
    cors: true, // 启用 CORS
  },

  // 构建配置
  build: {
    outDir: 'dist', // 输出目录
    assetsDir: 'assets', // 静态资源目录
    sourcemap: true, // 生成 source map
    rollupOptions: {
      output: {
        // 优化 chunk 文件名
        chunkFileNames: 'assets/js/[name]-[hash].js',
        entryFileNames: 'assets/js/[name]-[hash].js',
        assetFileNames: 'assets/[ext]/[name]-[hash].[ext]',
      },
    },
    // 优化图片压缩
    assetsInlineLimit: 4096, // 小于4kb的图片转为base64
    minify: 'terser', // 使用terser进行压缩
    terserOptions: {
      compress: {
        drop_console: true, // 移除console
        drop_debugger: true, // 移除debugger
      },
    },
  },

  // 优化配置
  optimizeDeps: {
    include: ['three', 'lil-gui'],
  },

  // 路径别名
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
      '@assets': path.resolve(__dirname, './assets'),
      '@public': path.resolve(__dirname, './public'),
    },
  },

  // CSS 配置
  css: {
    devSourcemap: true,
  },

  // 着色器文件处理
  assetsInclude: ['**/*.glsl', '**/*.vert', '**/*.frag'],

  // 插件配置
  plugins: [
    // 静态资源复制和优化
    viteStaticCopy({
      targets: [
        {
          src: 'public/images/*',
          dest: 'images',
        },
      ],
    }),
  ],
})
