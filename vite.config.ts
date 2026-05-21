import react from "@vitejs/plugin-react";
import { defineConfig } from "vite";

export default defineConfig({
  clearScreen: false,
  // React migration is in progress (Phase 0). plugin-react is a no-op for the
  // current vanilla entry (no JSX there) and powers the spike + future React app.
  plugins: [react()],
  server: {
    port: 1420,
    strictPort: true,
    host: "127.0.0.1",
    hmr: { port: 1421 },
    watch: { ignored: ["**/src-tauri/**"] },
  },
});
