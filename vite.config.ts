import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    // Always show the server address when starting
    host: true,
  },
  // Don't clear the console when reloading
  clearScreen: false
})
