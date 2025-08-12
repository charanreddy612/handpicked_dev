import { defineConfig } from "astro/config";
import react from "@astrojs/react";
import tailwind from "@astrojs/tailwind";

export default defineConfig({
  integrations: [
    react(),
    tailwind({ config: "./tailwind.config.cjs" }), // ✅ Tailwind 3 integration
  ],
});