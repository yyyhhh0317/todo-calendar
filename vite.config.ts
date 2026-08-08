import { defineConfig } from 'vitest/config'
import react from '@vitejs/plugin-react'
import path from 'node:path'

// https://vitejs.dev/config/
export default defineConfig({
  // GitHub Pages 部署在 /todo-calendar/ 子路径下，本地开发不受影响
  base: process.env.NODE_ENV === 'production' ? '/todo-calendar/' : '/',
  plugins: [react()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  server: {
    port: 5173,
    open: true,
  },
  // Vitest 单测配置：只收集 src 下的 *.test.ts，E2E 由 Playwright 单独运行
  test: {
    include: ['src/**/*.test.ts'],
    environment: 'node',
  },
})
