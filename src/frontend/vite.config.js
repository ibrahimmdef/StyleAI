import { defineConfig } from "vite";
import tailwindcss from "@tailwindcss/vite";

export default defineConfig({
  plugins: [tailwindcss()],
  esbuild: { jsx: "automatic" },
  server: {
    // Let the dev server read src/shared, which lives outside this folder
    fs: { allow: [".."] },
    // The app asks its own address for /api and /uploads, and Vite hands those
    // to the backend. To the browser it's one site, so the login cookie just works.
    // On the server the backend serves the app itself, so it's one site there too.
    // The trailing slash matters: "/api" alone would also catch our own api.js file.
    proxy: {
      "/api/": "http://localhost:5000",
      "/uploads/": "http://localhost:5000",
    },
  },
});
