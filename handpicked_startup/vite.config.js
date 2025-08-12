import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";

export default defineConfig({
  plugins: [
    react(),
    tailwindcss(), // ✅ Tailwind v4 plugin for Vite
  ],
  optimizeDeps: {
    include: ["react-router-dom"],
  },
  build: {
    commonjsOptions: {
      include: [/react-router-dom/, /node_modules/],
    },
  },
  resolve: {
    conditions: ["import"],
  },
});