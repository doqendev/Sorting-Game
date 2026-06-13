import { defineConfig } from "vite";

const githubPagesBase = process.env.GITHUB_PAGES === "true" ? "/Sorting-Game/" : "/";

export default defineConfig({
  base: githubPagesBase,
  server: {
    host: "127.0.0.1",
    port: 5173
  },
  build: {
    target: "es2022",
    sourcemap: true
  },
  test: {
    environment: "jsdom",
    include: ["tests/**/*.test.ts"]
  }
});
