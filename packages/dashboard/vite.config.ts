import { defineConfig } from "vite";
import tailwindcss from "@tailwindcss/vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";

export default defineConfig({
  plugins: [
    react(),
    tailwindcss(),
  ],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  server: {
    port: Number(process.env.VITE_PORT ?? process.env.PORT ?? 5173),
    strictPort: true,
    host: "0.0.0.0",
    allowedHosts: true,
    proxy: {
      "/api": {
        target: process.env.API_PROXY_URL ?? "http://127.0.0.1:3001",
        changeOrigin: true,
      },
      "/auth": {
        target: process.env.API_PROXY_URL ?? "http://127.0.0.1:3001",
        changeOrigin: true,
      },
      "/search": {
        target: process.env.API_PROXY_URL ?? "http://127.0.0.1:3001",
        changeOrigin: true,
      },
    },
    watch: {
      ignored: ["**/dist/**", "**/node_modules/**"],
    },
  },
});
