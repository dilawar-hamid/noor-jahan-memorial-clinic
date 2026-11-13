import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'

export default defineConfig({
  plugins: [react()],
  base: '/clinic-management-system/',
  build: {
    // The generated service worker precaches the complete hashed asset set.
    assetsInlineLimit: 4096,
  },
})
