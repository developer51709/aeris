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
    watch: {
      ignored: ["**/dist/**", "**/node_modules/**"],
    },
  },
});
