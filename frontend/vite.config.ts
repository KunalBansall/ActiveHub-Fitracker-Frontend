import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import pluginRewriteAll from 'vite-plugin-rewrite-all';

export default defineConfig({
  base: "/",

  plugins: [react(),pluginRewriteAll()],
});