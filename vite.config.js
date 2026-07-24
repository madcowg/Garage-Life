import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
// base must match your GitHub repo name for project-page Pages deploys,
// e.g. https://madcowg.github.io/Garage-Life/ -> base: '/Garage-Life/'
export default defineConfig({
  plugins: [react()],
  base: '/Garage-Life/',
})
