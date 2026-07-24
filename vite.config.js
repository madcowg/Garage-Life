import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
// base must match your GitHub repo name for project-page Pages deploys,
// e.g. https://<user>.github.io/garage-life-autocross/ -> base: '/garage-life-autocross/'
export default defineConfig({
  plugins: [react()],
  base: '/garage-life-autocross/',
})
