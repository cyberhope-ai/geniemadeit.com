/**
 * GenieMade front-end — Vite config for Cloudflare Pages.
 * Build: pnpm install && pnpm build   →  outputs to dist/public (set as Pages output dir)
 * The postbuild script copies _worker.js into dist/public so the Pages worker
 * keeps proxying /api/* and /asset/* to the GenieMade engine (same-origin auth).
 */
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";
import path from "path";

export default defineConfig({
  plugins: [react(), tailwindcss()],
  resolve: {
    alias: {
      "@": path.resolve(import.meta.dirname, "client", "src"),
      "@shared": path.resolve(import.meta.dirname, "shared"),
    },
  },
  envDir: path.resolve(import.meta.dirname),
  root: path.resolve(import.meta.dirname, "client"),
  build: {
    outDir: path.resolve(import.meta.dirname, "dist/public"),
    emptyOutDir: true,
  },
  server: {
    port: 3000,
    host: true,
    proxy: {
      // Local dev mirror of production _worker.js: same-origin /api + /asset
      // proxied to the GenieMade engine so auth cookies work first-party.
      "/api": {
        target: "https://geniemade-engine.cyberhopeai.workers.dev",
        changeOrigin: true,
        secure: true,
        cookieDomainRewrite: "",
        configure: (proxy) => {
          proxy.on("proxyRes", (proxyRes) => {
            const sc = proxyRes.headers["set-cookie"];
            if (sc) {
              proxyRes.headers["set-cookie"] = sc.map((c: string) =>
                c.replace(/;\s*Secure/gi, "").replace(/;\s*Domain=[^;]+/gi, "")
              );
            }
          });
        },
      },
      "/asset": {
        target: "https://geniemade-engine.cyberhopeai.workers.dev",
        changeOrigin: true,
        secure: true,
      },
    },
  },
});
