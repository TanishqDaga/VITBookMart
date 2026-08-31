import path from "node:path";
import { defineConfig, loadEnv } from "vite";
import react from "@vitejs/plugin-react";

/**
 * The backend declares no CORS configuration, so the browser cannot call it
 * cross-origin. In development we proxy /api through the dev server.
 *
 * Port 5174 keeps the admin portal off 5173, so it can run alongside the student
 * frontend without either stealing the other's port or localStorage keys.
 */
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), "");
  return {
    plugins: [react()],
    resolve: { alias: { "@": path.resolve(__dirname, "./src") } },
    server: {
      port: 5173,
      proxy: {
        "/api": {
          target: env.VITE_API_PROXY_TARGET || "http://localhost:8080",
          changeOrigin: true,
        },
      },
    },
    build: { target: "es2020", sourcemap: false },
  };
});
