import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";
import { componentTagger } from "lovable-tagger";

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => ({
  server: {
    host: "::",
    port: 8080,
    hmr: {
      overlay: false,
    },
  },
  plugins: [react(), mode === "development" && componentTagger()].filter(Boolean),
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  build: {
    rollupOptions: {
      external: ["@base-org/account"],
      onwarn(warning, warn) {
        // Suppress unresolved import warnings from Reown optional deps
        if (warning.code === 'UNRESOLVED_IMPORT' && warning.exporter?.includes('@base-org')) return;
        warn(warning);
      },
    },
  },
}));
