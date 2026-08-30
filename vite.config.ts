import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";
import { defineConfig } from "vite";

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), tailwindcss()],
  server: {
    // The API runs as a separate node:http process in development.
    proxy: {
      "/rpc": {
        target: process.env.API_ORIGIN ?? "http://localhost:3000",
        changeOrigin: true,
      },
    },
  },
});
