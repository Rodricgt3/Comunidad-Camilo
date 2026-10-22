import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import { readFileSync, writeFileSync } from "node:fs";
import { createHash } from "node:crypto";
export default defineConfig({
  base: "./",
  plugins: [
    react(),
    {
      name: "garage-offline-shell",
      closeBundle() {
        const html = readFileSync("dist/index.html", "utf8");
        const assets = [
          ...html.matchAll(/(?:src|href)="\.\/(assets\/[^\"]+)"/g),
        ].map((match) => match[1]);
        const version = createHash("sha256")
          .update(html)
          .digest("hex")
          .slice(0, 12);
        const sw = readFileSync("dist/sw.js", "utf8")
          .replace("cg-garage-v1", `cg-garage-${version}`)
          .replace(
            "const BUILD_ASSETS = [];",
            `const BUILD_ASSETS = ${JSON.stringify(assets)};`,
          );
        writeFileSync("dist/sw.js", sw);
      },
    },
  ],
  build: {
    chunkSizeWarningLimit: 750,
    rollupOptions: {
      output: {
        manualChunks: {
          firebase: ["firebase/app", "firebase/auth", "firebase/firestore"],
          react: ["react", "react-dom", "react-router-dom"],
        },
      },
    },
  },
});
