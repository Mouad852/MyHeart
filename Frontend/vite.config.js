import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '')

  return {
    plugins: [react()],
    server: {
      port: 3000,
      // Proxy API calls to the backend gateway during development, which
      // avoids CORS issues when running the frontend locally.
      // Override VITE_API_PROXY_TARGET when the gateway is not on 8080.
      proxy: {
        '/api': {
          target: env.VITE_API_PROXY_TARGET || 'http://localhost:8080',
          changeOrigin: true,
          rewrite: (path) => path.replace(/^\/api/, ''),
        },
      },
    },
    // jsdom tests are transformed by esbuild rather than by the React plugin,
    // which leaves JSX compiled to the classic runtime and React undefined.
    esbuild: { jsx: 'automatic' },

    test: {
      environment: 'jsdom',
      globals: true,
      setupFiles: './src/test/setup.js',
      // Only our own tests. Without this, Vitest walks node_modules.
      include: ['src/**/*.test.{js,jsx}'],
      restoreMocks: true,
      coverage: {
        provider: 'v8',
        reporter: ['text', 'html'],
        include: ['src/**/*.{js,jsx}'],
        exclude: ['src/**/*.test.{js,jsx}', 'src/test/**', 'src/main.jsx'],
      },
    },
  }
})
