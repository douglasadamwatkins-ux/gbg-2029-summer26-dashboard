import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  base: '/gbg-2029-summer26-dashboard/',
  build: {
    outDir: 'docs',
    emptyOutDir: true,
  }
})
