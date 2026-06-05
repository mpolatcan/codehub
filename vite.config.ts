import { URL, fileURLToPath } from "node:url";
import tailwindcss from "@tailwindcss/vite";
import react from "@vitejs/plugin-react";
import { defineConfig } from "vite";

export default defineConfig({
  clearScreen: false,
  // Relative asset base so the build's JS/CSS imports resolve under BOTH Tauri's
  // custom protocol (main window) AND a plain `file://` load — the latter is how
  // the out-of-process `.accessory` Dynamic Island helper (island-helper) loads
  // the bundled `dist/` in a release build.
  base: "./",
  // React 19 app (index.html → src/app/main.tsx). Tailwind v4 via the Vite
  // plugin; tokens are bridged from theme.css into the @theme layer.
  plugins: [react(), tailwindcss()],
  resolve: {
    alias: {
      "@": fileURLToPath(new URL("./src", import.meta.url)),
    },
  },
  server: {
    port: 1420,
    strictPort: true,
    host: "127.0.0.1",
    hmr: { port: 1421 },
    watch: { ignored: ["**/src-tauri/**"] },
    // Browser-mode dev bridge (src-tauri/src/devserver.rs, `make dev-web`).
    // Same-origin proxy so the frontend's /__bridge calls + WebSocket avoid
    // CORS. Harmless to the Tauri build, which never hits these paths.
    proxy: {
      "/__bridge": {
        target: "http://127.0.0.1:4555",
        changeOrigin: true,
        ws: true,
        rewrite: (path) => path.replace(/^\/__bridge/, ""),
      },
    },
  },
});
