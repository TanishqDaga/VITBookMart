import path from "node:path";
import { defineConfig, loadEnv } from "vite";
import react from "@vitejs/plugin-react";

/**
 * The VITBookMart Spring Boot backend does NOT declare any CORS configuration.
 * (Verified: no `.cors(...)` in SecurityConfig, no @CrossOrigin, no WebMvcConfigurer.)
 *
 * A browser therefore cannot call it cross-origin. For local development we proxy
 * `/api` through the Vite dev server so the browser only ever sees a same-origin
 * request. This is a real, standard frontend solution -- it is not a mock.
 *
 * For production the backend must add CORS (see README "Backend requirements").
 */
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), "");
  const target = env.VITE_API_PROXY_TARGET || "http://localhost:8080";

  return {
    plugins: [react()],
    resolve: {
      alias: {
        "@": path.resolve(__dirname, "./src"),
      },
    },
    server: {
      port: 5173,
      proxy: {
        "/api": {
          target,
          changeOrigin: true,
        },
      },
    },
    build: {
      target: "es2020",
      sourcemap: false,
    },
  };
});
