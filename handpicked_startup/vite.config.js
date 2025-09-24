// vite.config.js
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";

export default defineConfig({
  plugins: [
    react(),
    tailwindcss(), // ✅ Tailwind v4 plugin for Vite
  ],
  optimizeDeps: {
    include: ["react-router-dom", "react-quill-new"], // ✅ update package name
    exclude: ["quill-better-table"],
  },
  build: {
    commonjsOptions: {
      include: [/react-router-dom/, /node_modules/],
    },
    rollupOptions: {
      external: ["quill", "quill-better-table"],
    },
  },
  resolve: {
    conditions: ["import"],
    alias: {
      quill: "quill/dist/quill.js", // ✅ keep if some deps import plain "quill"
    },
  },
  ssr: {
    noExternal: ["react-quill-new", "quill", "quill-better-table"], // ✅ critical: prevents SSR import
  },
});
